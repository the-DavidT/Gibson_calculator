import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 980,
    minHeight: 720,
    title: 'Gibson Calculator',
    backgroundColor: '#f6f7f4',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.handle('print-current-window', async () => {
  const window = BrowserWindow.getFocusedWindow()

  if (!window) {
    return { ok: false, error: 'No active window to print.' }
  }

  window.webContents.print({ printBackground: true })
  return { ok: true }
})

ipcMain.handle('save-current-window-pdf', async () => {
  const window = BrowserWindow.getFocusedWindow()

  if (!window) {
    return { ok: false, error: 'No active window to save.' }
  }

  const { canceled, filePath } = await dialog.showSaveDialog(window, {
    title: 'Save Gibson worksheet',
    defaultPath: 'gibson-assembly-worksheet.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })

  if (canceled || !filePath) {
    return { ok: false, canceled: true }
  }

  const pdf = await window.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4'
  })
  await writeFile(filePath, pdf)

  return { ok: true, filePath }
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
