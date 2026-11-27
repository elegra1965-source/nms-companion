const {app,BrowserWindow,Menu,Tray,Notification,globalShortcut,ipcMain,nativeImage,shell,screen}=require('electron');
const path=require('path'),fs=require('fs'),os=require('os');
app.setAppUserModelId('app.nomansskyhub.companion');
if(!app.requestSingleInstanceLock()){app.quit();}
let win=null,tray=null,opts={width:460,height:760,minWidth:380,minHeight:560,frame:true,alwaysOnTop:false,transparent:false,resizable:true,hasShadow:true};
const send=(c,d)=>{if(win&&!win.isDestroyed())win.webContents.send(c,d);};
const home=p=>{if(typeof p!=='string')return p;if(p.startsWith('~/Documents'))return path.join(app.getPath('documents'),p.slice(11));if(p.startsWith('~'))return path.join(os.homedir(),p.slice(1));return p;};
function create(o,bounds){
  const old=win;
  const w=new BrowserWindow({width:o.width,height:o.height,minWidth:o.minWidth,minHeight:o.minHeight,frame:o.frame,alwaysOnTop:!!o.alwaysOnTop,transparent:!!o.transparent,resizable:o.resizable!==false,hasShadow:o.hasShadow!==false,
    backgroundColor:o.transparent?'#00000000':'#05090f',autoHideMenuBar:true,icon:path.join(__dirname,'build','icon.png'),show:false,
    ...(bounds?{x:bounds.x,y:bounds.y}:{}),
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
  if(o.alwaysOnTop)w.setAlwaysOnTop(true,'screen-saver');
  w.setMenuBarVisibility(false);
  w.loadFile(path.join(__dirname,'app','index.html'));
  w.once('ready-to-show',()=>{w.show();if(old&&!old.isDestroyed()){old.removeAllListeners('closed');old.destroy();}});
  w.on('close',e=>{if(!app.quitting&&tray){e.preventDefault();w.hide();}});
  w.webContents.setWindowOpenHandler(({url})=>{if(/^https:/.test(url))shell.openExternal(url);return {action:'deny'};});
  w.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith('file:')){e.preventDefault();if(/^https:/.test(url))shell.openExternal(url);}});
  win=w;opts=o;
}
app.on('second-instance',()=>{if(win){win.show();win.focus();}});
app.on('before-quit',()=>{app.quitting=true;});
app.whenReady().then(()=>{create(opts);});
app.on('window-all-closed',()=>{});
app.on('will-quit',()=>globalShortcut.unregisterAll());

// ---- desktop API shim backends ----
const mkMenu=items=>Menu.buildFromTemplate((items||[]).map(i=>{const o={...i};if(i.id){o.click=()=>send('menu-click',i.id);}if(i.type==='radio'||i.type==='checkbox'){o.checked=!!i.checked;}delete o.id;return o;}));
ipcMain.handle('win-set',async(_e,o)=>{const b=win.getBounds();const n={...opts,...o};
  const flagsChanged=['frame','transparent','alwaysOnTop','resizable','hasShadow'].some(k=>!!n[k]!==!!opts[k]&&!(k==='resizable'&&n[k]===undefined)&&!(k==='hasShadow'&&n[k]===undefined));
  if(flagsChanged){create(n,{x:b.x,y:b.y});return true;}
  opts=n;win.setMinimumSize(n.minWidth||100,n.minHeight||100);if(n.width&&n.height)win.setSize(n.width,n.height);return true;});
ipcMain.handle('win-place',async(_e,o)=>{const b=win.getBounds();const w=o.width||b.width,h=o.height||b.height;win.setMinimumSize(Math.min(w,100),Math.min(h,100));win.setBounds({x:b.x,y:b.y,width:w,height:h});return true;});
ipcMain.handle('win-get',async()=>win.getBounds());
ipcMain.handle('win-setb',async(_e,b)=>{win.setBounds(b);return true;});
ipcMain.handle('win-hide',async()=>{win.hide();return true;});
ipcMain.handle('win-show',async()=>{win.show();win.focus();return true;});
ipcMain.handle('menu-popup',async(_e,items)=>{mkMenu(items).popup({window:win});return true;});
ipcMain.handle('tray-set',async(_e,o)=>{
  const img=nativeImage.createFromPath(path.join(__dirname,'build','tray.png'));
  if(!tray){tray=new Tray(img);tray.on('click',()=>{if(win){win.show();win.focus();}});}else tray.setImage(img);
  tray.setToolTip((o.toolTip||'NMS Companion')+(o.title?'  ·  '+o.title:''));tray.setContextMenu(mkMenu(o.menu));return true;});
ipcMain.handle('gs-register',async(_e,acc)=>{try{globalShortcut.unregister(acc);return globalShortcut.register(acc,()=>send('gs',acc));}catch(e){return false;}});
ipcMain.handle('notify',async(_e,o)=>{try{new Notification({title:o.title||'NMS Companion',body:o.body||'',silent:false}).show();}catch(e){}return true;});
ipcMain.handle('fs',async(_e,{op,p,data,enc,rec})=>{p=home(p);
  if(op==='mkdir'){fs.mkdirSync(p,{recursive:true});return true;}
  if(op==='write'){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof data==='string'?data:Buffer.from(data));return true;}
  if(op==='append'){fs.mkdirSync(path.dirname(p),{recursive:true});fs.appendFileSync(p,data,'utf8');return true;}
  if(op==='read'){return fs.readFileSync(p,'utf8');}
  throw new Error('bad op');});
ipcMain.handle('open-path',async(_e,p)=>{p=home(p);if(!fs.existsSync(p))throw new Error('missing');const r=await shell.openPath(p);if(r)throw new Error(r);return true;});
const REL='https://github.com/elegra1965-source/nms-companion/releases/latest/download/';
const dlName=()=>process.platform==='win32'?'NMS-Companion-Setup.exe':process.platform==='darwin'?('NMS-Companion-Mac-'+(process.arch==='arm64'?'arm64':'x64')+'.dmg'):'NMS-Companion-Linux.AppImage';
ipcMain.handle('app-update',async()=>{const version=app.getVersion();try{const r=await fetch('https://api.github.com/repos/elegra1965-source/nms-companion/releases/latest',{headers:{'user-agent':'nms-companion'}});if(!r.ok)return {version,error:r.status};const j=await r.json();return {version,latest:String(j.tag_name||'').replace(/^v/,'')};}catch(e){return {version,error:1};}});
ipcMain.handle('app-download',async(e)=>{
  const send=t=>{try{e.sender.send('app-upd',t);}catch(_){}};
  if(process.platform==='win32'&&app.isPackaged&&!process.env.PORTABLE_EXECUTABLE_DIR){
    try{const {autoUpdater}=require('electron-updater');autoUpdater.autoDownload=false;autoUpdater.autoInstallOnAppQuit=false;
      autoUpdater.removeAllListeners();
      autoUpdater.on('download-progress',p=>send('Downloading '+Math.round(p.percent)+'%'));
      autoUpdater.on('update-downloaded',()=>{send('Installing, the app will restart...');setTimeout(()=>{app.quitting=true;autoUpdater.quitAndInstall(true,true);},800);});
      autoUpdater.on('error',er=>{try{fs.appendFileSync(path.join(app.getPath('documents'),'NMS Companion','update.log'),new Date().toISOString()+' '+String(er&&er.stack||er)+'\n');}catch(_){}send('Update failed, opening the download instead.');shell.openExternal(REL+dlName());});
      const r=await autoUpdater.checkForUpdates();if(!r||!r.updateInfo){shell.openExternal(REL+dlName());return true;}
      send('Downloading 0%');await autoUpdater.downloadUpdate();return true;
    }catch(err){send('Update failed, opening the download instead.');}
  }
  shell.openExternal(REL+dlName());return true;});
ipcMain.handle('app-uninstall',async()=>{
  if(process.platform==='win32'){shell.openExternal('ms-settings:appsfeatures');return 'Windows Settings opened: find NMS Companion in the list and choose Uninstall. If you use the portable version, just delete the file. Your saved files stay in Documents/NMS Companion.';}
  if(process.platform==='darwin')return 'Drag NMS Companion from Applications to the Bin. Your saved files stay in Documents/NMS Companion.';
  return 'Delete the AppImage file. Your saved files stay in Documents/NMS Companion.';});
// Atlas with the user's own Claude key (one request per call, no server of ours involved)
ipcMain.handle('ai',async(_e,{key,body})=>{
  const models=['claude-haiku-4-5-20251001','claude-sonnet-4-6'];let last={status:0,text:''};
  for(const m of models){
    try{const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},body:JSON.stringify({...body,model:m})});
      const t=await r.text();if(r.ok)return {ok:true,json:JSON.parse(t)};last={status:r.status,text:t.slice(0,300)};if(r.status===401||r.status===429)break;}
    catch(e){last={status:0,text:String(e).slice(0,200)};}
  }
  return {ok:false,...last};});
