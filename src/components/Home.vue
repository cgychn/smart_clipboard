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
                <span style="margin-top: 5px; color: rgb(205, 205, 205);">本机名称（请确保局域网内唯一性）</span>
                <div style="width: 100%; display: flex; justify-content: center; align-items: center; flex-wrap: nowrap; margin-top: 20px;">
                    <el-input size="small" style="width: calc(100% - 70px); margin-right: 10px;">
                    </el-input>
                    <el-button icon="el-icon-circle-check" type="primary" size="small" style="width: 60px;"></el-button>
                </div>
                
            </div>
            <div class="service-list"></div>
        </div>
    </div>
</template>

<script>
export default {
  name: 'Home',
  props: {
  },
  methods: {
    close () {

    }
  },
  mounted () {
    
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
    .title {
        width: 100%;
        height: 50px;
        display: flex;
        background: rgb(26, 26, 26);
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
            border: 1px grey solid;
        }
        .service-list {
            margin-top: 20px;
            width: 80%;
            height: 200px;
            padding: 10px;
        }
    }
}

</style>