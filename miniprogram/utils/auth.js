// 授权相关工具函数
const request = require('./request.js')

/**
 * 微信登录
 */
const wxLogin = () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code)
        } else {
          reject(new Error('获取code失败'))
        }
      },
      fail: reject
    })
  })
}

/**
 * 获取用户信息（新版本使用getUserProfile）
 */
const getUserProfile = () => {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        resolve(res.userInfo)
      },
      fail: reject
    })
  })
}

/**
 * 完整的登录流程
 * 重要：必须在用户点击事件中直接调用，不能有异步延迟
 * 1. 先调用wx.getUserProfile获取用户信息（必须同步在点击事件中）
 * 2. 调用wx.login获取code
 * 3. 将code和用户信息发送到后端
 */
const login = async () => {
  try {
    // 1. 先获取用户信息（必须在点击事件回调中同步调用）
    console.log('开始获取用户信息...')
    const userInfo = await getUserProfile()
    console.log('用户信息获取成功：', userInfo)
    
    // 2. 获取登录凭证
    console.log('开始获取登录code...')
    const code = await wxLogin()
    console.log('登录code获取成功：', code)
    
    // 3. 发送到后端进行登录
    console.log('开始请求后端登录接口...')
    const loginRes = await request({
      url: '/auth/login',
      method: 'POST',
      data: {
        code: code,
        userInfo: userInfo
      }
    })
    console.log('后端登录响应：', loginRes)
    
    // 检查响应是否成功
    if (loginRes.code !== 200 || !loginRes.data) {
      throw new Error(loginRes.message || '登录失败')
    }
    
    // 从 data 中提取登录信息
    const data = loginRes.data
    console.log('登录数据：', data)
    
    // 4. 保存登录信息
    const app = getApp()
    app.globalData.token = data.token
    app.globalData.userInfo = data.userInfo
    app.globalData.openid = data.userInfo ? data.userInfo.openId : null
    app.globalData.userId = data.userId || (data.userInfo ? data.userInfo.userId : null)
    
    wx.setStorageSync('token', data.token)
    wx.setStorageSync('userInfo', data.userInfo)
    wx.setStorageSync('openid', data.userInfo ? data.userInfo.openId : null)
    wx.setStorageSync('userId', data.userId || (data.userInfo ? data.userInfo.userId : null))
    
    // 返回成功标志
    return { success: true, data: data }
  } catch (error) {
    console.error('登录失败：', error)
    throw error
  }
}

module.exports = {
  wxLogin,
  getUserProfile,
  login
}
