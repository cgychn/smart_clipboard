<template>
    <div id="paste-assistant">
      <div class="container">
        <div style="height: 50px;">
          <el-tabs v-model="activeName" @tab-click="changeCB">
            <el-tab-pane v-for="item in serverList" :key="item.id" :name="item.id">
              <span slot="label">
                {{ item.name }}
                <el-tag type="success" size="mini" v-if="item.default" style="margin-left: 5px;" effect="dark">
                  默认
                </el-tag>
              </span>
            </el-tab-pane>
          </el-tabs>
        </div>
        
        <div style="width: 100%; height: calc(100% - 50px); overflow: auto;">
          <div v-for="item in clipboardList" class="cb-item">
            <div class="cb-item-left">
              <div class="cb-item-icon" style="position: relative;">
                <template v-if="item.type === 'filePaths'">
                  <div class="file-count">
                    {{ item.content.length }}
                  </div>
                  <img src="/img/files.png" style="height: 90%;"></img>
                </template>
                <template v-else>
                  <img src="/img/text.png" style="height: 90%;"></img>
                </template>
              </div>
            </div>
            <div class="cb-item-right">
              <div class="cb-item-content" :style="checkExpand(item) ? 'width: 0px;' : ''">
                <span v-if="item.type === 'filePaths'">
                  <template v-if="item.content.length > 0">
                    {{ item.content[0].filePath }}
                  </template>
                </span>
                <span v-else>
                  {{ item.content }}
                </span>
              </div>
              <div class="cb-item-content-op" :style="checkExpand(item) ? 'width: 100%;' : ''">
                <el-button size="mini" type="text" @click="showDetail(item)">查看详情</el-button>
                <el-button v-if="item.type === 'filePaths'" size="mini" type="text" @click="transferToLocal(item)">拷至本机</el-button>
                <el-button v-else size="mini" type="text" @click="copyToClipboard(item)">复制到剪贴板</el-button>
              </div>
            </div>
            <div class="cb-item-operation" @click="expandOp(item)">
              <i :class="checkExpand(item) ? 'el-icon-caret-right' : 'el-icon-caret-left'"></i>
            </div>
          </div>
        </div>
      </div>
      <el-dialog :visible.sync="detailDialogVisible" width="90%">
        <div slot="title">
          <span style="color: white;">详情</span>
        </div>
        <div class="detail_body" v-if="detail.textDetail" style="width: 100%; max-height: 200px; overflow: auto; color: white;">
          {{ detail.textDetail }}
        </div>
        <div class="detail_body" v-else style="width: 100%; max-height: 200px; overflow: auto; color: white;">
          <div v-for="file in detail.fileDetail" style="padding-left: 5px; padding-right: 5px;">
            <div style="width: 100%; height: 30px;" class="marquee" @mouseenter="showMarquee($event, $event.currentTarget)" @mouseleave="removeMarquee($event, $event.currentTarget)">
              <span>{{ file.filePath }}</span>
            </div>
          </div>
        </div>
      </el-dialog>
    </div>
</template>

<script>
import { remote, ipcRenderer, clipboard } from 'electron'
import Icon from "./common/Icon.vue"
const config = remote.getGlobal('sharedObject').config
const deviceId = remote.getGlobal('sharedObject').deviceId
console.log(deviceId)
export default {
  name: 'PasteAssistant',
  components: {
    Icon
  },
  props: {
  },
  data () {
    return {
      serverList: [
        // {name : "123321123", id: "2345678", default: false, online: false},
        // {name : "223321123", id: "3345678", default: false, online: true},
        // {name : "323321123", id: "4345678", default: true, online: true},
        // {name : "423321123", id: "5345678", default: false, online: true},
      ],
      clipboardList: [
        // {
        //   type: "filePaths", // file / text,
        //   content: [
        //     {filePath: "D:\\bb", isFile: false, fileSize: 0},
        //     {filePath: "D:\\aa.txt", isFile: true, fileSize: 1024}
        //   ] // the content of clipboard
        // },
        // {
        //   type: "text", // file / text,
        //   content: "这是一段文字" // the content of clipboard
        // }
      ],
      expandItems: new Set(),
      activeName: null,
      detailDialogVisible: false,
      detail: {
        textDetail: "",
        fileDetail: null,
      }
    }
  },
  methods: {
    showMarquee (event, el) {
      console.log(el)
      let span = el.querySelector("span");
      console.log(span)
      const containerWidth = el.offsetWidth;
      const textWidth = span.scrollWidth;
      console.log(containerWidth, textWidth)
      if (textWidth > containerWidth) {
        // 计算需要移动的距离：容器宽度 - 文本宽度
        const move = containerWidth - textWidth;
        span.style.setProperty("--move", move + "px");
        // span.style.setProperty("--color", "red");
        span.style.animation = 'none';
        span.offsetHeight; // 强制重绘
        span.style.animation = '';
      }
    },
    removeMarquee (event, el) {
      console.log(el)
      let span = el.querySelector("span");
      console.log(span)
      span.style.removeProperty("--move");
      span.style.setProperty("--color", "white");
      span.style.animation = 'none';
      span.offsetHeight; // 强制重绘
      span.style.animation = '';
    },
    checkExpand (item) {
      // console.log(item, this.expandItems)
      return this.expandItems.has(item.id)
    },
    async changeCB () {
      console.log(this.activeName)
      this.expandItems = new Set()
      this.fetchCurrentActivateCbList()
    },
    async fetchCurrentActivateCbList () {
      for (let server of this.serverList) {
        if (server.id === this.activeName) {
          let ip = server.ipAddress;
          // console.log(ip)
          if (ip) {
            try {
              let { data } = await this.ajax.post('http://' + ip + ":13238/cbList")
              // console.log(data)
              this.clipboardList = data.data
            } catch (e) {
              console.error(e)
            }
          }
          break;
        }
      }
    },
    expandOp (item) {
      // console.log(item)
      if (this.expandItems.has(item.id)) {
        this.expandItems.delete(item.id)
      } else {
        this.expandItems.add(item.id)
      }
      this.$forceUpdate()
    },
    showDetail (item) {
      console.log(item)
      this.detailDialogVisible = true
      if (item.type == "text") {
        this.detail.fileDetail = null
        this.detail.textDetail = item.content
      } else {
        this.detail.fileDetail = item.content
        this.detail.textDetail = null
      }
    },
    transferToLocal (item) {
      console.log(item)
      const result = remote.dialog.showOpenDialogSync({
        title: "请选择传输至哪个目录",
        properties: ['openDirectory', "promptToCreate"],
      });
      console.log(result)
      if (!result) {
        return
      }
      let ip;
      for (let server of this.serverList) {
        if (server.id === this.activeName) {
          ip = server.ipAddress;
          break;
        }
      }
      ipcRenderer.send("start-download", {
        fileList: item.content,
        toDir: result[0],
        serverPath: `http://${ip}:13238`
      })
    },
    copyToClipboard (item) {
      console.log(item)
      clipboard.writeText(item.content)
    }
  },
  mounted () {
    let that = this;
    ipcRenderer.on("set-cblist", function (event, data) {
      // console.log(data)
      that.serverList = data
      // console.log(that.serverList, that.activeName)
      for (let cb of that.serverList) {
        if (cb.default && (!that.activeName || that.activeName == "0")) {
          that.activeName = cb.id
          break;
        }
        that.fetchCurrentActivateCbList()
      }
      that.$forceUpdate()
    })

  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
#paste-assistant {
    width: 100%;
    height: 100%;
    transition: .5s ease all;
    background-color: rgb(47, 47, 47);
    display: flex;
    justify-content: center;
    align-items: center;
    .el-dialog {
      display: flex;
      flex-direction: column;
      margin: 0 !important;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgb(117, 117, 117);
      max-height: 80%;
      overflow: auto;
    }
    .el-dialog .el-dialog__body {
      flex: 1;
      overflow: auto;
      padding-top: 10px;
      .detail_body {
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
      
    }
    .el-dialog__close {
      color: white;
    }
    .el-tabs__item {
      color: rgb(152, 152, 152);
    }
    .el-tabs__item.is-active {
      color: white;
    }
    .el-tabs__nav-wrap::after {
      background-color: transparent;
    }
    .el-tabs__active-bar {
      background-color: rgb(155, 112, 112);
    }
    .container {
      width: calc(100% - 20px);
      height: calc(100% - 20px);
      padding: 10px;
      .cb-item {
        height: 60px;
        width: 100%;
        background-color: rgb(87, 87, 86);
        border-radius: 5px;
        margin-bottom: 5px;
        display: flex;
        flex-direction: row;
        .cb-item-left {
          width: 60px;
          height: 60px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .cb-item-right {
          height: 100%;
          width: calc(100% - 60px - 40px);
          justify-content: flex-start;
          align-items: center;
          display: flex;
        }
        .cb-item-icon {
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          .file-count {
            position: absolute; 
            color: white; top: -1px; 
            right: -5px;
            font-size: 10px; background-color: red; 
            padding-left: 3px; padding-right: 3px; 
            border-radius: 40%; display: flex; 
            align-items: center;
          }
        }
        .cb-item-content {
          color: white;
          font-size: 15px;
          width: 90%;
          overflow: hidden; 
          text-overflow: ellipsis; 
          white-space: nowrap;
          transition: .5s ease all;
        }
        .cb-item-content-op {
          color: white;
          font-size: 15px;
          width: 0px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          flex-wrap: nowrap;
          flex-direction: row;
          overflow: hidden;
          height: 80%;
          border-radius: 5px 0 0 5px;
          transition: .5s ease all;
          background: linear-gradient(to right, rgb(67, 67, 67), transparent);
        }
        .cb-item-operation {
          width: 40px;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          cursor: pointer;
        }
      }
    }


    .marquee {
      animation-duration: 3s;
      overflow: hidden;
      white-space: nowrap;
      position: relative;
    }

    .marquee > span {
      display: inline-block;
      animation: marquee 3s linear infinite alternate;
      --move: 0px;
      color: var(--color, "white");
    }

    @keyframes marquee {
      from { transform: translateX(0); }
      to   { transform: translateX(var(--move, 0px)); } /* 移动一个自身宽度 */
    }


}

</style>