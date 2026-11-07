import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import cp from 'node:child_process';import {materialCatalogs} from '../src/materials-data.js';import {flattenItems} from '../src/materials.js';
const base='45c0d9573b4d88e0424974f55c4283bdc48078e6';
const git=(...a)=>cp.execFileSync('git',['-c','safe.directory='+process.cwd().replaceAll('\\','/'),...a],{maxBuffer:32*1024*1024});
const norm=s=>s.replaceAll('\r\n','\n');
test('published baseline preserved except exact Phase1 integration and approved test update',()=>{
 for(const f of git('ls-tree','-r','--name-only',base).toString().trim().split('\n')){
 if(f==='tests/release-002-003.test.mjs'){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),'a1c5d8f3d09d2d14e73bf1546a606715a052a73a0f5794cedef7c03328ac6d88');continue;}
 const original=git('show',base+':'+f);if(f==='src/app.js'){let expected=original.toString();for(const[a,b]of JSON.parse(fs.readFileSync('tests/phase1-edits.json')))expected=expected.replace(a,b);assert.equal(norm(fs.readFileSync(f,'utf8')),norm(expected),f)}
 else if(f==='index.html'){const expected=original.toString().replace('</head>','  <link rel="stylesheet" href="./src/materials.css?v=20261105-materials" />\n</head>').replace('./src/app.js?v=20261021-flu','./src/app.js?v=20261105-materials');assert.equal(norm(fs.readFileSync(f,'utf8')),norm(expected),f)}
 else if(f.endsWith('.png'))assert.deepEqual(fs.readFileSync(f),original,f);else assert.equal(norm(fs.readFileSync(f,'utf8')),norm(original.toString()),f);
 }
});
test('accepted materials are byte identical and all 657 catalog items remain',()=>{for(const[f,h]of Object.entries(JSON.parse(fs.readFileSync('tests/phase1-approved-hashes.json'))))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),h,f);assert.equal(materialCatalogs.flatMap(c=>flattenItems(c.items)).length,657)});
