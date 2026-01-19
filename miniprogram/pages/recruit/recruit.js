// pages/recruit/recruit.js
const app = getApp()
const request = require('../../utils/request.js')

Page({
  data: {
    gold: 0,
    silver: 0,
    juniorToken: 0,
    intermediateToken: 0,
    seniorToken: 0,
    dailyClaimed: false,
    recruitedGenerals: []
  },

  onLoad() {
    this.loadResources()
  },

  onShow() {
    this.loadResources()
  },

  async loadResources() {
    try {
      const res = await request({ url: '/recruit/resource', method: 'GET' })
      if (res.code === 200 && res.data) {
        this.setData({
          gold: res.data.gold || 0,
          silver: res.data.silver || 0,
          juniorToken: res.data.juniorToken || 0,
          intermediateToken: res.data.intermediateToken || 0,
          seniorToken: res.data.seniorToken || 0,
          dailyClaimed: res.data.dailyTokenClaimed >= 3
        })
      }
    } catch (error) {
      console.error('加载资源失败:', error)
    }
  },

  async claimDaily() {
    wx.showLoading({ title: '领取中...' })
    try {
      const res = await request({ url: '/recruit/claim-daily', method: 'POST' })
      if (res.code === 200) {
        this.setData({
          juniorToken: res.data.juniorToken,
          dailyClaimed: res.data.dailyTokenClaimed >= 3
        })
        wx.showToast({ title: '领取成功！', icon: 'success' })
      } else {
        wx.showToast({ title: res.message || '领取失败', icon: 'none' })
      }
    } catch (error) {
      wx.showToast({ title: '领取异常', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  async buyToken(e) {
    const type = e.currentTarget.dataset.type
    const typeName = type === 'junior' ? '初级' : type === 'intermediate' ? '中级' : '高级'
    
    wx.showLoading({ title: '购买中...' })
    try {
      const res = await request({ 
        url: '/recruit/buy', 
        method: 'POST',
        data: { tokenType: type.toUpperCase() }
      })
      if (res.code === 200) {
        this.setData({
          gold: res.data.gold,
          silver: res.data.silver,
          juniorToken: res.data.juniorToken,
          intermediateToken: res.data.intermediateToken,
          seniorToken: res.data.seniorToken
        })
        wx.showToast({ title: '购买成功！', icon: 'success' })
      } else {
        wx.showToast({ title: res.message || '购买失败', icon: 'none' })
      }
    } catch (error) {
      wx.showToast({ title: '购买异常', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  async composeToken(e) {
    const from = e.currentTarget.dataset.from
    
    wx.showLoading({ title: '合成中...' })
    try {
      const res = await request({ 
        url: '/recruit/compose', 
        method: 'POST',
        data: { fromType: from.toUpperCase() }
      })
      if (res.code === 200) {
        this.setData({
          gold: res.data.gold,
          silver: res.data.silver,
          juniorToken: res.data.juniorToken,
          intermediateToken: res.data.intermediateToken,
          seniorToken: res.data.seniorToken
        })
        wx.showToast({ title: '合成成功！', icon: 'success' })
      } else {
        wx.showToast({ title: res.message || '合成失败', icon: 'none' })
      }
    } catch (error) {
      wx.showToast({ title: '合成异常', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  async recruit(e) {
    const type = e.currentTarget.dataset.type
    const count = parseInt(e.currentTarget.dataset.count) || 1
    
    // 检查招贤令数量
    let available = 0
    switch (type) {
      case 'JUNIOR': available = this.data.juniorToken; break
      case 'INTERMEDIATE': available = this.data.intermediateToken; break
      case 'SENIOR': available = this.data.seniorToken; break
    }
    
    if (available < count) {
      wx.showToast({ title: '招贤令不足', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '招募中...' })
    try {
      const res = await request({ 
        url: '/recruit/recruit', 
        method: 'POST',
        data: { tokenType: type, count: count }
      })
      if (res.code === 200 && res.data) {
        // 更新招贤令数量
        await this.loadResources()
        
        // 获取招募结果 - 后端返回 RecruitResult 对象
        const result = res.data
        const generals = result.generals || []
        
        // 显示招募结果
        this.setData({
          recruitedGenerals: generals
        })
        
        // 使用后端返回的高品质标记
        if (result.hasOrange) {
          wx.showToast({ title: '🎉 恭喜获得橙色武将！', icon: 'none', duration: 3000 })
        } else if (result.hasPurple) {
          wx.showToast({ title: '✨ 获得紫色武将！', icon: 'none', duration: 2000 })
        } else {
          wx.showToast({ title: '招募成功！', icon: 'success' })
        }
      } else {
        wx.showToast({ title: res.message || '招募失败', icon: 'none' })
      }
    } catch (error) {
      console.error('招募异常:', error)
      wx.showToast({ title: '招募异常', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  goBack() {
    wx.navigateBack()
  }
})
