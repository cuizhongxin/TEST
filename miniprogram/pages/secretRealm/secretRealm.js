// pages/secretRealm/secretRealm.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    realms: [
      { id: 1, name: '铜雀台', icon: '🏛️', description: '获取装备材料', reward: '强化石、装备碎片', available: true },
      { id: 2, name: '赤壁遗址', icon: '🔥', description: '获取经验丹', reward: '经验丹、银两', available: true },
      { id: 3, name: '五丈原', icon: '⛰️', description: '获取兵法典籍', reward: '兵书、纸张', available: false, cooldown: '12:30:45' },
      { id: 4, name: '洛阳宝库', icon: '💰', description: '获取大量银两', reward: '银两、黄金', available: false, cooldown: '23:59:59' }
    ],
    todayRewards: []
  },

  onLoad: function() {
    this.fetchRealmStatus()
    this.fetchTodayRewards()
  },

  fetchRealmStatus: function() {
    var that = this
    request({ url: '/secretRealm/status', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({ realms: res.data })
      }
    }).catch(function(err) {
      console.error('获取秘境状态失败:', err)
    })
  },

  fetchTodayRewards: function() {
    var that = this
    request({ url: '/secretRealm/today-rewards', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({ todayRewards: res.data })
      }
    }).catch(function(err) {
      console.error('获取今日奖励失败:', err)
    })
  },

  enterRealm: function(e) {
    var that = this
    var id = e.currentTarget.dataset.id
    var realm = that.data.realms.find(function(r) { return r.id === id })
    
    if (!realm.available) {
      wx.showToast({ title: '秘境冷却中', icon: 'none' })
      return
    }
    
    wx.showModal({
      title: '进入秘境',
      content: '确定要进入' + realm.name + '吗？',
      success: function(res) {
        if (res.confirm) {
          request({
            url: '/secretRealm/enter',
            method: 'POST',
            data: { realmId: id }
          }).then(function(res) {
            if (res.code === 200) {
              var rewards = res.data || []
              var rewardText = rewards.map(function(r) { return r.name + '×' + r.count }).join('、')
              wx.showModal({
                title: '探索完成',
                content: '获得: ' + (rewardText || '无'),
                showCancel: false
              })
              that.fetchRealmStatus()
              that.fetchTodayRewards()
            } else {
              wx.showToast({ title: res.message || '探索失败', icon: 'none' })
            }
          }).catch(function(err) {
            wx.showToast({ title: '探索失败', icon: 'none' })
          })
        }
      }
    })
  }
})
