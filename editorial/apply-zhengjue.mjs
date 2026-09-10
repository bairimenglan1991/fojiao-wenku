import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {applyLaodaCommentary,readOverlay} from './laoda-commentary.mjs';
import {addZhengjueSources} from './zhengjue-sources.mjs';
import {normalize,prepare,search} from '../search-engine.mjs';
const mirror=path.resolve(import.meta.dirname,'..');
const overlay=readOverlay(path.join(import.meta.dirname,'laoda-commentary-zhengjue-2172.json'));
for(const root of [path.join(mirror,'data'),path.resolve(mirror,'../佛教文库公开检索站/public/data')]){
 const f=path.join(root,'records/FXYW-0943.json'),r=JSON.parse(fs.readFileSync(f));
 const before=structuredClone(r);
 applyLaodaCommentary([r],overlay);addZhengjueSources([r]);
 r.titleNorms=[r.title,r.label,...r.aliases].map(normalize);r.searchNorm=normalize(r.searchText);
 for(const [k,v] of before.fields)assert(r.fields.some(([a,b])=>a===k&&b===v),'Existing field changed '+k);
 assert.equal(r.fields.find(([k])=>k==='老大评唱')[1],overlay.groups[0].excerpts.map(e=>e.text).join('\n\n'));
 assert.equal(overlay.groups[0].excerpts.length,10);
 fs.writeFileSync(f,JSON.stringify(r));
 for(const name of ['index.json','search-index.json','search-titles.json']){
  const file=path.join(root,name),data=JSON.parse(fs.readFileSync(file));
  const previous=structuredClone(data.records);
  data.records=data.records.map(x=>{
   if(x.id!==r.id)return x;
   const next={...x};for(const k of Object.keys(x))if(Object.hasOwn(r,k))next[k]=r[k];return next;
  });
  assert.equal(data.records.length,previous.length);
  for(let i=0;i<previous.length;i++)if(previous[i].id!==r.id)assert.deepEqual(data.records[i],previous[i]);
  fs.writeFileSync(file,JSON.stringify(data));
  if(name==='search-index.json'){
   for(const q of ['一切众生皆证如来觉性','一切众生皆证圆觉','皆证论'])assert.equal(search(prepare(data.records),q)[0].entry.id,r.id,q);
  }
 }
 const manifestPath=path.join(root,'search-manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestPath));
 manifest.version=createHash('sha256').update(fs.readFileSync(path.join(root,'search-index.json'))).update(JSON.stringify(r)).digest('hex').slice(0,20);
 fs.writeFileSync(manifestPath,JSON.stringify(manifest));
 console.log(JSON.stringify({root,id:r.id,paragraphs:10,ancientSources:3,originalPreserved:true,searchVerified:true}));
}

