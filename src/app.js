import { events, updatedAt } from './data.js?v=20261003-aliases';

const routes=[['/','首頁','⌂'],['/overview','學期總覽','▤'],['/calendar','篩選查詢／月曆','📅'],['/book-covers','書套尺寸','▤']];
const categoryGroups={
  '重要日程':['開學/放假','校園活動','校外教學','學習活動','晨間演說','暑期活動'],
  '學習與評量':['期中考','期末考','五年級學力測驗','英文拼字競試'],
  '畢業班':['畢業旅行','直升考','畢業考','畢業典禮'],
  '家長參與':['親師座談','家長簽章'],
  '行政與其他':['註冊/繳費','行政','健康檢查','新生入學','其他'],
};
const groupFor=(category)=>Object.entries(categoryGroups).find(([,items])=>items.includes(category))?.[0]||'行政與其他';
const placeFor=(category)=>['校外教學','畢業旅行'].includes(category)?'校外':'校內';
const state={view:'list',month:'all',academicYear:'all',semester:'all',grade:'all',place:'all',groups:[],categories:[],query:'',includePast:false,focusEvent:null};
const root=document.querySelector('#root');
const dateText=(event)=>{
  const weekdays='日一二三四五六';
  const short=(value)=>{const date=new Date(`${value}T00:00:00`);return `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}（${weekdays[date.getDay()]}）`};
  return event.end&&event.end!==event.start?`${short(event.start)}<span class="date-connector">｜</span><span class="date-end">${short(event.end)}</span>`:short(event.start);
};
const gradeText=(grades)=>grades.length?grades.map(x=>`${'一二三四五六'[x-1]}年級`).join('、'):'小學部全體';
const head=(a,b,c)=>`<header class="page-header"><span class="eyebrow">${a}</span><h1>${b}</h1><p>${c}</p></header>`;
const localDate=(value)=>new Date(`${value}T00:00:00`);
const startOfToday=()=>{const today=new Date();return new Date(today.getFullYear(),today.getMonth(),today.getDate())};
const daysUntil=(value)=>Math.ceil((localDate(value)-startOfToday())/86400000);
const compactDate=(event)=>{
  const weekdays='日一二三四五六';
  const format=(value)=>{const date=localDate(value);return `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}（${weekdays[date.getDay()]}）`};
  return event.end&&event.end!==event.start?`${format(event.start)}－${format(event.end)}`:format(event.start);
};
const countdownLabel=(date)=>{const days=daysUntil(date);return days===0?'就是今天':days>0?`還有 ${days} 天`:'已結束'};
const escapeHtml=(value)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const isPast=(event)=>localDate(event.end||event.start)<startOfToday();
const addDays=(value,days)=>{const date=localDate(value);date.setDate(date.getDate()+days);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`};
const googleCalendarUrl=(event)=>{
  const calendarDate=(value)=>value.replaceAll('-','');
  const details=[gradeText(event.grades),event.category,event.note||'', '本站為家長自行整理資訊，請以學校與導師最新公告為準。'].filter(Boolean).join('\n');
  const params=new URLSearchParams({action:'TEMPLATE',text:event.title,dates:`${calendarDate(event.start)}/${calendarDate(addDays(event.end||event.start,1))}`,details});
  return `https://calendar.google.com/calendar/render?${params}`;
};
const eventDetails=(event)=>{
  if(event.activitySchedule)return `<details class="event-details activity-details"><summary>查看細節</summary><div class="event-details-body"><section><h3>活動流程</h3><div class="exam-table-wrap"><table><thead><tr><th>時間</th><th>活動項目</th><th>地點</th></tr></thead><tbody>${event.activitySchedule.map(item=>`<tr><td>${escapeHtml(item.time)}</td><td>${escapeHtml(item.activity)}</td><td>${escapeHtml(item.place)}</td></tr>`).join('')}</tbody></table></div></section><section><h3>提醒事項</h3><ul>${(event.activityReminders||[]).map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul></section></div></details>`;

  if(!event.schedule&&!event.examScope&&!event.reminders)return '';
  const scopeFor=(subject)=>event.examScope?.find(([name])=>subject.replace(/科|閱讀|聽力/g,'')===name.replace(/科/g,''))?.[1]||'—';
  const schedule=event.schedule?`<section><h3>考試時間與範圍</h3><div class="exam-table-wrap"><table><thead><tr><th>日期</th><th>時間</th><th>科目</th><th>測驗範圍</th></tr></thead><tbody>${event.schedule.map((item,index)=>`<tr class="${index>0&&item.date!==event.schedule[index-1].date?'new-exam-day':''}"><td>${item.date}</td><td>${item.time}</td><td>${item.subject}</td><td>${scopeFor(item.subject)}</td></tr>`).join('')}</tbody></table></div></section>`:'';
  const reminders=event.reminders?`<section><h3>重要提醒</h3><ul>${event.reminders.map(item=>`<li>${item}</li>`).join('')}</ul></section>`:'';
  return `<details class="event-details"><summary>查看考程與範圍</summary><div class="event-details-body">${schedule}${reminders}</div></details>`;
};

const examCategories=new Set(['期中考','期末考','五年級學力測驗','英文拼字競試','直升考','畢業考']);
function examCountdown(){
 const exams=events.filter(event=>examCategories.has(event.category)&&!isPast(event)&&daysUntil(event.start)<=14).sort((a,b)=>a.start.localeCompare(b.start));
 return '<section class="exam-countdown countdown-card" aria-labelledby="exam-countdown-title"><h2 id="exam-countdown-title">兩週內考試倒數</h2><p class="exam-countdown-intro">今天起 14 天內的考試，含正在進行的考試。</p>'+(exams.length?'<ul>'+exams.map(event=>'<li><a class="countdown-event-link" href="#/calendar" data-event-index="'+events.indexOf(event)+'"><strong>'+(daysUntil(event.start)<0?'進行中':countdownLabel(event.start))+'</strong><h3>'+escapeHtml(event.title)+'</h3><p>'+compactDate(event)+'</p><p>'+gradeText(event.grades)+(event.tentative?' · 暫定':'')+'</p></a></li>').join('')+'</ul>':'<p class="countdown-empty">依目前已整理的行程，兩週內沒有考試。</p>')+'</section>';
}

function home(){
 const upcoming=events.filter(x=>!isPast(x)).sort((a,b)=>a.start.localeCompare(b.start)).slice(0,3);
 return '<section class="hero"><div class="hero-copy"><span class="eyebrow">ELEMENTARY SCHOOL CALENDAR</span><h1>小學生活的重要日子，<br>一起好好記下來。</h1><p>一至六年級的學校活動、學習評量與親師日程。</p><div class="hero-actions"><a class="primary" href="#/overview">📅 查看完整行事曆</a><a href="#/calendar">篩選查詢／月曆 ›</a></div></div><aside class="today-card countdown-card"><span>◷ 近期重要日程</span><section class="entrance-countdown">'+(upcoming.length?upcoming.map(x=>'<a class="countdown-event-link upcoming-event-link" href="#/calendar" data-event-index="'+events.indexOf(x)+'"><h2>'+escapeHtml(x.title)+'<span aria-hidden="true">›</span></h2><p>'+compactDate(x)+'</p></a>').join(''):'<h2>目前沒有近期日程</h2><p>目前已整理的活動皆已結束，請至行事曆勾選「包含已過期」查看。</p>')+'</section><a href="#/calendar">查看行事曆 <b>›</b></a></aside></section><section class="status-band"><b>○</b><div><strong>115學年度第一學期行事曆</strong><span>'+(events.length?'已整理 '+events.length+' 項活動':'學校、學年度與正式日期待補，目前沒有正式行程。')+'</span></div></section>'+examCountdown();
}


const currentMonth=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
const monthLabel=m=>m.replace('-', ' 年 ')+' 月';
const inTerm=e=>(state.academicYear==='all'||e.academicYear===Number(state.academicYear))&&(state.semester==='all'||e.semester===Number(state.semester));
const eventMonths=e=>{const result=[];let m=e.start.slice(0,7);const end=(e.end||e.start).slice(0,7);while(m<=end){result.push(m);m=shiftMonth(m,1);}return result};
const shiftMonth=(m,n)=>{const d=new Date(m+'-01T00:00:00');d.setMonth(d.getMonth()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
const availableMonths=()=>[...new Set(events.filter(inTerm).flatMap(eventMonths))].sort();
const matchesMonth=e=>state.month==='all'||eventMonths(e).includes(state.month);
function monthGrid(items){
 const first=localDate(state.month+'-01');const count=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();const today=addDays(currentMonth()+'-01',new Date().getDate()-1);
 let cells=Array.from({length:first.getDay()},()=>'<div class="month-blank"></div>');
 for(let day=1;day<=count;day++){const date=state.month+'-'+String(day).padStart(2,'0');const dayEvents=items.filter(e=>e.start<=date&&(e.end||e.start)>=date);cells.push('<div class="month-day '+(date===today?'month-today':'')+'"><time datetime="'+date+'">'+day+'</time>'+dayEvents.map(e=>'<button type="button" class="month-event" data-calendar-event="'+events.indexOf(e)+'">'+escapeHtml(e.title)+(e.tentative?'（暫定）':'')+'</button>').join('')+'</div>');}
 return '<div class="month-navigation"><button type="button" data-month-step="-1" aria-label="上個月">‹ 上個月</button><h2>'+monthLabel(state.month)+'</h2><button type="button" data-month-step="1" aria-label="下個月">下個月 ›</button></div><div class="month-scroll"><div class="month-grid">'+[...'日一二三四五六'].map(d=>'<div class="weekday">'+d+'</div>').join('')+cells.join('')+'</div></div>'+(items.length?'':'<p class="empty-state">本月沒有符合篩選條件的行程，可調整篩選或勾選「包含已過期」。</p>');
}


const categoryAliases={
 '期中考':['期中','期中評量','期中考試','段考'],
 '期末考':['期末','期末評量','期末考試','段考'],
 '五年級學力測驗':['學力檢測','學力測驗','五年級學力檢測'],
 '畢業旅行':['畢旅'],
 '畢業考':['畢業評量','畢業考試'],
 '直升考':['直升考試','直升測驗'],
 '畢業典禮':['畢典'],
 '暑期活動':['暑輔','暑期輔導','暑期班'],
 '晨間演說':['晨間演講','晨演','晨間朗讀'],
 '英文拼字競試':['英文拼字比賽','拼字比賽']
};
const normalizeSearch=value=>String(value).normalize('NFKC').toLocaleLowerCase('zh-Hant').replace(/\s+/g,' ').trim();
const aliasesFor=event=>[
 ...(categoryAliases[event.category]||[]),...(event.aliases||[]),
 ...(event.title.includes('學校日')?['家長日','親師座談會']:[]),
 ...(event.title.includes('結業式')||event.title.includes('休業式')?['結業式','休業式']:[]),
 ...(event.title.includes('藝文活動')?['音樂會','親子音樂會']:[]),
 ...(event.title.includes('校車')&&event.title.includes('費')?['校車繳費','校車費','交通費']:[]),
 ...(event.title.includes('註冊')?['註冊費','註冊繳費','學費']:[])
];

function calendar(){
  if(state.view==='month'&&state.month==='all'){const months=availableMonths();state.month=months.includes(currentMonth())?currentMonth():(months[0]||currentMonth());}
  const categories=state.groups.length?[...new Set(state.groups.flatMap(group=>categoryGroups[group]))]:Object.values(categoryGroups).flat();
  const query=normalizeSearch(state.query);
  const matchesQuery=(x)=>{
    if(!query)return true;
    const dates=[x.start,x.end||''].flatMap(value=>value?[value,value.replaceAll('-','.'),value.replaceAll('-','/')]:[]);
    const haystack=normalizeSearch([x.title,x.note||'',x.category,groupFor(x.category),placeFor(x.category),gradeText(x.grades),...dates,...aliasesFor(x)].join(' '));
    return haystack.includes(query);
  };
  const filtered=events.filter(x=>(state.academicYear==='all'||x.academicYear===Number(state.academicYear))&&(state.semester==='all'||x.semester===Number(state.semester))&&(state.includePast||!isPast(x))&&(state.grade==='all'||x.grades.length===0||x.grades.includes(Number(state.grade)))&&(state.place==='all'||placeFor(x.category)===state.place)&&(state.groups.length===0||state.groups.includes(groupFor(x.category)))&&(state.categories.length===0||state.categories.includes(x.category))&&matchesQuery(x)&&matchesMonth(x)).slice().sort((a,b)=>a.start.localeCompare(b.start)||a.title.localeCompare(b.title,'zh-Hant'));
  return head(`${state.academicYear==='all'?'全部學年度':state.academicYear+'學年度'}・${state.semester==='all'?'全部學期':state.semester==='1'?'上學期':'下學期'}`,'小學活動行事曆','依年級、校內／校外、大分類與小分類快速篩選。標示「暫定」的日期仍須以最新公告為準。')+
    `<div class="view-controls"><a href="#/overview">學期總覽</a><button type="button" data-view="list" aria-pressed="${state.view==='list'}">清單</button><button type="button" data-view="month" aria-pressed="${state.view==='month'}">月曆</button><button type="button" id="this-month">回到本月</button></div><section class="calendar-tools" aria-label="行事曆篩選"><div class="select-filters"><label>學年度<select id="academic-year-filter"><option value="all">全部學年度</option>${[...new Set(events.map(x=>x.academicYear))].sort((a,b)=>b-a).map(year=>`<option value="${year}">${year}學年度</option>`).join('')}</select></label><label>學期<select id="semester-filter"><option value="all">全部</option><option value="1">上學期</option><option value="2">下學期</option></select></label><label>月份<select id="month-filter">${state.view==='list'?'<option value="all">全部月份</option>':''}${[...new Set([...availableMonths(),...(state.month!=='all'?[state.month]:[])])].sort().map(m=>`<option value="${m}">${monthLabel(m)}</option>`).join('')}</select></label><label>適用年級<select id="grade-filter"><option value="all">全部年級</option><option value="1">一年級</option><option value="2">二年級</option><option value="3">三年級</option><option value="4">四年級</option><option value="5">五年級</option><option value="6">六年級</option></select></label><label>校內／校外<select id="place-filter"><option value="all">全部</option><option value="校內">校內</option><option value="校外">校外</option></select></label><label class="past-toggle"><input id="include-past" type="checkbox" ${state.includePast?'checked':''}><span>包含已過期</span></label><p>顯示 <strong>${filtered.length}</strong> 項</p></div><fieldset class="multi-filter"><legend>大分類（可複選；未選代表全部）</legend><div>${Object.keys(categoryGroups).map(x=>`<label><input type="checkbox" name="group-filter" value="${x}" ${state.groups.includes(x)?'checked':''}><span>${x}</span></label>`).join('')}</div></fieldset><fieldset class="multi-filter"><legend>小分類（可複選；未選代表全部）</legend><div>${categories.map(x=>`<label><input type="checkbox" name="category-filter" value="${x}" ${state.categories.includes(x)?'checked':''}><span>${x}</span></label>`).join('')}</div></fieldset></section>`+
    `<section class="calendar-results">${state.view==='month'?monthGrid(filtered):''}<section class="timeline" ${state.view==='month'?'hidden':''}>${filtered.map(x=>`<article id="event-${events.indexOf(x)}" class="${isPast(x)?'past-event ':''}${state.focusEvent===events.indexOf(x)?'focused-event':''}"><time>${dateText(x)}</time><div class="event-copy"><div class="event-tags"><span class="place-tag">${placeFor(x.category)}</span><span class="group-tag">${groupFor(x.category)}</span><span class="tag">${x.category}</span><span class="grade-tag">${gradeText(x.grades)}</span>${x.tentative?'<span class="tentative-tag">暫定</span>':''}${isPast(x)?'<span class="expired-tag">已結束</span>':''}</div><h2>${x.title}</h2>${x.note?`<p>${x.note}</p>`:''}${eventDetails(x)}<a class="google-calendar-link" href="${googleCalendarUrl(x)}" target="_blank" rel="noopener">＋ 加入 Google 日曆</a></div></article>`).join('')||`<p class="empty-state">${events.length?'目前沒有符合條件的活動。':'尚未加入正式活動，等待學校行事曆資料。'}</p>`}</section></section><p class="source-note">資料來源：學校115學年度第1學期學校簡曆表（表頭標記0618）。另含使用者提供的112至114學年度暑期活動與六年級畢業相關行程日期供備查。115學年度資料涵蓋2026年暑假至2027年2月11日第二學期開學；請以學校最新公告為準。</p>`;

}


const overviewState={year:115,semester:1};

function overviewWeekDays(start,items,month,today){
 return '<div class="overview-week-days">'+[...'日一二三四五六'].map((label,index)=>{
  const date=addDays(start,index),hasEvent=items.some(e=>e.start<=date&&(e.end||e.start)>=date);
  return '<div class="overview-day '+(index===0||index===6?'is-weekend ':'')+(date.slice(0,7)!==month?'outside-month ':'')+(date===today?'is-today':'')+'" aria-label="'+date+' 星期'+label+(hasEvent?'，有行程':'')+'"'+(date===today?' aria-current="date"':'')+'><span>'+label+'</span><time datetime="'+date+'">'+Number(date.slice(-2))+'</time><i aria-hidden="true">'+(hasEvent?'•':'')+'</i></div>';
 }).join('')+'</div>';
}

function overview(){
 const {year,semester}=overviewState;
 const items=events.filter(e=>e.academicYear===year&&e.semester===semester).sort((a,b)=>a.start.localeCompare(b.start));
 const y=year+1911,start=semester===1?y+'-07-01':(y+1)+'-02-01';let end=semester===1?(y+1)+'-01-31':(y+1)+'-07-31';
 for(const e of items)if((e.end||e.start)>end)end=e.end||e.start;
 const today=addDays(currentMonth()+'-01',new Date().getDate()-1);let month=start.slice(0,7),sections=[],jumps=[];
 while(month<=end.slice(0,7)){
 const first=month+'-01',last=addDays(shiftMonth(month,1)+'-01',-1);let day=addDays(first,-localDate(first).getDay()),rows=[];
 while(day<=last){const stop=addDays(day,6),current=day<=today&&stop>=today&&today.slice(0,7)===month;
 const entries=items.filter(e=>e.start<=stop&&(e.end||e.start)>=day&&e.start<=last&&(e.end||e.start)>=first);
 rows.push('<tr '+(current?'id="overview-current" class="overview-current"':'')+'><th scope="row">'+day.slice(5).replace('-','/')+'～'+stop.slice(5).replace('-','/')+'<small>'+(current?'本週':'日期區間')+'</small>'+overviewWeekDays(day,items,month,today)+'</th><td>'+entries.map(e=>'<details class="overview-event"><summary><span>'+e.start.slice(5).replace('-','/')+(e.end&&e.end!==e.start?'～'+e.end.slice(5).replace('-','/'):'')+'</span><strong>'+escapeHtml(e.title)+(e.tentative?'（暫定）':'')+'</strong><small>'+gradeText(e.grades)+' · '+e.category+'</small></summary><div class="overview-body">'+(e.note?'<p>'+escapeHtml(e.note)+'</p>':'')+eventDetails(e)+'<a href="'+googleCalendarUrl(e)+'" target="_blank" rel="noopener">＋ 加入 Google 日曆</a></div></details>').join('')+(entries.length?'':'<p class="overview-empty">本週未收錄行程</p>')+'</td></tr>');day=addDays(day,7);}
 jumps.push('<button data-jump="overview-'+month+'" aria-label="'+monthLabel(month)+'">'+Number(month.slice(5))+' 月'+(month.slice(0,4)!==start.slice(0,4)?'（'+month.slice(0,4)+'）':'')+'</button>');sections.push('<section class="overview-month" id="overview-'+month+'"><h2>'+monthLabel(month)+'</h2><table class="overview-table"><thead><tr><th>週次與日期</th><th>當週行程</th></tr></thead><tbody>'+rows.join('')+'</tbody></table></section>');month=shiftMonth(month,1);}
 return head('學期總覽',year+' 學年度'+(semester===1?'上學期':'下學期'),'整學期依月份與每週呈現，包含已過及未來行程。')+'<div class="view-controls"><button aria-pressed="true">學期總覽</button><a href="#/calendar" data-overview-mode="list">篩選查詢／清單</a><a href="#/calendar" data-overview-mode="month">月曆</a></div><div class="overview-selectors"><label>學年度 <select id="overview-year">'+[...new Set(events.map(e=>e.academicYear))].sort((a,b)=>b-a).map(v=>'<option value="'+v+'" '+(v===year?'selected':'')+'>'+v+'學年度</option>').join('')+'</select></label><label>學期 <select id="overview-semester"><option value="1" '+(semester===1?'selected':'')+'>上學期</option><option value="2" '+(semester===2?'selected':'')+'>下學期</option></select></label><span>已收錄 '+items.length+' 項行程</span></div><p class="source-note">'+(year<115?'歷史資料僅供參考，非完整學期行事曆。':'')+'依目前已收錄資料呈現；空白週不代表放假。週次尚未逐一核對，先以日期區間呈現。跨週、跨月活動會重複顯示；點選活動可展開備註。</p><div class="overview-jumps"><button data-jump="overview-current">跳到本週</button>'+jumps.join('')+'</div><p id="overview-message" role="status"></p>'+sections.join('');
}

function bookCovers(){return head('115學年度','書套尺寸參考','依年級查看整理表，點選圖片可開啟原圖。')+`<section class="book-cover-grid">${[1,5,6].map(grade=>`<article class="book-cover-card"><h2>${{1:'一',5:'五',6:'六'}[grade]}年級</h2><a href="./assets/book-covers/grade-${grade}.png" target="_blank" rel="noopener"><img src="./assets/book-covers/grade-${grade}.png" alt="115學年${grade}年級書套尺寸參考表" loading="lazy"></a><div class="book-cover-actions"><a href="./assets/book-covers/grade-${grade}.png" target="_blank" rel="noopener">放大查看</a><a href="./assets/book-covers/grade-${grade}.png" download="115菁英班書套尺寸參考--G${grade}.png">下載原檔</a></div></article>`).join('')}</section>`;}

function render(resetScroll=false){
  const previousScroll=window.scrollY;
  const raw=location.hash.slice(1)||'/';
  const path=routes.some(([p])=>p===raw)?raw:'/';
  const pages={'/':home,'/overview':overview,'/calendar':calendar,'/book-covers':bookCovers};
  root.innerHTML=`<div class="site-shell"><header class="site-header"><a class="brand" href="#/"><b>◆</b><span>小鈴鐺資訊整合（小學）</span></a><button class="menu-button" aria-label="切換導覽">☰</button><nav aria-label="主要導覽">${routes.map(([p,l,i])=>`<a class="${path===p?'active':''}" href="#${p}"><b>${i}</b><span>${l}</span></a>`).join('')}<a href="https://eilleenlan.github.io/word-club/" target="_blank" rel="noopener noreferrer" aria-label="英文單字練習（另開新分頁）"><b aria-hidden="true">🔤</b><span>英文單字練習</span></a></nav></header><div class="school-level-switch" role="navigation" aria-label="切換學段"><span class="school-level-label">逛逛小鈴鐺</span><span class="school-level-current" aria-current="true"><span><span aria-hidden="true">🔔</span> 小學鈴噹</span><span class="school-level-hint">你在這裡</span></span><a href="https://eilleenlan.github.io/lanbell/#/" aria-label="前往國中資訊網站"><span aria-hidden="true">🔔</span><span>國中鈴鐺</span></a></div><aside class="site-notice" aria-label="網站聲明">非官方網站，純屬家長交流參考，一切資訊以學校最新公告為準</aside><main>${pages[path]()}</main><footer>非官方網站，純屬家長交流參考，一切資訊以學校最新公告為準<span>最後更新：${updatedAt}</span></footer></div>`;
  document.querySelector('.menu-button').onclick=()=>document.querySelector('nav').classList.toggle('open');
  if(path==='/'){
    const actions=document.querySelector('.hero-actions');
    actions.querySelector('.secondary')?.remove();
    document.querySelector('.quick-section')?.remove();
    actions.insertAdjacentHTML('beforebegin','<form class="calendar-search home-search" id="home-search" role="search"><label for="home-search-input">搜尋所有行程</label><div><input id="home-search-input" type="search" placeholder="例如：畢旅、暑輔、一年級" autocomplete="off"><button class="search-button" type="submit">搜尋</button></div></form>');
    const homeSearch=document.querySelector('#home-search');
    const homeSearchInput=document.querySelector('#home-search-input');
    homeSearchInput.value=state.query;
    homeSearch.onsubmit=(event)=>{event.preventDefault();state.query=homeSearchInput.value.trim();if(!state.query)return;state.view='list';state.month='all';state.includePast=true;location.hash='#/calendar'};
    document.querySelectorAll('.countdown-event-link').forEach(link=>link.onclick=()=>{state.academicYear='all';state.semester='all';state.grade='all';state.place='all';state.groups=[];state.categories=[];state.query='';state.includePast=false;state.view='list';state.month='all';state.focusEvent=Number(link.dataset.eventIndex)});
  }
  if(path==='/overview'){
 document.querySelector('#overview-year').onchange=e=>{overviewState.year=Number(e.target.value);render()};
 document.querySelector('#overview-semester').onchange=e=>{overviewState.semester=Number(e.target.value);render()};
 document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{const target=document.getElementById(b.dataset.jump);if(target)target.scrollIntoView({behavior:'smooth',block:'start'});else document.querySelector('#overview-message').textContent='本週不在目前學期日期範圍內。'});
 document.querySelectorAll('[data-overview-mode]').forEach(a=>a.onclick=()=>{state.view=a.dataset.overviewMode;state.academicYear=String(overviewState.year);state.semester=String(overviewState.semester);state.month='all';state.includePast=true;state.query='';state.groups=[];state.categories=[];state.grade='all';state.place='all';});
 }
 if(path==='/calendar'){

    document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;render()});
    const month=document.querySelector('#month-filter');month.value=state.month;month.onchange=()=>{state.month=month.value;state.includePast=true;render()};
    document.querySelector('#this-month').onclick=()=>{const entry=events.filter(e=>eventMonths(e).includes(currentMonth())).sort((a,b)=>b.academicYear-a.academicYear)[0];state.academicYear=entry?String(entry.academicYear):'all';state.semester=entry?String(entry.semester):'all';state.month=currentMonth();state.includePast=true;render()};
    const bindResults=()=>{
      document.querySelectorAll('[data-month-step]').forEach(b=>b.onclick=()=>{const next=shiftMonth(state.month,Number(b.dataset.monthStep));state.month=next;state.includePast=true;render()});
      document.querySelectorAll('[data-calendar-event]').forEach(b=>b.onclick=()=>{state.focusEvent=Number(b.dataset.calendarEvent);state.view='list';render()});
    };bindResults();
    const year=document.querySelector('#academic-year-filter');year.value=state.academicYear;year.onchange=()=>{state.academicYear=year.value;state.month='all';state.includePast=true;render()};
    const semester=document.querySelector('#semester-filter');semester.value=state.semester;semester.onchange=()=>{state.semester=semester.value;state.month='all';render()};
    const grade=document.querySelector('#grade-filter');
    const place=document.querySelector('#place-filter');
    const includePast=document.querySelector('#include-past');
    const groupChecks=[...document.querySelectorAll('[name="group-filter"]')];
    const categoryChecks=[...document.querySelectorAll('[name="category-filter"]')];
    grade.value=state.grade; place.value=state.place;
    const searchForm=document.createElement('form');
    searchForm.className='calendar-search';
    searchForm.setAttribute('role','search');
    searchForm.innerHTML='<label for="calendar-search-input">搜尋行事曆</label><div><input id="calendar-search-input" type="search" placeholder="例如：段考、畢旅、家長日" autocomplete="off"><button class="search-button" type="submit">搜尋</button><button class="clear-button" type="button">清除搜尋</button></div>';
    document.querySelector('.calendar-tools').before(searchForm);
    const searchInput=searchForm.querySelector('input');
    searchInput.value=state.query;
    // Keep the input node alive to preserve focus, selection and IME composition.
    const updateSearch=()=>{
      state.query=searchInput.value;
      const template=document.createElement('template');
      template.innerHTML=calendar();
      document.querySelector('.calendar-results').replaceWith(template.content.querySelector('.calendar-results'));bindResults();
      document.querySelector('.select-filters strong').textContent=template.content.querySelector('.select-filters strong').textContent;
    };
    let composing=false;
    searchInput.addEventListener('compositionstart',()=>{composing=true});
    searchInput.addEventListener('compositionend',()=>{composing=false;updateSearch()});
    searchInput.oninput=(event)=>{if(!composing&&!event.isComposing)updateSearch()};
    searchForm.onsubmit=(event)=>{event.preventDefault();if(!composing)updateSearch()};
    searchForm.querySelector('.clear-button').onclick=()=>{searchInput.value='';updateSearch();searchInput.focus()};
    grade.onchange=()=>{state.grade=grade.value;render()};
    place.onchange=()=>{state.place=place.value;render()};
    includePast.onchange=()=>{state.includePast=includePast.checked;render()};
    groupChecks.forEach(input=>input.onchange=()=>{state.groups=groupChecks.filter(x=>x.checked).map(x=>x.value);const allowed=state.groups.length?state.groups.flatMap(x=>categoryGroups[x]):Object.values(categoryGroups).flat();state.categories=state.categories.filter(x=>allowed.includes(x));render()});
    categoryChecks.forEach(input=>input.onchange=()=>{state.categories=categoryChecks.filter(x=>x.checked).map(x=>x.value);render()});
    if(state.focusEvent!==null){const target=document.querySelector(`#event-${state.focusEvent}`);requestAnimationFrame(()=>target?.scrollIntoView({behavior:'smooth',block:'center'}));state.focusEvent=null}
  }
  window.scrollTo(0,resetScroll?0:previousScroll);
}
addEventListener('hashchange',()=>render(true));render();

if(document.modelContext?.registerTool){
  try{Promise.resolve(document.modelContext.registerTool({
    name:'search_elementary_calendar',description:'搜尋小學行事曆並顯示結果，不新增活動。',
    inputSchema:{type:'object',properties:{query:{type:'string'}},required:['query'],additionalProperties:false},
    annotations:{readOnlyHint:false},
    execute(input){if(!input||typeof input.query!=='string')throw new Error('query 必須是文字');state.query=input.query;state.grade='all';state.academicYear='all';state.semester='all';state.place='all';state.groups=[];state.categories=[];state.includePast=true;location.hash='#/calendar';render();return {query:state.query,total:document.querySelector('.select-filters strong').textContent}}
  })).catch(()=>{});}catch{}
}
