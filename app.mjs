import {prepare,search,certifiedTitleMatch} from './search-engine.mjs';
const $=s=>document.querySelector(s), q=$('#q'),answer=$('#answer'),related=$('#related'),status=$('#status');
const examples=['南泉站猫','狗子有佛性','大慧宗杲竹篾子','珊瑚吱吱撑着月','仓央嘉措','那若巴'];
let titles=[],records=null,version='',timer=0,active=0,fullPromise=null;
const manifest=await fetch('data/search-manifest.json').then(r=>r.json());version=manifest.version;
titles=prepare((await fetch(`data/search-titles.json?v=${version}`).then(r=>r.json())).records);
status.textContent=`已收录 ${manifest.count.toLocaleString()} 条资料，可开始搜索。`;
$('#examples').innerHTML=examples.map(x=>`<button data-q="${x}">${x}</button>`).join('');
$('#examples').onclick=e=>{const x=e.target.dataset.q;if(x){q.value=x;run(x)}};$('#clear').onclick=()=>{q.value='';answer.hidden=true;related.hidden=true;status.textContent=`已收录 ${manifest.count.toLocaleString()} 条资料，可开始搜索。`;q.focus()};
q.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>run(q.value),45)});q.addEventListener('keydown',e=>{if(e.key==='Escape')$('#clear').click()});
function esc(x=''){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function loadFull(){return records||(fullPromise??=fetch(`data/search-index.json?v=${version}`).then(r=>r.json()).then(x=>records=prepare(x.records)))}
async function run(value){
  const query=value.trim(),seq=++active;if(!query)return $('#clear').click();
  history.replaceState({},'',`?q=${encodeURIComponent(query)}`);status.textContent='正在检索……';
  let ranked=[],fast=certifiedTitleMatch(titles,query);
  if(fast){ranked=[fast];show(ranked,query,seq);setTimeout(async()=>{ranked=search(await loadFull(),query);show(ranked,query,seq)},700)}
  else{ranked=search(await loadFull(),query);show(ranked,query,seq)}
}
async function show(ranked,query,seq){
  if(seq!==active)return;if(!ranked.length){status.textContent='暂未找到，可尝试人物、话头或原文片段。';answer.hidden=true;related.hidden=true;return}
  status.textContent=`“${query}”的最佳匹配`;const item=ranked[0].entry;
  const path=(item.detailPath||`data/records/${encodeURIComponent(encodeURIComponent(item.id))}.json`).replace(/^\//,'');
  const record=await fetch(`${path}?v=${version}`).then(r=>r.json());if(seq!==active)return;
  const fields=record.fields||[];
  answer.className='card';answer.hidden=false;answer.innerHTML=`<div class="card-head"><div><p class="kicker">最佳匹配 · ${esc(record.collection||record.category||'文库')}</p><h2>${esc(record.title)}</h2><div class="tags">${(record.tags||[]).map(x=>'#'+esc(x)).join(' ')}</div></div><button class="copy-all">一键复制全文</button></div>${fields.map(([label,text],i)=>`<section class="field"><div class="field-head"><span class="field-label">${esc(label)}</span>${/原文|颂古|拈提|评唱|正文|通行文本/.test(label)?`<button class="copy" data-i="${i}">一键复制</button>`:''}</div><div class="field-body">${esc(text)}</div></section>`).join('')}`;
  answer.querySelector('.copy-all').onclick=e=>copy(e.currentTarget,`${record.title}\n\n${fields.map(x=>x.join('\n')).join('\n\n')}`);
  answer.querySelectorAll('.copy').forEach(b=>b.onclick=e=>copy(e.currentTarget,fields[+e.currentTarget.dataset.i][1]));
  const rest=ranked.slice(1);related.hidden=!rest.length;related.innerHTML=rest.length?`<div class="card"><span class="field-label">也可能是</span><div class="related-list">${rest.map((x,i)=>`<button class="related-item" data-i="${i+1}"><strong>${esc(x.entry.title)}</strong><span>${esc(x.entry.collection||x.entry.category)}</span></button>`).join('')}</div></div>`:'';
  related.querySelectorAll('button').forEach(b=>b.onclick=()=>show([ranked[+b.dataset.i],...ranked.filter((_,i)=>i!==+b.dataset.i)],query,seq));
}
async function copy(button,text){await navigator.clipboard.writeText(text);const old=button.textContent;button.textContent='已复制';button.classList.add('ok');setTimeout(()=>{button.textContent=old;button.classList.remove('ok')},1200)}
const initial=new URLSearchParams(location.search).get('q');if(initial){q.value=initial;run(initial)}
