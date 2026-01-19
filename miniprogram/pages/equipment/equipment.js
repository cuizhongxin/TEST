// pages/equipment/equipment.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    generals: [],
    currentGeneralId: null,
    currentGeneral: null,
    equipmentSlots: [
      { type: 'weapon', label: '武器' },
      { type: 'armor', label: '防具' },
      { type: 'accessory', label: '饰品' },
      { type: 'mount', label: '坐骑' }
    ],
    showModal: false,
    currentSlotType: '',
    currentSlotLabel: '',
    availableEquipments: []
  },

  onLoad: function() {
    this.fetchGenerals()
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

  selectGeneral: function(e) {
    var that = this
    var id = e.currentTarget.dataset.id
    that.setData({ currentGeneralId: id })
    
    request({ url: '/general/detail?id=' + id, method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        var general = res.data
        if (!general.equipment) {
          general.equipment = {}
        }
        that.setData({ currentGeneral: general })
      }
    }).catch(function(err) {
      console.error('获取武将详情失败:', err)
    })
  },

  showEquipmentList: function(e) {
    var that = this
    var type = e.currentTarget.dataset.type
    var slot = that.data.equipmentSlots.find(function(s) { return s.type === type })
    
    request({ url: '/equipment/available?type=' + type, method: 'GET' }).then(function(res) {
      if (res.code === 200) {
        that.setData({
          showModal: true,
          currentSlotType: type,
          currentSlotLabel: slot ? slot.label : '',
          availableEquipments: res.data || []
        })
      }
    }).catch(function(err) {
      console.error('获取装备列表失败:', err)
    })
  },

  equipItem: function(e) {
    var that = this
    var equipId = e.currentTarget.dataset.id
    var generalId = that.data.currentGeneralId
    var slotType = that.data.currentSlotType
    
    request({
      url: '/equipment/equip',
      method: 'POST',
      data: { generalId: generalId, equipmentId: equipId, slot: slotType }
    }).then(function(res) {
      if (res.code === 200) {
        wx.showToast({ title: '装备成功', icon: 'success' })
        that.hideModal()
        that.selectGeneral({ currentTarget: { dataset: { id: generalId } } })
      } else {
        wx.showToast({ title: res.message || '装备失败', icon: 'none' })
      }
    }).catch(function(err) {
      wx.showToast({ title: '装备失败', icon: 'none' })
    })
  },

  hideModal: function() {
    this.setData({ showModal: false })
  }
})
