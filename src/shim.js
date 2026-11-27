/* NMS Companion standalone shim: gives the page the same `desktop` API the Claude artifact runtime provided */
(function(){
const B=window.nmscBridge;if(!B)return;window.NMSC_STANDALONE=true;
const cbs={};let cid=0;
const ser=items=>(items||[]).map(i=>{const o={...i};if(typeof i.click==='function'){const id='c'+(++cid);cbs[id]=i.click;o.id=id;}delete o.click;return o;});
B.on('menu-click',id=>{const f=cbs[id];if(f)try{f();}catch(e){}});
const gs={};B.on('gs',a=>{const f=gs[a];if(f)try{f();}catch(e){}});
const ALL={'full-access':'granted','shortcuts':'granted','notifications':'granted','menu-bar':'granted','overlay':'granted'};
const desktop={
 permissions:{state:async n=>n?'granted':{...ALL},request:async()=>({...ALL})},
 install:{state:async()=>'unavailable',request:async()=>{}},
 window:{setOptions:o=>B.invoke('win-set',o),place:o=>B.invoke('win-place',o),getBounds:()=>B.invoke('win-get'),setBounds:b=>B.invoke('win-setb',b),hide:()=>B.invoke('win-hide'),show:()=>B.invoke('win-show')},
 Menu:{popup:items=>B.invoke('menu-popup',ser(items))},
 tray:{set:o=>B.invoke('tray-set',{icon:o.icon,title:o.title,toolTip:o.toolTip,menu:ser(o.menu)})},
 globalShortcut:{register:async(a,f)=>{gs[a]=f;return B.invoke('gs-register',a);}},
 notification:{show:o=>B.invoke('notify',o)},
 app:{dock:{setIcon:async()=>{}}},
 fs:{mkdir:(p)=>B.invoke('fs',{op:'mkdir',p}),writeFile:(p,d)=>B.invoke('fs',{op:'write',p,data:d}),appendFile:(p,d)=>B.invoke('fs',{op:'append',p,data:d}),readFile:(p)=>B.invoke('fs',{op:'read',p})},
 shell:{openPath:p=>B.invoke('open-path',p)}
};
// Atlas: user's own Claude key (optional). One call per turn through the main process, tools run here.
const sample=async(prompt,opt)=>{
 const key=(localStorage.getItem('nmsc_key')||'').trim();if(!key){const e=new Error('no key');e.code='no_key';throw e;}
 const tools=(opt&&opt.tools)||[];const defs=tools.map(t=>({name:t.name,description:t.description,input_schema:t.inputSchema}));
 const msgs=[{role:'user',content:prompt}];let text='';
 for(let n=0;n<4;n++){
  const r=await B.invoke('ai',{key,body:{max_tokens:700,messages:msgs,...(defs.length?{tools:defs}:{})}});
  if(!r.ok){const e=new Error('ai '+r.status);e.code=r.status===401?'bad_key':r.status===429?'rate_limited':'ai_error';throw e;}
  const j=r.json,parts=j.content||[];const tx=parts.filter(p=>p.type==='text').map(p=>p.text).join('');if(tx){text=tx;if(opt&&opt.onText)opt.onText({text});}
  const uses=parts.filter(p=>p.type==='tool_use');if(j.stop_reason!=='tool_use'||!uses.length)break;
  msgs.push({role:'assistant',content:parts});const res=[];
  for(const u of uses){const t=tools.find(x=>x.name===u.name);let out='{}';try{out=t?await t.execute(u.input||{}):'{}';}catch(e){out='error';}res.push({type:'tool_result',tool_use_id:u.id,content:String(out)});}
  msgs.push({role:'user',content:res});
 }
 return {text};
};
const tts=('speechSynthesis' in window)?{speak:async(t,o)=>{const u=new SpeechSynthesisUtterance(t);if(o&&o.language)u.lang=o.language;speechSynthesis.cancel();speechSynthesis.speak(u);}}:null;
window.claude={use:async n=>n==='desktop'?desktop:n==='sample'?sample:n==='tts'?tts:null};
})();
