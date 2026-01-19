// pages/shop/shop.js
var app = getApp()

Page({
  data: {
    userGold: 14894,
    currentTab: 'enhance',
    currentGoods: [],
    
    // 所有商品数据
    allGoods: {
      // 强化材料
      enhance: [
        { id: 'stone1', name: '1级强化石', icon: '💎', quality: 'white', price: 2, desc: '强化1-10级装备' },
        { id: 'stone2', name: '2级强化石', icon: '💎', quality: 'green', price: 5, desc: '强化11-20级装备' },
        { id: 'stone3', name: '3级强化石', icon: '💎', quality: 'green', price: 10, desc: '强化21-40级装备' },
        { id: 'stone4', name: '4级强化石', icon: '💎', quality: 'blue', price: 20, desc: '强化41-60级装备' },
        { id: 'stone5', name: '5级强化石', icon: '💎', quality: 'purple', price: 50, desc: '强化61-80级装备' },
        { id: 'stone6', name: '6级强化石', icon: '💎', quality: 'orange', price: 100, desc: '强化81-100级装备' },
        { id: 'protect', name: '强化保护符', icon: '🛡️', quality: 'purple', price: 50, desc: '强化失败不降级' },
        { id: 'lucky', name: '幸运符', icon: '🍀', quality: 'blue', price: 30, desc: '强化成功率+10%' }
      ],
      // 招贤令
      recruit: [
        { id: 'recruit_junior', name: '初级招贤令', icon: '📜', quality: 'green', price: 5, desc: '招募绿/白武将' },
        { id: 'recruit_mid', name: '中级招贤令', icon: '📜', quality: 'blue', price: 15, desc: '招募蓝/红武将' },
        { id: 'recruit_senior', name: '高级招贤令', icon: '📜', quality: 'purple', price: 200, desc: '招募紫/橙武将' },
        { id: 'recruit_supreme', name: '至尊招贤令', icon: '📜', quality: 'orange', price: 500, desc: '必得橙色武将' },
        { id: 'recruit_pack5', name: '招贤令礼包(5张)', icon: '🎁', quality: 'blue', price: 70, desc: '5张中级招贤令' },
        { id: 'recruit_pack10', name: '招贤令礼包(10张)', icon: '🎁', quality: 'purple', price: 130, desc: '10张中级招贤令' }
      ],
      // 资源包
      resource: [
        { id: 'wood_s', name: '小木材包', icon: '🪵', quality: 'white', price: 5, desc: '木材x100' },
        { id: 'wood_m', name: '中木材包', icon: '🪵', quality: 'green', price: 20, desc: '木材x500' },
        { id: 'wood_l', name: '大木材包', icon: '🪵', quality: 'blue', price: 80, desc: '木材x2500' },
        { id: 'metal_s', name: '小金属包', icon: '⚙️', quality: 'white', price: 5, desc: '金属x100' },
        { id: 'metal_m', name: '中金属包', icon: '⚙️', quality: 'green', price: 20, desc: '金属x500' },
        { id: 'metal_l', name: '大金属包', icon: '⚙️', quality: 'blue', price: 80, desc: '金属x2500' },
        { id: 'food_s', name: '小粮食包', icon: '🌾', quality: 'white', price: 5, desc: '粮食x100' },
        { id: 'food_m', name: '中粮食包', icon: '🌾', quality: 'green', price: 20, desc: '粮食x500' },
        { id: 'food_l', name: '大粮食包', icon: '🌾', quality: 'blue', price: 80, desc: '粮食x2500' },
        { id: 'silver_s', name: '小银两包', icon: '🥈', quality: 'white', price: 10, desc: '银两x10000' },
        { id: 'silver_m', name: '中银两包', icon: '🥈', quality: 'green', price: 50, desc: '银两x60000' },
        { id: 'silver_l', name: '大银两包', icon: '🥈', quality: 'blue', price: 200, desc: '银两x300000' }
      ],
      // 消耗品
      consumable: [
        { id: 'stamina_s', name: '小体力丹', icon: '⚡', quality: 'green', price: 10, desc: '恢复20点体力' },
        { id: 'stamina_m', name: '中体力丹', icon: '⚡', quality: 'blue', price: 25, desc: '恢复50点体力' },
        { id: 'stamina_l', name: '大体力丹', icon: '⚡', quality: 'purple', price: 50, desc: '恢复100点体力' },
        { id: 'exp_s', name: '小经验丹', icon: '📕', quality: 'green', price: 15, desc: '获得1000经验' },
        { id: 'exp_m', name: '中经验丹', icon: '📕', quality: 'blue', price: 40, desc: '获得3000经验' },
        { id: 'exp_l', name: '大经验丹', icon: '📕', quality: 'purple', price: 100, desc: '获得10000经验' },
        { id: 'army_order', name: '军需令', icon: '📋', quality: 'blue', price: 20, desc: '增加1次副本次数' },
        { id: 'reset_order', name: '重置令', icon: '🔄', quality: 'purple', price: 50, desc: '重置每日副本次数' }
      ],
      // 特殊道具
      special: [
        { id: 'rename_card', name: '改名卡', icon: '✏️', quality: 'blue', price: 100, desc: '更改武将名称' },
        { id: 'quality_up', name: '品质提升丹', icon: '⬆️', quality: 'orange', price: 1000, desc: '武将品质提升1级' },
        { id: 'skill_book', name: '兵法秘籍', icon: '📖', quality: 'purple', price: 200, desc: '随机获得一个兵法' },
        { id: 'soldier_exp', name: '练兵令', icon: '🎖️', quality: 'blue', price: 30, desc: '士兵经验+1000' },
        { id: 'vip_card', name: 'VIP体验卡', icon: '👑', quality: 'orange', price: 500, desc: '3天VIP特权', dailyLimit: 1 },
        { id: 'gift_box', name: '神秘宝箱', icon: '🎁', quality: 'purple', price: 150, desc: '随机获得稀有物品' },
        { id: 'compose_s', name: '初级合成符', icon: '🔮', quality: 'green', price: 10, desc: '合成初级装备' },
        { id: 'compose_m', name: '中级合成符', icon: '🔮', quality: 'blue', price: 30, desc: '合成中级装备' },
        { id: 'compose_l', name: '高级合成符', icon: '🔮', quality: 'purple', price: 80, desc: '合成高级装备' }
      ]
    },
    
    // 购买弹窗
    showBuyModal: false,
    selectedItem: null,
    buyCount: 1
  },

  onLoad: function() {
    this.loadUserGold()
    this.switchTab({ currentTarget: { dataset: { tab: 'enhance' } } })
  },

  onShow: function() {
    this.loadUserGold()
  },

  loadUserGold: function() {
    var gold = wx.getStorageSync('userGold')
    if (gold) {
      this.setData({ userGold: parseInt(gold) })
    }
  },

  switchTab: function(e) {
    var tab = e.currentTarget.dataset.tab
    var goods = this.data.allGoods[tab] || []
    this.setData({
      currentTab: tab,
      currentGoods: goods
    })
  },

  buyItem: function(e) {
    var id = e.currentTarget.dataset.id
    var goods = this.data.currentGoods
    var item = null
    for (var i = 0; i < goods.length; i++) {
      if (goods[i].id === id) {
        item = goods[i]
        break
      }
    }
    
    if (item) {
      this.setData({
        showBuyModal: true,
        selectedItem: item,
        buyCount: 1
      })
    }
  },

  decreaseCount: function() {
    if (this.data.buyCount > 1) {
      this.setData({ buyCount: this.data.buyCount - 1 })
    }
  },

  increaseCount: function() {
    var maxCount = 99
    var item = this.data.selectedItem
    if (item && item.dailyLimit) {
      maxCount = item.dailyLimit - (item.bought || 0)
    }
    if (this.data.buyCount < maxCount) {
      this.setData({ buyCount: this.data.buyCount + 1 })
    }
  },

  closeBuyModal: function() {
    this.setData({ showBuyModal: false, selectedItem: null, buyCount: 1 })
  },

  confirmBuy: function() {
    var item = this.data.selectedItem
    var count = this.data.buyCount
    var totalPrice = item.price * count
    var userGold = this.data.userGold
    
    if (userGold < totalPrice) {
      wx.showToast({ title: '黄金不足', icon: 'none' })
      return
    }
    
    // 检查每日限制
    if (item.dailyLimit) {
      var bought = item.bought || 0
      if (bought + count > item.dailyLimit) {
        wx.showToast({ title: '已达每日购买上限', icon: 'none' })
        return
      }
    }
    
    // 扣除金币
    var newGold = userGold - totalPrice
    wx.setStorageSync('userGold', newGold)
    
    // 保存购买的物品到背包
    this.addToInventory(item, count)
    
    // 更新UI
    this.setData({
      userGold: newGold,
      showBuyModal: false
    })
    
    wx.showToast({
      title: '购买成功！',
      icon: 'success'
    })
  },

  addToInventory: function(item, count) {
    var inventory = wx.getStorageSync('inventory') || {}
    var itemId = item.id
    
    if (inventory[itemId]) {
      inventory[itemId].count += count
    } else {
      inventory[itemId] = {
        id: item.id,
        name: item.name,
        icon: item.icon,
        quality: item.quality,
        desc: item.desc,
        count: count
      }
    }
    
    wx.setStorageSync('inventory', inventory)
  },

  goBack: function() {
    wx.navigateBack()
  }
})


