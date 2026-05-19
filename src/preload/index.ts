import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('gibsonDesktop', {
  print: () => ipcRenderer.invoke('print-current-window'),
  savePdf: () => ipcRenderer.invoke('save-current-window-pdf')
})
