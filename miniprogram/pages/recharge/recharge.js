// pages/recharge/recharge.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    userInfo: null,
    gold: 0,
    diamond: 0,
    vipLevel: 0,
    hasRecharged: false,
    
    // 商品列表
    products: [],
    selectedProduct: null,
    
    // 支付方式（微信小程序中只能用微信支付）
    paymentMethod: 'WECHAT',
    
    // 支付状态
    paying: false
  },

  onLoad: function() {
    if (app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo })
    }
    this.loadProducts()
    this.loadUserResource()
  },

  onShow: function() {
    this.loadUserResource()
  },

  // 加载商品列表
  loadProducts: function() {
    var that = this
    request({ url: '/recharge/products', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({ products: res.data })
      }
    }).catch(function(err) {
      console.error('加载商品失败:', err)
    })
  },

  // 加载用户资源
  loadUserResource: function() {
    var that = this
    request({ url: '/resource', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({
          gold: res.data.gold || 0,
          diamond: res.data.diamond || 0,
          vipLevel: res.data.vipLevel || 0,
          hasRecharged: (res.data.totalRecharge || 0) > 0
        })
      }
    }).catch(function(err) {
      console.error('加载资源失败:', err)
    })
  },

  // 选择商品
  selectProduct: function(e) {
    var product = e.currentTarget.dataset.product
    this.setData({ selectedProduct: product })
  },

  // 选择支付方式
  selectPayment: function(e) {
    var method = e.currentTarget.dataset.method
    
    // 微信小程序中，支付宝和银联需要跳转
    if (method === 'ALIPAY') {
      wx.showModal({
        title: '提示',
        content: '支付宝支付需要跳转到支付宝小程序完成，是否继续？',
        confirmText: '跳转支付',
        success: (res) => {
          if (res.confirm) {
            this.setData({ paymentMethod: method })
          }
        }
      })
      return
    }
    
    if (method === 'UNIONPAY') {
      wx.showModal({
        title: '提示',
        content: '银联支付需要跳转到云闪付小程序完成，是否继续？',
        confirmText: '跳转支付',
        success: (res) => {
          if (res.confirm) {
            this.setData({ paymentMethod: method })
          }
        }
      })
      return
    }
    
    this.setData({ paymentMethod: method })
  },

  // 处理支付
  handlePay: function() {
    var that = this
    var selectedProduct = this.data.selectedProduct
    var paymentMethod = this.data.paymentMethod
    
    if (!selectedProduct) {
      wx.showToast({ title: '请选择充值套餐', icon: 'none' })
      return
    }
    
    if (!paymentMethod) {
      wx.showToast({ title: '请选择支付方式', icon: 'none' })
      return
    }
    
    this.setData({ paying: true })
    
    // 创建订单
    request({
      url: '/recharge/create',
      method: 'POST',
      data: {
        productId: selectedProduct.id,
        paymentMethod: paymentMethod
      }
    }).then(function(res) {
      if (res.code === 200 && res.data) {
        var orderId = res.data.orderId
        var payParams = res.data.payParams
        
        // 根据支付方式调用不同的支付
        if (paymentMethod === 'WECHAT') {
          that.callWechatPay(orderId, payParams)
        } else if (paymentMethod === 'ALIPAY') {
          that.callAlipay(orderId, payParams)
        } else if (paymentMethod === 'UNIONPAY') {
          that.callUnionpay(orderId, payParams)
        }
      } else {
        that.setData({ paying: false })
        wx.showToast({ title: res.message || '创建订单失败', icon: 'none' })
      }
    }).catch(function(err) {
      that.setData({ paying: false })
      wx.showToast({ title: '创建订单失败', icon: 'none' })
    })
  },

  // 调用微信支付（测试模式：直接成功）
  callWechatPay: function(orderId, payParams) {
    var that = this
    
    // ========== 测试模式：直接模拟支付成功 ==========
    console.log('测试模式：直接模拟支付成功，订单ID:', orderId)
    that.mockPaySuccess(orderId)
    return
    
    // ========== 以下是真实支付代码（暂时注释） ==========
    /*
    var selectedProduct = this.data.selectedProduct
    
    // 检查是否有真实支付参数（兼容不同字段名）
    var timeStamp = payParams.timeStamp || payParams.timestamp || payParams.time_stamp
    var nonceStr = payParams.nonceStr || payParams.nonce_str || payParams.noncestr
    var packageVal = payParams.package || payParams.prepay_id
    var signType = payParams.signType || payParams.sign_type || 'RSA'
    var paySign = payParams.paySign || payParams.pay_sign || payParams.sign
    
    // 如果 package 是纯 prepay_id，需要加前缀
    if (packageVal && !packageVal.startsWith('prepay_id=')) {
      packageVal = 'prepay_id=' + packageVal
    }
    
    console.log('微信支付参数:', {
      timeStamp: timeStamp,
      nonceStr: nonceStr,
      package: packageVal,
      signType: signType,
      paySign: paySign
    })
    
    if (timeStamp && nonceStr && packageVal && paySign) {
      // 构建支付参数对象
      var paymentParams = {
        timeStamp: String(timeStamp),  // 必须是字符串
        nonceStr: String(nonceStr),
        package: String(packageVal),
        signType: signType,
        paySign: String(paySign),
        success: function(res) {
          console.log('微信支付成功', res)
          that.onPaySuccess(orderId)
        },
        fail: function(err) {
          console.error('微信支付失败', err)
          that.setData({ paying: false })
          if (err.errMsg && err.errMsg.indexOf('cancel') > -1) {
            wx.showToast({ title: '已取消支付', icon: 'none' })
          } else {
            wx.showToast({ title: '支付失败: ' + (err.errMsg || '未知错误'), icon: 'none' })
          }
        }
      }
      
      // 真实微信支付
      wx.requestPayment(paymentParams)
    } else {
      // 后端未返回完整支付参数，显示缺少的参数
      var missing = []
      if (!timeStamp) missing.push('timeStamp')
      if (!nonceStr) missing.push('nonceStr')
      if (!packageVal) missing.push('package')
      if (!paySign) missing.push('paySign')
      
      console.error('支付参数不完整，缺少:', missing, '收到的参数:', payParams)
      
      wx.showModal({
        title: '支付参数不完整',
        content: '缺少参数: ' + missing.join(', ') + '\n\n当前为测试模式，点击确定模拟支付成功。',
        confirmText: '模拟支付',
        cancelText: '取消',
        success: function(res) {
          if (res.confirm) {
            that.mockPaySuccess(orderId)
          } else {
            that.setData({ paying: false })
          }
        }
      })
    }
    */
  },

  // 支付宝支付（测试模式：直接成功）
  callAlipay: function(orderId, payParams) {
    var that = this
    
    // ========== 测试模式：直接模拟支付成功 ==========
    console.log('测试模式：支付宝直接模拟支付成功，订单ID:', orderId)
    that.mockPaySuccess(orderId)
  },

  // 银联支付（测试模式：直接成功）
  callUnionpay: function(orderId, payParams) {
    var that = this
    
    // ========== 测试模式：直接模拟支付成功 ==========
    console.log('测试模式：银联直接模拟支付成功，订单ID:', orderId)
    that.mockPaySuccess(orderId)
  },

  // 模拟支付成功（测试用）
  mockPaySuccess: function(orderId) {
    var that = this
    
    request({
      url: '/recharge/mock/pay',
      method: 'POST',
      data: { orderId: orderId }
    }).then(function(res) {
      if (res.code === 200 && res.data && res.data.success) {
        that.onPaySuccess(orderId)
      } else {
        that.setData({ paying: false })
        wx.showToast({ title: '支付失败', icon: 'none' })
      }
    }).catch(function(err) {
      that.setData({ paying: false })
      wx.showToast({ title: '支付失败', icon: 'none' })
    })
  },

  // 支付成功处理
  onPaySuccess: function(orderId) {
    var that = this
    this.setData({ paying: false, selectedProduct: null })
    
    wx.showToast({
      title: '充值成功！',
      icon: 'success',
      duration: 2000
    })
    
    // 刷新资源
    setTimeout(function() {
      that.loadUserResource()
    }, 500)
  },

  // 查看充值记录
  viewHistory: function() {
    wx.showToast({ title: '充值记录功能开发中', icon: 'none' })
  }
})
