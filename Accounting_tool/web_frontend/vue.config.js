const { defineConfig } = require('@vue/cli-service')
const path = require('path');

module.exports = defineConfig({
  transpileDependencies: true,

  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        logLevel: 'debug'
      }
    }
  },

  configureWebpack: {
    resolve: {
      alias: {
        '@tauri-apps/api/dialog': path.resolve(__dirname, 'src/tauri-dialog-shim.js')
      }
    }
  },

  publicPath: './', // ✅ 最关键的修复点
  outputDir: 'dist',
  lintOnSave: false
});