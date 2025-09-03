<template></template>

<script>
const http = require('http')
const fs = require("fs")
import { ipcRenderer } from "electron";
export default {
  name: 'HttpServer',
  components: {
  },
  props: {
  },
  data () {
    return {
      clipboardList: []
    }
  },
  methods: {
    createHttpServer () {
      let that = this
      http.createServer(function (req, res) {
          console.log(req)
          if (req.url === "/copyFile") {
            
          } else if (req.url === "/cbList") {
            console.log(that.clipboardList)
            res.writeHead(200, { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*" });
            res.end(JSON.stringify({ "result": "success", "data": [ ...that.clipboardList ].reverse(), "message": "" }));
          }
      }).listen(13238)
    }
  },
  mounted () {
    this.createHttpServer()
    let that = this
    ipcRenderer.on("append-clipboard", function (event, {filePaths, text}) {
        // 最多保持5个历史
        console.log({filePaths, text})
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
        }
    })
  }
}
</script>

<style lang="scss">
</style>