import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {normalize} from '../search-engine.mjs';
import {applyLaodaCommentary, readOverlay} from './laoda-commentary.mjs';
const root = path.resolve(import.meta.dirname, '../data');
const overlay = readOverlay(process.argv[2] ? path.resolve(process.argv[2]) : undefined);
const changed = new Map();
let filesChanged = 0;
for (const dir of ['records','fast-records','candidates']) {
  for (const name of fs.readdirSync(path.join(root,dir))) {
    if (!name.endsWith('.json')) continue;
    const file = path.join(root,dir,name), old = fs.readFileSync(file,'utf8');
    const data = JSON.parse(old), records = data.records || [data];
    const originals = records.map(r => JSON.stringify((r.fields || []).filter(([k])=>!['老大评唱','老大评唱来源'].includes(k))));
    applyLaodaCommentary(records,overlay);
    records.forEach((r,i)=>{
      assert.equal(JSON.stringify((r.fields||[]).filter(([k])=>!['老大评唱','老大评唱来源'].includes(k))), originals[i], r.id+' original changed');
      if (r.fields?.some(([k])=>k==='老大评唱')) {
        r.searchNorm=normalize(r.searchText);
        changed.set(r.id,r);
      }
    });
    const next=JSON.stringify(data);
    if(next!==old){fs.writeFileSync(file,next);filesChanged++;}
  }
}
for(const name of ['index.json','search-index.json']) {
  const file=path.join(root,name),data=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const r of data.records) {
    const full=changed.get(r.id);if(!full)continue;
    r.searchNorm=full.searchNorm;
    if(Object.hasOwn(r,'searchText'))r.searchText=full.searchText;
  }
  fs.writeFileSync(file,JSON.stringify(data));
}
for(const g of overlay.groups)assert(g.ids.some(id=>changed.has(id)), 'Missing topic '+g.topic);
const manifestFile=path.join(root,'search-manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestFile));
const hash=createHash('sha256').update(fs.readFileSync(path.join(root,'search-index.json')));
for(const r of changed.values())hash.update(JSON.stringify(r));
manifest.version=hash.digest('hex').slice(0,20);
fs.writeFileSync(manifestFile,JSON.stringify(manifest));
console.log(JSON.stringify({topics:overlay.groups.length,records:changed.size,filesChanged,ids:[...changed.keys()],version:manifest.version},null,2));
