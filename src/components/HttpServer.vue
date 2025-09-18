<template></template>

<script>
const http = require('http')
const fs = require("original-fs")
const path = require("path")
import { ipcRenderer } from "electron";

async function getPublicPath () {
  try {
    let res = await ipcRenderer.invoke("get-public-path")
    return res;
  } catch (error) {
    return error
  }
}

export default {
  name: 'HttpServer',
  components: {
  },
  props: {
  },
  data () {
    return {
      clipboardList: [],
      setting: {
        skipSameFile: true,
        hideDevice: false,
        hideClipboardContent: false,
      },
      userPublicPath: ""
    }
  },
  methods: {
    cleanTmpImages (clipboardList) {
      let imageNames = new Set()
      for (let item of clipboardList) {
        if (item.type === "image") {
          imageNames.add(path.basename(item.content))
        }
      }
      let tmpImagePath = path.join(this.userPublicPath, ".temp_images")
      let fileNames = fs.readdirSync(tmpImagePath)
      for (let fileName of fileNames) {
        if (!imageNames.has(fileName)) {
          // delete file
          let fullPath = path.join(this.userPublicPath, ".temp_images", fileName)
          fs.unlinkSync(fullPath)
        }
      }
    },
    pathToCurrentPlatform (filePath) {
        return path.normalize(filePath)
    },
    createHttpServer () {
      let that = this
      http.createServer(function (req, res) {
          console.log(req)
          if (req.url === "/copyFile") {
            // 前置验证
            if (that.setting.hideDevice) {
              res.writeHead(400, { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*" });
              res.end(JSON.stringify({ "result": "fail", "msg": "设备已隐藏" }));
              return
            }


            let body = "";
            req.on('data', (chunk) => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                console.log(body)
                const jsonData = JSON.parse(body);
                // 在这里处理接收到的 JSON 数据
                console.log('Received JSON data:', jsonData);
                // path转为当前平台的path
                let filePath = that.pathToCurrentPlatform(jsonData.filePath)
                let stat = fs.statSync(filePath)
                let fileName = path.basename(filePath)
                // write file to response
                res.writeHead(200, {
                  'Content-Type': 'application/octet-stream',              // 二进制流
                  'Content-Disposition': 'attachment; filename=' + encodeURIComponent(fileName), // 下载时的文件名
                  'Content-Length': stat.size
                });
                const readStream = fs.createReadStream(filePath);
                readStream.pipe(res);
              } catch (error) {
                console.error('Error parsing JSON:', error);
                res.writeHead(400, { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*" });
                res.end(JSON.stringify({ "result": "fail" }));
              }
            });
          } else if (req.url === "/cbList") {
            // console.log(that.clipboardList)
            // 前置验证
            if (that.setting.hideDevice || that.setting.hideClipboardContent) {
              res.writeHead(200, { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*" });
              res.end(JSON.stringify({ "result": "success", "data": [], "message": "" }));
              return
            }


            res.writeHead(200, { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*" });
            res.end(JSON.stringify({ "result": "success", "data": [ ...that.clipboardList ].reverse(), "message": "" }));
          } else if (req.url === "/listfiles") {

            // 前置验证
            if (that.setting.hideDevice || that.setting.hideClipboardContent) {
              res.writeHead(200, { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*" });
              res.end(JSON.stringify({ "result": "success", "data": [], "message": "" }));
              return
            }


            let body = "";
            req.on('data', (chunk) => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                console.log(body)
                const jsonData = JSON.parse(body);
                // 在这里处理接收到的 JSON 数据
                console.log('Received JSON data:', jsonData);
                // path转为当前平台的path
                let filePath = that.pathToCurrentPlatform(jsonData.filePath)
                // list files in filePath
                let fileNames = fs.readdirSync(filePath)
                let result = []
                for (let fileName of fileNames) {
                  let fileFullPath = path.join(filePath, fileName)
                  let fileInfo = fs.statSync(fileFullPath);
                  result.push({
                    filePath: fileFullPath,
                    isFile: fileInfo.isFile(),
                    fileSize: fileInfo.size
                  })
                }
                // 返回响应
                res.writeHead(200, { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*" });
                res.end(JSON.stringify({ "result": "success", data: result }));
              } catch (error) {
                console.error('Error parsing JSON:', error);
                res.writeHead(400, { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*" });
                res.end(JSON.stringify({ "result": "fail" }));
              }
            });
          }
      }).listen(13238)
    }
  },
  async mounted () {
    this.userPublicPath = await getPublicPath()
    this.createHttpServer()
    let that = this
    ipcRenderer.on("append-clipboard", function (event, {filePaths, text, image}) {
      // 最多保持5个历史
      console.log({filePaths, text, image})
      if (that.clipboardList.length >= 5 && (text || (filePaths && filePaths.length > 0))) {
        that.clipboardList.shift()
      }
      if (filePaths && filePaths.length > 0) {
        let fileList = []
        for (let filePath of filePaths) {
          let fileInfo = fs.statSync(filePath)
          fileList.push({
            isFile: fileInfo.isFile(),
            filePath: filePath,
            fileSize: fileInfo.size
          })
        }
        that.clipboardList.push({content: fileList, type: "filePaths", id: new Date().getTime()})
      } else if (text) {
        that.clipboardList.push({content: text, type: "text", id: new Date().getTime()})
      } else if (image) {
        that.clipboardList.push({content: image, type: "image", id: new Date().getTime()})
      }
      // 清理本地图片缓存目录
      that.cleanTmpImages(that.clipboardList)
    })
    ipcRenderer.on("set-setting", function (event, setting) {
      // 设置setting
      that.setting = setting
    })
  }
}
</script>

<style lang="scss">
</style>