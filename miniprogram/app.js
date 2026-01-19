// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    openid: null,
    userId: null,
    chatMessages: []
  },

  onLaunch() {
    console.log('小程序启动')
    // 检查登录状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    const userId = wx.getStorageSync('userId')
    
    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.userId = userId
      this.globalData.openid = wx.getStorageSync('openid')
      return true
    }
    return false
  },

  // 清除登录信息
  clearLoginInfo() {
    this.globalData.token = null
    this.globalData.userInfo = null
    this.globalData.openid = null
    this.globalData.userId = null
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('openid')
    wx.removeStorageSync('userId')
  }
})
