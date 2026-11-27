const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('nmscBridge',{
  invoke:(c,a)=>ipcRenderer.invoke(c,a),
  on:(c,f)=>ipcRenderer.on(c,(_e,d)=>f(d))
});
