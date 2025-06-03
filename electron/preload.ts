import { contextBridge, ipcRenderer } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  onWindowMaximize: (callback: () => void) => {
    ipcRenderer.on('window-maximized', () => callback())
    return () => ipcRenderer.removeListener('window-maximized', callback)
  },
  onWindowUnmaximize: (callback: () => void) => {
    ipcRenderer.on('window-unmaximized', () => callback())
    return () => ipcRenderer.removeListener('window-unmaximized', callback)
  },
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  toggleMaximizeWindow: () => ipcRenderer.send('window-toggle-maximize'),
  closeWindow: () => ipcRenderer.send('window-close')
})

// 暴露给渲染进程的API
window.electronAPI = {
  onWindowMaximize: (callback: () => void) => {
    ipcRenderer.on('window-maximized', () => callback())
    return () => ipcRenderer.removeListener('window-maximized', callback)
  },
  onWindowUnmaximize: (callback: () => void) => {
    ipcRenderer.on('window-unmaximized', () => callback())
    return () => ipcRenderer.removeListener('window-unmaximized', callback)
  },
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  toggleMaximizeWindow: () => ipcRenderer.send('window-toggle-maximize'),
  closeWindow: () => ipcRenderer.send('window-close')
}
