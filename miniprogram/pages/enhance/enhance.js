// pages/enhance/enhance.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    generals: [],
    currentGeneralId: null,
    currentGeneral: null,
    equipments: [],
    selectedEquipId: null,
    selectedEquip: null,
    enhanceStone: 0,
    silver: 0
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
          that.selectGeneral({ currentTarget: { dataset: { id: res.data[0].id } } })
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
          enhanceStone: res.data.enhanceStone || 0,
          silver: res.data.silver || 0
        })
      }
    }).catch(function(err) {
      console.error('获取资源失败:', err)
    })
  },

  selectGeneral: function(e) {
    var that = this
    var id = e.currentTarget.dataset.id
    that.setData({ currentGeneralId: id, selectedEquipId: null, selectedEquip: null })
    
    request({ url: '/general/detail?id=' + id, method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        var general = res.data
        var equipments = []
        if (general.equipment) {
          var slots = ['weapon', 'armor', 'accessory', 'mount']
          slots.forEach(function(slot) {
            if (general.equipment[slot]) {
              equipments.push(general.equipment[slot])
            }
          })
        }
        that.setData({ currentGeneral: general, equipments: equipments })
      }
    }).catch(function(err) {
      console.error('获取武将详情失败:', err)
    })
  },

  selectEquip: function(e) {
    var id = e.currentTarget.dataset.id
    var equip = this.data.equipments.find(function(e) { return e.id === id })
    this.setData({ selectedEquipId: id, selectedEquip: equip })
  },

  getNextMobility: function(equip) {
    if (!equip) return 0
    var level = (equip.enhanceLevel || 0) + 1
    var bonus = 0
    if (level >= 4) bonus += 1
    if (level >= 6) bonus += 1
    if (level >= 8) bonus += 2
    if (level >= 10) bonus += 4
    return (equip.mobility || 0) + bonus
  },

  getEnhanceCost: function(equip) {
    if (!equip) return 0
    var level = equip.enhanceLevel || 0
    return (level + 1) * 1000
  },

  doEnhance: function() {
    var that = this
    if (!that.data.selectedEquipId) {
      wx.showToast({ title: '请先选择装备', icon: 'none' })
      return
    }
    
    request({
      url: '/enhance/do',
      method: 'POST',
      data: { equipmentId: that.data.selectedEquipId }
    }).then(function(res) {
      if (res.code === 200) {
        wx.showToast({ title: '强化成功', icon: 'success' })
        that.selectGeneral({ currentTarget: { dataset: { id: that.data.currentGeneralId } } })
        that.fetchResources()
      } else {
        wx.showToast({ title: res.message || '强化失败', icon: 'none' })
      }
    }).catch(function(err) {
      wx.showToast({ title: '强化失败', icon: 'none' })
    })
  }
})
