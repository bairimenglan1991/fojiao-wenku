const variants={斬:'斩',戰:'斩',战:'斩',站:'斩',貓:'猫',吱:'枝',著:'着',趙:'赵'};
export const normalize=value=>value.normalize('NFKC').toLowerCase().replace(/[斬戰战站貓吱著趙]/g,c=>variants[c]||c).replace(/[\s，。！？、；：“”‘’（）()《》〈〉·—_-]+/g,'');
export function prepare(records){return records.map(r=>({...r,_title:r.titleNorms.join(''),_book:normalize(r.collection)}));}
// Only return a title winner when unseen full text cannot outrank it.
export function certifiedTitleMatch(records,query,boosts={}){
  const q=normalize(query);if(!q)return null;
  const chars=[...q],pairs=chars.slice(1).map((c,i)=>chars[i]+c),unique=new Set(q).size;
  let best=null,unknown=-Infinity;
  for(const r of records){
    const priority=r.resultPriority||0;
    const boost=Math.max(boosts[r.id]||0,...(r.mergedIds||[]).map(id=>boosts[id]||0));
    if(r.category==='古籍全文'&&!q.includes(r._book)&&!r._book.includes(q)&&!q.includes('卷')){unknown=Math.max(unknown,boost);continue;}
    let rank;
    if(r.titleNorms.includes(q))rank=2000+priority+boost;
    else if(r._title.includes(q))rank=1500-q.length-r._title.indexOf(q)+priority+boost;
    else{
      const th=pairs.filter(p=>r._title.includes(p)).length;
      unknown=Math.max(unknown,Math.max(1000,th*120+pairs.length*45+unique*8)+priority+boost);continue;
    }
    if(!best||rank>best.rank)best={entry:{id:r.id,title:r.title,collection:r.collection,category:r.category,detailPath:r.detailPath,aliases:[r.title]},rank};
  }
  return best&&best.rank>unknown?best:null;
}
export function search(records,query,boosts={}){
  const q=normalize(query);if(!q)return [];
  const chars=[...q], pairs=chars.slice(1).map((c,i)=>chars[i]+c), unique=[...new Set(q)];
  const results=[];
  const add=(r,rank)=>{
    rank+=Math.max(boosts[r.id]||0,...(r.mergedIds||[]).map(id=>boosts[id]||0));
    if(rank>0)results.push({entry:{id:r.id,title:r.title,collection:r.collection,category:r.category,detailPath:r.detailPath,aliases:[r.title]},rank});
  };
  for(const r of records){
    if(r.category==='古籍全文'&&!q.includes(r._book)&&!r._book.includes(q)&&!q.includes('卷')){add(r,0);continue;}
    const title=r._title,text=r.searchNorm,priority=r.resultPriority||0;
    let rank=0;
    if(r.titleNorms.includes(q))rank=2000+priority;
    else if(title.includes(q))rank=1500-q.length-title.indexOf(q)+priority;
    else if(text.includes(q))rank=1000-Math.min(text.indexOf(q)/100,400)+priority;
    else{
      // Equivalent bigram membership without rebuilding two full-text Sets per keystroke.
      const th=pairs.filter(p=>title.includes(p)).length, sh=pairs.filter(p=>text.includes(p)).length;
      const ch=unique.filter(c=>text.includes(c)).length;
      if(Math.max(th*1.5,sh)/Math.max(1,pairs.length)<.34&&ch/Math.max(1,unique.length)<.72){add(r,0);continue;}
      rank=th*120+sh*45+ch*8+priority;
    }
    add(r,rank);
  }
  return results.sort((a,b)=>b.rank-a.rank).slice(0,6);
}
