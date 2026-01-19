// pages/training/training.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    generals: [],
    currentGeneralId: null,
    currentMode: 'lord',
    currentFood: 'basic',
    basicFood: 0,
    advancedFood: 0,
    premiumFood: 0
  },

  onLoad: function() {
    this.fetchGenerals()
    this.fetchResources()
  },

  fetchGenerals: function() {
    var that = this
    request({ url: '/general/list', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({ generals: res.data })
        if (res.data.length > 0) {
          that.setData({ currentGeneralId: res.data[0].id })
        }
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
          basicFood: res.data.basicFood || 0,
          advancedFood: res.data.advancedFood || 0,
          premiumFood: res.data.premiumFood || 0
        })
      }
    }).catch(function(err) {
      console.error('获取资源失败:', err)
    })
  },

  selectGeneral: function(e) {
    var id = e.currentTarget.dataset.id
    this.setData({ currentGeneralId: id })
  },

  selectMode: function(e) {
    var mode = e.currentTarget.dataset.mode
    this.setData({ currentMode: mode })
  },

  selectFood: function(e) {
    var food = e.currentTarget.dataset.food
    this.setData({ currentFood: food })
  },

  startTraining: function() {
    var that = this
    
    if (!that.data.currentGeneralId) {
      wx.showToast({ title: '请先选择武将', icon: 'none' })
      return
    }
    
    request({
      url: '/training/train',
      method: 'POST',
      data: {
        generalId: that.data.currentGeneralId,
        mode: that.data.currentMode,
        foodGrade: that.data.currentFood
      }
    }).then(function(res) {
      if (res.code === 200) {
        var data = res.data || {}
        wx.showToast({ 
          title: '主公+' + (data.lordExp || 0) + ' 武将+' + (data.generalExp || 0), 
          icon: 'none',
          duration: 2000
        })
        that.fetchResources()
        that.fetchGenerals()
      } else {
        wx.showToast({ title: res.message || '训练失败', icon: 'none' })
      }
    }).catch(function(err) {
      wx.showToast({ title: '训练失败', icon: 'none' })
    })
  }
})
