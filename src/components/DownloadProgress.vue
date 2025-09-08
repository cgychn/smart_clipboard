<template>
    <div id="download-progress-container">
        <div class="title">
            <div style="width: calc(100% - 50px); -webkit-app-region: drag; height: 100%; display: flex; justify-content: flex-start; align-items: center; flex-wrap: nowrap;">
                <span style="margin-left: 15px; color: rgb(205, 205, 205);">传输任务</span>
            </div>
        </div>
        <div style="width: 50px; height: 50px; display: flex; justify-content: flex-end; align-items: center; font-family: '黑体'; position: absolute; right: 0; top: 0; z-index: 10">
            <div><i class="el-icon-close" style="margin-right: 15px; cursor: pointer; color: rgb(205, 205, 205);" @click="close()"></i></div>
        </div>
        <div class="content">
            <div class="list-empty-placeholder" v-if="getDownloadProgressList().length === 0">
                当前无下载任务
            </div>
            <div class="file-item" v-for="downloadProgress in getDownloadProgressList()">
                <div class="file-item-img">
                    <img src="/img/files.png" style="width: 70%;" />
                    <div class="bubble" v-if="downloadProgress.totalFileCount > 1">{{ downloadProgress.totalFileCount }}</div>
                </div>
                <div class="file-item-content">
                    <div class="file-name">
                        <div style="width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="downloadProgress.currentDownloadFile">{{ downloadProgress.currentDownloadFile }}</div>
                    </div>
                    <div class="progress-bar">
                        <div class="thumb-total">
                            <div class="thumb-inner-success" :style="`width: 100%;`" v-if="downloadProgress.complete"></div>
                            <div class="thumb-inner-error" :style="`width: 40%;`" v-else-if="downloadProgress.error"></div>
                            <div class="thumb-inner" :style="`width: ${downloadProgress.currentFileDownloadProgress}%;`" v-else></div>
                        </div>
                    </div>
                </div>
                <div class="file-item-op">
                    <i class="el-icon-close" style="cursor: pointer; color: rgb(205, 205, 205);" @click="deleteTask(downloadProgress)"></i>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ipcRenderer } from "electron";
export default {
  name: 'DownloadProgress',
  components: {
  },
  props: {
  },
  data () {
    return {
        // {currentDownloadFile: "D:\\aqwdw\\wdww.txt", currentFileDownloadProgress: 60, id: 123456, totalFileCount: 2},
      downloadProgressMap: {
        // "123456": {currentDownloadFile: "D:\\aqwdw\\wdww.txt", currentFileDownloadProgress: 60, id: 123456, totalFileCount: 2},
      }
    }
  },
  methods: {
    deleteTask (task) {
        // 检查如果任务正在进行中给与提示

        console.log(task)
        delete this.downloadProgressMap[task.id]
        // close downloader window
        ipcRenderer.send("stop-download", {id: task.id})
    },
    addDownloadProgressList (file) {
        console.log(file)
        this.downloadProgressMap[file.id] = file
        this.$forceUpdate()
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
        height: 60px;
        // background-color: red;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        margin-bottom: 10px;
        // background-color: #6b6b6b;
        // border-radius: 5px;
        border-bottom: 1px solid grey;

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
            justify-content: center;
            align-items: center;
            // background-color: #0f0d0d;
        }
    }
}
</style>