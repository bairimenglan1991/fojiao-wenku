import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {applyLaodaCommentary} from './laoda-commentary.mjs';
const git='C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe';
const mirror=path.resolve(import.meta.dirname,'..');
const site=path.resolve(mirror,'../佛教文库公开检索站');
const overlay=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'laoda-commentary-qiaqia-2172.json'),'utf8'));
const expected=overlay.groups[0].excerpts.map(x=>x.text).join('\n\n');
assert.equal(overlay.groups[0].excerpts.length,6);
for(const [root,prefix] of [[mirror,'data'],[site,'public/data']]) {
  const rel=prefix+'/records/FXYW-0934.json';
  const r=JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
  const old=JSON.parse(execFileSync(git,['show','HEAD:'+rel],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024}));
  assert.equal(r.fields.find(([k])=>k==='老大评唱')[1],expected);
  assert.equal(r.fields.filter(([k])=>k==='老大评唱').length,1);
  const originalFields=x=>x.fields.filter(([k])=>!['老大评唱','老大评唱来源'].includes(k));
  assert.deepEqual(originalFields(r),originalFields(old),'Ancient text or other fields changed');
  assert(r.fields.find(([k])=>k==='老大评唱来源')[1].includes(overlay.sourceUrl));
  assert(r.searchText.includes(expected));
  const copy=structuredClone(r);applyLaodaCommentary([copy],overlay);assert.deepEqual(copy,r,'Not idempotent');
  for(const name of ['index.json','search-index.json']) {
    const current=JSON.parse(fs.readFileSync(path.join(root,prefix,name),'utf8'));
    const before=JSON.parse(execFileSync(git,['show','HEAD:'+prefix+'/'+name],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024}));
    assert.equal(current.records.length,before.records.length);
    const prev=new Map(before.records.map(x=>[x.id,x]));
    for(const x of current.records) if(x.id!=='FXYW-0934') assert.deepEqual(x,prev.get(x.id),'Unrelated record changed '+x.id);
    const target=current.records.find(x=>x.id==='FXYW-0934');
    assert(target.searchNorm.includes('七处征心'));
  }
  console.log(JSON.stringify({site:path.basename(root),id:r.id,paragraphs:6,originalPreserved:true,otherRecordsPreserved:true,idempotent:true}));
}
