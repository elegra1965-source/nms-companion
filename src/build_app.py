import base64,json,re
t=open('/home/claude/nms-companion/src/template-src.html').read()
def rep(a,b):
    global t
    assert t.count(a)==1,('missing',a[:70]); t=t.replace(a,b)
shim=open('/home/claude/nms-companion/src/shim.js').read()
# shim first in head
i=t.index('<head>')+6
t=t[:i]+'<script>'+shim+'</script>'+t[i:]
# local fallback answers when no key
rep("async function ask(q){","""function localAtlas(q){const s=q.toLowerCase();
 if(/expedition|ends|end|next|live|research|mission/.test(s)){const l=data.live,n=data.next;if(!l)return 'No expedition is live right now, Traveller.';const h=Math.max(0,Math.round((l.end-nowMs())/36e5));return l.name+' is live and ends '+dt(l.end)+' ('+h+' hours left).'+(n?' Next up: '+n.name+(n.estimated?' (estimated)':'')+'.':'');}
 if(/notebook|catalogue|catalog|find|search|system|base|pet|discover/.test(s)){const w=s.replace(/.*(?:for|about|called|named)\\s+/,'').trim();const r=notes.filter(n=>(n.name+' '+n.note+' '+n.hex+' '+n.type).toLowerCase().includes(w)).slice(0,5);return r.length?r.map(n=>n.type+': '+n.name+' ('+n.hex+')').join('. '):'Nothing in your catalogue matches that, Traveller.';}
 return 'I can answer expedition and catalogue questions offline. For anything else, add your own Claude key below (optional).';}
async function ask(q){""")
rep("out.textContent=(e&&e.code==='rate_limited')?","if(e&&e.code==='no_key'){const a=localAtlas(q);out.textContent=a;hist.push({r:'u',t:q},{r:'a',t:a});logTx(lang,q,a);busy=false;$('#aSend').disabled=false;return;}out.textContent=(e&&e.code==='bad_key')?'That Claude key was not accepted. Check it below.':(e&&e.code==='rate_limited')?")
rep("(sampleFn?'Answers come from Claude playing the Atlas, with your expedition data and notebook. ':'The Atlas needs the installed app. ')","(window.NMSC_STANDALONE?'Without a key the Atlas answers expedition and catalogue questions offline. Add your own Claude key below for full answers. ':sampleFn?'Answers come from Claude playing the Atlas, with your expedition data and notebook. ':'The Atlas needs the installed app. ')")
# key box + backup panel
rep('<div class="src" id="aNote"></div>','<div class="src" id="aNote"></div>\n      <div class="fold" id="keyBox" hidden><div class="two fld"><input class="inp" id="keyIn" type="password" placeholder="YOUR CLAUDE API KEY (OPTIONAL)" autocomplete="off"><button class="btn" id="keySave">SAVE KEY</button></div><div class="src">Stored only on this computer. Answers use your own Claude account and are billed by Anthropic to you, not to us. Leave empty for free offline answers.</div></div>')
rep("  </div></section>\n</main>","""  <div class="panel" id="appPanel" hidden><div class="kick al">THIS APP</div><div class="row"><span>Version</span><b id="appVer">...</b></div><div class="src" id="appMsg">Checks for a newer version on start.</div><div class="btns"><button class="btn" id="appChk">CHECK FOR UPDATES</button><button class="btn" id="appUn">UNINSTALL</button></div></div>
  <div class="panel" id="bkPanel" hidden><div class="kick al">BACKUP</div><div class="src">Moving to a new computer? Export your settings and catalogue entries to one file, then import it there. Nothing leaves this computer.</div><div class="btns"><button class="btn" id="bkOut">EXPORT BACKUP</button><button class="btn" id="bkIn">IMPORT BACKUP</button><input type="file" id="bkFile" accept=".json" hidden></div></div>
  </div></section>
</main>""")
open('/home/claude/nmsc-app/_tmp.html','w').write(t)
rep("$('#bTest').onclick=","""if(window.NMSC_STANDALONE){$('#keyBox').hidden=false;$('#bkPanel').hidden=false;$('#appPanel').hidden=false;
 const compare=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++){if((x[i]||0)!==(y[i]||0))return(x[i]||0)>(y[i]||0)?1:-1;}return 0;};
 let upd=null;
 const chk=async quiet=>{try{const r=await window.nmscBridge.invoke('app-update');$('#appVer').textContent=r.version;if(r.error){if(!quiet)$('#appMsg').textContent='Could not reach GitHub. Try again later.';return;}
  if(compare(r.latest,r.version)>0){upd=r;$('#appMsg').textContent='Version '+r.latest+' is available.';$('#appChk').textContent='DOWNLOAD UPDATE';if(quiet)notify('Update available','NMS Companion '+r.latest+' is ready. Open the Alerts tab to download it.','upd-'+r.latest);}
  else{$('#appMsg').textContent='You have the latest version.';$('#appChk').textContent='CHECK FOR UPDATES';}}catch(e){if(!quiet)$('#appMsg').textContent='Could not check for updates.';}};
 $('#appChk').onclick=()=>{if(upd){window.nmscBridge.invoke('app-download');}else chk(false);};
 $('#appUn').onclick=async()=>{const m=await window.nmscBridge.invoke('app-uninstall');$('#appMsg').textContent=m;};
 setTimeout(()=>chk(true),8000);
 $('#keyIn').value=localStorage.getItem('nmsc_key')?'saved':'';
 $('#keySave').onclick=()=>{const v=$('#keyIn').value.trim();if(v==='saved')return;if(v)localStorage.setItem('nmsc_key',v);else localStorage.removeItem('nmsc_key');$('#keyIn').value=v?'saved':'';$('#aNote').textContent=v?'Key saved on this computer.':'Key removed. The Atlas answers offline.';};
 $('#bkOut').onclick=()=>{const o={app:'nms-companion',v:1,data:{}};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('nmsc_')&&k!=='nmsc_key'&&k!=='nmsc_ap')o.data[k]=localStorage.getItem(k);}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:'application/json'}));a.download='nms-companion-backup.json';document.body.appendChild(a);a.click();a.remove();};
 $('#bkIn').onclick=()=>$('#bkFile').click();
 $('#bkFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const o=JSON.parse(await f.text());if(o.app!=='nms-companion'||!o.data)throw 0;for(const k in o.data)if(k.startsWith('nmsc_')&&k!=='nmsc_key')localStorage.setItem(k,o.data[k]);location.reload();}catch(x){alert('That is not a NMS Companion backup file.');}};}
$('#bTest').onclick=""")
f=base64.b64encode(open('/mnt/user-data/uploads/Projects/Oblivion Theme Page/nms-glyph-translate/assets/nms-alphabet.ttf','rb').read()).decode()
A=json.dumps(json.load(open('/home/claude/companion/assets3.json')),separators=(',',':')).replace('<','\\u003c')
open('/home/claude/nms-companion/app/index.html','w').write(t.replace('/*FONT*/',f).replace('/*ASSETS*/',A))
print('built',len(t))
