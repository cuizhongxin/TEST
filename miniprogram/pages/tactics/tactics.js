// pages/tactics/tactics.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    generals: [],
    currentGeneralId: null,
    currentGeneral: null,
    tacticsList: [
      { id: 'fangyuan', name: '方圆阵', type: 'formation', quality: 'blue', description: '防御+10%', paperCost: 100, woodCost: 50, silverCost: 1000 },
      { id: 'queyue', name: '却月阵', type: 'formation', quality: 'purple', description: '对弓兵反伤30%，但骑兵对此阵伤害+10%', paperCost: 200, woodCost: 100, silverCost: 2000 },
      { id: 'changhong', name: '长虹贯日', type: 'tactics', quality: 'orange', description: '弓兵专属，对一排三个武将造成50%/40%/30%伤害', paperCost: 500, woodCost: 200, silverCost: 5000 },
      { id: 'yizi', name: '一字长蛇阵', type: 'formation', quality: 'green', description: '攻击+5%', paperCost: 50, woodCost: 30, silverCost: 500 },
      { id: 'yanxing', name: '雁行阵', type: 'formation', quality: 'blue', description: '速度+15%', paperCost: 150, woodCost: 80, silverCost: 1500 }
    ]
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
        that.setData({ currentGeneral: res.data })
      }
    }).catch(function(err) {
      console.error('获取武将详情失败:', err)
    })
  },

  learnTactics: function(e) {
    var that = this
    var tacticsId = e.currentTarget.dataset.id
    var generalId = that.data.currentGeneralId
    
    if (!generalId) {
      wx.showToast({ title: '请先选择武将', icon: 'none' })
      return
    }
    
    request({
      url: '/tactics/learn',
      method: 'POST',
      data: { generalId: generalId, tacticsId: tacticsId }
    }).then(function(res) {
      if (res.code === 200) {
        wx.showToast({ title: '学习成功', icon: 'success' })
        that.selectGeneral({ currentTarget: { dataset: { id: generalId } } })
      } else {
        wx.showToast({ title: res.message || '学习失败', icon: 'none' })
      }
    }).catch(function(err) {
      wx.showToast({ title: '学习失败', icon: 'none' })
    })
  }
})
