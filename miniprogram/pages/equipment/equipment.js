// pages/equipment/equipment.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    // 武将列表
    generals: [],
    selectedGeneral: null,
    
    // 装备槽位定义
    equipmentSlots: [
      { id: 1, name: '武器', icon: '⚔️', equipment: null },
      { id: 2, name: '戒指', icon: '💍', equipment: null },
      { id: 3, name: '铠甲', icon: '🛡️', equipment: null },
      { id: 4, name: '项链', icon: '📿', equipment: null },
      { id: 5, name: '头盔', icon: '⛑️', equipment: null },
      { id: 6, name: '鞋子', icon: '👢', equipment: null }
    ],
    
    // 套装信息
    setBonus: null,
    
    // 背包装备
    bagEquipments: [],
    
    // 当前选择的槽位
    selectedSlot: null,
    
    // 显示背包弹窗
    showBagModal: false,
    
    // 显示装备详情弹窗
    showDetailModal: false,
    selectedEquipment: null,
    
    // 强化相关
    showEnhanceModal: false,
    enhanceEquipment: null,
    enhanceStones: [], // 用户拥有的强化石
    selectedStone: null,
    enhanceSuccess: false,
    
    // 属性总计
    totalAttributes: {
      attack: 0,
      defense: 0,
      valor: 0,
      command: 0,
      mobility: 0,
      hp: 0
    }
  },

  onLoad: function() {
    this.loadData()
    this.loadBagEquipments()
  },

  onShow: function() {
    this.loadData()
    this.loadBagEquipments()
  },

  // 按顺序加载：先加载阵型，再加载武将，优先展示阵型中的武将
  loadData: function() {
    var that = this
    
    // 先获取阵型数据
    request({ url: '/formation', method: 'GET' }).then(function(formationRes) {
      var formationGenerals = []
      var formationIds = []
      
      if (formationRes.code === 200 && formationRes.data && formationRes.data.slots) {
        var slots = formationRes.data.slots
        for (var i = 0; i < slots.length; i++) {
          if (slots[i] && !slots[i].empty && slots[i].generalId) {
            formationIds.push(slots[i].generalId)
            // 从槽位数据构建武将信息
            formationGenerals.push({
              id: slots[i].generalId,
              name: slots[i].name,
              level: slots[i].level,
              quality: slots[i].quality,
              qualityClass: that.getQualityClass(slots[i].quality),
              inFormation: true
            })
          }
        }
      }
      
      // 再获取所有武将列表
      return request({ url: '/general/list', method: 'GET' }).then(function(res) {
        if (res.code === 200 && res.data) {
          var allGenerals = res.data
          var finalGenerals = []
          
          // 先添加阵型中的武将（已经按阵型顺序）
          for (var i = 0; i < formationGenerals.length; i++) {
            // 从完整武将数据中找到对应武将，补充完整信息
            var found = null
            for (var j = 0; j < allGenerals.length; j++) {
              if (allGenerals[j].id === formationGenerals[i].id) {
                found = allGenerals[j]
                break
              }
            }
            if (found) {
              found.qualityClass = that.getQualityClass(found.quality)
              found.inFormation = true
              finalGenerals.push(found)
            } else {
              // 如果没找到完整数据，使用阵型中的数据
              finalGenerals.push(formationGenerals[i])
            }
          }
          
          // 再添加不在阵型中的武将
          for (var k = 0; k < allGenerals.length; k++) {
            if (formationIds.indexOf(allGenerals[k].id) === -1) {
              allGenerals[k].qualityClass = that.getQualityClass(allGenerals[k].quality)
              allGenerals[k].inFormation = false
              finalGenerals.push(allGenerals[k])
            }
          }
          
          that.setData({ generals: finalGenerals })
          
          // 默认选择第一个武将（优先是阵型中的武将）
          if (finalGenerals.length > 0) {
            that.selectGeneral({ currentTarget: { dataset: { general: finalGenerals[0] } } })
          }
        }
      })
    }).catch(function(error) {
      console.error('加载数据失败:', error)
      // 如果阵型加载失败，直接加载武将列表
      that.loadGeneralsFallback()
    })
  },

  // 备用方案：直接加载武将列表
  loadGeneralsFallback: function() {
    var that = this
    request({
      url: '/general/list',
      method: 'GET'
    }).then(function(res) {
      if (res.code === 200 && res.data) {
        var generals = res.data
        for (var i = 0; i < generals.length; i++) {
          generals[i].qualityClass = that.getQualityClass(generals[i].quality)
        }
        that.setData({ generals: generals })
        
        if (generals.length > 0) {
          that.selectGeneral({ currentTarget: { dataset: { general: generals[0] } } })
        }
      }
    }).catch(function(error) {
      console.error('获取武将列表失败:', error)
    })
  },

  // 加载背包装备
  loadBagEquipments: function() {
    var that = this
    request({
      url: '/equipment/bag',
      method: 'GET'
    }).then(function(res) {
      if (res.code === 200 && res.data) {
        var equipments = res.data
        // 添加品质样式
        for (var i = 0; i < equipments.length; i++) {
          equipments[i].qualityClass = that.getEquipmentQualityClass(equipments[i])
        }
        that.setData({ bagEquipments: equipments })
      }
    }).catch(function(error) {
      console.error('获取背包装备失败:', error)
    })
  },

  // 选择武将
  selectGeneral: function(e) {
    var that = this
    var general = e.currentTarget.dataset.general
    
    this.setData({ selectedGeneral: general })
    
    // 加载武将装备
    request({
      url: '/equipment/general/' + general.id,
      method: 'GET'
    }).then(function(res) {
      if (res.code === 200 && res.data) {
        var equipments = res.data.equipments || []
        var setBonus = res.data.setBonus || null
        
        // 更新装备槽位
        var slots = that.data.equipmentSlots.slice()
        for (var i = 0; i < slots.length; i++) {
          slots[i].equipment = null
          for (var j = 0; j < equipments.length; j++) {
            if (equipments[j].slotType && equipments[j].slotType.id === slots[i].id) {
              equipments[j].qualityClass = that.getEquipmentQualityClass(equipments[j])
              slots[i].equipment = equipments[j]
              break
            }
          }
        }
        
        // 计算属性总计
        var totalAttributes = that.calculateTotalAttributes(slots)
        
        that.setData({
          equipmentSlots: slots,
          setBonus: setBonus,
          totalAttributes: totalAttributes
        })
      }
    }).catch(function(error) {
      console.error('获取武将装备失败:', error)
    })
  },

  // 计算属性总计
  calculateTotalAttributes: function(slots) {
    var total = {
      attack: 0,
      defense: 0,
      valor: 0,
      command: 0,
      mobility: 0,
      hp: 0
    }
    
    for (var i = 0; i < slots.length; i++) {
      var equip = slots[i].equipment
      if (equip && equip.baseAttributes) {
        var attrs = equip.baseAttributes
        total.attack += attrs.attack || 0
        total.defense += attrs.defense || 0
        total.valor += attrs.valor || 0
        total.command += attrs.command || 0
        total.mobility += attrs.mobility || 0
        total.hp += attrs.hp || 0
      }
      // 加上附加属性
      if (equip && equip.bonusAttributes) {
        var bonus = equip.bonusAttributes
        total.attack += bonus.attack || 0
        total.defense += bonus.defense || 0
        total.valor += bonus.valor || 0
        total.command += bonus.command || 0
        total.mobility += bonus.mobility || 0
        total.hp += bonus.hp || 0
      }
    }
    
    return total
  },

  // 点击装备槽位
  onSlotTap: function(e) {
    var slot = e.currentTarget.dataset.slot
    
    if (slot.equipment) {
      // 显示装备详情
      this.setData({
        selectedSlot: slot,
        selectedEquipment: slot.equipment,
        showDetailModal: true
      })
    } else {
      // 打开背包选择装备
      this.openBagModal(slot)
    }
  },

  // 打开背包弹窗
  openBagModal: function(slot) {
    // 筛选对应槽位的装备
    var slotEquipments = []
    for (var i = 0; i < this.data.bagEquipments.length; i++) {
      var equip = this.data.bagEquipments[i]
      if (equip.slotType && equip.slotType.id === slot.id) {
        slotEquipments.push(equip)
      }
    }
    
    this.setData({
      selectedSlot: slot,
      showBagModal: true
    })
  },

  // 关闭背包弹窗
  closeBagModal: function() {
    this.setData({
      showBagModal: false,
      selectedSlot: null
    })
  },

  // 从背包选择装备
  selectBagEquipment: function(e) {
    var that = this
    var equipment = e.currentTarget.dataset.equipment
    var general = this.data.selectedGeneral
    var slot = this.data.selectedSlot
    
    if (!general || !slot || !equipment) return
    
    // 检查槽位是否匹配
    if (equipment.slotType && equipment.slotType.id !== slot.id) {
      wx.showToast({ title: '装备类型不匹配', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '装备中...' })
    
    request({
      url: '/equipment/equip',
      method: 'POST',
      data: {
        equipmentId: equipment.id,
        generalId: general.id
      }
    }).then(function(res) {
      wx.hideLoading()
      if (res.code === 200) {
        wx.showToast({ title: '装备成功', icon: 'success' })
        that.closeBagModal()
        that.selectGeneral({ currentTarget: { dataset: { general: general } } })
        that.loadBagEquipments()
      } else {
        wx.showToast({ title: res.message || '装备失败', icon: 'none' })
      }
    }).catch(function(error) {
      wx.hideLoading()
      console.error('装备失败:', error)
      wx.showToast({ title: '装备失败', icon: 'none' })
    })
  },

  // 关闭详情弹窗
  closeDetailModal: function() {
    this.setData({
      showDetailModal: false,
      selectedEquipment: null
    })
  },

  // 卸下装备
  unequipItem: function() {
    var that = this
    var equipment = this.data.selectedEquipment
    var general = this.data.selectedGeneral
    
    if (!equipment) return
    
    wx.showLoading({ title: '卸下中...' })
    
    request({
      url: '/equipment/unequip',
      method: 'POST',
      data: {
        equipmentId: equipment.id
      }
    }).then(function(res) {
      wx.hideLoading()
      if (res.code === 200) {
        wx.showToast({ title: '已卸下', icon: 'success' })
        that.closeDetailModal()
        that.selectGeneral({ currentTarget: { dataset: { general: general } } })
        that.loadBagEquipments()
      } else {
        wx.showToast({ title: res.message || '卸下失败', icon: 'none' })
      }
    }).catch(function(error) {
      wx.hideLoading()
      console.error('卸下装备失败:', error)
      wx.showToast({ title: '卸下失败', icon: 'none' })
    })
  },

  // 打开强化弹窗
  openEnhanceModal: function() {
    var equipment = this.data.selectedEquipment
    if (!equipment) return
    
    this.setData({
      showDetailModal: false,
      showEnhanceModal: true,
      enhanceEquipment: equipment,
      enhanceSuccess: false
    })
    
    this.loadEnhanceStones()
  },

  // 加载强化石
  loadEnhanceStones: function() {
    var that = this
    request({
      url: '/warehouse/items?page=0&pageSize=100&itemType=material',
      method: 'GET'
    }).then(function(res) {
      if (res.code === 200 && res.data && res.data.items) {
        // 筛选强化石
        var stones = []
        for (var i = 0; i < res.data.items.length; i++) {
          var item = res.data.items[i]
          if (item.itemId && item.itemId.indexOf('enhance_stone') >= 0) {
            stones.push(item)
          }
        }
        that.setData({ enhanceStones: stones })
      }
    }).catch(function(error) {
      console.error('获取强化石失败:', error)
    })
  },

  // 选择强化石
  selectEnhanceStone: function(e) {
    var stone = e.currentTarget.dataset.stone
    this.setData({ selectedStone: stone })
  },

  // 执行强化
  doEnhance: function() {
    var that = this
    var equipment = this.data.enhanceEquipment
    var stone = this.data.selectedStone
    
    if (!equipment || !stone) {
      wx.showToast({ title: '请选择强化石', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '强化中...' })
    
    // 模拟强化（实际应该调用后端API）
    setTimeout(function() {
      wx.hideLoading()
      
      // 随机成功/失败
      var success = Math.random() < 0.7
      
      that.setData({ enhanceSuccess: success })
      
      if (success) {
        wx.showToast({ title: '强化成功！', icon: 'success' })
      } else {
        wx.showToast({ title: '强化失败', icon: 'none' })
      }
      
      // 刷新数据
      that.loadEnhanceStones()
      if (that.data.selectedGeneral) {
        that.selectGeneral({ currentTarget: { dataset: { general: that.data.selectedGeneral } } })
      }
    }, 1000)
  },

  // 关闭强化弹窗
  closeEnhanceModal: function() {
    this.setData({
      showEnhanceModal: false,
      enhanceEquipment: null,
      selectedStone: null,
      enhanceSuccess: false
    })
  },

  // 更换装备
  changeEquipment: function() {
    var slot = this.data.selectedSlot
    this.closeDetailModal()
    this.openBagModal(slot)
  },

  // 获取品质样式类
  getQualityClass: function(quality) {
    if (!quality) return 'quality-white'
    var name = quality.name || quality
    if (typeof name === 'string') {
      name = name.toLowerCase()
      if (name.indexOf('橙') >= 0 || name.indexOf('传说') >= 0) return 'quality-orange'
      if (name.indexOf('紫') >= 0 || name.indexOf('史诗') >= 0) return 'quality-purple'
      if (name.indexOf('红') >= 0) return 'quality-red'
      if (name.indexOf('蓝') >= 0 || name.indexOf('精良') >= 0) return 'quality-blue'
      if (name.indexOf('绿') >= 0 || name.indexOf('优秀') >= 0) return 'quality-green'
    }
    return 'quality-white'
  },

  getEquipmentQualityClass: function(equipment) {
    if (!equipment || !equipment.quality) return 'quality-white'
    var q = equipment.quality
    if (q.id === 5 || q.name === '传说') return 'quality-orange'
    if (q.id === 4 || q.name === '史诗') return 'quality-purple'
    if (q.id === 3 || q.name === '精良') return 'quality-blue'
    if (q.id === 2 || q.name === '优秀') return 'quality-green'
    return 'quality-white'
  },

  // 返回
  goBack: function() {
    wx.navigateBack()
  }
})
