// pages/character/character.js - 将领详情页
var request = require('../../utils/request.js')

Page({
  data: {
    activeTab: 'list', // list, detail, inherit, drill
    
    // 将领列表
    generals: [],
    selectedGeneral: null,
    
    // 装备
    equipSlots: [
      { id: 1, name: '武器', icon: '🗡️' },
      { id: 2, name: '头盔', icon: '⛑️' },
      { id: 3, name: '铠甲', icon: '🛡️' },
      { id: 4, name: '戒指', icon: '💍' },
      { id: 5, name: '鞋子', icon: '👢' },
      { id: 6, name: '项链', icon: '📿' }
    ],
    generalEquipments: {},
    
    // 解雇弹窗
    showDismissModal: false,
    
    // 传承
    inheritScrolls: [
      { id: 'basic', name: '初级传承符', rate: 50, count: 0 },
      { id: 'medium', name: '中级传承符', rate: 75, count: 0 },
      { id: 'advanced', name: '高级传承符', rate: 100, count: 0 }
    ],
    selectedScroll: null,
    sourceGeneral: null,
    showSourceModal: false,
    canInherit: false,
    
    // 军事演习
    drillItems: [
      { id: 'small', name: '小型演习令', icon: '🎖️', exp: 100, count: 0 },
      { id: 'medium', name: '中型演习令', icon: '🏅', exp: 500, count: 0 },
      { id: 'large', name: '大型演习令', icon: '🎯', exp: 2000, count: 0 }
    ],
    selectedDrill: null,
    drillCount: 1,
    canDrill: false,
    
    // 预览值
    inheritExpPreview: 0,
    drillExpPreview: 0
  },

  onLoad(options) {
    // 如果传入了将领ID，直接选中
    if (options.id) {
      this.loadGeneralById(options.id)
    }
    this.loadGenerals()
    this.loadResources()
  },

  onShow() {
    this.loadGenerals()
    this.loadResources()
  },

  // 切换选项卡
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    
    if (tab === 'detail' && this.data.selectedGeneral) {
      this.loadGeneralEquipments(this.data.selectedGeneral.id)
    }
  },

  // 加载将领列表
  async loadGenerals() {
    try {
      const res = await request({ url: '/general/list', method: 'GET' })
      if (res.code === 200 && res.data) {
        this.setData({ generals: res.data })
        // 如果没有选中的将领，默认选中第一个
        if (!this.data.selectedGeneral && res.data.length > 0) {
          this.selectGeneral({ currentTarget: { dataset: { general: res.data[0] } } })
        } else if (this.data.selectedGeneral) {
          // 刷新选中将领的数据
          const updated = res.data.find(g => g.id === this.data.selectedGeneral.id)
          if (updated) {
            this.setData({ selectedGeneral: updated })
          }
        }
      }
    } catch (err) {
      console.error('加载将领失败:', err)
    }
  },

  // 加载指定将领
  async loadGeneralById(generalId) {
    try {
      const res = await request({ url: '/general/' + generalId, method: 'GET' })
      if (res.code === 200 && res.data) {
        this.setData({ selectedGeneral: res.data })
      }
    } catch (err) {
      console.error('加载将领详情失败:', err)
    }
  },

  // 加载资源（传承符、演习令）
  async loadResources() {
    try {
      const res = await request({ url: '/resource', method: 'GET' })
      if (res.code === 200 && res.data) {
        // 更新传承符数量
        const scrolls = this.data.inheritScrolls.map(s => {
          if (s.id === 'basic') s.count = res.data.inheritScrollBasic || 0
          if (s.id === 'medium') s.count = res.data.inheritScrollMedium || 0
          if (s.id === 'advanced') s.count = res.data.inheritScrollAdvanced || 0
          return s
        })
        
        // 更新演习令数量
        const drills = this.data.drillItems.map(d => {
          if (d.id === 'small') d.count = res.data.drillOrderSmall || 5
          if (d.id === 'medium') d.count = res.data.drillOrderMedium || 3
          if (d.id === 'large') d.count = res.data.drillOrderLarge || 1
          return d
        })
        
        this.setData({ inheritScrolls: scrolls, drillItems: drills })
      }
    } catch (err) {
      console.error('加载资源失败:', err)
    }
  },

  // 选择将领
  selectGeneral(e) {
    const general = e.currentTarget.dataset.general
    this.setData({ 
      selectedGeneral: general,
      sourceGeneral: null // 清除传承源
    })
    this.updateCanInherit()
    this.updateCanDrill()
    
    if (this.data.activeTab === 'detail') {
      this.loadGeneralEquipments(general.id)
    }
  },

  // 加载将领装备
  async loadGeneralEquipments(generalId) {
    try {
      const res = await request({ 
        url: '/equipment/general/' + generalId, 
        method: 'GET' 
      })
      if (res.code === 200 && res.data) {
        const equips = {}
        // 确保 res.data 是数组
        const equipList = Array.isArray(res.data) ? res.data : []
        equipList.forEach(eq => {
          if (eq && eq.slotType && eq.slotType.id) {
            equips[eq.slotType.id] = eq
          }
        })
        this.setData({ generalEquipments: equips })
      } else {
        // 没有装备数据，清空
        this.setData({ generalEquipments: {} })
      }
    } catch (err) {
      console.error('加载装备失败:', err)
      this.setData({ generalEquipments: {} })
    }
  },

  // 点击装备槽位
  onEquipSlotTap(e) {
    const slot = e.currentTarget.dataset.slot
    wx.navigateTo({
      url: '/pages/equipment/equipment?generalId=' + this.data.selectedGeneral.id + '&slotId=' + slot.id
    })
  },

  // ==================== 解雇功能 ====================
  
  showDismissConfirm() {
    if (!this.data.selectedGeneral) return
    this.setData({ showDismissModal: true })
  },

  closeDismissModal() {
    this.setData({ showDismissModal: false })
  },

  async doDismiss() {
    if (!this.data.selectedGeneral) return
    
    try {
      const res = await request({
        url: '/general/dismiss',
        method: 'POST',
        data: { generalId: this.data.selectedGeneral.id }
      })
      
      if (res.code === 200) {
        wx.showToast({ title: '解雇成功', icon: 'success' })
        this.setData({ 
          showDismissModal: false,
          selectedGeneral: null 
        })
        this.loadGenerals()
      } else {
        wx.showToast({ title: res.message || '解雇失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '解雇失败', icon: 'none' })
    }
  },

  // ==================== 传承功能 ====================
  
  selectInheritScroll(e) {
    const id = e.currentTarget.dataset.id
    const scroll = this.data.inheritScrolls.find(s => s.id === id)
    if (scroll && scroll.count > 0) {
      this.setData({ selectedScroll: id })
      this.updateCanInherit()
    } else {
      wx.showToast({ title: '传承符不足', icon: 'none' })
    }
  },

  selectSourceGeneral() {
    this.setData({ showSourceModal: true })
  },

  closeSourceModal() {
    this.setData({ showSourceModal: false })
  },

  confirmSourceGeneral(e) {
    const general = e.currentTarget.dataset.general
    this.setData({ 
      sourceGeneral: general,
      showSourceModal: false 
    })
    this.updateCanInherit()
  },

  updateCanInherit() {
    const canInherit = this.data.selectedGeneral && 
                       this.data.sourceGeneral && 
                       this.data.selectedScroll &&
                       this.data.selectedGeneral.id !== this.data.sourceGeneral.id
    
    // 计算预览经验
    let inheritExpPreview = 0
    if (this.data.sourceGeneral && this.data.selectedScroll) {
      const scroll = this.data.inheritScrolls.find(s => s.id === this.data.selectedScroll)
      if (scroll) {
        const sourceExp = this.data.sourceGeneral.exp || 0
        inheritExpPreview = Math.floor(sourceExp * (scroll.rate / 100))
      }
    }
    
    this.setData({ canInherit, inheritExpPreview })
  },

  async doInherit() {
    if (!this.data.canInherit) {
      wx.showToast({ title: '请完善传承信息', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认传承',
      content: `将【${this.data.sourceGeneral.name}】的经验传承给【${this.data.selectedGeneral.name}】？\n\n注意：${this.data.sourceGeneral.name}将永久消失！`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await request({
              url: '/general/inherit',
              method: 'POST',
              data: {
                sourceGeneralId: this.data.sourceGeneral.id,
                targetGeneralId: this.data.selectedGeneral.id,
                scrollType: this.data.selectedScroll
              }
            })
            
            if (result.code === 200) {
              wx.showModal({
                title: '传承成功',
                content: `${this.data.selectedGeneral.name}获得了${result.data.expGained}点经验！`,
                showCancel: false
              })
              this.setData({ sourceGeneral: null, selectedScroll: null })
              this.loadGenerals()
              this.loadResources()
            } else {
              wx.showToast({ title: result.message || '传承失败', icon: 'none' })
            }
          } catch (err) {
            wx.showToast({ title: '传承失败', icon: 'none' })
          }
        }
      }
    })
  },

  // ==================== 军事演习功能 ====================
  
  selectDrillItem(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.drillItems.find(d => d.id === id)
    if (item && item.count > 0) {
      this.setData({ 
        selectedDrill: id,
        drillCount: 1 
      })
      this.updateCanDrill()
    } else {
      wx.showToast({ title: '演习令不足', icon: 'none' })
    }
  },

  decreaseDrillCount() {
    if (this.data.drillCount > 1) {
      const newCount = this.data.drillCount - 1
      const item = this.data.drillItems.find(d => d.id === this.data.selectedDrill)
      const drillExpPreview = item ? item.exp * newCount : 0
      this.setData({ drillCount: newCount, drillExpPreview })
      this.updateCanDrill()
    }
  },

  increaseDrillCount() {
    const item = this.data.drillItems.find(d => d.id === this.data.selectedDrill)
    if (item && this.data.drillCount < item.count) {
      const newCount = this.data.drillCount + 1
      const drillExpPreview = item.exp * newCount
      this.setData({ drillCount: newCount, drillExpPreview })
      this.updateCanDrill()
    }
  },

  maxDrillCount() {
    const item = this.data.drillItems.find(d => d.id === this.data.selectedDrill)
    if (item) {
      const drillExpPreview = item.exp * item.count
      this.setData({ drillCount: item.count, drillExpPreview })
      this.updateCanDrill()
    }
  },

  updateCanDrill() {
    const canDrill = this.data.selectedGeneral && 
                     this.data.selectedDrill &&
                     this.data.drillCount > 0
    
    // 计算预览经验
    let drillExpPreview = 0
    if (this.data.selectedDrill) {
      const item = this.data.drillItems.find(d => d.id === this.data.selectedDrill)
      if (item) {
        drillExpPreview = item.exp * this.data.drillCount
      }
    }
    
    this.setData({ canDrill, drillExpPreview })
  },

  async doDrill() {
    if (!this.data.canDrill) {
      wx.showToast({ title: '请选择演习令', icon: 'none' })
      return
    }

    try {
      const result = await request({
        url: '/general/drill',
        method: 'POST',
        data: {
          generalId: this.data.selectedGeneral.id,
          drillType: this.data.selectedDrill,
          count: this.data.drillCount
        }
      })
      
      if (result.code === 200) {
        let message = `获得${result.data.expGained}点经验！`
        if (result.data.levelUp) {
          message += `\n升级到Lv.${result.data.newLevel}！`
        }
        
        wx.showModal({
          title: '演习完成',
          content: message,
          showCancel: false
        })
        
        this.setData({ selectedDrill: null, drillCount: 1 })
        this.loadGenerals()
        this.loadResources()
      } else {
        wx.showToast({ title: result.message || '演习失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '演习失败', icon: 'none' })
    }
  },

  // 返回
  goBack() {
    wx.navigateBack()
  }
})
