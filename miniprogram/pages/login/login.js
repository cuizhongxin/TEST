// pages/login/login.js
const app = getApp()
const { login } = require('../../utils/auth.js')
const request = require('../../utils/request.js')

Page({
  data: {
    isLoading: false,
    // 国家选择
    showNationSelect: false,
    nations: [],
    selectedNation: null
  },

  onLoad() {
    // 检查是否已登录
    if (app.checkLoginStatus()) {
      this.checkNationAndRedirect()
    }
  },

  // 检查国籍并跳转
  async checkNationAndRedirect() {
    try {
      const res = await request({
        url: '/api/nationwar/has-nation',
        method: 'GET'
      })
      
      if (res.hasNation) {
        // 已选择国家，跳转主页
        app.globalData.playerNation = res.nation
        app.globalData.playerNationName = res.nationName
        wx.redirectTo({ url: '/pages/index/index' })
      } else {
        // 未选择国家，显示选择界面
        this.loadNations()
      }
    } catch (err) {
      console.error('检查国籍失败:', err)
      // 出错时直接进入主页
      wx.redirectTo({ url: '/pages/index/index' })
    }
  },

  // 加载国家列表
  async loadNations() {
    try {
      const res = await request({
        url: '/api/nationwar/nations',
        method: 'GET'
      })
      
      this.setData({
        nations: res.nations || [],
        showNationSelect: true
      })
    } catch (err) {
      console.error('加载国家列表失败:', err)
    }
  },

  // 选择国家
  onSelectNation(e) {
    const nationId = e.currentTarget.dataset.nation
    this.setData({ selectedNation: nationId })
  },

  // 确认选择国家
  async confirmNation() {
    if (!this.data.selectedNation) {
      wx.showToast({ title: '请选择一个国家', icon: 'none' })
      return
    }

    try {
      const res = await request({
        url: '/api/nationwar/select-nation',
        method: 'POST',
        data: { nationId: this.data.selectedNation }
      })

      wx.showToast({
        title: res.message || '选择成功',
        icon: 'success',
        duration: 1500
      })

      app.globalData.playerNation = this.data.selectedNation
      
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/index/index' })
      }, 1500)
    } catch (err) {
      console.error('选择国家失败:', err)
      wx.showToast({ title: err.message || '选择失败', icon: 'none' })
    }
  },

  async handleLogin() {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })

    try {
      const result = await login()
      
      if (result.success) {
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        })

        setTimeout(() => {
          // 登录成功后检查国籍
          this.checkNationAndRedirect()
        }, 1500)
      } else {
        wx.showToast({
          title: result.message || '登录失败',
          icon: 'none',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('登录失败:', error)
      wx.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setData({ isLoading: false })
    }
  }
})


