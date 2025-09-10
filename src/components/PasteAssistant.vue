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
        
        <div class="cblist-empty-placeholder" v-if="clipboardList.length == 0">
          该剪切板暂无数据
        </div>
        <div v-else style="width: 100%; height: calc(100% - 50px); overflow: auto;">
          <div v-for="item in clipboardList" class="cb-item">
            <div class="cb-item-left">
              <div class="cb-item-icon" style="position: relative;">
                <template v-if="item.type === 'filePaths'">
                  <div class="file-count">
                    {{ item.content.length }}
                  </div>
                  <img src="/img/files.png" style="height: 90%;"></img>
                </template>
                <template v-else-if="item.type === 'text'">
                  <img src="/img/text.png" style="height: 90%;"></img>
                </template>
                <template v-else-if="item.type === 'image'">
                  <img v-if="item.imageShowPath" :src="item.imageShowPath" style="height: 90%; width: 90%; object-fit: contain;"></img>
                  <i class="el-icon-loading" style="font-size: 20px; color: white;" v-else></i>
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
                <span v-else-if="item.type === 'text'">
                  {{ item.content }}
                </span>
                <span v-else-if="item.type === 'image'">
                  图片
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
        <div class="detail_body" v-else-if="detail.fileDetail" style="width: 100%; max-height: 200px; overflow: auto; color: white;">
          <div v-for="file in detail.fileDetail" style="padding-left: 5px; padding-right: 5px;">
            <div style="width: 100%; height: 30px;" class="marquee" @mouseenter="showMarquee($event, $event.currentTarget)" @mouseleave="removeMarquee($event, $event.currentTarget)">
              <span>{{ file.filePath }}</span>
            </div>
          </div>
        </div>
        <div v-else-if="detail.imageDetail" style="width: 100%; max-height: 200px; overflow: auto; color: white; display: flex; justify-content: center; flex-wrap: wrap;">
          <img :src="detail.imageDetail" style="width: 100%; height: 100%; object-fit: contain;"></img>
          <el-button type="text" style="margin-top: 5px;" @click="showFile(detail.imageDetail)">查看大图</el-button>
        </div>
      </el-dialog>
    </div>
</template>

<script>
import { ipcRenderer, clipboard, shell, nativeImage } from 'electron'
import Icon from "./common/Icon.vue"
const fs = require("fs")
const path = require("path")

async function openDialog (title) {
  try {
    let res = await ipcRenderer.invoke("open-dialog", {dialogTitle: title})
    return res;
  } catch (error) {
    return error
  }
}

async function getPublicPath () {
  try {
    let res = await ipcRenderer.invoke("get-public-path")
    return res;
  } catch (error) {
    return error
  }
}

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
      userPublicPath: "",
      expandItems: new Set(),
      activeName: null,
      detailDialogVisible: false,
      detail: {
        textDetail: "",
        fileDetail: null,
      },
      loadingImages: new Set()
    }
  },
  methods: {
    showFile (filePath) {
      console.log(filePath)
      shell.openPath(filePath)
    },
    async downloadRemoteImageToLocal (serverPath, serverId, imagePath, clipboardId) {
      let that = this
      return new Promise(async (resolve, reject) => {
        // 创建根目录
        fs.mkdirSync(this.userPublicPath + "\\.remote_images\\" + serverId, {recursive: true})
        // 创建文件
        let fileName = path.basename(imagePath)
        let destFilePath = this.userPublicPath + "\\.remote_images\\" + serverId + "\\" + fileName
        fs.writeFileSync(destFilePath, "")
        // 将文件下载到该位置
        let response = await fetch(`${serverPath}/copyFile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filePath: imagePath
            })
        })
        if (!response.ok) {
            console.error(response.statusText)
            reject()
        } else {
            const fileStream = fs.createWriteStream(destFilePath);
            const reader = response.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fileStream.write(value);
            }
            fileStream.end();
            console.log("image download complete")
            resolve()
        }
        that.loadingImages.delete(serverId + " " + clipboardId)
        // that.$forceUpdate()    
      })
    },
    getImageShowPath (serverPath, serverId, imagePath, clipboardId) {
      let fileName = path.basename(imagePath)
      let showPath = this.userPublicPath + "\\.remote_images\\" + serverId + "\\" + fileName
      if (!fs.existsSync(showPath)) {
        // 开始下载文件
        if (!this.loadingImages.has(serverId + " " + clipboardId)) {
          this.loadingImages.add(serverId + " " + clipboardId)
          this.downloadRemoteImageToLocal(serverPath, serverId, imagePath, clipboardId)
        }
        return null;
      }
      return showPath;
    },
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
              for (let item of data.data) {
                item.serverId = server.id
                item.serverPath = `http://${ip}:13238`
                if (item.type === "image") {
                  item.imageShowPath = this.getImageShowPath(item.serverPath, item.serverId, item.content, item.id)
                }
              }
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
        this.detail.imageDetail = null
      } else if (item.type == 'filePaths') {
        this.detail.fileDetail = item.content
        this.detail.textDetail = null
        this.detail.imageDetail = null
      } else if (item.type == "image") {
        // 显示图片，并支持外部查看器打开显示
        this.detail.textDetail = null
        this.detail.fileDetail = null
        this.detail.imageDetail = item.imageShowPath
      }
    },
    async transferToLocal (item) {
      console.log(item)
      const result = await openDialog("请选择传输到哪个目录")
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
        id: item.id,
        fileList: item.content,
        toDir: result[0],
        serverPath: `http://${ip}:13238`
      })
      // 提示文件已经开始传输
      this.$message({
        message: "文件开始传输至指定位置，点屏幕右下角悬窗查看传输进度"
      })
    },
    copyToClipboard (item) {
      console.log(item)
      if (item.type === "text") {
        clipboard.writeText(item.content)
        this.$message.success("文本内容已复制到剪切板")
      } else if (item.type === "image") {
        // copy image to clipboard
        let image = nativeImage.createFromPath(item.imageShowPath)
        clipboard.writeImage(image)
        this.$message.success("图片已复制到剪切板")
      }
    }
  },
  async mounted () {
    let that = this;
    this.userPublicPath = await getPublicPath()
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
    ipcRenderer.on("focus", function (event, data) {
      let dom = document.getElementById("paste-assistant")
      dom.focus()
      console.log("dom focused")
    })

  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.el-message {
  width: 80% !important;
  min-width: 0 !important;
}
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
    .cblist-empty-placeholder {
      width: 100%;
      height: calc(100% - 50px);
      display: flex;
      justify-content: center;
      align-items: center;
      color: rgb(207, 207, 207);
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