'use strict'



import { app, protocol, BrowserWindow, Tray, Menu, ipcMain, clipboard, screen } from 'electron'
const clipboardEx = require('electron-clipboard-ex');
const robot = require('robotjs')
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const path = require('path');
const fs = require("fs")
const isDevelopment = process.env.NODE_ENV !== 'production'
let appTray, mainWindow, pasteAssistantWindow, httpServerWindow;
const ioHook = require('iohook');
import { Sqlite } from "@/js/sqlite";

let userPublicPath = "C:\\Users\\Public\\.smart_clipboard";
let logoPath = process.env.WEBPACK_DEV_SERVER_URL ?  path.dirname(__dirname) + "\\logo.png" : path.dirname(app.getPath("exe")) + "\\logo.png"
let configPath = userPublicPath + "\\config.json"
let configPathTemplate = process.env.WEBPACK_DEV_SERVER_URL ?  path.dirname(__dirname) + "\\config.json.template" : path.dirname(app.getPath("exe")) + "\\config.json.template"
let dbTemplate = process.env.WEBPACK_DEV_SERVER_URL ?  path.dirname(__dirname) + "\\local.db" : path.dirname(app.getPath("exe")) + "\\local.db"
let deviceHashFilePath = userPublicPath + "\\device.id"
let localDB = userPublicPath + "\\local.db"
const isMac = process.platform === 'darwin';

function loadConfig () {
  let config
  if (!fs.existsSync(configPath)) {
    // 创建文件
    createFile(configPath)
    // 读取模板
    config = JSON.parse(fs.readFileSync(configPathTemplate))
    // 写回文件
    fs.writeFileSync(configPath, JSON.stringify(config));
  } else {
    // read from file
    config = JSON.parse(fs.readFileSync(configPath))
    let template = JSON.parse(fs.readFileSync(configPathTemplate))
    // 从template中获取新配置项
    let configKeys = Object.keys(config);
    let templateKeys = Object.keys(template);
    console.log(configKeys, templateKeys)
    for (let key of templateKeys) {
      if (configKeys.indexOf(key) === -1) {
        config[key] = template[key];
      }
    }
  }
  console.log(config)
  return config
}

function loadDB () {
  if (!fs.existsSync(localDB)) {
    createFile(localDB)
    fs.copyFileSync(dbTemplate, localDB)
  }
}

/**
 * 加载设备唯一值
 * @returns {Buffer}
 */
function loadDeviceId () {
  let deviceId
  if (!fs.existsSync(deviceHashFilePath)) {
    // 创建device.id
    deviceId = new Date().getTime()
    // 创建并写入文件
    createFile(deviceHashFilePath)
    console.log(deviceId)
    fs.writeFileSync(deviceHashFilePath, deviceId + '');
  } else {
    // read from file
    deviceId = fs.readFileSync(deviceHashFilePath)
  }
  return deviceId + ""
}

function createFile (filePath) {
  let pPath = path.dirname(filePath)
  if (!fs.existsSync(pPath)) {
    fs.mkdirSync(pPath)
  }
  // 创建文件
  fs.writeFileSync(filePath, "")
}

let config = loadConfig()
let deviceId = loadDeviceId()
loadDB()
let db = new Sqlite()
db.init(localDB)


console.log(config, deviceId)

global.sharedObject = {
  config,
  deviceId
}

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
  console.log(process.env.WEBPACK_DEV_SERVER_URL)
  // Create the browser window.
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    minHeight: 400,
    show: false,
    minWidth: 300,
    frame: false,
    transparent: false,
    fullscreenable: false,
    maximizable: false,
    resizable: false,
    webPreferences: {
      nodeIntegrationInWorker: true,
      webSecurity: false,
      nodeIntegration: true, // 在网页中集成Node
      enableRemoteModule: true, // 打开remote模块
      contextIsolation: false // 是否在独立 JavaScript 环境中运行 Electron API和指定的preload 脚本
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
}

let pasteAssistantWindowHeight = 400
let pasteAssistantWindowWidth = 300
let hide = false

// 创建黏贴辅助窗口
async function createPasteAssistantWindow () {
  // console.log(pasteAssistantWindow)
  // if (pasteAssistantWindow) {
  //   pasteAssistantWindow.close()
  //   pasteAssistantWindow = null
  // }
  const win = new BrowserWindow({
    width: pasteAssistantWindowWidth,
    height: pasteAssistantWindowHeight,
    frame: false,
    show: false,
    transparent: false,
    skipTaskbar: true,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegrationInWorker: true,
      webSecurity: false,
      nodeIntegration: true, // 在网页中集成Node
      enableRemoteModule: true, // 打开remote模块
      contextIsolation: false // 是否在独立 JavaScript 环境中运行 Electron API和指定的preload 脚本
    }
  })
  pasteAssistantWindow = win
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + "#/pasteAssistant")
    // if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    // Load the index.html when not in development
    win.loadURL('app://./index.html/#/pasteAssistant')
  }
  win.once('ready-to-show', () => {
    console.log("ready-to-show")
    win.focus()
    
  })
  win.on("blur", function () {
    console.log("blur")
    if (hide) {
      // win.hide()
    }
    // pasteAssistantWindow = null;
  })
  win.on("focus", function () {
    console.log("focus")
  })
}

async function createHttpServerWindow () {
  const win = new BrowserWindow({
    show: false,
    transparent: false,
    fullscreenable: false,
    skipTaskbar: true,
    maximizable: false,
    resizable: false,
    webPreferences: {
      nodeIntegrationInWorker: true,
      webSecurity: false,
      nodeIntegration: true, // 在网页中集成Node
      enableRemoteModule: true, // 打开remote模块
      contextIsolation: false // 是否在独立 JavaScript 环境中运行 Electron API和指定的preload 脚本
    }
  })
  httpServerWindow = win
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + "#/httpServer")
    // if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html/#/httpServer')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    // app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    console.log("activate")
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
function readFromClipBoard () {
  let times = 1000
  function read (resolve) {
    let paths = clipboardEx.readFilePaths()
    // console.log(paths)
    if (paths.length <= 0 && times >= 0) {
      times --
      // console.log(times)
      setTimeout(() => {
        read(resolve)
      }, 1)
    } else {
      resolve(paths)
    }
  }
  return new Promise((resolve, reject) => {
    read(resolve)
  })
} 

async function checkHotKey (key) {
  if (key.rawcode === 67 && key.ctrlKey) {
    // 复制快捷键触发
    console.log("复制快捷键触发")
    // 读取剪切板内容
    setTimeout(async () => {
      console.log("Formats:", clipboard.availableFormats());
      let text = clipboard.readText()
      console.log("text", text)
      let filePaths = []
      if (!text) {
        filePaths = await readFromClipBoard()
        // filePaths = clipboardEx.readFilePaths()
      }
      // console.log(getClipboardFiles())
      console.log(filePaths)
      // 发送到页面处理
      if (httpServerWindow) {
        httpServerWindow.webContents.send('append-clipboard', {filePaths, text})
      }
    }, 100)
  } else if (key.rawcode === 86 && key.ctrlKey && key.altKey) {
    // 光标处打开黏贴窗口
    const cursorPos = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPos);
    console.log(cursorPos)
    let x = cursorPos.x - display.bounds.x;
    let y = cursorPos.y - display.bounds.y;
    // console.log(pasteAssistantWindow.getBounds(), cursorPos.x, cursorPos.y, x, y)
    const { height, width } = screen.getDisplayMatching({...cursorPos, width: 0, height: 0}).size;
    console.log("raw", x, y, height, width)
    
    if (x + 20 + pasteAssistantWindowWidth > width) {
      x = x - pasteAssistantWindowWidth - 20
    } else {
      x = x + 20
    }
    if (y + 20 + pasteAssistantWindowHeight > height) {
      y = y - pasteAssistantWindowHeight - 20
    } else {
      y = y + 20
    }
    console.log(x, y, height, width)
    hide = false
    pasteAssistantWindow.minimize()
    pasteAssistantWindow.restore()
    pasteAssistantWindow.show()
    pasteAssistantWindow.setPosition(x + display.bounds.x, y + display.bounds.y)
    setTimeout(() => {
      hide = true
    }, 10)
    // pasteAssistantWindow.webContents.send("show-clipboard-list", {})
  }
}

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
      // console.log('Key pressed:', event);
      checkHotKey(event)
    });

    ioHook.start();
  }
  console.log("ready")
  await createPasteAssistantWindow()
  await createWindow()
  await createHttpServerWindow()
  setTray()
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




// 事件交互
// 关闭按钮
ipcMain.on("hide-main-win", () => {
  mainWindow.hide()
})

// 设置hostname
ipcMain.on("set-host-name", (event, hostName) => {
  config.hostName = hostName
  fs.writeFileSync(configPath, JSON.stringify(config));
})

ipcMain.on("sync-cblist", (event, data) => {
  // console.log(data)
  if (pasteAssistantWindow) {
    pasteAssistantWindow.webContents.send("set-cblist", data)
  }
})


// ====================== 数据库相关 ==============================
/**
 * 查询
 */
ipcMain.handle("sqlite-all", async (event, {sqlStr}) => {
  try {
    let res = await db.all(sqlStr)
    return {sqlStr, res}
  } catch (e) {
    // console.log(e)
    return {error: e}
  }
})

/**
 * 操作数据库
 */
ipcMain.handle("sqlite-run", async (event, {sqlStr}) => {
  try {
    let res = await db.run(sqlStr)
    return {res}
  } catch (e) {
    // console.log(e)
    return {error: e}
  }
})

/**
 * 操作数据库(prepare)
 */
ipcMain.handle("sqlite-run-prepare", async (event, {sqlStr, params}) => {
  try {
    let res = await db.prepareRun(sqlStr, params)
    return {res}
  } catch (e) {
    // console.log(e)
    return {error: e}
  }
})

/**
 * 操作数据库(prepare)
 */
ipcMain.handle("sqlite-multiple-run-prepare", async (event, {sqlStr, paramsArray}) => {
  try {
    let res = await db.multiplePrepareRun(sqlStr, paramsArray)
    return {res}
  } catch (e) {
    // console.log(e)
    return {error: e}
  }
})