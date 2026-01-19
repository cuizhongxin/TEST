// pages/index/index.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    userInfo: null,
    // 等级经验
    level: 1,
    currentExp: 0,
    nextLevelExp: 100,
    expPercent: 0,
    // 资源
    rank: '白身',
    fame: 0,
    generalCount: 0,
    maxGeneral: 10,
    gold: 14894,
    silver: 4225105,
    stamina: 100,
    generalOrder: 9,
    // 左侧悬浮图标
    leftIcons: [
      { id: 1, icon: '🏔️', label: '秘境', name: 'secretRealm' },
      { id: 2, icon: '🔨', label: '锻造', name: 'craft' },
      { id: 3, icon: '📜', label: '招募', name: 'recruit' },
      { id: 4, icon: '🚪', label: '退出', name: 'logout' }
    ],
    // 右侧悬浮图标
    rightIcons: [
      { id: 1, icon: '💰', label: '充值', name: 'recharge' },
      { id: 2, icon: '🛒', label: '商店', name: 'shop' },
      { id: 3, icon: '📦', label: '仓库', name: 'warehouse' },
      { id: 4, icon: '📧', label: '邮件', name: 'mail' }
    ],
    // 武将
    generals: [],
    displayGenerals: [null, null, null, null, null, null],
    // 聊天
    lastMessage: null
  },

  onLoad: function() {
    var that = this
    if (app.globalData.userInfo) {
      that.setData({ userInfo: app.globalData.userInfo })
    }

    if (!app.globalData.chatMessages || app.globalData.chatMessages.length === 0) {
      app.globalData.chatMessages = [
        { id: 1, user: '系统', text: '欢迎来到三国志·战役！', time: Date.now() }
      ]
    }
    that.updateLastMessage()

    that.fetchUserLevel()
    that.fetchGenerals()
    that.fetchUserResource()
  },

  onShow: function() {
    var that = this
    if (!app.checkLoginStatus()) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    
    if (app.globalData.userInfo) {
      that.setData({ userInfo: app.globalData.userInfo })
    }
    
    that.updateLastMessage()
    that.fetchUserLevel()
    that.fetchGenerals()
    that.fetchUserResource()
  },

  fetchUserLevel: function() {
    var that = this
    request({ url: '/level', method: 'GET' }).then(function(response) {
      if (response.code === 200 && response.data) {
        var data = response.data
        var level = data.level || 1
        var currentExp = data.currentExp || 0
        var nextLevelExp = data.nextLevelExp || 100
        that.setData({
          level: level,
          currentExp: currentExp,
          nextLevelExp: nextLevelExp,
          expPercent: nextLevelExp > 0 ? Math.floor((currentExp / nextLevelExp) * 100) : 0
        })
      }
    }).catch(function(error) {
      console.error('获取等级失败:', error)
    })
  },

  fetchGenerals: function() {
    var that = this
    request({ url: '/general/list', method: 'GET' }).then(function(response) {
      if (response.code === 200 && response.data) {
        var generals = response.data.map(function(g) {
          var userInfo = that.data.userInfo
          g.avatar = (userInfo && userInfo.avatarUrl) ? userInfo.avatarUrl : ''
          return g
        })
        
        var displayGenerals = [null, null, null, null, null, null]
        for (var i = 0; i < Math.min(6, generals.length); i++) {
          displayGenerals[i] = generals[i]
        }
        
        that.setData({ 
          generals: generals,
          displayGenerals: displayGenerals,
          generalCount: generals.length
        })

        if (generals.length === 0) {
          that.initGenerals()
        }
      }
    }).catch(function(error) {
      console.error('获取武将失败:', error)
    })
  },

  initGenerals: function() {
    var that = this
    request({ url: '/general/init', method: 'POST' }).then(function(response) {
      if (response.code === 200 && response.data) {
        var generals = response.data.map(function(g) {
          var userInfo = that.data.userInfo
          g.avatar = (userInfo && userInfo.avatarUrl) ? userInfo.avatarUrl : ''
          return g
        })
        
        var displayGenerals = [null, null, null, null, null, null]
        for (var i = 0; i < Math.min(6, generals.length); i++) {
          displayGenerals[i] = generals[i]
        }
        
        that.setData({ 
          generals: generals,
          displayGenerals: displayGenerals,
          generalCount: generals.length
        })
        wx.showToast({ title: '获得初始武将！', icon: 'success' })
      }
    }).catch(function(error) {
      console.error('初始化武将失败:', error)
    })
  },

  // 左侧悬浮图标点击
  onLeftIconTap: function(e) {
    var name = e.currentTarget.dataset.name
    switch (name) {
      case 'secretRealm':
        wx.navigateTo({ url: '/pages/secretRealm/secretRealm' })
        break
      case 'craft':
        wx.navigateTo({ url: '/pages/craft/craft' })
        break
      case 'recruit':
        wx.navigateTo({ url: '/pages/recruit/recruit' })
        break
      case 'logout':
        this.handleLogout()
        break
    }
  },

  // 退出登录
  handleLogout: function() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: function(res) {
        if (res.confirm) {
          app.clearLoginInfo()
          wx.showToast({ title: '已退出登录', icon: 'success' })
          setTimeout(function() {
            wx.redirectTo({ url: '/pages/login/login' })
          }, 1000)
        }
      }
    })
  },

  // 右侧悬浮图标点击
  onRightIconTap: function(e) {
    var name = e.currentTarget.dataset.name
    switch (name) {
      case 'recharge':
        wx.navigateTo({ url: '/pages/recharge/recharge' })
        break
      case 'shop':
        wx.navigateTo({ url: '/pages/shop/shop' })
        break
      case 'warehouse':
        wx.navigateTo({ url: '/pages/warehouse/warehouse' })
        break
      case 'mail':
        wx.showToast({ title: '邮件功能开发中', icon: 'none' })
        break
      default:
        wx.showToast({ title: '功能开发中', icon: 'none' })
    }
  },

  onGeneralTap: function(e) {
    var index = e.currentTarget.dataset.index
    var general = this.data.displayGenerals[index]
    if (general) {
      wx.navigateTo({ url: '/pages/character/character?id=' + general.id })
    } else {
      wx.navigateTo({ url: '/pages/recruit/recruit' })
    }
  },

  goToCharacterDetail: function(e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/character/character?id=' + id })
  },

  // 中间功能按钮
  goToEquipment: function() {
    wx.navigateTo({ url: '/pages/equipment/equipment' })
  },

  goToFormation: function() {
    wx.navigateTo({ url: '/pages/formation/formation' })
  },

  goToTactics: function() {
    wx.navigateTo({ url: '/pages/tactics/tactics' })
  },

  goToTraining: function() {
    wx.navigateTo({ url: '/pages/training/training' })
  },

  goToTrain: function() {
    wx.showToast({ title: '训练功能开发中', icon: 'none' })
  },

  goToEnhance: function() {
    wx.navigateTo({ url: '/pages/enhance/enhance' })
  },

  goToSoldier: function() {
    wx.showToast({ title: '士兵功能开发中', icon: 'none' })
  },

  // 底部功能图标
  goToRecruit: function() {
    wx.navigateTo({ url: '/pages/recruit/recruit' })
  },

  goToCraft: function() {
    wx.navigateTo({ url: '/pages/craft/craft' })
  },

  goToSecretRealm: function() {
    wx.navigateTo({ url: '/pages/secretRealm/secretRealm' })
  },

  goToDungeon: function() {
    wx.navigateTo({ url: '/pages/dungeon/dungeon' })
  },

  goToWarehouse: function() {
    wx.navigateTo({ url: '/pages/warehouse/warehouse' })
  },

  goToAlliance: function() {
    wx.showToast({ title: '联盟功能开发中', icon: 'none' })
  },

  goToCharacter: function() {
    wx.navigateTo({ url: '/pages/character/character' })
  },

  updateLastMessage: function() {
    var messages = app.globalData.chatMessages || []
    if (messages.length > 0) {
      this.setData({ lastMessage: messages[messages.length - 1] })
    }
  },

  openChatPage: function() {
    wx.navigateTo({ url: '/pages/chat/chat' })
  },

  // 从后端获取用户资源
  fetchUserResource: function() {
    var that = this
    request({ url: '/resource/summary', method: 'GET' }).then(function(response) {
      if (response.code === 200 && response.data) {
        var data = response.data
        that.setData({
          gold: data.gold || 0,
          silver: data.silver || 0,
          stamina: data.stamina || 0,
          generalOrder: data.generalOrder || 0,
          rank: data.rank || '白身',
          fame: data.fame || 0,
          generalCount: data.generalCount || 0,
          maxGeneral: data.maxGeneral || 50
        })
      }
    }).catch(function(error) {
      console.error('获取资源失败:', error)
    })
  },

  // 打开充值页面
  goToRecharge: function() {
    wx.navigateTo({ url: '/pages/recharge/recharge' })
  }
})
