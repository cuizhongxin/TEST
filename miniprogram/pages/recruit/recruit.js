// pages/recruit/recruit.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    generals: [],
    silver: 0,
    generalOrder: 0,
    showResult: false,
    recruitResult: []
  },

  onLoad: function() {
    this.fetchGenerals()
    this.fetchResources()
  },

  onShow: function() {
    this.fetchGenerals()
    this.fetchResources()
  },

  fetchGenerals: function() {
    var that = this
    request({ url: '/general/list', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({ generals: res.data })
      }
    }).catch(function(err) {
      console.error('获取武将列表失败:', err)
    })
  },

  fetchResources: function() {
    var that = this
    request({ url: '/resource/summary', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({
          silver: res.data.silver || 0,
          generalOrder: res.data.generalOrder || 0
        })
      }
    }).catch(function(err) {
      console.error('获取资源失败:', err)
    })
  },

  doRecruit: function(e) {
    var that = this
    var type = e.currentTarget.dataset.type
    
    request({
      url: '/recruit/' + type,
      method: 'POST'
    }).then(function(res) {
      if (res.code === 200 && res.data) {
        var result = Array.isArray(res.data) ? res.data : [res.data]
        that.setData({
          showResult: true,
          recruitResult: result
        })
        that.fetchGenerals()
        that.fetchResources()
      } else {
        wx.showToast({ title: res.message || '招募失败', icon: 'none' })
      }
    }).catch(function(err) {
      wx.showToast({ title: '招募失败', icon: 'none' })
    })
  },

  viewGeneral: function(e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/character/character?id=' + id })
  },

  hideResult: function() {
    this.setData({ showResult: false, recruitResult: [] })
  }
})
