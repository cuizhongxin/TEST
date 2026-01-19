// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    openid: null,
    userId: null,
    isLoggedIn: false,
    chatMessages: []
  },

  onLaunch: function() {
    console.log('小程序启动')
    // 检查登录状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus: function() {
    var token = wx.getStorageSync('token')
    var userInfo = wx.getStorageSync('userInfo')
    var userId = wx.getStorageSync('userId')
    
    if (token) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.userId = userId
      this.globalData.openid = wx.getStorageSync('openid')
      this.globalData.isLoggedIn = true
      return true
    }
    return false
  },

  // 清除登录信息
  clearLoginInfo: function() {
    this.globalData.token = null
    this.globalData.userInfo = null
    this.globalData.openid = null
    this.globalData.userId = null
    this.globalData.isLoggedIn = false
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('openid')
    wx.removeStorageSync('userId')
  }
})
