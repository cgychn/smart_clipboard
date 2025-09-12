<template>
    <div id="home">
        <div class="title">
            <div :style="`width: calc(100% - ${settingShow ? '30px' : '60px'}); -webkit-app-region: drag; height: 100%; display: flex; justify-content: flex-start; align-items: center; flex-wrap: nowrap;`">
                <span style="margin-left: 15px; color: rgb(205, 205, 205);">Smart Clipboard</span>
            </div>
        </div>
        <div v-if="!settingShow" style="width: 30px; height: 50px; display: flex; justify-content: flex-end; align-items: center; font-family: '黑体'; position: absolute; right: 30px; top: 0; z-index: 10">
            <div><i class="el-icon-setting" style="margin-right: 15px; cursor: pointer; color: rgb(205, 205, 205);" @click="showSetting()"></i></div>
        </div>
        <div style="width: 30px; height: 50px; display: flex; justify-content: flex-end; align-items: center; font-family: '黑体'; position: absolute; right: 0; top: 0; z-index: 10">
            <div><i class="el-icon-close" style="margin-right: 15px; cursor: pointer; color: rgb(205, 205, 205);" @click="close()"></i></div>
        </div>
        <div v-if="settingShow" style="width: 100%; height: calc(100% - 50px); display: flex; justify-content: center; align-items: center;">
            <div style="width: 80%; height: 90%; display: flex; justify-content: center; align-content: flex-start; flex-wrap: wrap;">
                <div style="width: 100%; height: 30px; color: rgb(217, 217, 217); font-weight: bold; display: flex;">配置项</div>
                <div class="setting-item-container">
                    <div class="setting-item">
                        <div class="setting-item-left">
                            隐私：
                        </div>
                        <div class="setting-item-right">
                            <div style="width: 100%;">
                                <el-checkbox v-model="setting.hideDevice">
                                    隐身使用
                                    <el-tooltip class="item" effect="dark" content="该设备对其他设备不可见" placement="top-start">
                                        <i class="el-icon-question" style="margin-left: 5px;"></i>
                                    </el-tooltip>
                                </el-checkbox>
                            </div>
                            <div style="margin-top: 10px;">
                                <el-checkbox v-model="setting.hideClipboardContent">
                                    不分享剪切板内容
                                    <el-tooltip class="item" effect="dark" content="该设备的剪切板内容对其他设备不可见" placement="top-start">
                                        <i class="el-icon-question" style="margin-left: 5px;"></i>
                                    </el-tooltip>
                                </el-checkbox>
                            </div>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-item-left">
                            文件传输：
                        </div>
                        <div class="setting-item-right">
                            <div>
                                <el-radio v-model="setting.skipSameFile" :label="true">同名文件自动跳过</el-radio>
                            </div>
                            <div style="margin-top: 10px;">
                                <el-radio v-model="setting.skipSameFile" :label="false">同名文件自动覆盖</el-radio>
                            </div>
                        </div>
                    </div>
                    <!-- <div class="setting-item">
                        <div class="setting-item-left">
                            服务端口：
                        </div>
                        <div class="setting-item-right">
                            <div>
                                <el-input size="mini"></el-input>
                            </div>
                        </div>
                    </div> -->
                </div>
                <div style="width: 100%; height: 80px; display: flex; justify-content: center; align-items: center;">
                    <el-button type="primary" size="medium" @click="saveSetting()">应用</el-button>
                    <el-button size="medium" type="danger" style="margin-left: 30px;" @click="restoreSetting()">返回</el-button>
                </div>
                
            </div>
        </div>
        
        <div v-else class="content">
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
                <div class="service-list-container" v-if="availableCBList.length > 0">
                    <div class="cb-list-item" :key="device.id" v-for="device in availableCBList">
                        <div :class="`top${device.online ? '' : ' offline'}`">
                            <img :src="`/img/${device.platform}.png`" onerror="this.onerror=null; this.src='/img/unknow.png';" style="height: 75%;" />
                            <template v-if="device.id === deviceId">
                                <span class="current-device" type="success">本机</span>
                            </template>
                            <!-- <Icon v-else :type="'net'" :color="device.online ? 'green' : 'grey'" style="width: 20px; height: 20px;"></Icon> -->
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
                            <el-tooltip class="item" effect="dark" content="默认展示该设备内容" placement="top-start">
                                <el-checkbox v-model="device.default" @change="(val) => { defaultChanged(device, val) }"></el-checkbox>
                            </el-tooltip>
                        </div>
                    </div>
                </div>
                <div v-else style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
                    <span>暂无可用剪切板</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
const {setTimeout, setInterval, clearInterval} = require('timers');
import { ipcRenderer, clipboard, ipcMain } from "electron";
import Icon from "./common/Icon.vue";
const fs = require("fs")
const dgram = require('dgram');
const socket = dgram.createSocket('udp4');
const os = require("os")
const PORT = 18268; // 自定义端口

async function dbRunPrepare (sqlStr, ...params) {
  try {
    let {res} = await ipcRenderer.invoke("sqlite-run-prepare", {sqlId: 0, sqlStr, params})
    return res;
  } catch (error) {
    return error
  }
}

async function dbAll (sqlStr) {
  try {
    let {res} = await ipcRenderer.invoke("sqlite-all", {sqlId: 0, sqlStr})
    return res;
  } catch (error) {
    return error
  }
}

async function getConfig () {
    const data = await ipcRenderer.invoke('get-config')
    console.log(data)
    return data
}

async function getDeviceId () {
    const data = await ipcRenderer.invoke('get-deviceid')
    console.log(data)
    return data
}

async function getPlatform () {
    const data = await ipcRenderer.invoke('get-platform')
    console.log(data)
    return data
}

export default {
  name: 'Home',
  components: {
    Icon
  },
  props: {
  },
  data () {
    return {
        deviceId: "",
        localName: "",
        availableCBList: [],
        settingShow: false,
        setting: {
            skipSameFile: true,
            hideDevice: false,
            hideClipboardContent: false,
        },
        savedSetting: {

        },
        platform: ""
    }
  },
  methods: {
    async saveSetting () {
        // 保存到数据库
        await dbRunPrepare(`update setting set setting_value = '${this.setting.skipSameFile ? "1" : "0"}' where setting_name = 'skipSameFile'`)
        await dbRunPrepare(`update setting set setting_value = '${this.setting.hideDevice ? "1" : "0"}' where setting_name = 'hideDevice'`)
        await dbRunPrepare(`update setting set setting_value = '${this.setting.hideClipboardContent ? "1" : "0"}' where setting_name = 'hideClipboardContent'`)
        this.savedSetting = {...this.setting}
        this.$message.success("保存成功")
        this.settingShow = false
        // broadcase setting
        ipcRenderer.send("set-setting", this.savedSetting)
    },
    async restoreSetting () {
        if (JSON.stringify(this.setting) != JSON.stringify(this.savedSetting)) {
            // 提醒用户设置变更
            try {
                await this.$confirm('检测到您的变更未保存，此操作不会保存您的变更，是否继续?', '提示', {
                    confirmButtonText: '是',
                    cancelButtonText: '否',
                    type: 'warning'
                })
                // 恢复setting
                this.setting = {...this.savedSetting}
                this.settingShow = false;
            } catch (e) {
                console.error(e)
            }
        } else {
            this.settingShow = false;
            this.setting = {...this.savedSetting}
        }
    },
    async loadSetting () {
        try {
            let res = await dbAll("select * from setting")
            console.log(res)
            let settingMap = {}
            for (let settingItem of res) {
                settingMap[settingItem.setting_name] = settingItem.setting_value
            }
            // 是否跳过复制同名文件
            if ("skipSameFile" in settingMap) {
                if (settingMap["skipSameFile"] == "1") {
                    this.savedSetting["skipSameFile"] = true
                } else {
                    this.savedSetting["skipSameFile"] = false
                }
            } else {
                // 更新默认值
                await dbRunPrepare("insert into setting(setting_name, setting_value) values(?, ?)", "skipSameFile", "0")
                this.savedSetting["skipSameFile"] = false
            }
            // 是否隐藏设备
            if ("hideDevice" in settingMap) {
                if (settingMap["hideDevice"] == "1") {
                    this.savedSetting["hideDevice"] = true
                } else {
                    this.savedSetting["hideDevice"] = false
                }
            } else {
                // 更新默认值
                await dbRunPrepare("insert into setting(setting_name, setting_value) values(?, ?)", "hideDevice", "0")
                this.savedSetting["hideDevice"] = false
            }
            // 是否隐藏剪切板内容
            if ("hideClipboardContent" in settingMap) {
                if (settingMap["hideClipboardContent"] == "1") {
                    this.savedSetting["hideClipboardContent"] = true
                } else {
                    this.savedSetting["hideClipboardContent"] = false
                }
            } else {
                // 更新默认值
                await dbRunPrepare("insert into setting(setting_name, setting_value) values(?, ?)", "hideClipboardContent", "0")
                this.savedSetting["hideClipboardContent"] = false
            }
            this.setting = {...this.savedSetting}
            ipcRenderer.send("set-setting", this.savedSetting)
        } catch (e) {
            console.error(e)
        }
    },
    async defaultChanged (device, value) {
        console.log(device, value)
        // update cb_server all record's default 0 and update $device.id default 1
        try {
            if (value) {
                await dbRunPrepare(`update cb_server set \`default\` = CASE id WHEN '${device.id}' THEN '1' ELSE '0' END`)
            } else {
                await dbRunPrepare(`update cb_server set \`default\` = 0`)
            }
        } catch (e) {
            console.error(e)
            this.$message('设置默认设备失败，请重试！')
            device.default = !value
        }
    },
    async loadCBListFromDB () {
        let res = await dbAll("select * from cb_server")
        console.log(res)
        for (let cb of res) {
            cb.default = (cb.default === 1)
        }
        this.availableCBList = res
    },
    syncDBListToMainProgress() {
        let that = this;
        let currentTime = new Date().getTime();
        setInterval(() => {
            for (let cb of that.availableCBList) {
                if (cb.lastHeartbeatTime) {
                    let duringTime = currentTime - cb.lastHeartbeatTime
                    if (duringTime > 10000) {
                        // 10s 内没有收到心跳，服务下线
                        cb.online = false
                    }
                }
            }
            // 同步到主进程
            ipcRenderer.send('sync-cblist', that.availableCBList)
        }, 1000)
    },
    getLocalIPv4() {
        const interfaces = os.networkInterfaces();
        const addrs = [];
        for (const name in interfaces) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    addrs.push(iface);
                }
            }
        }
        return addrs;
    },
    getBroadcastAddress(ip, netmask) {
        const ipParts = ip.split('.').map(Number);
        const maskParts = netmask.split('.').map(Number);
        const broadcastParts = ipParts.map((p, i) => (p & maskParts[i]) | (~maskParts[i] & 255));
        return broadcastParts.join('.');
    },
    broadcast () {
        clearInterval()
        let interfaces = this.getLocalIPv4();
        let that = this

        // 对每个网卡都开启广播
        for (let intef of interfaces) {
            let broadcaseAddr = this.getBroadcastAddress(intef.address, intef.netmask)
            socket.bind(PORT, intef.address, () => {
                socket.setBroadcast(true); // 开启广播权限
                setInterval(() => {
                    // 如果隐身模式则跳过广播
                    if (!that.savedSetting.hideDevice) {
                        const message = Buffer.from(JSON.stringify({
                            name: this.localName,
                            id: this.deviceId,
                            platform: this.platform
                        }));
                        socket.send(message, 0, message.length, PORT, broadcaseAddr, (err) => {
                            if (err) console.error(err);
                            else console.log('广播消息已发送');
                        });
                    }
                }, 2000);
            });
        }
    },
    listenBroadcast () {
        let that = this;
        socket.on('message', async (msg, rinfo) => {
            console.log(`收到消息: ${msg} 来自 ${rinfo.address}:${rinfo.port}`);
            let msgJSON = JSON.parse(msg)
            let added = false;
            for (let cb of that.availableCBList) {
                if (cb.id === msgJSON.id) {
                    cb.online = true
                    cb.ipAddress = rinfo.address
                    cb.lastHeartbeatTime = new Date().getTime()
                    cb.platform = msgJSON.platform
                    added = true
                }
            }
            if (!added) {
                that.availableCBList.push(
                    { ...msgJSON, ipAddress: rinfo.address }
                )
                that.$forceUpdate()
                // update to sqlite
                let sql = "insert or ignore into cb_server('id', 'name', 'default') values (?, ?, ?)"
                try {
                    await dbRunPrepare(sql, msgJSON.id, msgJSON.name, '0')
                } catch (e) {
                    console.log(e)
                }
            }
            that.$forceUpdate()
            console.log(that.availableCBList)
        });
    },
    close () {
        ipcRenderer.send("hide-main-win")
    },
    showSetting () {
        this.settingShow = true
    },
    saveHostname (notice) {
        ipcRenderer.send("set-host-name", this.localName)
        if (notice) {
            this.$message.success("修改成功！")
        }
    },
  },
  async mounted () {
    let hostname = await getConfig().localName
    this.deviceId = await getDeviceId()
    this.platform = await getPlatform()
    if (!hostname) {
        this.localName = os.hostname()
        // 保存到config
        this.saveHostname()
    }
    await this.loadSetting()
    // 开始广播
    this.loadCBListFromDB()
    this.broadcast()
    this.listenBroadcast()
    this.syncDBListToMainProgress()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.el-message-box {
    background-color: #4e4e4e !important;
    border: 1px solid #474747 !important;
    width: 80% !important;
}
.el-message-box__title {
    color: #cbcbcb !important;
}
.el-message-box__message {
    color: #c3c3c3 !important;
}
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
    .el-radio__inner {
        background-color: #505050;
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
                &::-webkit-scrollbar {
                    width: 4px;
                }
                /*定义滑块 内阴影+圆角*/
                &::-webkit-scrollbar-thumb {
                    width: 4px;
                    border-radius: 4px;
                    background-color: #de7d7d;
                }
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
                        position: relative;
                        .status-point {
                            width: 15px; 
                            height: 15px; 
                            border-radius: 50%; 
                        }
                    }
                    .offline {
                        filter: grayscale(100%);
                    }
                    .current-device {
                        position: absolute; color: white; 
                        padding-top: 2px; padding-bottom: 2px; 
                        padding-right: 5px; padding-left: 5px; 
                        font-size: 8px; 
                        background-color: rgb(0, 176, 0);
                        display: block;
                        border-radius: 4px;
                        top: 5px;
                        left: 5px;
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
    .setting-item-container {
        width: 100%; 
        height: calc(100% - 80px - 30px); 
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
    }
    .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        width: 100%;
        min-height: 50px;
        flex-wrap: wrap;
        color: rgb(192, 192, 192);
        margin-bottom: 20px;
        margin-top: 20px;
        .setting-item-left {
            width: 40%;
            height: 100%;
            display: flex;
            justify-content: flex-end;
            align-items: flex-start;
            // background-color: rebeccapurple;
        }
        .setting-item-right {
            width: 55%;
            height: 100%;
            display: flex;
            justify-content: flex-start;
            align-items: flex-start;
            flex-wrap: wrap;
            // background-color: aqua;
        }
    }
}

</style>