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
                <div class="service-list-container" v-if="availableCBList.length > 0">
                    <div class="cb-list-item" :key="device.id" v-for="device in availableCBList">
                        <div class="top">
                            <!-- <div :style="device.online ? 'background-color: green;' : 'background-color: red;'" class="status-point"></div> -->
                            <template v-if="device.id === deviceId">
                                <el-tag type="success" size="mini" effect="dark">本机</el-tag>
                            </template>
                            <Icon v-else :type="'net'" :color="device.online ? 'green' : 'grey'" style="width: 20px; height: 20px;"></Icon>
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
                            <el-checkbox v-model="device.default" @change="(val) => { defaultChanged(device, val) }"></el-checkbox>
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
const BROADCAST_ADDR = '255.255.255.255'; // 广播地址
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
    }
  },
  methods: {
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
    getLocalIPList() {
        const interfaces = os.networkInterfaces();
        const ips = [];
        for (const name in interfaces) {
            for (const iface of interfaces[name]) {
                // 跳过 IPv6 和 内部地址（127.0.0.1）
                if (iface.family === 'IPv4' && !iface.internal) {
                    ips.push({
                        address: iface.address,
                    });
                }
            }
        }
        return ips;
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
    broadcast () {
        clearInterval()
        let ips = this.getLocalIPList();
        console.log(ips)
        socket.bind(PORT, () => {
            socket.setBroadcast(true); // 开启广播权限
            setInterval(() => {
                const message = Buffer.from(JSON.stringify({
                    name: this.localName,
                    httpServers: [...ips],
                    id: this.deviceId
                }));
                socket.send(message, 0, message.length, PORT, BROADCAST_ADDR, (err) => {
                    if (err) console.error(err);
                    else console.log('广播消息已发送');
                });
            }, 2000);
        });
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
            console.log(that.availableCBList)
        });
    },
    close () {
        ipcRenderer.send("hide-main-win")
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
    if (!hostname) {
        this.localName = os.hostname()
        // 保存到config
        this.saveHostname()
    }
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