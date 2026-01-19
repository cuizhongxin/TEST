// pages/formation/formation.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    formations: [
      { id: 'yizi', name: '一字长蛇阵', description: '攻击+10%' },
      { id: 'fangyu', name: '方圆阵', description: '防御+10%' },
      { id: 'queyue', name: '却月阵', description: '对弓兵反伤30%' },
      { id: 'yanxing', name: '雁行阵', description: '速度+15%' },
      { id: 'yulin', name: '鱼鳞阵', description: '暴击+10%' }
    ],
    currentFormation: 'yizi',
    battleGenerals: [],
    allGenerals: [],
    availableGenerals: [],
    showModal: false,
    currentSlotIndex: -1
  },

  onLoad: function() {
    this.fetchGenerals()
    this.fetchBattleOrder()
  },

  fetchGenerals: function() {
    var that = this
    request({ url: '/general/list', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({ allGenerals: res.data })
      }
    }).catch(function(err) {
      console.error('获取武将列表失败:', err)
    })
  },

  fetchBattleOrder: function() {
    var that = this
    request({ url: '/formation/battle-order', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({ battleGenerals: res.data })
      }
    }).catch(function(err) {
      console.error('获取出战阵容失败:', err)
    })
  },

  selectFormation: function(e) {
    var id = e.currentTarget.dataset.id
    this.setData({ currentFormation: id })
  },

  selectSlot: function(e) {
    var that = this
    var index = e.currentTarget.dataset.index
    
    // 过滤已出战的武将
    var battleIds = that.data.battleGenerals.map(function(g) { return g ? g.id : null })
    var available = that.data.allGenerals.filter(function(g) {
      return battleIds.indexOf(g.id) === -1
    })
    
    that.setData({
      showModal: true,
      currentSlotIndex: index,
      availableGenerals: available
    })
  },

  addGeneral: function(e) {
    var that = this
    var generalId = e.currentTarget.dataset.id
    var general = that.data.allGenerals.find(function(g) { return g.id === generalId })
    var index = that.data.currentSlotIndex
    
    if (general) {
      var battleGenerals = that.data.battleGenerals.slice()
      battleGenerals[index] = general
      that.setData({ battleGenerals: battleGenerals })
    }
    that.hideModal()
  },

  removeGeneral: function(e) {
    var index = e.currentTarget.dataset.index
    var battleGenerals = this.data.battleGenerals.slice()
    battleGenerals.splice(index, 1)
    this.setData({ battleGenerals: battleGenerals })
  },

  hideModal: function() {
    this.setData({ showModal: false, currentSlotIndex: -1 })
  },

  saveFormation: function() {
    var that = this
    var generalIds = that.data.battleGenerals.map(function(g) { return g ? g.id : null }).filter(function(id) { return id !== null })
    
    if (generalIds.length === 0) {
      wx.showToast({ title: '请至少选择一个武将', icon: 'none' })
      return
    }
    
    request({
      url: '/formation/save',
      method: 'POST',
      data: { formationType: that.data.currentFormation, generalIds: generalIds }
    }).then(function(res) {
      if (res.code === 200) {
        wx.showToast({ title: '保存成功', icon: 'success' })
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' })
      }
    }).catch(function(err) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  }
})
