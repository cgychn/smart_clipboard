<template>
    <div id="toolbar-container" style="-webkit-app-region: drag;" @click="showDownloadList">
        <div class="toolbar-icon">
            <template v-if="twinkle.twinkling">
                <i v-if="twinkle.type === 'success'" class="el-icon-success blink-icon" style="color: rgb(0, 196, 0); -webkit-app-region: no-drag;"></i>
                <i v-if="twinkle.type === 'error'" class="el-icon-error blink-icon" style="color: red; -webkit-app-region: no-drag;"></i>
            </template>
            <template v-else>
                <i style="position: absolute; top: 10px; left: 8px; color: rgb(230, 162, 60); font-size: 15px;" class="el-icon-warning" v-if="showWarning"></i>
                <img v-show="transferingCount <= 0" src="/img/logo.png" style="width: 20px; -webkit-app-region: no-drag;" />
                <i class="el-icon-refresh transfer-icon" style="font-weight: bolder; font-size: 20px; -webkit-app-region: no-drag;" v-show="transferingCount > 0"></i>
                <div class="toolbar-counter" v-show="transferingCount > 0">
                    {{ countToShow }}
                </div>
            </template>
        </div>
    </div>
</template>

<script>
const http = require('http')
const fs = require("fs")
const path = require("path")
import { ipcRenderer } from "electron";
export default {
  name: 'ToolBar',
  components: {
  },
  props: {
  },
  data () {
    return {
      transferingCount: 0,
      countToShow: "0",
      twinkle: {
        type: "",
        twinkling: false,
        timeout: null
      },
      showWarning: false
    }
  },
  methods: {
    opTransferingCount (delt) {
        this.transferingCount += delt
        if (delt >= 99) {
            this.countToShow = "99+" 
        } else {
            this.countToShow = this.transferingCount
        }
    },
    showDownloadList () {
        ipcRenderer.send("show-download-progress", {})
    },
    startTwinkle (type) {
        console.log(type)
        let that = this
        if (this.twinkle.twinkling && this.twinkle.type == type) {
            // do nothing
        } else {
            this.twinkle.twinkling = true
            this.twinkle.type = type
            if (this.twinkle.timeout) {
                clearTimeout(this.twinkle.timeout)
            }
            this.twinkle.timeout = setTimeout(() => {
                that.twinkle.twinkling = false
            }, 2000)
        }
    },
  },
  mounted () {
    let that = this
    ipcRenderer.on("op-transfering-count", function (event, {delt}) {
        console.log(delt)
        that.opTransferingCount(delt)
    })
    ipcRenderer.on("success-twinkle", function (event, data) {
        console.log(data)
        that.startTwinkle("success")
    })
    ipcRenderer.on("error-twinkle", function (event, data) {
        console.log(data)
        that.startTwinkle("error")
    })
    ipcRenderer.on("set-warning", function (event, data) {
        console.log(data)
        that.showWarning = data
    })
  }
}
</script>

<style lang="scss">
#toolbar-container {
    width: 100%; 
    height: 100%; 
    display: flex; 
    justify-content: flex-end; 
    align-items: center; 
    flex-direction: row; 
    flex-wrap: nowrap;
    cursor: pointer;
    background-color: transparent;
    .toolbar-icon {
        height: calc(100%); 
        width: calc(100%);
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        background-color: rgb(67, 67, 67);
        color: rgb(178, 178, 178);
    }
    .transfer-icon {
        position: relative;
        animation: transfering 2s linear infinite;
        color: red;
    }
    .toolbar-counter {
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        top: 0px;
        left: 0px;
        background-color: red;
        padding-top: 2px;
        padding-bottom: 2px;
        padding-left: 5px;
        padding-right: 5px;
        border-radius: 5px;
        color: white;
        font-size: 8px;
    }
    @keyframes transfering {
        from { transform: rotate(0deg); }
        to { transform: rotate(180deg); }
    }

    .blink-icon {
      animation: blink .5s infinite;
      font-size: 25px;
    }

    @keyframes blink {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0;
      }
    }
}
</style>