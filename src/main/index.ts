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

  // Print the rendered worksheet straight to the default printer in A4. We use
  // silent (no preview dialog) on purpose: the preview path hangs indefinitely
  // in this app, while printToPDF (Save PDF) and other apps print to the same
  // printer fine. Awaiting the callback lets us surface real failures instead of
  // returning ok before the job is handed off.
  try {
    await new Promise<void>((resolve, reject) => {
      window.webContents.print(
        { silent: true, printBackground: true, pageSize: 'A4' },
        (success, failureReason) => {
          if (!success) {
            reject(new Error(failureReason))
            return
          }

          resolve()
        }
      )
    })
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
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
