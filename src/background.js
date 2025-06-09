'use strict'



import { app, protocol, BrowserWindow, Tray, Menu } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const path = require ('path');
const fs = require("fs")
const isDevelopment = process.env.NODE_ENV !== 'production'
let appTray, mainWindow;
const ioHook = require('iohook');

let logoPath = process.env.WEBPACK_DEV_SERVER_URL ?  path.dirname(__dirname) + "\\logo.png" : path.dirname(app.getPath("exe")) + "\\logo.png"


// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

function setTray () {
  // 系统托盘右键菜单
  let traymenuTemplate = [{     // 系统托盘图标目录
    label: '退出',
    click: function () {
      // 退出所有子进程
      try {
        mainWindow.close()
        mainWindow.destory()
      } catch (e) {
        console.log(e)
      }
      app.quit();
    }
  }];
  // 当前目录下的app.ico图标
  appTray = new Tray(logoPath);
  // 图标的上下文菜单
  const contextMenu = Menu.buildFromTemplate(traymenuTemplate);
  // 设置托盘悬浮提示
  appTray.setToolTip('smart-clipboard');
  // 设置托盘菜单
  appTray.setContextMenu(contextMenu);
  // 单击托盘小图标显示应用
  appTray.on('click', function(){
    // 显示主程序
    if (mainWindow) {
      mainWindow.show();
    }
    // 关闭托盘显示
    // appTray.destroy();
  });
}


async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    transparent: false,
    webPreferences: {
      nodeIntegration: true, // 在网页中集成Node
      enableRemoteModule: true, // 打开remote模块
    }
  })
  mainWindow = win
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    // if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
  setTray()
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
    // 监听键盘按下事件
    ioHook.on('keydown', event => {
      console.log('Key pressed:', event);
    });

    ioHook.start();
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
