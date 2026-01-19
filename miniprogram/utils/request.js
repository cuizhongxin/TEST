// 网络请求封装
var config = require('./config.js')

// 请求拦截器
function request(options) {
  return new Promise(function(resolve, reject) {
    var app = getApp()
    
    // 获取userId，优先从globalData获取，否则从storage获取
    var userId = app.globalData.userId
    if (!userId) {
      userId = wx.getStorageSync('userId')
      if (userId) {
        app.globalData.userId = userId
      }
    }
    
    // 获取token
    var token = app.globalData.token
    if (!token) {
      token = wx.getStorageSync('token')
    }
    
    wx.request({
      url: config.API_BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        'Authorization': token ? ('Bearer ' + token) : '',
        'X-User-Id': userId ? String(userId) : ''
      },
      success: function(res) {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // token过期，跳转到登录页
          app.clearLoginInfo()
          wx.redirectTo({
            url: '/pages/login/login'
          })
          reject(new Error('登录已过期'))
        } else {
          reject(res)
        }
      },
      fail: function(err) {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

module.exports = request
