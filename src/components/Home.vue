<template>
    <div id="home">
        <div class="title">
            <div style="width: calc(100% - 150px); -webkit-app-region: drag; height: 100%; display: flex; justify-content: flex-start; align-items: center; flex-wrap: nowrap;">
            </div>
        </div>
        <div style="width: 150px; height: 50px; display: flex; justify-content: flex-end; align-items: center; color: white; font-family: '黑体'; position: absolute; right: 0; top: 0; z-index: 10">
            <div><i class="el-icon-minus" style="margin-right: 15px; cursor: pointer;" @click="minimize()"></i></div>
            <div><i class="el-icon-full-screen" style="margin-right: 15px; cursor: pointer;" @click="maxsize()"></i></div>
            <div><i class="el-icon-close" style="margin-right: 15px; cursor: pointer;" @click="close()"></i></div>
        </div>
        <div class="content"></div>
    </div>
</template>

<script>
export default {
  name: 'Home',
  props: {
  },
  methods: {

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
    .title {
        width: 100%;
        height: 50px;
        display: flex;
        background: linear-gradient(90deg, #294d92, #151d3a 70%);
        justify-content: flex-start;
        align-items: center;
        flex-wrap: nowrap;
        z-index: 6;
    }
    .content {
        width: 100%;
        height: calc(100% - 50px);
    }
}

</style>