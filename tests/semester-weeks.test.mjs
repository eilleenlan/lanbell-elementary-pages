import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weekSegments, taipeiToday } from '../src/semester-weeks.js';
test('confirmed first semester acceptance dates',()=>{
 for(const [start,label] of [['2026-10-11','第 7 週'],['2026-10-25','第 9 週'],['2026-11-01','第 10 週'],['2027-01-17','第 21 週'],['2027-01-24','寒假']])assert.equal(weekSegments(start,115)[0].label,label);
});
test('boundaries keep exact partial-week dates',()=>{
 assert.deepEqual(weekSegments('2026-08-30',115),[{label:'暑假',start:'2026-08-30',end:'2026-08-30'},{label:'第 1 週',start:'2026-08-31',end:'2026-09-05'}]);
 assert.deepEqual(weekSegments('2027-01-17',115),[{label:'第 21 週',start:'2027-01-17',end:'2027-01-20'},{label:'寒假',start:'2027-01-21',end:'2027-01-23'}]);
 assert.deepEqual(weekSegments('2027-02-07',115),[{label:'寒假',start:'2027-02-07',end:'2027-02-10'},{label:'週次待核對',start:'2027-02-11',end:'2027-02-13'}]);
});
test('unconfirmed semesters and summer never get inferred labels',()=>{
 for(const date of ['2027-02-14','2027-07-04'])assert.equal(weekSegments(date,115)[0].label,'週次待核對');
 assert.equal(weekSegments('2025-10-12',114)[0].label,'週次待核對');
});
test('verified replacement configuration can restart week count',()=>{
 const config={115:[{start:'2027-02-11',end:'2027-02-20',anchor:'2027-02-11',confirmed:true}]};
 assert.equal(weekSegments('2027-02-07',115,config)[1].label,'第 1 週');
 assert.equal(weekSegments('2027-02-14',115,config)[0].label,'第 2 週');
});
test('today follows Taiwan midnight',()=>{
 assert.equal(taipeiToday(new Date('2026-10-12T15:59:59Z')),'2026-10-12');
 assert.equal(taipeiToday(new Date('2026-10-12T16:00:00Z')),'2026-10-13');
});
