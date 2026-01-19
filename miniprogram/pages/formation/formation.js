// pages/formation/formation.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    // 阵型槽位
    slots: [
      { index: 0, empty: true },
      { index: 1, empty: true },
      { index: 2, empty: true },
      { index: 3, empty: true },
      { index: 4, empty: true },
      { index: 5, empty: true }
    ],
    
    // 所有武将
    generals: [],
    filteredGenerals: [],
    filterQuality: 'all',
    
    // 战斗顺序
    battleOrder: [],
    
    // 弹窗
    showModal: false,
    selectedSlot: -1,
    availableGenerals: []
  },

  onLoad: function() {
    this.loadData()
  },

  onShow: function() {
    this.loadData()
  },

  // 按顺序加载数据：先加载阵型，再加载武将
  loadData: function() {
    var that = this
    // 先加载阵型
    request({ url: '/formation', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        var slots = res.data.slots || []
        // 处理槽位数据
        slots = slots.map(function(slot) {
          slot.qualityClass = that.getQualityClass(slot.quality)
          return slot
        })
        that.setData({ slots: slots })
        that.updateBattleOrder()
      }
      // 阵型加载完成后再加载武将
      that.loadGenerals()
    }).catch(function(err) {
      console.error('加载阵型失败:', err)
      // 即使阵型加载失败，也要加载武将
      that.loadGenerals()
    })
  },

  loadFormation: function() {
    var that = this
    request({ url: '/formation', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        var slots = res.data.slots || []
        // 处理槽位数据
        slots = slots.map(function(slot) {
          slot.qualityClass = that.getQualityClass(slot.quality)
          return slot
        })
        that.setData({ slots: slots })
        that.updateBattleOrder()
        // 更新武将的上阵状态
        that.refreshGeneralsFormationStatus()
      }
    }).catch(function(err) {
      console.error('加载阵型失败:', err)
    })
  },

  // 刷新武将的上阵状态
  refreshGeneralsFormationStatus: function() {
    var that = this
    var formationIds = this.getFormationGeneralIds()
    var generals = this.data.generals.map(function(g) {
      g.inFormation = formationIds.indexOf(g.id) > -1
      return g
    })
    this.setData({ 
      generals: generals,
      filteredGenerals: this.data.filterQuality === 'all' ? generals : generals.filter(function(g) {
        return that.getQualityClass(g.quality) === that.data.filterQuality
      })
    })
  },

  loadGenerals: function() {
    var that = this
    request({ url: '/general/list', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        var generals = res.data || []
        
        // 标记已上阵的武将
        var formationIds = that.getFormationGeneralIds()
        generals = generals.map(function(g) {
          g.inFormation = formationIds.indexOf(g.id) > -1
          g.qualityClass = that.getQualityClass(g.quality)
          return g
        })
        
        // 按机动性排序
        generals.sort(function(a, b) {
          var mobA = a.attributes ? a.attributes.mobility : 0
          var mobB = b.attributes ? b.attributes.mobility : 0
          return mobB - mobA
        })
        
        that.setData({ 
          generals: generals,
          filteredGenerals: generals
        })
        that.applyFilter()
      }
    }).catch(function(err) {
      console.error('加载武将失败:', err)
    })
  },

  getFormationGeneralIds: function() {
    var ids = []
    this.data.slots.forEach(function(slot) {
      if (slot.generalId) {
        ids.push(slot.generalId)
      }
    })
    return ids
  },

  getQualityClass: function(quality) {
    if (!quality) return ''
    var name = typeof quality === 'object' ? quality.name : quality
    switch (name) {
      case 'orange': case '橙色': return 'orange'
      case 'purple': case '紫色': return 'purple'
      case 'red': case '红色': return 'red'
      case 'blue': case '蓝色': return 'blue'
      case 'green': case '绿色': return 'green'
      default: return ''
    }
  },

  setFilter: function(e) {
    var filter = e.currentTarget.dataset.filter
    this.setData({ filterQuality: filter })
    this.applyFilter()
  },

  applyFilter: function() {
    var that = this
    var filter = this.data.filterQuality
    var generals = this.data.generals
    
    if (filter === 'all') {
      this.setData({ filteredGenerals: generals })
      return
    }
    
    var filtered = generals.filter(function(g) {
      return that.getQualityClass(g.quality) === filter
    })
    this.setData({ filteredGenerals: filtered })
  },

  onSlotTap: function(e) {
    var index = e.currentTarget.dataset.index
    var formationIds = this.getFormationGeneralIds()
    
    // 获取可选武将（排除已上阵的）
    var available = this.data.generals.map(function(g) {
      g.inFormation = formationIds.indexOf(g.id) > -1
      return g
    })
    
    this.setData({
      showModal: true,
      selectedSlot: index,
      availableGenerals: available
    })
  },

  onGeneralTap: function(e) {
    var general = e.currentTarget.dataset.general
    if (general.inFormation) {
      wx.showToast({ title: '该武将已上阵', icon: 'none' })
      return
    }
    
    // 找到第一个空槽位
    var emptySlot = -1
    for (var i = 0; i < this.data.slots.length; i++) {
      if (this.data.slots[i].empty) {
        emptySlot = i
        break
      }
    }
    
    if (emptySlot === -1) {
      wx.showToast({ title: '阵型已满，请先移除武将', icon: 'none' })
      return
    }
    
    this.setSlot(emptySlot, general.id)
  },

  selectGeneral: function(e) {
    var general = e.currentTarget.dataset.general
    if (general.inFormation) {
      wx.showToast({ title: '该武将已上阵', icon: 'none' })
      return
    }
    
    this.setSlot(this.data.selectedSlot, general.id)
    this.closeModal()
  },

  clearSlot: function() {
    this.setSlot(this.data.selectedSlot, null)
    this.closeModal()
  },

  setSlot: function(slotIndex, generalId) {
    var that = this
    wx.showLoading({ title: '设置中...' })
    
    request({
      url: '/formation/slot',
      method: 'POST',
      data: { slotIndex: slotIndex, generalId: generalId }
    }).then(function(res) {
      wx.hideLoading()
      if (res.code === 200) {
        that.loadFormation()
        that.loadGenerals()
        wx.showToast({ title: '设置成功', icon: 'success' })
      } else {
        wx.showToast({ title: res.message || '设置失败', icon: 'none' })
      }
    }).catch(function(err) {
      wx.hideLoading()
      wx.showToast({ title: '设置异常', icon: 'none' })
    })
  },

  closeModal: function() {
    this.setData({ showModal: false, selectedSlot: -1 })
  },

  updateBattleOrder: function() {
    var that = this
    var slots = this.data.slots
    var order = []
    
    // 位置优先级：右侧(后排)最高，左侧(前排)最低
    // 后排(4,5) > 中排(2,3) > 前排(0,1)
    // 数值越小优先级越高
    var positionPriority = {
      0: 2,  // 前排（最低优先）
      1: 2,  // 前排（最低优先）
      2: 1,  // 中排（中等优先）
      3: 1,  // 中排（中等优先）
      4: 0,  // 后排（最高优先）
      5: 0   // 后排（最高优先）
    }
    
    slots.forEach(function(slot, index) {
      if (!slot.empty && slot.generalId) {
        order.push({
          index: index,
          name: slot.generalName,
          mobility: slot.mobility || 0,
          priority: positionPriority[index]
        })
      }
    })
    
    // 排序规则：机动性降序 > 位置优先级升序（右侧优先） > 索引升序
    order.sort(function(a, b) {
      // 先按机动性降序
      if (a.mobility !== b.mobility) {
        return b.mobility - a.mobility
      }
      // 机动性相同，按位置优先级（后排/右侧优先）
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      // 都相同，按索引升序
      return a.index - b.index
    })
    
    this.setData({ battleOrder: order })
  },

  saveFormation: function() {
    var generalIds = []
    this.data.slots.forEach(function(slot) {
      generalIds.push(slot.generalId || null)
    })
    
    var that = this
    wx.showLoading({ title: '保存中...' })
    
    request({
      url: '/formation/batch',
      method: 'POST',
      data: { generalIds: generalIds }
    }).then(function(res) {
      wx.hideLoading()
      if (res.code === 200) {
        wx.showToast({ title: '阵型已保存', icon: 'success' })
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' })
      }
    }).catch(function(err) {
      wx.hideLoading()
      wx.showToast({ title: '保存异常', icon: 'none' })
    })
  },

  goBack: function() {
    wx.navigateBack()
  }
})

