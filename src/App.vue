<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
// import Home from './components/Home.vue';


export default {
  name: 'App',
  components: {
    // Home
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
}
#app {
  width: 100%;
  height: 100%;
  position: absolute;
}
</style>
