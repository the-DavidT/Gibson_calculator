/// <reference types="vite/client" />

interface GibsonDesktopBridge {
  print: () => Promise<unknown>
  savePdf: () => Promise<unknown>
}

interface Window {
  gibsonDesktop?: GibsonDesktopBridge
}
