// pages/secretRealm/secretRealm.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    playerLevel: 1,
    userGold: 0,
    warehouseUsed: 0,
    warehouseMax: 100,
    
    realms: [],
    currentRealmIndex: 0,
    currentRealm: null,
    
    explorationRecords: [],
    announcements: [
      { player: '张三', itemName: '特训符', quality: 'purple' },
      { player: '李四', itemName: '昆仑剑', quality: 'purple' },
      { player: '王五', itemName: '初级经验丹', quality: 'green' }
    ],
    
    showResultModal: false,
    resultItems: [],
    isExploring: false
  },

  onLoad: function() {
    var realmsData = this.getRealmsData()
    this.setData({
      realms: realmsData,
      currentRealm: realmsData[0]
    })
    this.loadPlayerInfo()
  },

  onShow: function() {
    this.loadPlayerInfo()
  },

  getRealmsData: function() {
    return [
      {
        id: 'penglai',
        name: '蓬莱秘宝',
        minLevel: 40,
        costGold: 10,
        description: '蓬莱秘境之中一直有一个传说，这里蕴藏着神兵利器和大量珍贵材料。',
        rewards: [
          { id: 1, name: '鹰扬刀', icon: '🗡️', quality: 'blue' },
          { id: 2, name: '鹰扬戒', icon: '💍', quality: 'blue' },
          { id: 3, name: '鹰扬项链', icon: '📿', quality: 'blue' },
          { id: 4, name: '鹰扬铠', icon: '🛡️', quality: 'blue' },
          { id: 5, name: '鹰扬盔', icon: '⛑️', quality: 'blue' },
          { id: 6, name: '鹰扬靴', icon: '👢', quality: 'blue' },
          { id: 7, name: '银锭', icon: '🥈', quality: 'white' },
          { id: 8, name: '4级强化石', icon: '💎', quality: 'green' },
          { id: 9, name: '初级经验丹', icon: '📕', quality: 'green' },
          { id: 10, name: '中级招贤令', icon: '📜', quality: 'blue' },
          { id: 11, name: '中级合成符', icon: '📋', quality: 'blue' },
          { id: 12, name: '特训符', icon: '📑', quality: 'purple' }
        ]
      },
      {
        id: 'kunlun',
        name: '昆仑秘宝',
        minLevel: 60,
        costGold: 20,
        description: '昆仑山巅，传说有仙人遗留的宝藏，只有勇者才能一探究竟。',
        rewards: [
          { id: 1, name: '昆仑剑', icon: '⚔️', quality: 'purple' },
          { id: 2, name: '昆仑戒', icon: '💍', quality: 'purple' },
          { id: 3, name: '昆仑链', icon: '📿', quality: 'purple' },
          { id: 4, name: '昆仑甲', icon: '🛡️', quality: 'purple' },
          { id: 5, name: '昆仑盔', icon: '⛑️', quality: 'purple' },
          { id: 6, name: '昆仑靴', icon: '👢', quality: 'purple' },
          { id: 7, name: '金锭', icon: '🥇', quality: 'green' },
          { id: 8, name: '5级强化石', icon: '💎', quality: 'blue' },
          { id: 9, name: '中级经验丹', icon: '📕', quality: 'blue' },
          { id: 10, name: '高级招贤令', icon: '📜', quality: 'purple' }
        ]
      },
      {
        id: 'yaochi',
        name: '瑶池秘宝',
        minLevel: 80,
        costGold: 50,
        description: '瑶池仙境，王母娘娘的宝库，据说藏有天界至宝。',
        rewards: [
          { id: 1, name: '瑶池剑', icon: '⚔️', quality: 'orange' },
          { id: 2, name: '瑶池戒', icon: '💍', quality: 'orange' },
          { id: 3, name: '瑶池链', icon: '📿', quality: 'purple' },
          { id: 4, name: '瑶池甲', icon: '🛡️', quality: 'purple' },
          { id: 5, name: '瑶池盔', icon: '⛑️', quality: 'purple' },
          { id: 6, name: '瑶池靴', icon: '👢', quality: 'purple' },
          { id: 7, name: '仙晶', icon: '✨', quality: 'blue' },
          { id: 8, name: '6级强化石', icon: '💎', quality: 'purple' }
        ]
      },
      {
        id: 'jiutian',
        name: '九天秘宝',
        minLevel: 100,
        costGold: 100,
        description: '九天之上，诸神居所，传说中最强的神器皆出于此。',
        rewards: [
          { id: 1, name: '九天神剑', icon: '⚔️', quality: 'orange' },
          { id: 2, name: '九天神戒', icon: '💍', quality: 'orange' },
          { id: 3, name: '九天神链', icon: '📿', quality: 'orange' },
          { id: 4, name: '九天神甲', icon: '🛡️', quality: 'orange' },
          { id: 5, name: '九天神盔', icon: '⛑️', quality: 'orange' },
          { id: 6, name: '九天神靴', icon: '👢', quality: 'orange' }
        ]
      }
    ]
  },

  loadPlayerInfo: function() {
    var that = this
    
    // 获取玩家等级
    request({ url: '/level', method: 'GET' }).then(function(response) {
      if (response.code === 200 && response.data) {
        that.setData({ playerLevel: response.data.level || 1 })
      }
    }).catch(function(error) {
      console.error('获取等级失败:', error)
    })
    
    // 获取用户资源
    request({ url: '/resource/summary', method: 'GET' }).then(function(response) {
      if (response.code === 200 && response.data) {
        that.setData({ userGold: response.data.gold || 0 })
      }
    }).catch(function(error) {
      console.error('获取资源失败:', error)
    })
    
    // 获取仓库信息
    request({ url: '/warehouse/info', method: 'GET' }).then(function(response) {
      if (response.code === 200 && response.data) {
        var equipInfo = response.data.equipment || {}
        var itemInfo = response.data.item || {}
        that.setData({
          warehouseUsed: (equipInfo.used || 0) + (itemInfo.used || 0),
          warehouseMax: (equipInfo.capacity || 100) + (itemInfo.capacity || 100)
        })
      }
    }).catch(function(error) {
      console.error('获取仓库信息失败:', error)
    })
  },

  switchRealm: function(e) {
    var index = e.currentTarget.dataset.index
    var realm = this.data.realms[index]
    
    if (this.data.playerLevel < realm.minLevel) {
      wx.showToast({ 
        title: '需要达到' + realm.minLevel + '级', 
        icon: 'none' 
      })
      return
    }
    
    this.setData({
      currentRealmIndex: index,
      currentRealm: realm,
      explorationRecords: []
    })
  },

  explore: function(e) {
    var that = this
    var count = parseInt(e.currentTarget.dataset.count)
    var currentRealm = this.data.currentRealm
    var userGold = this.data.userGold
    var playerLevel = this.data.playerLevel
    
    if (this.data.isExploring) {
      return
    }
    
    if (!currentRealm) {
      wx.showToast({ title: '请选择秘境', icon: 'none' })
      return
    }
    
    if (playerLevel < currentRealm.minLevel) {
      wx.showToast({ title: '需要达到' + currentRealm.minLevel + '级', icon: 'none' })
      return
    }
    
    var discount = 1
    if (count === 10) discount = 0.95
    if (count === 50) discount = 0.9
    var totalCost = Math.floor(currentRealm.costGold * count * discount)
    
    if (userGold < totalCost) {
      wx.showToast({ title: '黄金不足', icon: 'none' })
      return
    }
    
    this.setData({ isExploring: true })
    wx.showLoading({ title: '探索中...' })
    
    // 调用后端 API
    request({
      url: '/secret-realm/explore',
      method: 'POST',
      data: {
        realmId: currentRealm.id,
        count: count
      }
    }).then(function(res) {
      wx.hideLoading()
      that.setData({ isExploring: false })
      
      if (res.code === 200 && res.data) {
        var result = res.data
        
        // 更新黄金
        that.setData({ userGold: result.remainingGold })
        
        // 合并到探索记录
        var explorationRecords = that.data.explorationRecords.slice()
        for (var i = 0; i < result.items.length; i++) {
          var item = result.items[i]
          var existingIndex = -1
          
          // 装备不合并
          if (item.type !== 'equipment') {
            for (var j = 0; j < explorationRecords.length; j++) {
              if (explorationRecords[j].id === item.id) {
                existingIndex = j
                break
              }
            }
          }
          
          if (existingIndex >= 0) {
            explorationRecords[existingIndex].count += item.count
          } else {
            explorationRecords.push({
              id: item.id,
              name: item.name,
              icon: item.icon,
              quality: item.quality,
              type: item.type,
              count: item.count
            })
          }
        }
        
        that.setData({
          explorationRecords: explorationRecords,
          resultItems: result.items,
          showResultModal: true
        })
        
        wx.showToast({
          title: '获得' + result.items.length + '种物品',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.message || '探索失败',
          icon: 'none'
        })
      }
    }).catch(function(error) {
      wx.hideLoading()
      that.setData({ isExploring: false })
      console.error('探索失败:', error)
      wx.showToast({ title: '探索失败', icon: 'none' })
    })
  },

  closeResultModal: function() {
    this.setData({ showResultModal: false })
    // 刷新仓库信息
    this.loadPlayerInfo()
  },

  goToWarehouse: function() {
    wx.navigateTo({ url: '/pages/warehouse/warehouse' })
  },

  goBack: function() {
    wx.navigateBack()
  }
})
