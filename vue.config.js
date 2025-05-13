const { defineConfig } = require('@vue/cli-service')
const path = require('path');

module.exports = defineConfig({
  transpileDependencies: true,
  
  // 开发模式代理配置
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

  publicPath: process.env.NODE_ENV === 'production'
    ? '/Accounting_tool/'  // Replace with your repository name
    : '/',
  outputDir: 'dist'
});