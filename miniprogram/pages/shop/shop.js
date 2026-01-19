// pages/shop/shop.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    currentCategory: 'resource',
    goodsList: [],
    gold: 0,
    silver: 0,
    allGoods: {
      resource: [
        { id: 'r1', name: '初级粮草×10', description: '训练消耗', icon: '🌾', price: 1000, currency: '银两' },
        { id: 'r2', name: '中级粮草×5', description: '训练消耗', icon: '🌾', price: 3000, currency: '银两' },
        { id: 'r3', name: '精力药水', description: '恢复50精力', icon: '💧', price: 100, currency: '黄金' }
      ],
      equipment: [
        { id: 'e1', name: '铁剑', description: '普通武器', icon: '⚔️', price: 5000, currency: '银两' },
        { id: 'e2', name: '皮甲', description: '普通防具', icon: '🛡️', price: 5000, currency: '银两' }
      ],
      item: [
        { id: 'i1', name: '强化石×5', description: '装备强化材料', icon: '💎', price: 2000, currency: '银两' },
        { id: 'i2', name: '兵符×1', description: '高级招募凭证', icon: '📜', price: 200, currency: '黄金' }
      ]
    }
  },

  onLoad: function() {
    this.loadGoods()
    this.fetchResources()
  },

  fetchResources: function() {
    var that = this
    request({ url: '/resource/summary', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({
          gold: res.data.gold || 0,
          silver: res.data.silver || 0
        })
      }
    }).catch(function(err) {
      console.error('获取资源失败:', err)
    })
  },

  selectCategory: function(e) {
    var cat = e.currentTarget.dataset.cat
    this.setData({ currentCategory: cat })
    this.loadGoods()
  },

  loadGoods: function() {
    var goods = this.data.allGoods[this.data.currentCategory] || []
    this.setData({ goodsList: goods })
  },

  buyGoods: function(e) {
    var that = this
    var id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认购买',
      content: '确定要购买此商品吗？',
      success: function(res) {
        if (res.confirm) {
          request({
            url: '/shop/buy',
            method: 'POST',
            data: { goodsId: id }
          }).then(function(res) {
            if (res.code === 200) {
              wx.showToast({ title: '购买成功', icon: 'success' })
              that.fetchResources()
            } else {
              wx.showToast({ title: res.message || '购买失败', icon: 'none' })
            }
          }).catch(function(err) {
            wx.showToast({ title: '购买失败', icon: 'none' })
          })
        }
      }
    })
  }
})
