(function(){
const W=VOCAB_DATA.units[0].words,ARM=ARM_CFG.arm,L=ARM==='linguistic',LS=localStorage,SC=SCAFFOLDS,$=id=>document.getElementById(id);
let sid,i,lvl,streak,stars,t0,lv,shown,conf,strat,think,done,rec,tm,uses;
const J=(k,d)=>{try{return JSON.parse(LS.getItem(k))||d}catch(e){return d}};
const put=(k,v)=>{try{LS.setItem(k,JSON.stringify(v))}catch(e){}};
const rx=w=>new RegExp('\\b'+w+'(?:s|es|ed|d|ing)?\\b','gi');
const bl=(s,w)=>s.replace(rx(w),'_____'),hl=(s,w)=>s.replace(rx(w),m=>'<b>'+m+'</b>');
const sw=w=>(SC.words||{})[w]||{};
// Same items, same distractors, same order in both arms (deterministic)
function opts(k){const a=[W[k],W[(k+1)%W.length],W[(k+4)%W.length],W[(k+9)%W.length]],r=(k*3)%4;return a.map((_,j)=>a[(j+r)%4]);}
const gated=()=>!L&&((lv>=2&&conf==null)||(lv===3&&strat==null));
const nextBtn='<button class="b" data-a="next">Next →</button>';

function home(){$('app').innerHTML='<div class="c"><h1>🎵 Elementary Symphony</h1><p>Unit 1: Learning and Growth Mindset</p><input id="sid" placeholder="Student ID"><br><button class="b" data-a="go">Start 🚀</button></div>';}
function show(){
  if(i>=W.length)return end();
  const w=W[i];lv=lvl;shown=lv===3?9:lv===2?1:0;conf=null;strat=null;think=false;done=false;rec=null;uses=0;t0=Date.now();clearTimeout(tm);
  $('app').innerHTML='<div class="c"><div class="s">Word '+(i+1)+' of '+W.length+' · ⭐ '+stars+'</div><div class="q">“'+bl(w.example,w.word)+'”</div><div id="sp"></div><div id="ch">'+
    opts(i).map(o=>'<button class="o" data-a="pick" data-v="'+o.word+'">'+o.word+'</button>').join('')+'</div><div id="fb"></div></div>';
  sup();
  tm=setTimeout(()=>{const b=$('sb');if(b)b.classList.add('pulse')},20000); // time-based contingency: nudge toward help
}
function litems(w){const s=sw(w.word),a=['<div class="p">📖 Meaning: '+w.def+'</div>','<div class="p"><span class="e">'+w.emoji+'</span></div>'];if(s.model)a.push('<div class="p">✏️ '+hl(s.model,w.word)+'</div>');return a;}
function sup(){
  const w=W[i],h=[];let b='';
  if(L){const a=litems(w);h.push(...a.slice(0,shown));if(shown<a.length)b='<button id="sb" class="h" data-a="help">💡 '+(shown?'More help':'Help')+'</button>';}
  else{
    if(lv===3||think)h.push('<div class="p">🧠 '+(sw(w.word).clue||SC.generic.clue)+'</div><div class="p">'+SC.generic.predict+'</div>',
      '<div class="p">'+SC.generic.stratQ+'<br>'+SC.generic.strategies.map(s=>'<button class="m'+(strat===s?' on':'')+'" data-a="strat" data-v="'+s+'">'+s+'</button>').join('')+'</div>');
    if(lv>=2||think)h.push('<div class="p">'+SC.generic.confQ+'<br>'+['😟','😐','😊'].map((e,k)=>'<button class="m'+(conf===k+1?' on':'')+'" data-a="conf" data-v="'+(k+1)+'">'+e+'</button>').join('')+'</div>');
    if(lv<3&&!think)b='<button id="sb" class="h" data-a="think">🧠 Think</button>';
  }
  $('sp').innerHTML=h.join('')+b;
}
const act={
  go(){sid=$('sid').value.trim();if(!sid)return;const p=J('es_'+ARM+'_'+sid,{});lvl=p.lvl||3;streak=p.streak||0;i=0;stars=0;show();},
  help(){shown++;uses++;sup();},
  think(){think=true;uses++;sup();},
  strat(v){strat=v;sup();},
  conf(v){conf=+v;sup();},
  pick(v){
    if(done)return;
    if(gated()){$('fb').innerHTML='<div class="n">'+SC.generic.gate+'</div>';return;}
    done=true;clearTimeout(tm);
    const w=W[i],ok=v===w.word;
    rec={ts:new Date().toISOString(),arm:ARM,sid:sid,word:w.word,support_level:lv,correct:+ok,chosen:v,rt_sec:((Date.now()-t0)/1000).toFixed(1),support_requests:uses,confidence:conf||'',strategy:strat||'',reflection:''};
    document.querySelectorAll('.o').forEach(b=>{b.disabled=true;if(b.dataset.v===w.word)b.classList.add('ok');else if(b.dataset.v===v)b.classList.add('no');});
    // Fading / contingency: 2 correct in a row -> less support; any error -> more support
    if(ok){stars++;streak++;if(streak>=2){lvl=Math.max(1,lvl-1);streak=0;}}else{lvl=Math.min(3,lvl+1);streak=0;}
    put('es_'+ARM+'_'+sid,{lvl:lvl,streak:streak});
    let f=ok?'<div class="n g">✅ Well done!</div>':'<div class="n r">❌ Not this time. The word is <b>'+w.word+'</b>.</div>';
    if(L&&!ok)f+='<div class="p">🔁 Listen and say: “'+hl(w.example,w.word)+'”</div>'; // recast on error
    if(!L&&lv>=2){const g=SC.generic;f+='<div class="p">'+(ok?g.qRight:g.qWrong)+'<br>'+(ok?g.reflRight:g.reflWrong).map(r=>'<button class="m" data-a="refl" data-v="'+r+'">'+r+'</button>').join('')+'</div>';}
    else f+=nextBtn;
    $('fb').innerHTML=f;
  },
  refl(v){rec.reflection=v;document.querySelectorAll('[data-a=refl]').forEach(b=>{b.disabled=true;if(b.dataset.v===v)b.classList.add('on');});$('fb').insertAdjacentHTML('beforeend',nextBtn);},
  next(){const a=J('es_log',[]);a.push(rec);put('es_log',a);i++;show();},
  csv(){
    const a=J('es_log',[]);if(!a.length)return;const k=Object.keys(a[0]);
    const t=[k.join(',')].concat(a.map(r=>k.map(c=>'"'+String(r[c]==null?'':r[c]).replace(/"/g,'""')+'"').join(','))).join('\n');
    const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([t],{type:'text/csv'}));l.download='es_log.csv';l.click();
  },
  restart(){home();}
};
function end(){$('app').innerHTML='<div class="c"><h2>🏆 Unit complete!</h2><p>⭐ '+stars+' / '+W.length+'</p><button class="b" data-a="csv">⬇️ Export log (CSV)</button><button class="b" data-a="restart">Start over</button></div>';}
document.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(a&&act[a.dataset.a])act[a.dataset.a](a.dataset.v);});
home();
})();
