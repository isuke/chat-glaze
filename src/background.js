'use strict'

import path from 'path'
import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'

import pkg from '../package.json'

const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

ipcMain.on('asynchronous-message', (event, arg) => {
  console.log(arg) // prints "ping"
  event.reply('asynchronous-reply', 'pong')
})

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    title: `Chat Glaze v${pkg.version}${isDevelopment ? ' [DEV]' : ''}`,
    width: 800,
    height: isDevelopment ? 900 : 760,
    icon: path.join(__static, 'icon.png'),
    webPreferences: {
      nodeIntegration: true
    }
  })

  // win.webContents.on('did-finish-load', () => {
  //   win.webContents.send('ping', 'from main to renderer')
  // })

  const menu = Menu.buildFromTemplate([
    {
      label: 'App',
      submenu: [
        { label: 'About', role: 'about' },
        { label: 'Quit', role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Select All', role: 'selectAll' },
        { label: 'Cut', role: 'cut' },
        { label: 'Copy', role: 'copy' },
        { label: 'Paste', role: 'paste' },
        { label: 'Reload', role: 'reload' },
        { label: 'Force Reload', role: 'forcereload' },
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    closeAllWindows()
    win = null
  })
}

function closeAllWindows () {
  BrowserWindow.getAllWindows().forEach(win => win.close())
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    closeAllWindows()
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        closeAllWindows()
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      closeAllWindows()
      app.quit()
    })
  }
}
