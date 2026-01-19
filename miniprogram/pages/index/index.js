// pages/index/index.js
const app = getApp()
const request = require('../../utils/request.js')

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

  onLoad() {
    if (app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo })
    }

    if (!app.globalData.chatMessages || app.globalData.chatMessages.length === 0) {
      app.globalData.chatMessages = [
        { id: 1, user: '系统', text: '欢迎来到三国志·战役！', time: Date.now() }
      ]
    }
    this.updateLastMessage()

    this.fetchUserLevel()
    this.fetchGenerals()
    this.fetchUserResource()
  },

  onShow() {
    if (!app.checkLoginStatus()) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    
    if (app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo })
    }
    
    this.updateLastMessage()
    this.fetchUserLevel()
    this.fetchGenerals()
    this.fetchUserResource()
  },

  async fetchUserLevel() {
    try {
      const response = await request({ url: '/level', method: 'GET' })
      if (response.code === 200 && response.data) {
        const { level, currentExp, nextLevelExp } = response.data
        this.setData({
          level: level || 1,
          currentExp: currentExp || 0,
          nextLevelExp: nextLevelExp || 100,
          expPercent: nextLevelExp > 0 ? Math.floor((currentExp / nextLevelExp) * 100) : 0
        })
      }
    } catch (error) {
      console.error('获取等级失败:', error)
    }
  },

  async fetchGenerals() {
    try {
      const response = await request({ url: '/general/list', method: 'GET' })
      if (response.code === 200 && response.data) {
        const generals = response.data.map(g => {
          g.avatar = this.data.userInfo?.avatarUrl || ''
          return g
        })
        
        const displayGenerals = [null, null, null, null, null, null]
        for (let i = 0; i < Math.min(6, generals.length); i++) {
          displayGenerals[i] = generals[i]
        }
        
        this.setData({ 
          generals,
          displayGenerals,
          generalCount: generals.length
        })

        if (generals.length === 0) {
          await this.initGenerals()
        }
      }
    } catch (error) {
      console.error('获取武将失败:', error)
    }
  },

  async initGenerals() {
    try {
      const response = await request({ url: '/general/init', method: 'POST' })
      if (response.code === 200 && response.data) {
        const generals = response.data.map(g => {
          g.avatar = this.data.userInfo?.avatarUrl || ''
          return g
        })
        
        const displayGenerals = [null, null, null, null, null, null]
        for (let i = 0; i < Math.min(6, generals.length); i++) {
          displayGenerals[i] = generals[i]
        }
        
        this.setData({ 
          generals,
          displayGenerals,
          generalCount: generals.length
        })
        wx.showToast({ title: '获得初始武将！', icon: 'success' })
      }
    } catch (error) {
      console.error('初始化武将失败:', error)
    }
  },

  // 左侧悬浮图标点击
  onLeftIconTap(e) {
    const name = e.currentTarget.dataset.name
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
  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          app.clearLoginInfo()
          wx.showToast({ title: '已退出登录', icon: 'success' })
          // 跳转到登录页
          setTimeout(() => {
            wx.redirectTo({ url: '/pages/login/login' })
          }, 1000)
        }
      }
    })
  },

  // 右侧悬浮图标点击
  onRightIconTap(e) {
    const name = e.currentTarget.dataset.name
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

  onGeneralTap(e) {
    const index = e.currentTarget.dataset.index
    const general = this.data.displayGenerals[index]
    if (general) {
      wx.navigateTo({ url: `/pages/character/character?id=${general.id}` })
    } else {
      wx.navigateTo({ url: '/pages/recruit/recruit' })
    }
  },

  goToCharacterDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/character/character?id=${id}` })
  },

  // 中间功能按钮
  goToEquipment() {
    wx.navigateTo({ url: '/pages/equipment/equipment' })
  },

  goToFormation() {
    wx.navigateTo({ url: '/pages/formation/formation' })
  },

  goToTactics() {
    wx.navigateTo({ url: '/pages/tactics/tactics' })
  },

  goToTrain() {
    wx.navigateTo({ url: '/pages/training/training' })
  },

  goToEnhance() {
    wx.showToast({ title: '强化功能开发中', icon: 'none' })
  },

  goToSoldier() {
    wx.showToast({ title: '士兵功能开发中', icon: 'none' })
  },

  // 底部功能图标
  goToRecruit() {
    wx.navigateTo({ url: '/pages/recruit/recruit' })
  },

  goToCraft() {
    wx.navigateTo({ url: '/pages/craft/craft' })
  },

  goToSecretRealm() {
    wx.navigateTo({ url: '/pages/secretRealm/secretRealm' })
  },

  goToDungeon() {
    wx.navigateTo({ url: '/pages/dungeon/dungeon' })
  },

  goToWarehouse() {
    wx.navigateTo({ url: '/pages/warehouse/warehouse' })
  },

  goToAlliance() {
    wx.showToast({ title: '联盟功能开发中', icon: 'none' })
  },

  goToCharacter() {
    wx.navigateTo({ url: '/pages/character/character' })
  },

  updateLastMessage() {
    const messages = app.globalData.chatMessages || []
    if (messages.length > 0) {
      this.setData({ lastMessage: messages[messages.length - 1] })
    }
  },

  openChatPage() {
    wx.navigateTo({ url: '/pages/chat/chat' })
  },

  // 从后端获取用户资源
  async fetchUserResource() {
    try {
      const response = await request({ url: '/resource/summary', method: 'GET' })
      if (response.code === 200 && response.data) {
        const data = response.data
        this.setData({
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
    } catch (error) {
      console.error('获取资源失败:', error)
    }
  },

  // 打开充值页面
  goToRecharge() {
    wx.navigateTo({ url: '/pages/recharge/recharge' })
  }
})
