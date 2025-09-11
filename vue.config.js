const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: './',
  transpileDependencies: true,
  lintOnSave: false,
  pluginOptions: {
    electronBuilder: {
      customFileProtocol: "./",
      nodeIntegration:true,
      builderOptions: {
        extraResources: [
          { "from": "./config.json.template", "to": "../" },
          { "from": "./local.db", "to": "../" },
          { "from": "./logo.png", "to": "../" }
        ],
        "appId": "smart_clipboard",
        "copyright": "cgy",
        "productName": "smart_clipboard",
        "compression": "store",
        "nsis": {
          "oneClick": false,
          "language": "2052",
          "perMachine": true,
          "allowToChangeInstallationDirectory": true
        },
        win: {
          "icon": "./public/logo.ico",
          "target": [{
            "target": "nsis",
            "arch": [
              "x64"
            ]
          }],
          // "requestedExecutionLevel": 'requireAdministrator'
        },
        linux: {
          "icon": "./public/icons",
          "executableArgs": ["--no-sandbox"],
          "target": ["rpm"]
        },
        // rpm: {
        //   "fpm": ["--after-install=chmod.sh"]
        // }
      }
    }
  }
})
