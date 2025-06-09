const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  pluginOptions: {
    electronBuilder: {
      nodeModulesPath: ['./node_modules'],
      externals: ['iohook']
    }
  }
})
