// pages/login/login.js
var app = getApp()
var auth = require('../../utils/auth.js')

Page({
  data: {
    isLoading: false
  },

  onLoad: function() {
    // 检查是否已登录
    if (auth.checkLoginStatus()) {
      wx.redirectTo({
        url: '/pages/index/index'
      })
    }
  },

  handleLogin: function() {
    var that = this
    
    if (this.data.isLoading) return

    this.setData({ isLoading: true })

    auth.login().then(function(result) {
      that.setData({ isLoading: false })
      
      if (result.success) {
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        })

        setTimeout(function() {
          wx.redirectTo({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        wx.showToast({
          title: result.message || '登录失败',
          icon: 'none',
          duration: 2000
        })
      }
    }).catch(function(error) {
      that.setData({ isLoading: false })
      console.error('登录失败:', error)
      wx.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none',
        duration: 2000
      })
    })
  }
})
