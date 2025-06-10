<template>
    <div id="home">
        <div class="title">
            <div style="width: calc(100% - 50px); -webkit-app-region: drag; height: 100%; display: flex; justify-content: flex-start; align-items: center; flex-wrap: nowrap;">
                <span style="margin-left: 15px; color: rgb(205, 205, 205);">Smart Clipboard</span>
            </div>
        </div>
        <div style="width: 50px; height: 50px; display: flex; justify-content: flex-end; align-items: center; font-family: '黑体'; position: absolute; right: 0; top: 0; z-index: 10">
            <div><i class="el-icon-close" style="margin-right: 15px; cursor: pointer; color: rgb(205, 205, 205);" @click="close()"></i></div>
        </div>
        <div class="content">
            <div class="local-service">
                <span style="color: rgb(205, 205, 205);">本机</span>
                <br/>
                <span style="margin-top: 5px; color: rgb(205, 205, 205); margin-top: 8px; font-size: 10px;">ID: {{ deviceId }}</span>
                <div style="width: 100%; display: flex; justify-content: center; align-items: center; flex-wrap: nowrap; margin-top: 8px;">
                    <el-input size="mini" style="width: calc(100% - 60px); margin-right: 10px;" v-model="localName">
                    </el-input>
                    <el-button icon="el-icon-circle-check" type="primary" size="mini" style="width: 50px;" @click="saveHostname(true)"></el-button>
                </div>
                
            </div>
            <div class="service-list">
                可用剪切板
                <div class="service-list-container">
                    <div class="cb-list-item" :key="device.id" v-for="device in availableCBList">
                        <div class="top">
                            <!-- <div :style="device.online ? 'background-color: green;' : 'background-color: red;'" class="status-point"></div> -->
                            <Icon :type="'net'" :color="device.online ? 'green' : 'grey'" style="width: 20px; height: 20px;"></Icon>
                        </div>
                        <div class="center">
                            <div style="width: 100%; height: 60%; line-height: 2.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px;">
                                设备名称：{{ device.name }}
                            </div>
                            <div style="width: 100%; height: 40%; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ID：{{ device.id }}
                            </div>
                        </div>
                        <div class="end">
                            <el-checkbox v-model="device.default"></el-checkbox>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { remote, ipcRenderer, clipboard } from "electron";
import Icon from "./common/Icon.vue";
const config = remote.getGlobal('sharedObject').config
const deviceId = remote.getGlobal('sharedObject').deviceId
const os = require("os")
console.log(deviceId)
export default {
  name: 'Home',
  components: {
    Icon
  },
  props: {
  },
  data () {
    return {
        deviceId: deviceId,
        localName: "",
        availableCBList: [
            {name : "123321123", id: "2345678", default: false, online: false},
            {name : "223321123", id: "3345678", default: false, online: true},
            {name : "323321123", id: "4345678", default: true, online: true},
            {name : "423321123", id: "5345678", default: false, online: true},
        ],
        clipboardList: []
    }
  },
  methods: {
    close () {

    },
    saveHostname (notice) {
        ipcRenderer.send("set-host-name", this.localName)
        if (notice) {
            this.$message.success("修改成功！")
        }
    }
  },
  mounted () {
    let that = this
    let hostname = config.localName
    if (!hostname) {
        this.localName = os.hostname()
        // 保存到config
        this.saveHostname()
    }
    ipcRenderer.on("append-clipboard", function (event, {filePaths, text}) {
        // 最多保持5个历史
        console.log({filePaths, text})
        if (that.clipboardList.length >= 5) {
            that.clipboardList.unshift()
        }
        if (filePaths) {
            that.clipboardList.push({content: filePaths, type: "filePaths"})
        } else if (text) {
            that.clipboardList.push({content: text, type: "text"})
        }
    })
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
#home {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    flex-wrap: wrap;
    background-color: #2b2b2b;
    .el-input__inner {
        color: #e0e0e0 !important;
        background-color: #505050 !important;
        border: 1px solid #6f6f6f !important;
    }
    .el-checkbox__inner {
        background-color: #505050 !important;
        border: 1px solid #6f6f6f !important;
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
        width: 100%;
        height: calc(100% - 50px);
        display: flex;
        justify-content: center;
        align-content: flex-start;
        flex-wrap: wrap;
        .local-service {
            margin-top: 20px;
            width: 75%;
            padding: 20px;
            background-color: #2c3540;
            border-radius: 10px;
            border: 1px rgb(81, 81, 81) solid;
            box-shadow: 0 0 15px 5px rgb(27, 27, 27);
        }
        .service-list {
            margin-top: 20px;
            width: 75%;
            padding: 20px;
            height: calc(100% - 40px - 200px);
            color: rgb(205, 205, 205);
            background-color: #2c3540;
            border-radius: 10px;
            border: 1px rgb(81, 81, 81) solid;
            box-shadow: 0 0 15px 5px rgb(27, 27, 27);
            .service-list-container {
                width: 100%;
                height: calc(100% - 40px);
                display: flex;
                justify-content: center;
                align-content: flex-start;
                margin-top: 15px;
                overflow: auto;
                flex-wrap: wrap;
                .cb-list-item {
                    width: 100%;
                    margin-top: 2px;
                    height: 60px;
                    display: flex;
                    flex-direction: row;
                    background-color: rgb(46, 46, 46);
                    border-bottom: 1px solid rgb(59, 59, 59);
                    border-radius: 5px;
                    .top {
                        width: 60px;
                        height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        .status-point {
                            width: 15px; 
                            height: 15px; 
                            border-radius: 50%; 
                        }
                    }
                    .center {
                        width: calc(100% - 60px - 60px);
                        height: 100%;
                    }
                    .end {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 60px;
                        height: 100%;
                    }
                }
            }
        }
    }
}

</style>