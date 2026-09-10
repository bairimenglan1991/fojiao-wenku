import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {prepare,search} from '../search-engine.mjs';
const mirror=path.resolve(import.meta.dirname,'..');
for(const root of [path.join(mirror,'data'),path.resolve(mirror,'../佛教文库公开检索站/public/data')]){
 const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
 for(const topic of ['shigong','qiaqia','linji','yongjia','zhengjue']){
  const o=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'laoda-commentary-'+topic+'-2172.json'),'utf8'));
  for(const id of o.groups[0].ids){
   const r=read('records/'+encodeURIComponent(id)+'.json');
   assert.equal(r.fields.filter(([k])=>k==='老大评唱').length,1);
   assert.equal(r.fields.find(([k])=>k==='老大评唱')[1],o.groups[0].excerpts.map(e=>e.text).join('\n\n'),id);
  }
 }
 const keys=read('records/FXYW-0943.json').fields.map(f=>f[0]);
 assert(keys.indexOf('古籍原文｜宗密《圆觉经略疏》')<keys.indexOf('古籍原文｜大慧《答孙知县》'));
 assert(keys.indexOf('古籍原文｜大慧《答孙知县》')<keys.indexOf('老大评唱'));
 const index=read('search-index.json');
 assert(!index.records.some(r=>r.id==='FXYW-0529'));
 assert.equal(read('records/FXYW-0529.json').id,'ZEN-三玄三要');
 for(const [q,id] of [['一切众生皆证如来觉性','FXYW-0943'],['临济三玄三要','ZEN-三玄三要']])assert.equal(search(prepare(index.records),q)[0].entry.id,id);
 console.log(root+': all five commentary groups, reading order, merged entry and search verified');
}

