'use strict'



import { app, protocol, BrowserWindow, Tray, Menu, ipcMain, clipboard, screen, dialog } from 'electron'
const clipboardEx = require('electron-clipboard-ex');
// const robot = require('robotjs')
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const path = require('path');
const fs = require("fs")
const isDevelopment = process.env.NODE_ENV !== 'production'
let appTray, mainWindow, pasteAssistantWindow, httpServerWindow, downloadProgressWindow, toolBarWindow;
// const ioHook = require('iohook');
import { uIOhook, UiohookKey } from 'uiohook-napi'
import { Sqlite } from "@/js/sqlite";

const platform = process.platform
const isMac = platform === 'darwin';
const isLinux = platform === 'linux'

let userPublicPath = "C:\\Users\\Public\\.smart_clipboard";
if (isMac || isLinux) {
  // userPublicPath 设置为用户主目录，否则使用windows的public目录
  userPublicPath = app.getPath("home") + path.sep + ".smart_clipboard"
}
let logoPath = process.env.WEBPACK_DEV_SERVER_URL ?  path.dirname(__dirname) + path.sep + "logo.png" : path.dirname(app.getPath("exe")) + path.sep + "logo.png"
let configPath = userPublicPath + path.sep + "config.json"
let configPathTemplate = process.env.WEBPACK_DEV_SERVER_URL ?  path.dirname(__dirname) + path.sep + "config.json.template" : path.dirname(app.getPath("exe")) + path.sep + "config.json.template"
let dbTemplate = process.env.WEBPACK_DEV_SERVER_URL ?  path.dirname(__dirname) + path.sep + "local.db" : path.dirname(app.getPath("exe")) + path.sep + "local.db"
let deviceHashFilePath = userPublicPath + path.sep + "device.id"
let localDB = userPublicPath + path.sep + "local.db"
let tempImageFileRoot = userPublicPath + path.sep + ".temp_images";



let dontClosePasteAssistantWindow = false
let setting = {
  skipSameFile: true,
  hideDevice: false,
  hideClipboardContent: false,
}
fs.mkdirSync(tempImageFileRoot, {recursive: true})

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
    icon: logoPath,
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
    await win.loadURL('app://./index.html')
  }
}

let pasteAssistantWindowHeight = 400
let pasteAssistantWindowWidth = 300

// 创建黏贴辅助窗口
async function createPasteAssistantWindow () {
  const win = new BrowserWindow({
    width: pasteAssistantWindowWidth,
    height: pasteAssistantWindowHeight,
    // parent: toolBarWindow,
    frame: false,
    show: false,
    icon: logoPath,
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
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + "#/pasteAssistant")
    // if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    // Load the index.html when not in development
    await win.loadURL('app://./index.html#/pasteAssistant')
  }
  win.once('ready-to-show', () => {
    console.log("ready-to-show")
  })
  win.on("blur", function () {
    console.log("blur")
    // win.setAlwaysOnTop(false)
  })
  win.on("focus", function () {
    console.log("focus")
    win.webContents.send("focus", {})
    // win.setAlwaysOnTop(true, "screen")
    // setTimeout(() => {
    //   win.focus()
    // }, 2000)
  })
}

async function createHttpServerWindow () {
  const win = new BrowserWindow({
    show: false,
    transparent: false,
    fullscreenable: false,
    icon: logoPath,
    skipTaskbar: false,
    maximizable: false,
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
    win.loadURL('app://./index.html#/httpServer')
  }
}

async function createFloatToolbar () {
  let {width, height} = screen.getPrimaryDisplay().workAreaSize
  const win = new BrowserWindow({
    show: false,
    fullscreenable: false,
    skipTaskbar: true,
    icon: logoPath,
    maximizable: false,
    minimizable: false,
    alwaysOnTop: true,
    type: "toolbar",
    resizable: false,
    height: 50,
    frame: false,
    width: 50,
    x: width - 50,
    y: height - 60,
    webPreferences: {
      nodeIntegrationInWorker: true,
      webSecurity: false,
      nodeIntegration: true, // 在网页中集成Node
      enableRemoteModule: true, // 打开remote模块
      contextIsolation: false // 是否在独立 JavaScript 环境中运行 Electron API和指定的preload 脚本
    }
  })
  toolBarWindow = win
  win.once('ready-to-show', () => {
    win.show()
  })
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + "#/toolBar")
    // if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    await win.loadURL('app://./index.html#/toolBar')
  }
  
  win.on("move", function () {
    let bounds = win.getBounds();
    console.log(bounds)
    win.setBounds({x: width - 50, y: bounds.y, width: 50, height: 50})
  })
}

async function createDownloadProgress () {
  const win = new BrowserWindow({
    show: false,
    transparent: false,
    fullscreenable: false,
    skipTaskbar: false,
    maximizable: false,
    icon: logoPath,
    alwaysOnTop: false,
    resizable: false,
    frame: false,
    width: 400,
    height: 450,
    webPreferences: {
      nodeIntegrationInWorker: true,
      webSecurity: false,
      nodeIntegration: true, // 在网页中集成Node
      enableRemoteModule: true, // 打开remote模块
      contextIsolation: false // 是否在独立 JavaScript 环境中运行 Electron API和指定的preload 脚本
    }
  })
  downloadProgressWindow = win
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + "#/downloadProgress")
    // if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html#/downloadProgress')
  }
}

let downloader = {}

function createDonloadWorker (data) {
  let id = data.id
  const win = new BrowserWindow({
    show: false,
    transparent: false,
    fullscreenable: false,
    icon: logoPath,
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
  downloader[id] = win
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + "#/downloader")
    // if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html#/downloader')
  }
  win.once('ready-to-show', () => {
    win.webContents.send("start-download", {id, ...data})
  })
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
  // console.log(key)
  if (key.keycode === 46 && key.ctrlKey) {
    // 复制快捷键触发
    console.log("复制快捷键触发")
    // 读取剪切板内容
    setTimeout(async () => {
      let avalibleFormats = clipboard.availableFormats()
      console.log("Formats:", avalibleFormats);
      let text;
      let image;
      let filePaths = []
      if (avalibleFormats.indexOf("text/plain") != -1) {
        // 读取文本
        text = clipboard.readText()
      } else if (avalibleFormats.indexOf("image/png") != -1 || avalibleFormats.indexOf("image/jpeg") != -1) {
        // 读取图片
        image = clipboard.readImage()
      } else if (avalibleFormats.indexOf("text/uri-list") != -1) {
        // 读取文件
        filePaths = await readFromClipBoard()
      }
      if (text) {
        console.log("text:", text)
      }
      if (image) {
        console.log("img:", image)
      }
      // console.log(getClipboardFiles())
      console.log(filePaths)
      console.log("read done")
      // 发送到页面处理
      let tempPath;
      if (httpServerWindow) {
        if (image) {
          // write image to temp file, and send temp file to http server
          // console.log(image.toDataURL())
          console.log("write start")
          tempPath = tempImageFileRoot + path.sep + new Date().getTime() + ".png"
          fs.writeFileSync(tempPath, image.toPNG());
          console.log("write done")
        }
        httpServerWindow.webContents.send('append-clipboard', {filePaths, text, image: image ? tempPath : ""})
      }
    }, 100)
  } else if (key.keycode === 47 && key.ctrlKey && key.altKey) {
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
    // pasteAssistantWindow.hide()
    // pasteAssistantWindow.minimize()
    // pasteAssistantWindow.restore()
    // pasteAssistantWindow.setBounds(pasteAssistantWindow.getBounds())
    // pasteAssistantWindow.minimize()
    // pasteAssistantWindow.restore()
    pasteAssistantWindow.setPosition(x + display.bounds.x, y + display.bounds.y)
    pasteAssistantWindow.show()
    // pasteAssistantWindow.setAlwaysOnTop(true)
    // setTimeout(() => {
    //   pasteAssistantWindow.minimize()
    // }, 5000)
    // pasteAssistantWindow.setAlwaysOnTop(true);
    // pasteAssistantWindow.setAlwaysOnTop(false);
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
  }
  // 监听键盘按下事件
  uIOhook.on('keydown', event => {
    // console.log('Key pressed:', event);
    checkHotKey(event)
  });
  uIOhook.on('mousedown', event => {
    // console.log(event)
    let px = event.x
    let py = event.y
    // if (pasteAssistantWindow) {
    //   console.log(pasteAssistantWindow.getBounds(), pasteAssistantWindow.isVisible())
    // }
    if (pasteAssistantWindow) {
      let windowBounds = pasteAssistantWindow.getBounds()
      let display = screen.getDisplayMatching(windowBounds)
      let scaleFactor = display.scaleFactor
      const physicalBounds = {
        x: windowBounds.x * scaleFactor,
        y: windowBounds.y * scaleFactor,
        width: windowBounds.width * scaleFactor,
        height: windowBounds.height * scaleFactor,
      };
      console.log(physicalBounds)
      let clickWindow = (
        px >= physicalBounds.x &&
        px <= physicalBounds.x + physicalBounds.width &&
        py >= physicalBounds.y &&
        py <= physicalBounds.y + physicalBounds.height
      )
      if (!clickWindow && !dontClosePasteAssistantWindow) {
        pasteAssistantWindow.hide()
      }
      if (dontClosePasteAssistantWindow) {
        dontClosePasteAssistantWindow = false
      }
    }
  })
  uIOhook.start()
  console.log("ready")
  await createWindow()
  await createFloatToolbar()
  await createHttpServerWindow()
  await createDownloadProgress()
  await createPasteAssistantWindow()
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

ipcMain.on("hide-download-progress-win", () => {
  if (downloadProgressWindow) {
    downloadProgressWindow.hide()
  }
})

// 设置hostname
ipcMain.on("set-host-name", (event, {hostname, deviceId}) => {
  config.hostName = hostname
  fs.writeFileSync(configPath, JSON.stringify(config));
})

ipcMain.on("sync-cblist", (event, data) => {
  // console.log(data)
  if (pasteAssistantWindow) {
    pasteAssistantWindow.webContents.send("set-cblist", data)
  }
})

// 获取变量
ipcMain.handle('get-config', () => {
  return config
})

ipcMain.handle('get-deviceid', () => {
  return deviceId
})

ipcMain.handle('get-platform', () => {
  return platform
})

ipcMain.handle('get-setting', () => {
  console.log("get-setting", setting)
  return setting
})

ipcMain.handle("get-public-path", () => {
  console.log("get-public-path", userPublicPath)
  return userPublicPath
})

ipcMain.on('set-setting', (event, data) => {
  console.log("set-setting", data)
  setting = data
  if (httpServerWindow) {
    httpServerWindow.webContents.send("set-setting", data)
  }
})

ipcMain.on("broadcast-have-error-tasks", (event, data) => {
  console.log("broadcast-have-error-tasks", data)
  if (toolBarWindow) {
    toolBarWindow.webContents.send("set-warning", data)
  }
})

// ====================== 下载 ==================================
ipcMain.on("start-download", (event, data) => {
  console.log("start-download", data)
  createDonloadWorker(data)
  // 通知 toolbar 开始下载
  if (toolBarWindow) {
    toolBarWindow.webContents.send("op-transfering-count", {delt: 1})
  }
  // 通知 下载任务列表 开始下载
  if (downloadProgressWindow) {
    // {currentDownloadFile: "D:\\aqwdw\\wdww.txt", currentFileDownloadProgress: 60, id: 123456, totalFileCount: 2},
    downloadProgressWindow.webContents.send("set-download-progress", {
      id: data.id, 
      currentDownloadFile: data.fileList[0].filePath, 
      currentFileDownloadProgress: 0, 
      totalFileCount: data.fileList.length
    })
  }
})

ipcMain.on("download-complete", (event, data) => {
  console.log("download-complete", data)
  // do sth
  if (downloader[data.id]) {
    downloader[data.id].close()
    delete downloader[data.id]
  }
  // 通知 toolbar 下载完成
  if (toolBarWindow) {
    toolBarWindow.webContents.send("op-transfering-count", {delt: -1})
    toolBarWindow.webContents.send("success-twinkle", {})
  }
  // 通知 下载任务列表 下载完成
  if (downloadProgressWindow) {
    // {currentDownloadFile: "D:\\aqwdw\\wdww.txt", currentFileDownloadProgress: 60, id: 123456, totalFileCount: 2},
    downloadProgressWindow.webContents.send("set-download-complete", {
      id: data.id
    })
  }
})

ipcMain.on("download-error", (event, data) => {
  console.log("download-error", data)
  // do sth
  if (downloader[data.id]) {
    downloader[data.id].close()
    delete downloader[data.id]
  }
  // 通知 toolbar 下载失败
  if (toolBarWindow) {
    toolBarWindow.webContents.send("op-transfering-count", {delt: -1})
    toolBarWindow.webContents.send("error-twinkle", {})
  }
  // 通知 下载任务列表 下载失败
  if (downloadProgressWindow) {
    // {currentDownloadFile: "D:\\aqwdw\\wdww.txt", currentFileDownloadProgress: 60, id: 123456, totalFileCount: 2},
    downloadProgressWindow.webContents.send("set-download-error", {
      id: data.id
    })
  }
})

ipcMain.on("show-download-progress", (event, data) => {
  console.log(data)
  if (downloadProgressWindow) {
    downloadProgressWindow.show()
  }
})

ipcMain.on("broadcast-download-progress", (event, data) => {
  console.log(data)
  if (downloadProgressWindow) {
    downloadProgressWindow.webContents.send("set-download-progress", data)
  }
})

ipcMain.handle("stop-download", (event, data) => {
  console.log(data)
  if (downloader[data.id]) {
    downloader[data.id].close()
    delete downloader[data.id]
  }
  if (toolBarWindow) {
    toolBarWindow.webContents.send("op-transfering-count", {delt: -1})
  }
  return true
})

ipcMain.handle("open-dialog", (event, data) => {
  dontClosePasteAssistantWindow = true
  console.log(data)
  if (pasteAssistantWindow) {
    pasteAssistantWindow.setAlwaysOnTop(false)
  }
  let result = dialog.showOpenDialogSync({
    title: data.dialogTitle,
    properties: ['openDirectory', "promptToCreate"],
  });
  console.log(result)
  pasteAssistantWindow.setAlwaysOnTop(true)
  return result
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