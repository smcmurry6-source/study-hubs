const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync(process.argv[2],'utf8');
function grab(name){
  const m=src.match(new RegExp('(?:const|var|let)\\s+'+name+'\\s*=\\s*\\['));
  let i=m.index+m[0].length-1, depth=0, q=null, esc=false;
  for(let j=i;j<src.length;j++){const c=src[j];
    if(q){ if(esc){esc=false;continue;} if(c==='\\'){esc=true;continue;} if(c===q){q=null;} continue;}
    if(c==='"'||c==="'"||c==='`'){q=c;continue;}
    if(c==='[')depth++; else if(c===']'){depth--; if(depth===0) return vm.runInNewContext('('+src.slice(i,j+1)+')');}
  }
}
const L=grab('LECTURES'), Q=grab('QUESTIONS');
console.error('lectures',L.length,'questions',Q.length);
const types={};Q.forEach(q=>types[q.type]=(types[q.type]||0)+1);console.error(types);
const srcs={};Q.forEach(q=>srcs[q.src]=(srcs[q.src]||0)+1);console.error(srcs);
console.error('keys',[...new Set(Q.flatMap(Object.keys))].join(','));
const ids=new Set();Q.forEach(q=>{if(ids.has(q.id))console.error('DUP',q.id);ids.add(q.id)});
const out={hub:"hepatobiliary",exam:"GI Exam 2",archived:"2026-09-23",
 lectures:L.map(l=>({id:l.id,num:l.num,title:l.title,who:l.who})),
 questions:Q};
fs.writeFileSync(process.argv[3],JSON.stringify(out,null,1));
