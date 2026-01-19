// pages/warehouse/warehouse.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    currentTab: 'equipment',
    itemList: [],
    showDetail: false,
    selectedItem: null
  },

  onLoad: function() {
    this.fetchItems()
  },

  fetchItems: function() {
    var that = this
    request({ url: '/warehouse/list?type=' + that.data.currentTab, method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({ itemList: res.data })
      } else {
        // 使用默认数据
        var defaultItems = {
          equipment: [
            { id: 'e1', name: '铁剑', icon: '⚔️', qualityColor: '#32cd32', description: '普通武器', attrs: ['攻击+10'] },
            { id: 'e2', name: '皮甲', icon: '🛡️', qualityColor: '#32cd32', description: '普通防具', attrs: ['防御+5'] }
          ],
          material: [
            { id: 'm1', name: '强化石', icon: '💎', count: 15, description: '装备强化材料' },
            { id: 'm2', name: '纸张', icon: '📄', count: 50, description: '学习兵法消耗' }
          ],
          consumable: [
            { id: 'c1', name: '精力药水', icon: '💧', count: 3, usable: true, description: '恢复50精力' },
            { id: 'c2', name: '经验丹', icon: '💊', count: 5, usable: true, description: '获得1000经验' }
          ]
        }
        that.setData({ itemList: defaultItems[that.data.currentTab] || [] })
      }
    }).catch(function(err) {
      console.error('获取物品失败:', err)
    })
  },

  switchTab: function(e) {
    var tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    this.fetchItems()
  },

  showItemDetail: function(e) {
    var item = e.currentTarget.dataset.item
    this.setData({ showDetail: true, selectedItem: item })
  },

  hideDetail: function() {
    this.setData({ showDetail: false, selectedItem: null })
  },

  useItem: function() {
    var that = this
    request({
      url: '/warehouse/use',
      method: 'POST',
      data: { itemId: that.data.selectedItem.id }
    }).then(function(res) {
      if (res.code === 200) {
        wx.showToast({ title: '使用成功', icon: 'success' })
        that.hideDetail()
        that.fetchItems()
      } else {
        wx.showToast({ title: res.message || '使用失败', icon: 'none' })
      }
    }).catch(function(err) {
      wx.showToast({ title: '使用失败', icon: 'none' })
    })
  },

  sellItem: function() {
    var that = this
    wx.showModal({
      title: '确认出售',
      content: '确定要出售此物品吗？',
      success: function(res) {
        if (res.confirm) {
          request({
            url: '/warehouse/sell',
            method: 'POST',
            data: { itemId: that.data.selectedItem.id }
          }).then(function(res) {
            if (res.code === 200) {
              wx.showToast({ title: '出售成功', icon: 'success' })
              that.hideDetail()
              that.fetchItems()
            } else {
              wx.showToast({ title: res.message || '出售失败', icon: 'none' })
            }
          }).catch(function(err) {
            wx.showToast({ title: '出售失败', icon: 'none' })
          })
        }
      }
    })
  }
})
