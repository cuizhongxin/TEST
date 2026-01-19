// pages/character/character.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    generalId: null,
    general: null,
    equipmentSlots: [
      { type: 'weapon', label: '武器' },
      { type: 'armor', label: '防具' },
      { type: 'accessory', label: '饰品' },
      { type: 'mount', label: '坐骑' }
    ]
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({ generalId: options.id })
      this.fetchGeneralDetail(options.id)
    } else {
      this.fetchFirstGeneral()
    }
  },

  fetchFirstGeneral: function() {
    var that = this
    request({ url: '/general/list', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data && res.data.length > 0) {
        that.setData({ generalId: res.data[0].id })
        that.fetchGeneralDetail(res.data[0].id)
      }
    }).catch(function(err) {
      console.error('获取武将列表失败:', err)
    })
  },

  fetchGeneralDetail: function(id) {
    var that = this
    request({ url: '/general/detail?id=' + id, method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        var general = res.data
        if (!general.equipment) {
          general.equipment = {}
        }
        general.expPercent = general.maxExp > 0 ? Math.floor((general.exp || 0) / general.maxExp * 100) : 0
        that.setData({ general: general })
      }
    }).catch(function(err) {
      console.error('获取武将详情失败:', err)
    })
  }
})
