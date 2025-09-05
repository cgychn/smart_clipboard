<template></template>

<script>
const http = require('http')
const fs = require("fs")
const path = require("path")
import { ipcRenderer } from "electron";
import { url } from "inspector";
export default {
  name: 'Downloader',
  components: {
  },
  props: {
  },
  data () {
    return {
      taskId: null,
      fileList: []
    }
  },
  methods: {
    dealDownload (filePath, destFilePath, serverPath) {
        // 创建空文件
        let dirname = path.dirname(destFilePath)
        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, {recursive: true})
        }
        fs.writeFileSync(destFilePath, "")
        let that = this
        return new Promise(async (resolve, reject) => {
            try {
                let response = await fetch(`${serverPath}/copyFile`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        filePath
                    })
                })
                if (!response.ok) {
                    console.error(response.statusText)
                    reject()
                } else {
                    const total = Number(response.headers.get("content-length")); // 文件总大小
                    let downloaded = 0;
                    const fileStream = fs.createWriteStream(destFilePath);
                    const reader = response.body.getReader();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        fileStream.write(value);
                        downloaded += value.length;
                        if (total) {
                            const percent = ((downloaded / total) * 100).toFixed(2);
                            console.log(`\r下载进度: ${percent}% (${downloaded}/${total} bytes)`);
                            // broadcast download progress
                            // {currentDownloadFile: "D:\\aqwdw\\wdww.txt", currentFileDownloadProgress: 60, id: 123456, totalFileCount: 2},
                            ipcRenderer.send("broadcast-download-progress", {
                                id: that.taskId, 
                                currentDownloadFile: filePath, 
                                currentFileDownloadProgress: parseInt(percent), 
                                totalFileCount: that.fileList.length
                            })
                        } else {
                            console.log(`\r已下载: ${downloaded} bytes`);
                        }
                    }

                    fileStream.end();
                    console.log("resolved")
                    resolve()
                }
            } catch (e) {
                console.error(e)
                reject()
            }
        })
    }
  },
  mounted () {
    let that = this
    ipcRenderer.on("start-download", async function (event, {id, fileList, toDir, serverPath}) {
        that.taskId = id
        that.fileList = fileList
        console.log(fileList, toDir, serverPath)
        let toDealFiles = []
        for (let file of fileList) {
            console.log(path.basename(file.filePath))
            toDealFiles.push({
                filePath: file.filePath,
                isFile: file.isFile,
                fileSize: file.fileSize,
                realPath: path.basename(file.filePath)
            })
        }
        console.log(toDealFiles)
        while (toDealFiles.length > 0) {
            let file = toDealFiles.shift()
            try {
                // console.log(file)
                let toFilePath = toDir + "\\" + file.realPath
                // console.log(toFilePath)
                if (file.isFile) {
                    // console.log("file:", file.filePath)
                    // download file
                    await that.dealDownload(file.filePath, toFilePath, serverPath)
                    console.log("file downloaded")
                } else {
                    // create dir first
                    fs.mkdirSync(toFilePath, { recursive: true })
                    ipcRenderer.send("broadcast-download-progress", {
                        id: that.taskId, 
                        currentDownloadFile: file.filePath, 
                        currentFileDownloadProgress: 100, 
                        totalFileCount: that.fileList.length
                    })
                    // fetch listfile
                    let { data } = await that.ajax.post(serverPath + "/listfiles", {filePath: file.filePath})
                    // console.log(data)
                    if (data.data) {
                        // add file to toDealFiles
                        for (let f of data.data) {
                            toDealFiles.push({
                                filePath: f.filePath,
                                isFile: f.isFile,
                                fileSize: f.fileSize,
                                realPath: file.realPath + "\\" + path.basename(f.filePath)
                            })
                        }
                    }
                }
            } catch (e) {
                console.log(e)
                // error ocur do sth
                ipcRenderer.send("download-error", {id, file});
                break;
            }
        }
        console.log("compeletd")
        ipcRenderer.send("download-complete", {id})
    })
  }
}
</script>

<style lang="scss">
</style>