// pages/enhance/enhance.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    // 选项卡
    activeTab: 'enhance', // enhance, quality, fuse, decompose
    
    // 武将列表
    generals: [],
    selectedGeneral: null,
    
    // 装备列表
    equipments: [],
    selectedEquipment: null,
    
    // 强化信息
    enhanceInfo: null,
    useProtect: false,
    enhancing: false,
    
    // 品质信息
    qualityInfo: null,
    upgrading: false,
    
    // 融合信息
    fuseEquipments: [], // 选中的3件装备
    targetSlotId: null,
    fusing: false,
    setEquipments: [], // 可融合的套装装备
    
    // 分解信息
    decomposeEquipments: [], // 选中要分解的装备
    decomposing: false,
    
    // 槽位信息
    slotTypes: [
      { id: 1, name: '武器', icon: '🗡️' },
      { id: 2, name: '头盔', icon: '⛑️' },
      { id: 3, name: '铠甲', icon: '🛡️' },
      { id: 4, name: '戒指', icon: '💍' },
      { id: 5, name: '鞋子', icon: '👢' },
      { id: 6, name: '项链', icon: '📿' }
    ],
    
    // 资源
    silver: 0,
    qualityStone: 0,
    enhanceStones: {}
  },

  onLoad() {
    this.loadGenerals()
    this.loadResource()
  },

  onShow() {
    this.loadResource()
    if (this.data.selectedGeneral) {
      this.loadEquipments(this.data.selectedGeneral.id)
    }
  },

  // 切换选项卡
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ 
      activeTab: tab,
      selectedEquipment: null,
      enhanceInfo: null,
      qualityInfo: null,
      fuseEquipments: [],
      decomposeEquipments: []
    })
    
    if (tab === 'fuse' || tab === 'decompose') {
      this.loadAllEquipments()
    }
  },

  // 加载武将列表
  async loadGenerals() {
    try {
      const res = await request({ url: '/general/list', method: 'GET' })
      if (res.code === 200 && res.data) {
        this.setData({ generals: res.data })
        if (res.data.length > 0) {
          this.selectGeneral({ currentTarget: { dataset: { general: res.data[0] } } })
        }
      }
    } catch (err) {
      console.error('加载武将失败:', err)
    }
  },

  // 选择武将
  selectGeneral(e) {
    const general = e.currentTarget.dataset.general
    this.setData({ 
      selectedGeneral: general,
      selectedEquipment: null,
      enhanceInfo: null,
      qualityInfo: null
    })
    this.loadEquipments(general.id)
  },

  // 加载武将装备
  async loadEquipments(generalId) {
    try {
      const res = await request({ 
        url: '/equipment/general/' + generalId, 
        method: 'GET' 
      })
      if (res.code === 200 && res.data) {
        // 按槽位整理装备
        const equipped = {}
        res.data.forEach(eq => {
          if (eq.slotType && eq.slotType.id) {
            equipped[eq.slotType.id] = eq
          }
        })
        this.setData({ equipments: equipped })
      }
    } catch (err) {
      console.error('加载装备失败:', err)
    }
  },

  // 加载所有装备（用于融合和分解）
  async loadAllEquipments() {
    try {
      const res = await request({ url: '/equipment/list', method: 'GET' })
      if (res.code === 200 && res.data) {
        // 筛选套装装备（未装备的）
        const setEquipments = res.data.filter(eq => 
          eq.setInfo && eq.setInfo.setId && !eq.equipped
        )
        this.setData({ setEquipments: setEquipments })
      }
    } catch (err) {
      console.error('加载装备列表失败:', err)
    }
  },

  // 加载资源
  async loadResource() {
    try {
      const res = await request({ url: '/resource', method: 'GET' })
      if (res.code === 200 && res.data) {
        this.setData({
          silver: res.data.silver || 0,
          qualityStone: res.data.qualityStone || 0,
          enhanceStones: {
            1: res.data.enhanceStone1 || 0,
            2: res.data.enhanceStone2 || 0,
            3: res.data.enhanceStone3 || 0,
            4: res.data.enhanceStone4 || 0,
            5: res.data.enhanceStone5 || 0,
            6: res.data.enhanceStone6 || 0
          }
        })
      }
    } catch (err) {
      console.error('加载资源失败:', err)
    }
  },

  // 选择装备槽位
  selectSlot(e) {
    const slotId = e.currentTarget.dataset.slotId
    const equipment = this.data.equipments[slotId]
    
    if (!equipment) {
      wx.showToast({ title: '该槽位没有装备', icon: 'none' })
      return
    }
    
    this.setData({ selectedEquipment: equipment })
    
    if (this.data.activeTab === 'enhance') {
      this.loadEnhanceInfo(equipment.id)
    } else if (this.data.activeTab === 'quality') {
      this.loadQualityInfo(equipment.id)
    }
  },

  // 加载强化信息
  async loadEnhanceInfo(equipmentId) {
    try {
      const res = await request({
        url: '/refine/enhance/info',
        method: 'GET',
        data: { equipmentId: equipmentId }
      })
      if (res.code === 200 && res.data) {
        this.setData({ enhanceInfo: res.data })
      }
    } catch (err) {
      console.error('加载强化信息失败:', err)
    }
  },

  // 加载品质信息
  async loadQualityInfo(equipmentId) {
    try {
      const res = await request({
        url: '/refine/quality/info',
        method: 'GET',
        data: { equipmentId: equipmentId }
      })
      if (res.code === 200 && res.data) {
        this.setData({ qualityInfo: res.data })
      }
    } catch (err) {
      console.error('加载品质信息失败:', err)
    }
  },

  // 切换保护符
  toggleProtect() {
    this.setData({ useProtect: !this.data.useProtect })
  },

  // 执行强化
  async doEnhance() {
    if (!this.data.selectedEquipment || this.data.enhancing) return
    
    this.setData({ enhancing: true })
    
    try {
      const res = await request({
        url: '/refine/enhance',
        method: 'POST',
        data: {
          equipmentId: this.data.selectedEquipment.id,
          useProtect: this.data.useProtect
        }
      })
      
      if (res.code === 200 && res.data) {
        const result = res.data
        if (result.success) {
          wx.showToast({ 
            title: '强化成功！+' + result.newLevel, 
            icon: 'success' 
          })
        } else {
          if (result.levelDown) {
            wx.showToast({ 
              title: '强化失败，等级降为+' + result.newLevel, 
              icon: 'none' 
            })
          } else {
            wx.showToast({ title: '强化失败', icon: 'none' })
          }
        }
        
        // 刷新数据
        this.loadEnhanceInfo(this.data.selectedEquipment.id)
        this.loadResource()
        this.loadEquipments(this.data.selectedGeneral.id)
      }
    } catch (err) {
      wx.showToast({ title: err.message || '强化失败', icon: 'none' })
    } finally {
      this.setData({ enhancing: false })
    }
  },

  // 执行品质提升
  async doUpgradeQuality() {
    if (!this.data.selectedEquipment || this.data.upgrading) return
    
    this.setData({ upgrading: true })
    
    try {
      const res = await request({
        url: '/refine/quality/upgrade',
        method: 'POST',
        data: {
          equipmentId: this.data.selectedEquipment.id
        }
      })
      
      if (res.code === 200 && res.data) {
        const result = res.data
        wx.showToast({ 
          title: '品质提升+' + result.upgrade + '%', 
          icon: 'success' 
        })
        
        if (result.isPerfect) {
          wx.showModal({
            title: '恭喜',
            content: '装备已达完美品质！',
            showCancel: false
          })
        }
        
        // 刷新数据
        this.loadQualityInfo(this.data.selectedEquipment.id)
        this.loadResource()
        this.loadEquipments(this.data.selectedGeneral.id)
      }
    } catch (err) {
      wx.showToast({ title: err.message || '品质提升失败', icon: 'none' })
    } finally {
      this.setData({ upgrading: false })
    }
  },

  // 选择融合装备
  selectFuseEquipment(e) {
    const equipment = e.currentTarget.dataset.equipment
    const fuseEquipments = this.data.fuseEquipments
    
    // 检查是否已选中
    const index = fuseEquipments.findIndex(eq => eq.id === equipment.id)
    if (index >= 0) {
      fuseEquipments.splice(index, 1)
    } else {
      if (fuseEquipments.length >= 3) {
        wx.showToast({ title: '最多选择3件装备', icon: 'none' })
        return
      }
      
      // 检查是否同套装
      if (fuseEquipments.length > 0) {
        if (fuseEquipments[0].setInfo.setId !== equipment.setInfo.setId) {
          wx.showToast({ title: '请选择同一套装的装备', icon: 'none' })
          return
        }
      }
      
      fuseEquipments.push(equipment)
    }
    
    this.setData({ fuseEquipments: fuseEquipments })
  },

  // 选择目标槽位
  selectTargetSlot(e) {
    const slotId = e.currentTarget.dataset.slotId
    this.setData({ targetSlotId: slotId })
  },

  // 执行融合
  async doFuse() {
    if (this.data.fuseEquipments.length !== 3) {
      wx.showToast({ title: '请选择3件同套装装备', icon: 'none' })
      return
    }
    if (!this.data.targetSlotId) {
      wx.showToast({ title: '请选择目标部位', icon: 'none' })
      return
    }
    
    this.setData({ fusing: true })
    
    try {
      const res = await request({
        url: '/refine/fuse',
        method: 'POST',
        data: {
          equipmentIds: this.data.fuseEquipments.map(eq => eq.id),
          targetSlotId: this.data.targetSlotId
        }
      })
      
      if (res.code === 200 && res.data) {
        wx.showModal({
          title: '融合成功',
          content: '获得：' + res.data.newEquipment.name,
          showCancel: false
        })
        
        // 刷新数据
        this.setData({ 
          fuseEquipments: [], 
          targetSlotId: null 
        })
        this.loadAllEquipments()
        this.loadResource()
      }
    } catch (err) {
      wx.showToast({ title: err.message || '融合失败', icon: 'none' })
    } finally {
      this.setData({ fusing: false })
    }
  },

  // 选择分解装备
  selectDecomposeEquipment(e) {
    const equipment = e.currentTarget.dataset.equipment
    const decomposeEquipments = this.data.decomposeEquipments
    
    const index = decomposeEquipments.findIndex(eq => eq.id === equipment.id)
    if (index >= 0) {
      decomposeEquipments.splice(index, 1)
    } else {
      decomposeEquipments.push(equipment)
    }
    
    this.setData({ decomposeEquipments: decomposeEquipments })
  },

  // 执行分解
  async doDecompose() {
    if (this.data.decomposeEquipments.length === 0) {
      wx.showToast({ title: '请选择要分解的装备', icon: 'none' })
      return
    }
    
    wx.showModal({
      title: '确认分解',
      content: '确定要分解选中的 ' + this.data.decomposeEquipments.length + ' 件装备吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ decomposing: true })
          
          try {
            const res = await request({
              url: '/refine/decompose',
              method: 'POST',
              data: {
                equipmentIds: this.data.decomposeEquipments.map(eq => eq.id)
              }
            })
            
            if (res.code === 200 && res.data) {
              wx.showModal({
                title: '分解成功',
                content: '获得品质石 ' + res.data.qualityStoneGained + ' 个\n银币 ' + res.data.silverGained,
                showCancel: false
              })
              
              this.setData({ decomposeEquipments: [] })
              this.loadAllEquipments()
              this.loadResource()
            }
          } catch (err) {
            wx.showToast({ title: err.message || '分解失败', icon: 'none' })
          } finally {
            this.setData({ decomposing: false })
          }
        }
      }
    })
  },

  // 返回
  goBack() {
    wx.navigateBack()
  }
})
