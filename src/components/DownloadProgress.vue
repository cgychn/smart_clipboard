<template>
    <div id="download-progress-container">
        <div class="title">
            <div style="width: calc(100% - 50px); -webkit-app-region: drag; height: 100%; display: flex; justify-content: flex-start; align-items: center; flex-wrap: nowrap;">
                <span style="margin-left: 15px; color: rgb(205, 205, 205);">传输任务中心</span>
            </div>
        </div>
        <div style="width: 50px; height: 50px; display: flex; justify-content: flex-end; align-items: center; font-family: '黑体'; position: absolute; right: 0; top: 0; z-index: 10">
            <div><i class="el-icon-close" style="margin-right: 15px; cursor: pointer; color: rgb(205, 205, 205);" @click="close()"></i></div>
        </div>
        <div class="content">
            <div class="list-empty-placeholder" v-if="getDownloadProgressList().length === 0">
                当前无传输任务
            </div>
            <div class="file-item" v-for="downloadProgress in getDownloadProgressList()">
                <div class="file-item-img">
                    <img src="/img/files.png" style="width: 70%;" />
                    <div class="bubble" v-if="downloadProgress.fileList.length > 1">{{ downloadProgress.fileList.length }}</div>
                </div>
                <div class="file-item-content" :style="`${downloadProgress.complete ? 'width: calc(100% - 60px - 70px);' : ''}`">
                    <div class="file-name">
                        <div :style="`${downloadProgress.fileList.length > 1 ? 'width: calc(100% - 30px)' : 'width: 100%'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`" :title="downloadProgress.fileList[0].filePath">{{ downloadProgress.fileList[0].filePath }}</div>
                        <div style="width: 30px; display: flex; justify-content: center;" v-if="downloadProgress.fileList.length > 1">
                            <el-tooltip class="item" effect="dark" content="等多个文件" placement="top-start">
                                <i class="el-icon-more"></i>
                            </el-tooltip>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="thumb-total" :style="`${!downloadProgress.complete && !downloadProgress.error ? 'width: calc(100% - 90px);' : ''}`">
                            <div class="thumb-inner-success" :style="`width: 100%;`" v-if="downloadProgress.complete"></div>
                            <div class="thumb-inner-error" :style="`width: 40%;`" v-else-if="downloadProgress.error"></div>
                            <div class="thumb-inner" :style="`width: ${downloadProgress.currentFileDownloadProgress}%;`" v-else></div>
                        </div>
                        <div style="width: 90px; color: white; font-size: 12px; display: flex; justify-content: center;" v-if="!downloadProgress.complete && !downloadProgress.error">
                            {{ formatSize(downloadProgress.speedPS) }} / s
                        </div>
                    </div>
                </div>
                <div class="file-item-op" :style="`${downloadProgress.complete ? 'width: 70px;' : ''}`">
                    <i v-if="downloadProgress.complete" class="el-icon-folder" style="cursor: pointer; color: rgb(205, 205, 205);" @click.stop="openFolder(downloadProgress)"></i>
                    <i class="el-icon-close" style="cursor: pointer; color: rgb(205, 205, 205);" @click.stop="deleteTask(downloadProgress)"></i>
                </div>
                <div class="file-item-extra" v-if="!downloadProgress.error && !downloadProgress.complete">
                    正在处理：{{ getFileName(downloadProgress.currentDownloadFile) }}
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ipcRenderer, shell } from "electron";
const path = require("path")
import Vue from "vue"
async function closeDownload (dt) {
    const data = await ipcRenderer.invoke('stop-download', dt)
    return data
}

export default {
  name: 'DownloadProgress',
  components: {
  },
  props: {
  },
  data () {
    return {
        // {currentDownloadFile: "D:\\aqwdw\\wdww.txt", currentFileDownloadProgress: 60, id: 123456, fileList: []},
      downloadProgressMap: {
        // "123456": {currentDownloadFile: "D:\\aqwdw\\aqwdw\\aqwdw\\aqwdw\\aqwdw\\aqwdw\\aqwdw\\aqwdw\\wdww.txt", currentFileDownloadProgress: 60, id: 123456, fileList: [{filePath: "wwwwwwwwwwwwwwwwwwww1"}], complete: true},
      }
    }
  },
  methods: {
    openFolder (file) {
        shell.openPath(file.destFilePath);
    },
    getFileName (filePath) {
        return path.basename(filePath)
    },
    formatSize(bytes) {
      if (bytes) {
        if (bytes < 1024) {
          return bytes + " B";
        } else if (bytes < 1048576) {
          return (bytes / 1024).toFixed(2) + " KB";
        } else if (bytes < 1073741824) {
          return (bytes / 1048576).toFixed(2) + " MB";
        } else {
          return (bytes / 1073741824).toFixed(2) + " GB";
        }
      } else {
        return "0 B";
      }
    },
    async deleteTask (task) {
        // 检查如果任务正在进行中给与提示
        if (!task.error && !task.complete) {
            // 任务进行中
            try {
                await this.$confirm('文件仍在下载中，此操作将会中断下载，是否继续?', '提示', {
                    confirmButtonText: '是',
                    cancelButtonText: '否',
                    type: 'warning'
                })
                console.log(task)
                // close downloader window
                await closeDownload({id: task.id})
                delete this.downloadProgressMap[task.id]
            } catch (e) {
                console.log(e)
                // do nothing
            }   
        } else {
            console.log(task)
            await closeDownload({id: task.id})
            delete this.downloadProgressMap[task.id]
            // close downloader window
        }
        this.$forceUpdate()
    },
    addDownloadProgressList (file) {
        console.log(file)
        if (this.downloadProgressMap[file.id]) {
            if (this.downloadProgressMap[file.id].currentDownloadFile != file.currentDownloadFile) {
                let tmpFile = {...file}
                tmpFile.currentFileDownloadProgress = 0
                Vue.set(this.downloadProgressMap, file.id, tmpFile)
                Vue.set(this.downloadProgressMap, file.id, file)
            } else {
                Vue.set(this.downloadProgressMap, file.id, file)
            }
        } else {
            Vue.set(this.downloadProgressMap, file.id, file)
        }
    },
    getDownloadProgressList () {
        return Object.values(this.downloadProgressMap).sort((a, b) => b.id - a.id)
    },
    close () {
        ipcRenderer.send("hide-download-progress-win")
    },
    checkHaveErrorTasks () {
        for (let task of Object.values(this.downloadProgressMap)) {
            if (task.error) {
                return true
            }
        }
        return false
    }
  },
  mounted () {
    // this.$message({
    //     message: "文件开始传输至指定位置，点屏幕右下角悬窗查看传输进度",
    //     duration: 0
    // })

    let that = this
    setInterval(() => {
        ipcRenderer.send("broadcast-have-error-tasks", that.checkHaveErrorTasks())
    }, 1500)
    ipcRenderer.on("set-download-progress", function (event, data) {
        that.addDownloadProgressList(data)
    })
    ipcRenderer.on("set-download-complete", function (event, data) {
        let taskId = data.id
        let task = that.downloadProgressMap[taskId]
        if (task) {
            task.complete = true
        }
        that.$forceUpdate()
    })
    ipcRenderer.on("set-download-error", function (event, data) {
        let taskId = data.id     
        let task = that.downloadProgressMap[taskId]
        if (task) {
            task.error = true
        }
        that.$forceUpdate()
    })
    ipcRenderer.on("set-download-error", function (event, data) {
        let taskId = data.id     
        let task = that.downloadProgressMap[taskId]
        if (task) {
            task.error = true
        }
        that.$forceUpdate()
    })
  }
}
</script>

<style lang="scss">
#download-progress-container {
    width: 100%;
    height: 100%;
    background-color: #2b2b2b;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    .list-empty-placeholder {
        width: 100%; 
        height: 100%; 
        display: flex; 
        justify-content: center; 
        align-items: center; 
        color: rgb(199, 199, 199);
    }
    .title {
        width: 100%;
        height: 50px;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        flex-wrap: nowrap;
        z-index: 6;
    }
    .content {
        width: calc(100% - 40px);
        height: calc(100% - 90px);
        padding: 20px;
        overflow: auto;
        &::-webkit-scrollbar {
          width: 4px;
        }
        /*定义滑块 内阴影+圆角*/
        &::-webkit-scrollbar-thumb {
          width: 4px;
          border-radius: 4px;
          background-color: #de7d7d;
        }
        // background-color: rebeccapurple;
    }
    .file-item {
        width: 100%;
        min-height: 60px;
        // background-color: red;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        margin-bottom: 10px;
        // background-color: #6b6b6b;
        // border-radius: 5px;
        border-bottom: 1px solid grey;
        flex-wrap: wrap;
        .file-item-extra {
            width: 90%; 
            padding-top: 10px;
            padding-bottom: 10px;
            font-size: 13px;
            margin-left: auto; margin-right: auto; 
            margin-bottom: 10px;
            word-wrap: break-word;  /* 让长单词或连续文本自动换行 */
            word-break: break-all;  /* 针对中文和英文强制换行 */
            white-space: normal;    /* 允许正常换行 */
            color: rgb(191, 191, 191);
            overflow: hidden; 
            text-overflow: ellipsis; 
            white-space: nowrap;
        }
        .file-item-img {
            height: 60px;
            width: 60px;
            // background-color: #de7d7d;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            .bubble {
                position: absolute; 
                top: 5px; 
                right: 0px; 
                background-color: red; 
                color: white; 
                border-radius: 50%; 
                padding-left: 5px; 
                padding-right: 5px; 
                padding-top: 2px; 
                padding-bottom: 2px; 
                font-size: 10px;
            }
        }
        .file-item-content {
            height: 60px;
            width: calc(100% - 60px - 50px);
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            // background-color: #666666;
            .file-name {
                display: flex;
                justify-content: flex-start;
                align-items: flex-end;
                height: 50%;
                width: 90%;
                color: white;
                overflow: hidden; 
                text-overflow: ellipsis; 
                white-space: nowrap;
            }
            .progress-bar {
                display: flex;
                justify-content: flex-start;
                align-items: center;
                height: 50%;
                width: 90%;
                .thumb-total {
                    width: 100%; 
                    height: 5px; 
                    border-radius: 2px; 
                    background-color: rgb(137, 137, 137);
                }
                .thumb-inner {
                    transition: .2s ease all;
                    height: 5px; 
                    border-radius: 2px; 
                    background-color: rgb(60, 127, 243);
                }
                .thumb-inner-success {
                    transition: .2s ease all;
                    height: 5px; 
                    border-radius: 2px; 
                    background-color: rgb(99, 229, 99);
                }
                .thumb-inner-error {
                    transition: .2s ease all;
                    height: 5px; 
                    border-radius: 2px; 
                    background-color: rgb(221, 44, 44);
                }
            }
        }
        .file-item-op {
            height: 60px;
            width: 50px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            // background-color: #0f0d0d;
        }
    }
}
</style>