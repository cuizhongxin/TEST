// pages/training/training.js
var request = require('../../utils/request.js')

// 粮食等级配置
var foodTypes = [
  {
    level: 'junior',
    name: '初级',
    icon: '🍚',
    cost: 100,
    lordExpMain: 50,    // 主公修炼模式
    generalExpSub: 10,   // 主公修炼时武将获得
    generalExpMain: 40,  // 武将特训模式
    lordExpSub: 8        // 武将特训时主公获得
  },
  {
    level: 'intermediate',
    name: '中级',
    icon: '🍜',
    cost: 300,
    lordExpMain: 180,
    generalExpSub: 30,
    generalExpMain: 150,
    lordExpSub: 25
  },
  {
    level: 'senior',
    name: '高级',
    icon: '🍱',
    cost: 800,
    lordExpMain: 500,
    generalExpSub: 80,
    generalExpMain: 450,
    lordExpSub: 70
  }
]

Page({
  data: {
    food: 0,
    lordExp: 0,
    lordMaxExp: 1000,
    generals: [],
    currentMode: 'lord', // lord 或 general
    selectedFood: 'junior',
    currentGeneralId: null,
    trainCount: 1,
    totalCost: 100,
    canTrain: false,
    foodTypes: foodTypes,
    
    // 结果弹窗
    showResult: false,
    resultLordExp: 0,
    resultGeneralExp: 0,
    levelUp: false
  },

  onLoad: function() {
    this.loadData()
  },

  onShow: function() {
    this.loadData()
  },

  loadData: function() {
    this.loadResources()
    this.loadGenerals()
    this.loadLordInfo()
  },

  loadResources: function() {
    var that = this
    request({
      url: '/resource/summary',
      method: 'GET'
    }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({ food: res.data.food || 1000 })
        that.updateCanTrain()
      }
    }).catch(function(err) {
      console.error('加载资源失败:', err)
      that.setData({ food: 1000 })
      that.updateCanTrain()
    })
  },

  loadGenerals: function() {
    var that = this
    request({
      url: '/general/list',
      method: 'GET'
    }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({ generals: res.data })
        if (res.data.length > 0 && !that.data.currentGeneralId) {
          that.setData({ currentGeneralId: res.data[0].id })
        }
      }
    }).catch(function(err) {
      console.error('加载武将失败:', err)
    })
  },

  loadLordInfo: function() {
    var that = this
    request({
      url: '/level',
      method: 'GET'
    }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({
          lordExp: res.data.exp || 0,
          lordMaxExp: res.data.maxExp || 1000
        })
      }
    }).catch(function(err) {
      console.error('加载等级失败:', err)
    })
  },

  switchMode: function(e) {
    var mode = e.currentTarget.dataset.mode
    this.setData({ currentMode: mode })
    this.updateCanTrain()
  },

  selectFood: function(e) {
    var level = e.currentTarget.dataset.level
    this.setData({ selectedFood: level })
    this.updateTotalCost()
  },

  selectGeneral: function(e) {
    var id = e.currentTarget.dataset.id
    this.setData({ currentGeneralId: id })
    this.updateCanTrain()
  },

  decreaseCount: function() {
    if (this.data.trainCount > 1) {
      this.setData({ trainCount: this.data.trainCount - 1 })
      this.updateTotalCost()
    }
  },

  increaseCount: function() {
    var maxCount = this.getMaxTrainCount()
    if (this.data.trainCount < maxCount) {
      this.setData({ trainCount: this.data.trainCount + 1 })
      this.updateTotalCost()
    }
  },

  maxCount: function() {
    var maxCount = this.getMaxTrainCount()
    this.setData({ trainCount: Math.max(1, maxCount) })
    this.updateTotalCost()
  },

  getMaxTrainCount: function() {
    var food = foodTypes.find(function(f) { return f.level === this.data.selectedFood }.bind(this))
    if (!food) return 1
    return Math.floor(this.data.food / food.cost)
  },

  updateTotalCost: function() {
    var food = foodTypes.find(function(f) { return f.level === this.data.selectedFood }.bind(this))
    if (food) {
      this.setData({ totalCost: food.cost * this.data.trainCount })
    }
    this.updateCanTrain()
  },

  updateCanTrain: function() {
    var canTrain = this.data.food >= this.data.totalCost
    if (this.data.currentMode === 'general' && !this.data.currentGeneralId) {
      canTrain = false
    }
    this.setData({ canTrain: canTrain })
  },

  startTraining: function() {
    if (!this.data.canTrain) {
      wx.showToast({ title: '无法训练', icon: 'none' })
      return
    }

    var that = this
    var food = foodTypes.find(function(f) { return f.level === that.data.selectedFood })
    if (!food) return

    var lordExp = 0
    var generalExp = 0
    
    if (this.data.currentMode === 'lord') {
      lordExp = food.lordExpMain * this.data.trainCount
      generalExp = food.generalExpSub * this.data.trainCount
    } else {
      lordExp = food.lordExpSub * this.data.trainCount
      generalExp = food.generalExpMain * this.data.trainCount
    }

    request({
      url: '/training/train',
      method: 'POST',
      data: {
        mode: this.data.currentMode,
        foodLevel: this.data.selectedFood,
        count: this.data.trainCount,
        generalId: this.data.currentMode === 'general' ? this.data.currentGeneralId : null,
        foodCost: this.data.totalCost,
        lordExp: lordExp,
        generalExp: generalExp
      }
    }).then(function(res) {
      if (res.code === 200) {
        that.setData({
          showResult: true,
          resultLordExp: lordExp,
          resultGeneralExp: that.data.currentMode === 'general' ? generalExp : 0,
          levelUp: res.data && res.data.levelUp,
          food: that.data.food - that.data.totalCost
        })
        that.updateCanTrain()
      } else {
        wx.showToast({ title: res.message || '训练失败', icon: 'none' })
      }
    }).catch(function(err) {
      console.error('训练失败:', err)
      wx.showToast({ title: '训练失败', icon: 'none' })
    })
  },

  closeResult: function() {
    this.setData({ showResult: false })
    this.loadData() // 刷新数据
  }
})
