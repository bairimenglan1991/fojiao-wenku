import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mergeSanxuan, canonicalId, duplicateId} from './merge-sanxuan.mjs';
import {applyLaodaCommentary, readOverlay} from './laoda-commentary.mjs';
import {normalize,prepare,search} from '../search-engine.mjs';
const mirror=path.resolve(import.meta.dirname,'..');
const overlay=readOverlay(path.join(import.meta.dirname,'laoda-commentary-linji-2172.json'));
for(const root of [path.join(mirror,'data'),path.resolve(mirror,'../佛教文库公开检索站/public/data')]){
 const file=id=>path.join(root,'records',encodeURIComponent(id)+'.json');
 const original=JSON.parse(fs.readFileSync(file(canonicalId),'utf8'));
 const duplicate=JSON.parse(fs.readFileSync(file(duplicateId),'utf8'));
 const merged=mergeSanxuan([structuredClone(original),duplicate]);
 const primary=merged.records[0];
 applyLaodaCommentary([primary],overlay);
 primary.titleNorms=[primary.title,primary.label,...primary.aliases].map(normalize);
 primary.searchNorm=normalize(primary.searchText);
 for(const [key,value] of original.fields) assert(primary.fields.some(([k,v])=>k===key&&v===value),'Original field changed: '+key);
 assert.equal(primary.fields.find(([k])=>k==='老大评唱')[1],overlay.groups[0].excerpts.map(e=>e.text).join('\n\n'));
 const indexed=[];
 for(const name of ['index.json','search-index.json','search-titles.json']){
  const f=path.join(root,name), data=JSON.parse(fs.readFileSync(f,'utf8'));
  const before=data.records;
  assert(before.some(r=>r.id===canonicalId));
  const removed=before.filter(r=>r.id===duplicateId).length;
  data.records=before.filter(r=>r.id!==duplicateId).map(r=>{
   if(r.id!==canonicalId)return r;
   const next={...r};
   for(const key of Object.keys(r)) if(Object.hasOwn(primary,key)) next[key]=primary[key];
   next.mergedIds=primary.mergedIds;
   return next;
  });
  assert.equal(data.records.length,before.length-removed);
  for(const r of data.records) if(r.id!==canonicalId)assert.deepEqual(r,before.find(b=>b.id===r.id));
  assert(!data.records.some(r=>r.id===duplicateId));
  indexed.push([f,data]);
 }
 // Preserve old addresses as canonical detail aliases; never emit a duplicate search card.
 fs.writeFileSync(file(canonicalId),JSON.stringify(primary));
 fs.writeFileSync(file(duplicateId),JSON.stringify(primary));
 for(const [f,data] of indexed)fs.writeFileSync(f,JSON.stringify(data));
 const index=indexed.find(([f])=>f.endsWith('search-index.json'))[1];
 const prepared=prepare(index.records);
 for(const query of ['三玄三要','临济三玄三要']) {
  const hits=search(prepared,query);
  assert.equal(hits[0].entry.id,canonicalId,query+' winner');
  assert(!hits.some(h=>h.entry.id===duplicateId));
 }
 const manifestFile=path.join(root,'search-manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
 manifest.count=index.records.length;
 manifest.version=createHash('sha256').update(JSON.stringify(index)).update(JSON.stringify(primary)).digest('hex').slice(0,20);
 fs.writeFileSync(manifestFile,JSON.stringify(manifest));
 console.log(JSON.stringify({root,canonicalId,merged:duplicateId,paragraphs:3,originalPreserved:true,searchVerified:true,count:manifest.count}));
}

