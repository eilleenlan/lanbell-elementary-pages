import { materialVersions } from './materials-versions.js?v=115-1';
import { materialCatalogs } from './materials-data.js?v=115-1';
import { examScopes, sharedExamTimetable } from './exam-scopes-data.js?v=115-1';

const subjects = ['國語','英語','數學','自然','社會','生活'];
const gradeName = grade => `${'一二三四五六'[grade-1]}年級`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state = { view:'versions', year:115, semester:1, grade:'all', subject:'all', exam:'期中考' };
export const comparisonFields = ['semester','exam','grade','subject'];
export function findPreviousExam(current, records=examScopes) {
  return records.find(record => record.academicYear===current.academicYear-1 && comparisonFields.every(key=>record[key]===current[key])) || null;
}
export function selectCatalogs({year,semester,grade='all',subject='all'}) {
  return materialCatalogs.filter(c=>c.academicYear===Number(year) && c.semester===Number(semester) && (grade==='all'||c.grade===Number(grade)) && (subject==='all'||c.subject===subject));
}
export function flattenItems(items) { return items.flatMap(item=>[item,...flattenItems(item.children)]); }
export function scopeReferences(scope) {
  const catalog=materialCatalogs.find(c=>c.id===scope.versionId);
  if(!catalog)return [];
  return scope.references.map(ref=>({ ...ref, item:flattenItems(catalog.items).find(i=>i.number===ref.key || i.name===ref.key || i.raw.startsWith(ref.key+'｜')) || null }));
}
const versionFor = id => materialVersions.find(v=>v.id===id);
const versionLabel = version => version?.editionLabel || '教材版本未提供';
const allYears = () => [...new Set(materialVersions.map(v=>v.academicYear))].sort((a,b)=>b-a);
const semesterLabel = n => Number(n)===1?'上學期':'下學期';
const option = (value,label,selected) => `<option value="${esc(value)}" ${String(value)===String(selected)?'selected':''}>${esc(label)}</option>`;
const select = (key,label,options) => `<label for="materials-${key}">${label}<select id="materials-${key}" data-material-filter="${key}">${options}</select></label>`;
const list = entries => `<ul>${entries.map(entry=>`<li>${esc(entry)}</li>`).join('')}</ul>`;
function filters() {
  const years=select('year','學年度',allYears().map(y=>option(y,y+'學年度',state.year)).join(''));
  const semesters=[...new Set(materialVersions.filter(v=>v.academicYear===Number(state.year)).map(v=>v.semester))];
  const terms=select('semester','學期',semesters.map(s=>option(s,semesterLabel(s),state.semester)).join(''));
  const grades=select('grade','年級',(state.view==='exams'?'':option('all','全部年級',state.grade))+[1,2,3,4,5,6].map(g=>option(g,gradeName(g),state.grade)).join(''));
  const exams=select('exam','考次',[...new Set(examScopes.filter(e=>e.academicYear===Number(state.year)&&e.semester===Number(state.semester)).map(e=>e.exam))].map(e=>option(e,e,state.exam)).join(''));
  const available=subjects.filter(subject=>materialVersions.some(v=>v.academicYear===Number(state.year)&&v.semester===Number(state.semester)&&(state.grade==='all'||v.grade===Number(state.grade))&&v.subject===subject));
  const subject=select('subject','科目',option('all','全部科目',state.subject)+available.map(s=>option(s,s,state.subject)).join(''));
  return `<div class="materials-filters">${years}${terms}${state.view==='exams'?exams:''}${grades}${state.view==='catalog'?subject:''}</div>`;
}
function versionsView() {
  const rows=[1,2,3,4,5,6].filter(g=>state.grade==='all'||g===Number(state.grade));
  return `<h2>教材版本</h2><p>115學年度上學期，共28個年級／科目組合。尚無前一學年度已確認的版本變更資料，暫不標示紅字。</p><div class="materials-table-wrap" role="region" aria-label="教材版本表，可左右捲動" tabindex="0"><table><caption>${state.year}學年度${semesterLabel(state.semester)}教材版本</caption><thead><tr><th scope="col">年級</th>${subjects.map(s=>`<th scope="col">${s}</th>`).join('')}</tr></thead><tbody>${rows.map(g=>`<tr><th scope="row">${gradeName(g)}</th>${subjects.map(s=>{const v=materialVersions.find(v=>v.academicYear===Number(state.year)&&v.semester===Number(state.semester)&&v.grade===g&&v.subject===s);return `<td>${v?`<strong ${v.changeFromPreviousYear?.confirmed?'class="materials-changed"':''}>${esc(versionLabel(v))}</strong><span class="materials-cell-note">${esc(v.materialType)}${v.referencePublisher?'；參考'+esc(v.referencePublisher):''}</span>${v.changeFromPreviousYear?.confirmed?'<span class="materials-cell-note">'+esc(v.changeFromPreviousYear.note)+'</span>':''}`:'—'}</td>`}).join('')}</tr>`).join('')}</tbody></table></div><p class="materials-warning">一年級國語：目前收錄首冊，另一本待補。其餘科目依交接包提供的內容收錄；自編英語只列已確認單元名稱。</p>`;
}
function itemTree(items) {
  return `<ol class="materials-tree">${items.map(i=>`<li>${i.children.length?`<details><summary>${esc(i.raw)}</summary>${itemTree(i.children)}</details>`:`<span>${esc(i.raw)}</span>`}</li>`).join('')}</ol>`;
}
function catalogView() {
  const catalogs=selectCatalogs(state);
  return `<h2>教材目錄</h2><p>保留整學期已提供的教材順序，包含期中後單元。目錄項目不代表列入考試；請到「歷屆考試範圍」查看公告限制。</p><div class="materials-expand-actions"><button type="button" data-material-expand="true">展開目前目錄</button><button type="button" data-material-expand="false">收合目前目錄</button></div><p class="materials-count" role="status">顯示 ${catalogs.length} 個年級／科目目錄</p><div class="materials-catalogs">${catalogs.map(c=>`<details class="materials-catalog"><summary><strong>G${c.grade} ${gradeName(c.grade)} · ${c.subject}</strong><span>${esc(versionLabel(versionFor(c.versionId)))}</span></summary><div class="materials-catalog-body"><p class="${c.complete?'materials-muted':'materials-warning'}">${esc(c.coverageNote)}</p>${itemTree(c.items)}<p class="materials-source">來源：${esc(c.source)}；以上名稱依交接資料保留。</p></div></details>`).join('')||'<p>尚未提供此條件的教材目錄。</p>'}</div>`;
}
function dateLabel(date) {
  const format=value=>value.replaceAll('-','/')+'（'+'日一二三四五六'[new Date(value+'T00:00:00Z').getUTCDay()]+'）';
  return `${date.label}：${format(date.start)}${date.end?'～'+format(date.end):''}`;
}
function relatedItems(scope) {
  const refs=scopeReferences(scope);
  if(!refs.length)return '<p>未提供可確認的單元對應；請依上方公告文字及指定頁碼，不以目錄推定考試範圍。</p>';
  return `<p class="materials-muted">下列名稱供對照教材；展開的小節仍受上方公告限制，補充單元不會自動納入。</p><ul class="materials-related">${refs.map(ref=>`<li>${ref.item?`<details><summary>${esc(ref.item.raw)}</summary><p>${esc(ref.relation)}</p>${ref.item.children.length?itemTree(ref.item.children):'<p>已對應課名；未提供更細的範圍資料。</p>'}</details>`:`<span>${esc(ref.key)}：目錄對應待確認</span>`}</li>`).join('')}</ul>`;
}
function compareView(scope) {
  const previous=findPreviousExam(scope);
  return `<details class="materials-comparison"><summary>與前一學年度比較</summary><p>固定比較相同年級、學期、考次及科目。</p><div class="materials-compare-grid"><section><h4>${scope.academicYear}學年度 · ${gradeName(scope.grade)} ${scope.subject}</h4><p>教材：${esc(versionLabel(versionFor(scope.versionId)))}</p></section><section><h4>${scope.academicYear-1}學年度 · ${gradeName(scope.grade)} ${scope.subject}</h4><p>教材：${previous?esc(versionLabel(versionFor(previous.versionId))):'未提供'}</p></section></div>${previous?`<p>前一年度公告：${esc(previous.originalText)}</p>`:'<p>尚未提供前一學年度同條件的考試範圍及教材版本，因此不產生比較結果。</p>'}</details>`;
}
function examView() {
  const records=examScopes.filter(e=>e.academicYear===Number(state.year)&&e.semester===Number(state.semester)&&e.exam===state.exam&&e.grade===Number(state.grade));
  const scope=records.find(e=>e.subject===state.subject);
  return `<h2>歷屆考試範圍</h2><p>依學年度 → 學期 → 考次 → 年級 → 科目查詢。未提供的日期不套用其他年級；目前僅收錄115學年度上學期期中考。</p><div class="materials-subjects" role="group" aria-label="切換考試科目">${records.map(e=>`<button type="button" data-material-subject="${e.subject}" aria-pressed="${e.subject===state.subject}">${e.subject}${e.status==='未提供'?'（未提供）':''}</button>`).join('')}</div>${scope?`<article class="materials-exam"><header><span class="materials-kicker">${scope.academicYear}學年度 ${semesterLabel(scope.semester)} · ${scope.exam}</span><h3>G${scope.grade} ${gradeName(scope.grade)} · ${scope.subject}</h3><p><strong>${esc(versionLabel(versionFor(scope.versionId)))}</strong> · ${esc(versionFor(scope.versionId)?.materialType)}</p><span class="materials-badge">${esc(scope.status)}</span></header>${scope.questions.length?`<aside class="materials-warning"><h4>待確認事項</h4>${list(scope.questions)}</aside>`:''}<section><h4>學校公告範圍（依交接包）</h4><p class="materials-scope-text">${esc(scope.originalText)}</p></section><section><h4>指定頁碼與範圍限制</h4>${scope.limits.length?list(scope.limits):'<p>依上方公告範圍；未提供其他頁碼限制。</p>'}</section><section><h4>補充教材與特殊要求</h4>${scope.supplements.length?list(scope.supplements):'<p>未提供額外補充要求。</p>'}</section><section><h4>已確認的考試日期</h4>${scope.dates.length?list(scope.dates.map(dateLabel)):'<p>未提供此年級／科目的確定日期。</p>'}</section><section><h4>對應教材單元與課名</h4>${relatedItems(scope)}</section><details class="materials-original"><summary>原始公告用語（交接包所載）</summary><p class="materials-scope-text">${esc(scope.originalText)}</p><p class="materials-source">${esc(scope.source)}。此處不是未提供之原通知全文。</p></details>${compareView(scope)}</article>`:'<p>尚未提供此條件的考試範圍。</p>'}<details class="materials-timetable"><summary>共用考試時間參考表</summary>${timetableView()}</details>`;
}
function timetableView() {
  return `<h2>共用考試時間參考表</h2><p class="materials-warning">${esc(sharedExamTimetable.note)}</p>${sharedExamTimetable.groups.map(group=>`<section><h3>${group.label}</h3><table><thead><tr><th scope="col">時間</th><th scope="col">第一天</th><th scope="col">第二天</th></tr></thead><tbody>${group.rows.map(row=>`<tr>${row.map((value,index)=>index===0?`<th scope="row">${value}</th>`:`<td>${value}</td>`).join('')}</tr>`).join('')}</tbody></table></section>`).join('')}<p>此為共用參考，不代表每次考試均採相同節次，也不據此推定日期。</p>`;
}
function normalizeState() {
  if(state.view==='exams'){
    if(state.grade==='all')state.grade='1';
    const records=examScopes.filter(e=>e.academicYear===Number(state.year)&&e.semester===Number(state.semester)&&e.exam===state.exam&&e.grade===Number(state.grade));
    if(!records.some(e=>e.subject===state.subject))state.subject=records[0]?.subject||'all';
  } else if(state.subject!=='all'&&!selectCatalogs(state).length)state.subject='all';
}
export function materialsPage() {
  normalizeState();
  return `<section class="materials-page" id="materials-page"><header class="materials-heading"><span class="materials-kicker">教材與考試資料</span><h1>教材與考試查詢</h1><p>先看教材版本、再查完整目錄與公告範圍。待補或待核對的資訊會保留標記。</p></header><div class="materials-tabs" role="group" aria-label="教材查詢方式">${[['versions','教材版本'],['catalog','教材目錄'],['exams','歷屆考試範圍'],['timetable','時間參考表']].map(([key,label])=>`<button type="button" data-material-view="${key}" aria-pressed="${state.view===key}">${label}</button>`).join('')}</div>${state.view==='timetable'?'':filters()}<div class="materials-content">${({versions:versionsView,catalog:catalogView,exams:examView,timetable:timetableView})[state.view]()}</div><p class="materials-source">資料來源：使用者提供的115上 v1.1、v1.2交接資料。G1國語另一本待補；英語課內細節未提供。請以學校及老師當次公告為準。</p></section>`;
}
export function bindMaterials(host=document) {
  const page=host.querySelector('#materials-page');if(!page)return;
  function update(focusSelector){page.outerHTML=materialsPage();bindMaterials(host);if(focusSelector)host.querySelector(focusSelector)?.focus({preventScroll:true});}
  page.querySelectorAll('[data-material-view]').forEach(button=>button.addEventListener('click',()=>{state.view=button.dataset.materialView;if(state.view==='versions'){state.grade='all';state.subject='all';}update(`[data-material-view="${state.view}"]`);}));
  page.querySelectorAll('[data-material-filter]').forEach(input=>input.addEventListener('change',()=>{state[input.dataset.materialFilter]=input.value;update('#'+input.id);}));
  page.querySelectorAll('[data-material-subject]').forEach(button=>button.addEventListener('click',()=>{state.subject=button.dataset.materialSubject;update(`[data-material-subject="${state.subject}"]`);}));
  page.querySelectorAll('[data-material-expand]').forEach(button=>button.addEventListener('click',()=>{page.querySelectorAll('.materials-catalogs details').forEach(details=>details.open=button.dataset.materialExpand==='true');}));
}
