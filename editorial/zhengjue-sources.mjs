import fs from 'node:fs';
const sources=JSON.parse(fs.readFileSync(new URL('./zhengjue-sources.json',import.meta.url),'utf8'));
export function addZhengjueSources(records){
 const r=records.find(r=>r.id==='FXYW-0943');
 if(!r)throw new Error('Missing FXYW-0943');
 r.aliases=[...new Set([...r.aliases,...sources.aliases])];
 for(const [k,v] of sources.fields){
  const old=r.fields.find(f=>f[0]===k);
  if(old&&old[1]!==v)throw new Error('Review existing source field '+k);
  if(!old)r.fields.push([k,v]);
 }
 // User-requested reading order: Zongmi, Kewen via Dahui, full modern commentary.
 const leading=['条目标题','来源栏目','古籍原文｜宗密《圆觉经略疏》','古籍原文｜大慧《答孙知县》','老大评唱','老大评唱来源','引用页码或藏经行号','校勘说明'];
 r.fields=[...leading.flatMap(k=>r.fields.filter(f=>f[0]===k)),...r.fields.filter(f=>!leading.includes(f[0]))];
 const marker='\n古籍校核补充\n';
 r.searchText=r.searchText.split(marker)[0]+marker+sources.aliases.join('\n')+'\n'+sources.fields.map(f=>f.join('\n')).join('\n\n');
}
