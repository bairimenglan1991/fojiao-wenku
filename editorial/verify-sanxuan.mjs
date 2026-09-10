import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {prepare,search} from '../search-engine.mjs';
const mirror=path.resolve(import.meta.dirname,'..');
const git='C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe';
const id='ZEN-三玄三要', name=encodeURIComponent(id)+'.json';
for(const [root,prefix] of [[mirror,'data'],[path.resolve(mirror,'../佛教文库公开检索站'),'public/data']]){
 const read=p=>JSON.parse(fs.readFileSync(path.join(root,prefix,p),'utf8'));
 const rec=read('records/'+name),original=JSON.parse(execFileSync(git,['show','HEAD:'+prefix+'/records/'+name],{cwd:root,encoding:'utf8'}));
 for(const f of original.fields)assert(rec.fields.some(x=>x[0]===f[0]&&x[1]===f[1]),f[0]);
 assert.equal(read('records/FXYW-0529.json').id,id);
 const index=read('search-index.json');
 for(const n of ['index.json','search-index.json','search-titles.json']){
  const rs=read(n).records;
  assert.equal(rs.filter(r=>r.id===id).length,1);assert(!rs.some(r=>r.id==='FXYW-0529'));
  const r=rs.find(r=>r.id===id);assert(r.titleNorms.includes('临济三玄三要'));assert(r.mergedIds.includes('FXYW-0529'));
 }
 for(const q of ['三玄三要','临济三玄三要'])assert.equal(search(prepare(index.records),q)[0].entry.id,id);
 for(const topic of ['shigong','qiaqia','linji']){
  const overlay=JSON.parse(fs.readFileSync(path.join(mirror,'editorial/laoda-commentary-'+topic+'-2172.json'),'utf8'));
  for(const target of overlay.groups[0].ids){
   const r=read('records/'+encodeURIComponent(target)+'.json');
   assert.equal(r.fields.find(([k])=>k==='老大评唱')[1],overlay.groups[0].excerpts.map(e=>e.text).join('\n\n'));
  }
 }
 assert.equal(read('search-manifest.json').count,index.records.length);
 console.log(path.basename(root)+': canonical text, aliases, redirect, search winners, all commentaries verified');
}

