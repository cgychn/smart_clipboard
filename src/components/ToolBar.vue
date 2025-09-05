<template>
    <div id="toolbar-container" style="-webkit-app-region: drag;" @click="showDownloadList">
        <div class="toolbar-icon">
            <img v-show="transferingCount <= 0" src="/img/logo.png" style="width: 20px; -webkit-app-region: no-drag;" />
            <i class="el-icon-refresh transfer-icon" style="font-weight: bolder; font-size: 20px; -webkit-app-region: no-drag;" v-show="transferingCount > 0"></i>
            <div class="toolbar-counter" v-show="transferingCount > 0">
                {{ countToShow }}
            </div>
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
      countToShow: "0"
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
    }
  },
  mounted () {
    let that = this
    ipcRenderer.on("op-transfering-count", function (event, {delt}) {
        console.log(delt)
        that.opTransferingCount(delt)
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
        border-radius: 3px;
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
}
</style>