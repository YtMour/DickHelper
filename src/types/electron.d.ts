export interface ElectronAPI {
  onWindowMaximize: (callback: () => void) => () => void
  onWindowUnmaximize: (callback: () => void) => () => void
  minimizeWindow: () => void
  toggleMaximizeWindow: () => void
  closeWindow: () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {} 