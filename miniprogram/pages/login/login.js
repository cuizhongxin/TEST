// pages/login/login.js
const app = getApp()
const { login } = require('../../utils/auth.js')

Page({
  data: {
    isLoading: false
  },

  onLoad() {
    // 检查是否已登录
    if (app.checkLoginStatus()) {
      wx.redirectTo({
        url: '/pages/index/index'
      })
    }
  },

  async handleLogin() {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })

    try {
      const result = await login()
      
      if (result.success) {
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        })

        setTimeout(() => {
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
    } catch (error) {
      console.error('登录失败:', error)
      wx.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setData({ isLoading: false })
    }
  }
})


