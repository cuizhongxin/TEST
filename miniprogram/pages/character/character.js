// pages/character/character.js
const app = getApp()
const request = require('../../utils/request.js')

Page({
  data: {
    generals: [],
    selectedGeneral: null
  },

  onLoad() {
    this.fetchGenerals()
  },

  async fetchGenerals() {
    try {
      const response = await request({
        url: '/general/list',
        method: 'GET'
      })
      if (response.code === 200 && response.data) {
        const generals = response.data.map(g => {
          g.avatar = app.globalData.userInfo?.avatarUrl || ''
          return g
        })
        this.setData({
          generals,
          selectedGeneral: generals.length > 0 ? generals[0] : null
        })
      }
    } catch (error) {
      console.error('获取武将失败:', error)
    }
  },

  selectGeneral(e) {
    const id = e.currentTarget.dataset.id
    const general = this.data.generals.find(g => g.id === id)
    if (general) {
      this.setData({ selectedGeneral: general })
    }
  },

  goBack() {
    wx.navigateBack()
  }
})
