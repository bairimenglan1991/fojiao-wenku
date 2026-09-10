import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {applyLaodaCommentary} from './laoda-commentary.mjs';
const mirror=path.resolve(import.meta.dirname,'..'), site=path.resolve(mirror,'../佛教文库公开检索站');
const git='C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe';
const overlays=['shigong','qiaqia','linji'].map(n=>JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'laoda-commentary-'+n+'-2172.json'),'utf8')));
for(const [root,prefix] of [[mirror,'data'],[site,'public/data']]){
 for(const o of overlays){
  const id=o.groups[0].ids[0], rel=prefix+'/records/'+id+'.json';
  const r=JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
  const old=JSON.parse(execFileSync(git,['show','HEAD:'+rel],{cwd:root,encoding:'utf8'}));
  const expected=o.groups[0].excerpts.map(e=>e.text).join('\n\n');
  assert.equal(r.fields.find(([k])=>k==='老大评唱')[1],expected);
  assert.equal(r.fields.filter(([k])=>k==='老大评唱').length,1);
  const strip=x=>x.fields.filter(([k])=>!['老大评唱','老大评唱来源'].includes(k));
  assert.deepEqual(strip(r),strip(old));
  assert(r.searchText.includes(expected));
  const copy=structuredClone(r);applyLaodaCommentary([copy],o);assert.deepEqual(copy,r);
 }
 for(const name of ['index.json','search-index.json']){
  const current=JSON.parse(fs.readFileSync(path.join(root,prefix,name),'utf8'));
  const before=JSON.parse(execFileSync(git,['show','HEAD:'+prefix+'/'+name],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024}));
  assert.equal(current.records.length,before.records.length);
  const prev=new Map(before.records.map(r=>[r.id,r]));
  for(const r of current.records)if(!['FXYW-0934','FXYW-1205'].includes(r.id))assert.deepEqual(r,prev.get(r.id),r.id);
  assert(current.records.find(r=>r.id==='FXYW-1205').searchNorm.includes('体用何妨分不分'));
 }
 console.log(path.basename(root)+': three commentaries exact; original texts preserved; indices verified');
}

