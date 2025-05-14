const path = require('path');

module.exports = {
  publicPath: './',
  outputDir: 'dist',
  lintOnSave: false,

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
  }
};