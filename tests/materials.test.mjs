import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { materialVersions } from '../src/materials-versions.js';
import { materialCatalogs } from '../src/materials-data.js';
import { examScopes, sharedExamTimetable } from '../src/exam-scopes-data.js';
import { selectCatalogs, flattenItems, scopeReferences, findPreviousExam, materialsPage } from '../src/materials.js';
const scope=(grade,subject)=>examScopes.find(s=>s.grade===grade&&s.subject===subject);
test('28 distinct year/term/grade/subject records and matching versions',()=>{
 for(const records of [materialVersions,materialCatalogs,examScopes]){assert.equal(records.length,28);assert.equal(new Set(records.map(r=>r.id)).size,28);assert.ok(records.every(r=>r.academicYear===115&&r.semester===1));}
 for(const c of materialCatalogs){assert.ok(materialVersions.some(v=>v.id===c.versionId));const items=flattenItems(c.items);assert.ok(items.every((item,i)=>item.order===i+1));assert.equal(new Set(items.map(i=>i.id)).size,items.length);}
 assert.equal(materialVersions.find(v=>v.grade===5&&v.subject==='數學').editionLabel,'學校自編（參考康軒）');
 assert.ok(materialVersions.every(v=>v.changeFromPreviousYear===null));
});
test('catalog query honors grade and subject without substituting another year',()=>{
 assert.equal(selectCatalogs({year:115,semester:1}).length,28);
 assert.equal(selectCatalogs({year:115,semester:1,grade:1}).length,4);
 assert.equal(selectCatalogs({year:115,semester:1,grade:6,subject:'數學'}).length,1);
 assert.equal(selectCatalogs({year:114,semester:1}).length,0);
 const first=selectCatalogs({year:115,semester:1,grade:1,subject:'國語'})[0];assert.equal(first.complete,false);assert.equal(first.coverageNote,'目前收錄首冊，另一本待補');
});
test('midterm references never expand G6 math or infer page-based G3 English units',()=>{
 assert.deepEqual(scopeReferences(scope(6,'數學')).map(r=>r.item.number),['U1','U3','U6','U8']);
 assert.equal(scope(3,'英語').originalText,'課本p.1、11、13、14、22、24（SW）、25（WB）；習作p.1；補教；另有口試及英聽');
 assert.equal(scopeReferences(scope(3,'英語')).length,0);
 assert.ok(scope(1,'英語').originalText.includes('不含U3 Reading'));
 assert.ok(scope(5,'國語').limits.some(t=>t.includes('L8：僅生字語詞、課文')));
 for(const s of examScopes)assert.ok(scopeReferences(s).every(r=>r.item),'Unresolved approved reference: '+s.id);
});
test('all five original uncertainties survive and questionable names are not equated',()=>{
 assert.equal(examScopes.flatMap(s=>s.questions).length,5);
 assert.equal(scope(2,'英語').status,'未提供');assert.equal(scope(2,'英語').references.length,0);
 assert.ok(scope(5,'英語').originalText.includes('p.1～11★5'));
 assert.ok(!scope(5,'國語').references.some(r=>r.key==='統整活動一'));
 assert.ok(scope(6,'國語').originalText.includes('饗閱讀一'));
 assert.ok(!scope(6,'國語').references.some(r=>r.key==='享閱讀一'));
 assert.ok(flattenItems(materialCatalogs.find(c=>c.grade===6&&c.subject==='國語').items).some(i=>i.raw==='享閱讀一｜驚蟄驅蟻記'));
});
test('catalog retains units after midterm including G6 math U2 U4 U5 U7',()=>{
 const c=materialCatalogs.find(c=>c.grade===6&&c.subject==='數學');assert.deepEqual(c.items.filter(i=>i.number).map(i=>i.number),['U1','U2','U3','U4','U5','U6','U7','U8']);
 const g5=materialCatalogs.find(c=>c.grade===5&&c.subject==='數學');assert.equal(g5.items.at(-1).number,'U10');
});
test('only provided subject dates are stored and timetable remains shared',()=>{
 assert.equal(examScopes.filter(s=>s.dates.length).length,6);
 assert.deepEqual(scope(5,'英語').dates.map(d=>d.start),['2026-10-22','2026-10-30','2026-11-04']);
 assert.equal(scope(6,'數學').dates.length,0);assert.equal(sharedExamTimetable.groups.length,2);
 assert.deepEqual(sharedExamTimetable.groups[0].rows,[['09:00–09:40','國語','數學'],['10:00–10:40','英語','生活']]);
 assert.equal(sharedExamTimetable.groups[1].rows[2][2],'—');
});
test('comparison requires exact prior year and identical term/exam/grade/subject',()=>{
 const now=scope(5,'英語');assert.equal(findPreviousExam(now),null);
 const previous={...now,academicYear:114};assert.equal(findPreviousExam(now,[previous]),previous);
 for(const field of ['semester','exam','grade','subject'])assert.equal(findPreviousExam(now,[{...previous,[field]:'different'}]),null);
 assert.equal(findPreviousExam(now,[{...previous,academicYear:113}]),null);
});
test('default page displays all grades and escapes/labels incomplete data',()=>{
 const html=materialsPage();for(const g of ['一年級','二年級','三年級','四年級','五年級','六年級'])assert.ok(html.includes(g));assert.ok(html.includes('目前收錄首冊，另一本待補'));assert.ok(html.includes('學校自編（參考康軒）'));
});
