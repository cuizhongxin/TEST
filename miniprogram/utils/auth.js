// utils/auth.js
var request = require('./request.js')

/**
 * 登录函数
 */
function login() {
  return new Promise(function(resolve, reject) {
    wx.login({
      success: function(loginRes) {
        if (loginRes.code) {
          // 发送 code 到后端换取 token
          request({
            url: '/auth/login',
            method: 'POST',
            data: {
              code: loginRes.code
            }
          }).then(function(res) {
            if (res.code === 200 && res.data) {
              // 保存登录信息
              var token = res.data.token
              var userId = res.data.userId
              
              wx.setStorageSync('token', token)
              wx.setStorageSync('userId', userId)
              
              // 更新全局数据
              var app = getApp()
              if (app && app.globalData) {
                app.globalData.token = token
                app.globalData.userId = userId
                app.globalData.isLoggedIn = true
              }
              
              resolve({
                success: true,
                token: token,
                userId: userId
              })
            } else {
              resolve({
                success: false,
                message: res.message || '登录失败'
              })
            }
          }).catch(function(err) {
            console.error('登录请求失败:', err)
            reject(err)
          })
        } else {
          reject(new Error('获取登录code失败'))
        }
      },
      fail: function(err) {
        reject(err)
      }
    })
  })
}

/**
 * 检查登录状态
 */
function checkLoginStatus() {
  var token = wx.getStorageSync('token')
  var userId = wx.getStorageSync('userId')
  return !!(token && userId)
}

/**
 * 获取token
 */
function getToken() {
  return wx.getStorageSync('token') || ''
}

/**
 * 获取userId
 */
function getUserId() {
  return wx.getStorageSync('userId') || ''
}

/**
 * 退出登录
 */
function logout() {
  wx.removeStorageSync('token')
  wx.removeStorageSync('userId')
  
  var app = getApp()
  if (app && app.globalData) {
    app.globalData.token = null
    app.globalData.userId = null
    app.globalData.isLoggedIn = false
  }
}

module.exports = {
  login: login,
  checkLoginStatus: checkLoginStatus,
  getToken: getToken,
  getUserId: getUserId,
  logout: logout
}
