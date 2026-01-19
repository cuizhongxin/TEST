// pages/warehouse/warehouse.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    gold: 0,
    silver: 0,
    activeTab: 'equipment',
    
    // 装备仓库信息
    equipmentInfo: {
      capacity: 100,
      used: 0,
      expandTimes: 0,
      maxExpandTimes: 4,
      nextExpandCost: 100
    },
    
    // 物品仓库信息
    itemInfo: {
      capacity: 100,
      used: 0,
      expandTimes: 0,
      maxExpandTimes: 4,
      nextExpandCost: 100
    },
    
    // 装备列表
    equipments: [],
    emptyEquipmentSlots: [],
    
    // 物品列表
    items: [],
    emptyItemSlots: [],
    itemFilter: 'all',
    
    // 批量模式
    batchMode: false,
    selectedEquipments: [],
    
    // 选中的物品/装备详情
    selectedItem: null
  },

  onLoad: function() {
    this.loadWarehouseInfo()
    this.loadResources()
  },

  onShow: function() {
    this.loadWarehouseInfo()
  },

  loadResources: function() {
    var that = this
    request({ url: '/recruit/resource', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({
          gold: res.data.gold || 0,
          silver: res.data.silver || 0
        })
      }
    }).catch(function(err) {
      console.error('加载资源失败:', err)
    })
  },

  loadWarehouseInfo: function() {
    var that = this
    request({ url: '/warehouse/info', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({
          equipmentInfo: res.data.equipment || that.data.equipmentInfo,
          itemInfo: res.data.item || that.data.itemInfo
        })
        that.loadEquipments()
        that.loadItems()
      }
    }).catch(function(err) {
      console.error('加载仓库信息失败:', err)
      // 即使失败也加载数据
      that.loadEquipments()
      that.loadItems()
    })
  },

  loadEquipments: function() {
    var that = this
    request({ url: '/warehouse/equipments', method: 'GET' }).then(function(res) {
      if (res.code === 200 && res.data) {
        var equipments = res.data.equipments || []
        var capacity = res.data.capacity || that.data.equipmentInfo.capacity
        var used = res.data.used || equipments.length
        
        // 为装备添加品质样式类
        equipments = equipments.map(function(eq) {
          eq.qualityClass = that.getQualityClass(eq.quality)
          eq.qualityName = that.getQualityName(eq.quality)
          return eq
        })
        
        // 计算空槽位数量
        var emptyCount = Math.max(0, Math.min(capacity - used, 50))
        var emptySlots = []
        for (var i = 0; i < emptyCount; i++) {
          emptySlots.push(i)
        }
        
        that.setData({
          equipments: equipments,
          emptyEquipmentSlots: emptySlots,
          'equipmentInfo.used': used,
          'equipmentInfo.capacity': capacity
        })
      }
    }).catch(function(err) {
      console.error('加载装备列表失败:', err)
    })
  },

  loadItems: function() {
    var that = this
    var filter = this.data.itemFilter
    request({ 
      url: '/warehouse/items', 
      method: 'GET',
      data: { itemType: filter }
    }).then(function(res) {
      if (res.code === 200 && res.data) {
        var items = res.data.items || []
        var capacity = res.data.capacity || that.data.itemInfo.capacity
        var used = res.data.used || items.length
        
        // 为物品添加品质样式类
        items = items.map(function(item) {
          item.qualityClass = that.getQualityClass(item.quality)
          item.qualityName = that.getQualityName(item.quality)
          return item
        })
        
        // 计算空槽位数量
        var emptyCount = Math.max(0, Math.min(capacity - used, 50))
        var emptySlots = []
        for (var i = 0; i < emptyCount; i++) {
          emptySlots.push(i)
        }
        
        that.setData({
          items: items,
          emptyItemSlots: emptySlots,
          'itemInfo.used': used,
          'itemInfo.capacity': capacity
        })
      }
    }).catch(function(err) {
      console.error('加载物品列表失败:', err)
    })
  },

  getQualityClass: function(quality) {
    if (!quality) return ''
    // 处理对象类型的quality
    var qualityName = typeof quality === 'object' ? quality.name : quality
    switch (qualityName) {
      case 'orange': case '橙色': return 'orange'
      case 'purple': case '紫色': return 'purple'
      case 'red': case '红色': return 'red'
      case 'blue': case '蓝色': return 'blue'
      case 'green': case '绿色': return 'green'
      default: return ''
    }
  },

  getQualityName: function(quality) {
    if (!quality) return '普通'
    var qualityName = typeof quality === 'object' ? quality.name : quality
    switch (qualityName) {
      case 'orange': return '橙色'
      case 'purple': return '紫色'
      case 'red': return '红色'
      case 'blue': return '蓝色'
      case 'green': return '绿色'
      case 'white': return '白色'
      default: return qualityName
    }
  },

  switchTab: function(e) {
    var tab = e.currentTarget.dataset.tab
    this.setData({
      activeTab: tab,
      selectedItem: null,
      batchMode: false,
      selectedEquipments: []
    })
  },

  setItemFilter: function(e) {
    var filter = e.currentTarget.dataset.filter
    this.setData({ itemFilter: filter })
    this.loadItems()
  },

  expandStorage: function(e) {
    var that = this
    var type = e.currentTarget.dataset.type
    var info = type === 'equipment' ? this.data.equipmentInfo : this.data.itemInfo
    var cost = info.nextExpandCost
    
    wx.showModal({
      title: '扩充仓库',
      content: '花费 ' + cost + ' 元宝扩充' + (type === 'equipment' ? '装备' : '物品') + '仓库100格？',
      success: function(res) {
        if (res.confirm) {
          var url = type === 'equipment' ? '/warehouse/expand/equipment' : '/warehouse/expand/item'
          wx.showLoading({ title: '扩充中...' })
          
          request({ url: url, method: 'POST' }).then(function(res) {
            wx.hideLoading()
            if (res.code === 200 && res.data) {
              wx.showToast({ title: '扩充成功！', icon: 'success' })
              that.setData({ gold: res.data.remainingGold })
              that.loadWarehouseInfo()
            } else {
              wx.showToast({ title: res.message || '扩充失败', icon: 'none' })
            }
          }).catch(function(err) {
            wx.hideLoading()
            wx.showToast({ title: '扩充异常', icon: 'none' })
          })
        }
      }
    })
  },

  toggleBatchMode: function() {
    this.setData({
      batchMode: !this.data.batchMode,
      selectedEquipments: []
    })
  },

  onEquipmentTap: function(e) {
    var id = e.currentTarget.dataset.id
    var index = e.currentTarget.dataset.index
    
    if (this.data.batchMode) {
      // 批量选择模式
      var selected = this.data.selectedEquipments.slice()
      var idx = selected.indexOf(id)
      if (idx > -1) {
        selected.splice(idx, 1)
      } else {
        selected.push(id)
      }
      this.setData({ selectedEquipments: selected })
    } else {
      // 查看详情
      var equipment = this.data.equipments[index]
      if (equipment) {
        var sellPrice = this.calculateSellPrice(equipment.quality)
        this.setData({
          selectedItem: {
            id: equipment.id,
            name: equipment.name,
            icon: equipment.icon || '🗡️',
            quality: equipment.quality,
            qualityClass: equipment.qualityClass,
            qualityName: equipment.qualityName,
            enhanceLevel: equipment.enhanceLevel,
            attack: equipment.baseAttributes ? equipment.baseAttributes.attack : 0,
            defense: equipment.baseAttributes ? equipment.baseAttributes.defense : 0,
            valor: equipment.baseAttributes ? equipment.baseAttributes.valor : 0,
            command: equipment.baseAttributes ? equipment.baseAttributes.command : 0,
            mobility: equipment.baseAttributes ? equipment.baseAttributes.mobility : 0,
            description: equipment.description || '一件装备',
            sellPrice: sellPrice,
            isEquipment: true
          }
        })
      }
    }
  },

  onItemTap: function(e) {
    var item = e.currentTarget.dataset.item
    if (item) {
      // 判断物品是否可使用
      var usableTypes = ['stamina', 'exp', 'resource_wood', 'resource_metal', 'resource_food', 'silver']
      var usable = usableTypes.indexOf(item.itemType) > -1
      
      this.setData({
        selectedItem: {
          itemId: item.itemId,
          name: item.name,
          icon: item.icon || '📦',
          quality: item.quality,
          qualityClass: item.qualityClass,
          qualityName: item.qualityName,
          count: item.count,
          maxStack: item.maxStack || 99,
          description: item.description || '一件物品',
          itemType: item.itemType,
          usable: usable,
          isEquipment: false
        }
      })
    }
  },

  closeDetail: function() {
    this.setData({ selectedItem: null })
  },

  calculateSellPrice: function(quality) {
    var basePrice = 100
    if (!quality) return basePrice
    
    // 处理对象类型的quality
    var qualityId = typeof quality === 'object' ? quality.id : 0
    var qualityName = typeof quality === 'object' ? quality.name : quality
    
    if (qualityId) {
      switch (qualityId) {
        case 6: return basePrice * 100
        case 5: return basePrice * 80
        case 4: return basePrice * 50
        case 3: return basePrice * 20
        case 2: return basePrice * 5
        default: return basePrice
      }
    }
    
    switch (qualityName) {
      case 'orange': case '橙色': return basePrice * 100
      case 'purple': case '紫色': return basePrice * 80
      case 'red': case '红色': return basePrice * 50
      case 'blue': case '蓝色': return basePrice * 20
      case 'green': case '绿色': return basePrice * 5
      default: return basePrice
    }
  },

  equipItem: function() {
    wx.showToast({ title: '请在武将页面装备', icon: 'none' })
  },

  sellEquipment: function() {
    var that = this
    var item = this.data.selectedItem
    if (!item || !item.isEquipment) return
    
    wx.showModal({
      title: '出售装备',
      content: '确定出售 ' + item.name + '？\n可获得 ' + item.sellPrice + ' 银两',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({ title: '出售中...' })
          
          request({
            url: '/warehouse/sell/equipment',
            method: 'POST',
            data: { equipmentId: item.id }
          }).then(function(res) {
            wx.hideLoading()
            if (res.code === 200 && res.data) {
              wx.showToast({ title: '出售成功！', icon: 'success' })
              that.setData({
                silver: res.data.totalSilver,
                selectedItem: null
              })
              that.loadEquipments()
            } else {
              wx.showToast({ title: res.message || '出售失败', icon: 'none' })
            }
          }).catch(function(err) {
            wx.hideLoading()
            wx.showToast({ title: '出售异常', icon: 'none' })
          })
        }
      }
    })
  },

  batchSell: function() {
    var that = this
    var selected = this.data.selectedEquipments
    if (selected.length === 0) return
    
    wx.showModal({
      title: '批量出售',
      content: '确定出售选中的 ' + selected.length + ' 件装备？',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({ title: '出售中...' })
          
          request({
            url: '/warehouse/sell/batch',
            method: 'POST',
            data: { equipmentIds: selected }
          }).then(function(res) {
            wx.hideLoading()
            if (res.code === 200 && res.data) {
              wx.showToast({ 
                title: '出售' + res.data.soldCount + '件，获得' + res.data.totalPrice + '银', 
                icon: 'none',
                duration: 2000
              })
              that.setData({
                silver: res.data.totalSilver,
                batchMode: false,
                selectedEquipments: []
              })
              that.loadEquipments()
            } else {
              wx.showToast({ title: res.message || '出售失败', icon: 'none' })
            }
          }).catch(function(err) {
            wx.hideLoading()
            wx.showToast({ title: '出售异常', icon: 'none' })
          })
        }
      }
    })
  },

  useItem: function() {
    var that = this
    var item = this.data.selectedItem
    if (!item || item.isEquipment || !item.usable) return
    
    wx.showModal({
      title: '使用物品',
      content: '确定使用 ' + item.name + '？',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({ title: '使用中...' })
          
          request({
            url: '/warehouse/use',
            method: 'POST',
            data: { itemId: item.itemId, count: 1 }
          }).then(function(res) {
            wx.hideLoading()
            if (res.code === 200 && res.data) {
              wx.showToast({ title: res.data.message || '使用成功', icon: 'success' })
              that.setData({ selectedItem: null })
              that.loadItems()
              that.loadResources()
            } else {
              wx.showToast({ title: res.message || '使用失败', icon: 'none' })
            }
          }).catch(function(err) {
            wx.hideLoading()
            wx.showToast({ title: '使用异常', icon: 'none' })
          })
        }
      }
    })
  },

  discardItem: function() {
    var that = this
    var item = this.data.selectedItem
    if (!item || item.isEquipment) return
    
    wx.showModal({
      title: '丢弃物品',
      content: '确定丢弃 ' + item.name + ' x1？\n此操作不可恢复！',
      success: function(res) {
        if (res.confirm) {
          wx.showToast({ title: '已丢弃', icon: 'success' })
          that.setData({ selectedItem: null })
          that.loadItems()
        }
      }
    })
  },

  goBack: function() {
    wx.navigateBack()
  }
})
