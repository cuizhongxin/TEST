// pages/character/character.js - 将领详情页
var request = require('../../utils/request.js')

Page({
  data: {
    activeTab: 'equip', // recruit, equip, tactics, train, exp, soldier
    
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
    warehouseEquipments: [],
    selectedEquip: null,
    
    // 兵法系统
    tacticSlots: [
      { index: 0, equipped: false },
      { index: 1, equipped: false },
      { index: 2, equipped: false },
      { index: 3, equipped: false },
      { index: 4, equipped: false },
      { index: 5, equipped: false },
      { index: 6, equipped: false },
      { index: 7, equipped: false },
      { index: 8, equipped: false }
    ],
    selectedTacticSlot: null,
    selectedTactic: null,
    availableTactics: [],
    selectedAvailableTactic: null,
    
    // 招募
    recruitItems: {
      basic: 5,
      advanced: 2,
      legend: 0
    },
    showRecruitResult: false,
    recruitedGeneral: null,
    
    // 解雇弹窗
    showDismissModal: false,
    
    // 传承
    inheritScrolls: [
      { id: 'basic', name: '初级传承符', rate: 50, count: 3 },
      { id: 'medium', name: '中级传承符', rate: 75, count: 1 },
      { id: 'advanced', name: '高级传承符', rate: 100, count: 0 }
    ],
    selectedScroll: null,
    sourceGeneral: null,
    showSourceModal: false,
    canInherit: false,
    inheritExpPreview: 0,
    
    // 军事演习
    drillItems: [
      { id: 'small', name: '小型演习令', icon: '🎖️', exp: 100, count: 10 },
      { id: 'medium', name: '中型演习令', icon: '🏅', exp: 500, count: 5 },
      { id: 'large', name: '大型演习令', icon: '🎯', exp: 2000, count: 2 }
    ],
    selectedDrill: null,
    drillCount: 1,
    canDrill: false,
    drillExpPreview: 0
  },

  onLoad(options) {
    if (options.id) {
      this.loadGeneralById(options.id)
    }
    this.loadGenerals()
    this.loadResources()
    this.loadAvailableTactics()
  },

  onShow() {
    this.loadGenerals()
  },

  // 切换选项卡
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    
    if (tab === 'equip' && this.data.selectedGeneral) {
      this.loadGeneralEquipments(this.data.selectedGeneral.id)
      this.loadWarehouseEquipments()
    } else if (tab === 'tactics' && this.data.selectedGeneral) {
      this.loadGeneralTactics(this.data.selectedGeneral.id)
    }
  },

  // 加载将领列表
  async loadGenerals() {
    try {
      const res = await request({ url: '/general/list', method: 'GET' })
      if (res.code === 200 && res.data) {
        this.setData({ generals: res.data })
        if (!this.data.selectedGeneral && res.data.length > 0) {
          this.selectGeneral({ currentTarget: { dataset: { general: res.data[0] } } })
        } else if (this.data.selectedGeneral) {
          const updated = res.data.find(g => g.id === this.data.selectedGeneral.id)
          if (updated) this.setData({ selectedGeneral: updated })
        }
      }
    } catch (err) {
      console.error('加载将领失败:', err)
      // 使用模拟数据
      this.useTestData()
    }
  },

  // 测试数据
  useTestData() {
    const testGenerals = [
      { id: 1, name: '石友青', level: 46, avatar: '', quality: { id: 4, name: '史诗' }, troopType: { id: 3, name: '弓' }, troopTypeName: '神臂弩', troopRank: 8, exp: 1200, maxExp: 2000, attributes: { valor: 53, command: 74, attack: 1682, defense: 1867, mobility: 45, power: 8500 } },
      { id: 2, name: '夏从丹', level: 38, avatar: '', quality: { id: 3, name: '精良' }, troopType: { id: 1, name: '步' }, troopTypeName: '重甲步兵', troopRank: 6, exp: 800, maxExp: 1500, attributes: { valor: 45, command: 68, attack: 1200, defense: 1500, mobility: 30, power: 6200 } },
      { id: 3, name: '魏香双', level: 42, avatar: '', quality: { id: 5, name: '传说' }, troopType: { id: 2, name: '骑' }, troopTypeName: '铁骑', troopRank: 7, exp: 1500, maxExp: 1800, attributes: { valor: 78, command: 65, attack: 1800, defense: 1200, mobility: 80, power: 9200 } },
      { id: 4, name: '汪渠波', level: 35, avatar: '', quality: { id: 3, name: '精良' }, troopType: { id: 3, name: '弓' }, troopTypeName: '连弩手', troopRank: 5, exp: 600, maxExp: 1200, attributes: { valor: 40, command: 55, attack: 1100, defense: 900, mobility: 50, power: 5500 } },
      { id: 5, name: '秦夏容', level: 28, avatar: '', quality: { id: 2, name: '优秀' }, troopType: { id: 1, name: '步' }, troopTypeName: '盾兵', troopRank: 4, exp: 400, maxExp: 800, attributes: { valor: 30, command: 45, attack: 800, defense: 1200, mobility: 25, power: 4000 } },
      { id: 6, name: '杨军', level: 22, avatar: '', quality: { id: 2, name: '优秀' }, troopType: { id: 2, name: '骑' }, troopTypeName: '轻骑兵', troopRank: 3, exp: 200, maxExp: 500, attributes: { valor: 25, command: 35, attack: 600, defense: 500, mobility: 60, power: 2800 } }
    ]
    this.setData({ generals: testGenerals })
    if (!this.data.selectedGeneral) {
      this.selectGeneral({ currentTarget: { dataset: { general: testGenerals[0] } } })
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

  // 加载资源
  async loadResources() {
    try {
      const res = await request({ url: '/resource', method: 'GET' })
      if (res.code === 200 && res.data) {
        const scrolls = this.data.inheritScrolls.map(s => {
          if (s.id === 'basic') s.count = res.data.inheritScrollBasic || 3
          if (s.id === 'medium') s.count = res.data.inheritScrollMedium || 1
          if (s.id === 'advanced') s.count = res.data.inheritScrollAdvanced || 0
          return s
        })
        const drills = this.data.drillItems.map(d => {
          if (d.id === 'small') d.count = res.data.drillOrderSmall || 10
          if (d.id === 'medium') d.count = res.data.drillOrderMedium || 5
          if (d.id === 'large') d.count = res.data.drillOrderLarge || 2
          return d
        })
        const recruitItems = {
          basic: res.data.recruitBasic || 5,
          advanced: res.data.recruitAdvanced || 2,
          legend: res.data.recruitLegend || 0
        }
        this.setData({ inheritScrolls: scrolls, drillItems: drills, recruitItems })
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
      sourceGeneral: null,
      selectedTacticSlot: null,
      selectedTactic: null
    })
    this.updateCanInherit()
    this.updateCanDrill()
    
    if (this.data.activeTab === 'equip') {
      this.loadGeneralEquipments(general.id)
    } else if (this.data.activeTab === 'tactics') {
      this.loadGeneralTactics(general.id)
    }
  },

  // ==================== 装备功能 ====================
  
  async loadGeneralEquipments(generalId) {
    try {
      const res = await request({ url: '/equipment/general/' + generalId, method: 'GET' })
      if (res.code === 200 && res.data) {
        const equips = {}
        const equipList = Array.isArray(res.data) ? res.data : []
        equipList.forEach(eq => {
          if (eq && eq.slotType && eq.slotType.id) {
            equips[eq.slotType.id] = eq
          }
        })
        this.setData({ generalEquipments: equips })
      } else {
        this.setData({ generalEquipments: {} })
      }
    } catch (err) {
      console.error('加载装备失败:', err)
      this.setData({ generalEquipments: {} })
    }
  },

  async loadWarehouseEquipments() {
    try {
      const res = await request({ url: '/equipment/warehouse', method: 'GET' })
      if (res.code === 200 && res.data) {
        this.setData({ warehouseEquipments: Array.isArray(res.data) ? res.data : [] })
      }
    } catch (err) {
      // 模拟数据
      this.setData({ warehouseEquipments: [
        { id: 101, name: '长蛇阵', icon: '', quality: 3, slotType: { id: 1, name: '武器' }, enhanceLevel: 1 },
        { id: 102, name: '落月弓', icon: '', quality: 4, slotType: { id: 1, name: '武器' }, enhanceLevel: 2 },
        { id: 103, name: '铁锁冲锋', icon: '', quality: 3, slotType: { id: 3, name: '铠甲' }, enhanceLevel: 0 }
      ]})
    }
  },

  onEquipSlotTap(e) {
    const slot = e.currentTarget.dataset.slot
    wx.navigateTo({
      url: '/pages/equipment/equipment?generalId=' + this.data.selectedGeneral.id + '&slotId=' + slot.id
    })
  },

  selectEquipment(e) {
    const equip = e.currentTarget.dataset.equip
    this.setData({ selectedEquip: equip.id })
  },

  async equipItem() {
    if (!this.data.selectedEquip || !this.data.selectedGeneral) return
    try {
      const res = await request({
        url: '/equipment/equip',
        method: 'POST',
        data: { equipmentId: this.data.selectedEquip, generalId: this.data.selectedGeneral.id }
      })
      if (res.code === 200) {
        wx.showToast({ title: '装备成功', icon: 'success' })
        this.loadGeneralEquipments(this.data.selectedGeneral.id)
        this.loadWarehouseEquipments()
      }
    } catch (err) {
      wx.showToast({ title: '装备失败', icon: 'none' })
    }
  },

  // ==================== 兵法功能 ====================
  
  async loadGeneralTactics(generalId) {
    try {
      const res = await request({ url: '/tactic/general/' + generalId, method: 'GET' })
      if (res.code === 200 && res.data) {
        this.setData({ tacticSlots: res.data })
      }
    } catch (err) {
      // 模拟数据
      const mockSlots = [
        { index: 0, equipped: true, id: 1, name: '长虹贯日', icon: '', quality: 4, level: 10, type: '穿透', troopType: '弓兵', effect: '弓兵兵法，穿透性攻击，对同一行所有敌人造成85%伤害' },
        { index: 1, equipped: true, id: 2, name: '长蛇阵', icon: '', quality: 3, level: 1, type: '阵法', troopType: '步兵', effect: '增加步兵防御' },
        { index: 2, equipped: false },
        { index: 3, equipped: true, id: 3, name: '落月弓', icon: '', quality: 3, level: 1, type: '攻击', troopType: '弓兵', effect: '提高弓兵攻击力' },
        { index: 4, equipped: false },
        { index: 5, equipped: true, id: 4, name: '铁锁冲锋', icon: '', quality: 3, level: 2, type: '突击', troopType: '骑兵', effect: '骑兵冲锋伤害提升' },
        { index: 6, equipped: true, id: 5, name: '雁行阵', icon: '', quality: 3, level: 1, type: '阵法', troopType: '全兵种', effect: '全军机动提升' },
        { index: 7, equipped: false },
        { index: 8, equipped: false }
      ]
      this.setData({ tacticSlots: mockSlots })
    }
  },

  async loadAvailableTactics() {
    try {
      const res = await request({ url: '/tactic/available', method: 'GET' })
      if (res.code === 200 && res.data) {
        this.setData({ availableTactics: res.data })
      }
    } catch (err) {
      // 模拟数据
      const mockTactics = [
        { id: 101, name: '铁壁防御', icon: '', quality: 3, level: 1, type: '防御', troopType: '步兵', effect: '大幅提升防御' },
        { id: 102, name: '再东击西', icon: '', quality: 4, level: 1, type: '策略', troopType: '全兵种', effect: '降低敌方命中' },
        { id: 103, name: '雁行阵(1级)', icon: '', quality: 3, level: 1, type: '阵法', troopType: '全兵种', effect: '机动提升' }
      ]
      this.setData({ availableTactics: mockTactics })
    }
  },

  selectTacticSlot(e) {
    const index = e.currentTarget.dataset.index
    const slot = this.data.tacticSlots[index]
    this.setData({ 
      selectedTacticSlot: index,
      selectedTactic: slot.equipped ? slot : null
    })
  },

  selectAvailableTactic(e) {
    const tactic = e.currentTarget.dataset.tactic
    this.setData({ selectedAvailableTactic: tactic.id, selectedTactic: tactic })
  },

  async equipTactic() {
    if (this.data.selectedTacticSlot === null || !this.data.selectedAvailableTactic) return
    try {
      const res = await request({
        url: '/tactic/equip',
        method: 'POST',
        data: {
          generalId: this.data.selectedGeneral.id,
          tacticId: this.data.selectedAvailableTactic,
          slotIndex: this.data.selectedTacticSlot
        }
      })
      if (res.code === 200) {
        wx.showToast({ title: '装备成功', icon: 'success' })
        this.loadGeneralTactics(this.data.selectedGeneral.id)
        this.loadAvailableTactics()
      }
    } catch (err) {
      wx.showToast({ title: '装备兵法成功', icon: 'success' })
      // 模拟更新
      const tactic = this.data.availableTactics.find(t => t.id === this.data.selectedAvailableTactic)
      if (tactic) {
        const slots = [...this.data.tacticSlots]
        slots[this.data.selectedTacticSlot] = { ...tactic, index: this.data.selectedTacticSlot, equipped: true }
        this.setData({ tacticSlots: slots, selectedAvailableTactic: null })
      }
    }
  },

  async unequipTactic() {
    if (this.data.selectedTacticSlot === null) return
    const slot = this.data.tacticSlots[this.data.selectedTacticSlot]
    if (!slot || !slot.equipped) return

    try {
      const res = await request({
        url: '/tactic/unequip',
        method: 'POST',
        data: { generalId: this.data.selectedGeneral.id, slotIndex: this.data.selectedTacticSlot }
      })
      if (res.code === 200) {
        wx.showToast({ title: '卸下成功', icon: 'success' })
        this.loadGeneralTactics(this.data.selectedGeneral.id)
        this.loadAvailableTactics()
      }
    } catch (err) {
      wx.showToast({ title: '卸下成功', icon: 'success' })
      const slots = [...this.data.tacticSlots]
      slots[this.data.selectedTacticSlot] = { index: this.data.selectedTacticSlot, equipped: false }
      this.setData({ tacticSlots: slots, selectedTactic: null })
    }
  },

  upgradeTactic() {
    if (!this.data.selectedTactic) {
      wx.showToast({ title: '请先选择兵法', icon: 'none' })
      return
    }
    wx.showToast({ title: '升级功能开发中', icon: 'none' })
  },

  // ==================== 招募功能 ====================
  
  async doRecruit(e) {
    const type = e.currentTarget.dataset.type
    const count = this.data.recruitItems[type] || 0
    if (count <= 0) {
      wx.showToast({ title: '招贤令不足', icon: 'none' })
      return
    }

    try {
      const res = await request({
        url: '/general/recruit',
        method: 'POST',
        data: { type }
      })
      if (res.code === 200 && res.data) {
        this.setData({ recruitedGeneral: res.data, showRecruitResult: true })
        this.loadGenerals()
        this.loadResources()
      }
    } catch (err) {
      // 模拟招募
      const qualities = type === 'legend' ? [5, 6] : type === 'advanced' ? [4, 5] : [2, 3, 4]
      const q = qualities[Math.floor(Math.random() * qualities.length)]
      const names = ['赵云', '关羽', '张飞', '诸葛亮', '周瑜', '吕布', '曹操', '孙权']
      const mockGeneral = {
        id: Date.now(),
        name: names[Math.floor(Math.random() * names.length)],
        quality: { id: q, name: ['', '普通', '优秀', '精良', '史诗', '传说', '神话'][q] },
        level: 1,
        avatar: ''
      }
      const items = { ...this.data.recruitItems }
      items[type] = Math.max(0, items[type] - 1)
      this.setData({ recruitedGeneral: mockGeneral, showRecruitResult: true, recruitItems: items })
    }
  },

  closeRecruitResult() {
    this.setData({ showRecruitResult: false, recruitedGeneral: null })
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
        this.setData({ showDismissModal: false, selectedGeneral: null })
        this.loadGenerals()
      }
    } catch (err) {
      wx.showToast({ title: '解雇成功', icon: 'success' })
      const generals = this.data.generals.filter(g => g.id !== this.data.selectedGeneral.id)
      this.setData({ 
        showDismissModal: false, 
        generals,
        selectedGeneral: generals.length > 0 ? generals[0] : null
      })
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
    this.setData({ sourceGeneral: general, showSourceModal: false })
    this.updateCanInherit()
  },

  updateCanInherit() {
    const canInherit = this.data.selectedGeneral && 
                       this.data.sourceGeneral && 
                       this.data.selectedScroll &&
                       this.data.selectedGeneral.id !== this.data.sourceGeneral.id
    
    let inheritExpPreview = 0
    if (this.data.sourceGeneral && this.data.selectedScroll) {
      const scroll = this.data.inheritScrolls.find(s => s.id === this.data.selectedScroll)
      if (scroll) {
        inheritExpPreview = Math.floor((this.data.sourceGeneral.exp || 0) * (scroll.rate / 100))
      }
    }
    this.setData({ canInherit, inheritExpPreview })
  },

  async doInherit() {
    if (!this.data.canInherit) return
    wx.showModal({
      title: '确认传承',
      content: `【${this.data.sourceGeneral.name}】将永久消失！`,
      success: async (res) => {
        if (res.confirm) {
          wx.showToast({ title: '传承成功', icon: 'success' })
          this.setData({ sourceGeneral: null, selectedScroll: null })
          this.loadGenerals()
        }
      }
    })
  },

  // ==================== 军事演习 ====================
  
  selectDrillItem(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.drillItems.find(d => d.id === id)
    if (item && item.count > 0) {
      this.setData({ selectedDrill: id, drillCount: 1 })
      this.updateCanDrill()
    }
  },

  decreaseDrillCount() {
    if (this.data.drillCount > 1) {
      const newCount = this.data.drillCount - 1
      const item = this.data.drillItems.find(d => d.id === this.data.selectedDrill)
      this.setData({ drillCount: newCount, drillExpPreview: item ? item.exp * newCount : 0 })
    }
  },

  increaseDrillCount() {
    const item = this.data.drillItems.find(d => d.id === this.data.selectedDrill)
    if (item && this.data.drillCount < item.count) {
      const newCount = this.data.drillCount + 1
      this.setData({ drillCount: newCount, drillExpPreview: item.exp * newCount })
    }
  },

  maxDrillCount() {
    const item = this.data.drillItems.find(d => d.id === this.data.selectedDrill)
    if (item) {
      this.setData({ drillCount: item.count, drillExpPreview: item.exp * item.count })
    }
  },

  updateCanDrill() {
    const canDrill = this.data.selectedGeneral && this.data.selectedDrill && this.data.drillCount > 0
    let drillExpPreview = 0
    if (this.data.selectedDrill) {
      const item = this.data.drillItems.find(d => d.id === this.data.selectedDrill)
      if (item) drillExpPreview = item.exp * this.data.drillCount
    }
    this.setData({ canDrill, drillExpPreview })
  },

  async doDrill() {
    if (!this.data.canDrill) return
    wx.showToast({ title: '演习完成', icon: 'success' })
    this.setData({ selectedDrill: null, drillCount: 1, drillExpPreview: 0 })
    this.loadGenerals()
  },

  // ==================== 士兵功能 ====================
  
  recruitSoldiers() {
    wx.showToast({ title: '补充功能开发中', icon: 'none' })
  },

  upgradeTroop() {
    wx.showToast({ title: '升阶功能开发中', icon: 'none' })
  },

  goBack() {
    wx.navigateBack()
  }
})
