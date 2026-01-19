// pages/dungeon/dungeon.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    chapters: [
      { id: 1, name: '第一章 黄巾之乱' },
      { id: 2, name: '第二章 讨伐董卓' },
      { id: 3, name: '第三章 群雄割据' }
    ],
    currentChapter: 1,
    stages: [],
    selectedStage: null,
    stamina: 0
  },

  onLoad: function() {
    this.fetchStages()
    this.fetchResources()
  },

  fetchStages: function() {
    var that = this
    request({ url: '/dungeon/stages?chapter=' + that.data.currentChapter, method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({ stages: res.data })
      } else {
        // 使用默认数据
        that.setData({
          stages: [
            { id: 1, name: '黄巾起义', recommendLevel: 1, staminaCost: 5, enemyLevel: 1, expReward: 100, silverReward: 500, cleared: true },
            { id: 2, name: '颍川之战', recommendLevel: 5, staminaCost: 6, enemyLevel: 5, expReward: 150, silverReward: 800, cleared: false },
            { id: 3, name: '广宗决战', recommendLevel: 10, staminaCost: 8, enemyLevel: 10, expReward: 200, silverReward: 1000, locked: true }
          ]
        })
      }
    }).catch(function(err) {
      console.error('获取关卡失败:', err)
    })
  },

  fetchResources: function() {
    var that = this
    request({ url: '/resource/summary', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({ stamina: res.data.stamina || 0 })
      }
    }).catch(function(err) {
      console.error('获取资源失败:', err)
    })
  },

  selectChapter: function(e) {
    var id = e.currentTarget.dataset.id
    this.setData({ currentChapter: id, selectedStage: null })
    this.fetchStages()
  },

  selectStage: function(e) {
    var id = e.currentTarget.dataset.id
    var stage = this.data.stages.find(function(s) { return s.id === id })
    if (stage && !stage.locked) {
      this.setData({ selectedStage: stage })
    } else if (stage && stage.locked) {
      wx.showToast({ title: '关卡未解锁', icon: 'none' })
    }
  },

  startBattle: function() {
    var that = this
    if (!that.data.selectedStage) return
    
    if (that.data.stamina < that.data.selectedStage.staminaCost) {
      wx.showToast({ title: '精力不足', icon: 'none' })
      return
    }
    
    request({
      url: '/dungeon/battle',
      method: 'POST',
      data: { stageId: that.data.selectedStage.id }
    }).then(function(res) {
      if (res.code === 200) {
        var result = res.data || {}
        if (result.victory) {
          wx.showToast({ title: '战斗胜利！经验+' + (result.exp || 0), icon: 'success', duration: 2000 })
        } else {
          wx.showToast({ title: '战斗失败', icon: 'none' })
        }
        that.fetchStages()
        that.fetchResources()
      } else {
        wx.showToast({ title: res.message || '战斗失败', icon: 'none' })
      }
    }).catch(function(err) {
      wx.showToast({ title: '战斗失败', icon: 'none' })
    })
  }
})
