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
    
    // 支付方式
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

  // 调用微信支付
  callWechatPay: function(orderId, payParams) {
    var that = this
    
    // 开发测试模式：显示确认框模拟支付
    // 正式环境需要接入真实微信支付
    wx.showModal({
      title: '微信支付',
      content: '支付金额：¥' + (that.data.selectedProduct.price / 100) + '\n（开发模式：点击确定模拟支付成功）',
      confirmText: '确定支付',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          // 模拟支付成功
          that.mockPaySuccess(orderId)
        } else {
          that.setData({ paying: false })
          wx.showToast({ title: '已取消支付', icon: 'none' })
        }
      }
    })
    
    /* 正式环境微信支付代码（需要后端返回真实prepay_id）
    wx.requestPayment({
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.package,
      signType: payParams.signType,
      paySign: payParams.paySign,
      success: function(res) {
        that.onPaySuccess(orderId)
      },
      fail: function(err) {
        that.setData({ paying: false })
        if (err.errMsg.indexOf('cancel') > -1) {
          wx.showToast({ title: '已取消支付', icon: 'none' })
        } else {
          wx.showToast({ title: '支付失败', icon: 'none' })
        }
      }
    })
    */
  },

  // 调用支付宝（小程序环境下需要跳转或使用H5）
  callAlipay: function(orderId, payParams) {
    var that = this
    
    // 小程序中无法直接调用支付宝，通常需要：
    // 1. 跳转到支付宝小程序
    // 2. 使用 web-view 打开支付宝H5页面
    // 这里用模拟支付
    wx.showModal({
      title: '支付宝支付',
      content: '即将跳转支付宝完成支付',
      success: function(res) {
        if (res.confirm) {
          that.mockPaySuccess(orderId)
        } else {
          that.setData({ paying: false })
        }
      }
    })
  },

  // 调用银联支付
  callUnionpay: function(orderId, payParams) {
    var that = this
    
    // 银联支付通常需要跳转APP或使用SDK
    wx.showModal({
      title: '银联支付',
      content: '即将跳转银联完成支付',
      success: function(res) {
        if (res.confirm) {
          that.mockPaySuccess(orderId)
        } else {
          that.setData({ paying: false })
        }
      }
    })
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
