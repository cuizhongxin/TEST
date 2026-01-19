// pages/tactics/tactics.js
var request = require('../../utils/request.js')

// 兵法和阵法配置
var tacticsConfig = {
  // 阵法（步兵专属居多）
  formations: [
    {
      id: 'fang_yuan',
      name: '方圆阵',
      type: 'formation',
      quality: 'blue',
      troopRequirement: '步兵',
      description: '步兵专属防御阵型，提升整体防御能力',
      effectText: '防御力+10%',
      effect: { defenseBonus: 0.10 },
      paperCost: 50,
      woodCost: 30,
      silverCost: 500
    },
    {
      id: 'que_yue',
      name: '却月阵',
      type: 'formation',
      quality: 'purple',
      troopRequirement: '步兵',
      description: '弯月形阵法，克制弓兵但被骑兵克制',
      effectText: '对弓兵造成30%反伤；被骑兵攻击时伤害+10%',
      effect: { archerReflect: 0.30, cavalryVulnerable: 0.10 },
      paperCost: 100,
      woodCost: 80,
      silverCost: 1200
    },
    {
      id: 'feng_shi',
      name: '锋矢阵',
      type: 'formation',
      quality: 'blue',
      troopRequirement: null,
      description: '进攻型阵法，提升攻击力',
      effectText: '攻击力+15%，防御力-5%',
      effect: { attackBonus: 0.15, defensePenalty: -0.05 },
      paperCost: 60,
      woodCost: 40,
      silverCost: 600
    },
    {
      id: 'he_yi',
      name: '鹤翼阵',
      type: 'formation',
      quality: 'green',
      troopRequirement: null,
      description: '平衡型阵法，攻守兼备',
      effectText: '攻击力+5%，防御力+5%',
      effect: { attackBonus: 0.05, defenseBonus: 0.05 },
      paperCost: 40,
      woodCost: 25,
      silverCost: 400
    },
    {
      id: 'yu_lin',
      name: '鱼鳞阵',
      type: 'formation',
      quality: 'purple',
      troopRequirement: null,
      description: '密集型阵法，大幅提升防御',
      effectText: '防御力+20%，机动-10',
      effect: { defenseBonus: 0.20, mobilityPenalty: -10 },
      paperCost: 120,
      woodCost: 100,
      silverCost: 1500
    }
  ],
  // 兵法（各兵种都有）
  tactics: [
    {
      id: 'chang_hong',
      name: '长虹贯日',
      type: 'tactics',
      quality: 'orange',
      troopRequirement: '弓兵',
      description: '弓兵专属兵法，箭雨覆盖一排敌人',
      effectText: '对一排3个武将造成50%/40%/30%伤害',
      effect: { aoeRow: true, damageRatio: [0.50, 0.40, 0.30] },
      paperCost: 200,
      woodCost: 150,
      silverCost: 3000
    },
    {
      id: 'qi_bing',
      name: '奇兵突袭',
      type: 'tactics',
      quality: 'purple',
      troopRequirement: '骑兵',
      description: '骑兵专属兵法，快速突进造成额外伤害',
      effectText: '攻击时额外造成20%伤害，优先攻击后排',
      effect: { extraDamage: 0.20, priorityBack: true },
      paperCost: 150,
      woodCost: 100,
      silverCost: 2000
    },
    {
      id: 'po_zhen',
      name: '破阵',
      type: 'tactics',
      quality: 'blue',
      troopRequirement: null,
      description: '无视敌方部分防御',
      effectText: '攻击时无视敌方15%防御',
      effect: { ignoreDefense: 0.15 },
      paperCost: 80,
      woodCost: 50,
      silverCost: 800
    },
    {
      id: 'tie_bi',
      name: '铁壁',
      type: 'tactics',
      quality: 'blue',
      troopRequirement: null,
      description: '大幅提升防御，但降低攻击',
      effectText: '防御力+25%，攻击力-10%',
      effect: { defenseBonus: 0.25, attackPenalty: -0.10 },
      paperCost: 70,
      woodCost: 60,
      silverCost: 700
    },
    {
      id: 'ji_feng',
      name: '疾风',
      type: 'tactics',
      quality: 'green',
      troopRequirement: null,
      description: '提升机动性，更快行动',
      effectText: '机动+20',
      effect: { mobilityBonus: 20 },
      paperCost: 30,
      woodCost: 20,
      silverCost: 300
    },
    {
      id: 'zhen_she',
      name: '震慑',
      type: 'tactics',
      quality: 'purple',
      troopRequirement: null,
      description: '攻击时有几率降低敌方士气',
      effectText: '攻击时30%几率使敌人下回合攻击力-20%',
      effect: { debuffChance: 0.30, debuffEffect: { attackPenalty: -0.20 } },
      paperCost: 100,
      woodCost: 80,
      silverCost: 1000
    }
  ]
}

Page({
  data: {
    generals: [],
    currentGeneralId: null,
    currentGeneral: null,
    currentTab: 'formation',
    displayList: [],
    learnedTactics: [], // 用户已学习的兵法ID列表
    paper: 0,
    wood: 0,
    silver: 0
  },

  onLoad: function() {
    this.loadData()
  },

  onShow: function() {
    this.loadData()
  },

  loadData: function() {
    this.loadGenerals()
    this.loadResources()
    this.loadLearnedTactics()
  },

  loadGenerals: function() {
    var that = this
    request({
      url: '/general/list',
      method: 'GET'
    }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({ generals: res.data })
        if (res.data.length > 0 && !that.data.currentGeneralId) {
          that.selectGeneral({ currentTarget: { dataset: { id: res.data[0].id } } })
        }
      }
    }).catch(function(err) {
      console.error('加载武将失败:', err)
    })
  },

  loadResources: function() {
    var that = this
    request({
      url: '/resource/summary',
      method: 'GET'
    }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({
          paper: res.data.paper || 500,
          wood: res.data.wood || 300,
          silver: res.data.silver || 5000
        })
      }
    }).catch(function(err) {
      console.error('加载资源失败:', err)
      // 默认值
      that.setData({ paper: 500, wood: 300, silver: 5000 })
    })
  },

  loadLearnedTactics: function() {
    var that = this
    request({
      url: '/tactics/learned',
      method: 'GET'
    }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({ learnedTactics: res.data })
        that.updateDisplayList()
      }
    }).catch(function(err) {
      console.error('加载已学习兵法失败:', err)
      that.setData({ learnedTactics: [] })
      that.updateDisplayList()
    })
  },

  selectGeneral: function(e) {
    var id = e.currentTarget.dataset.id
    var general = this.data.generals.find(function(g) { return g.id === id })
    this.setData({
      currentGeneralId: id,
      currentGeneral: general
    })
    this.updateDisplayList()
  },

  switchTab: function(e) {
    var tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    this.updateDisplayList()
  },

  updateDisplayList: function() {
    var that = this
    var list = this.data.currentTab === 'formation' 
      ? tacticsConfig.formations 
      : tacticsConfig.tactics

    var displayList = list.map(function(item) {
      return Object.assign({}, item, {
        learned: that.data.learnedTactics.indexOf(item.id) !== -1
      })
    })

    this.setData({ displayList: displayList })
  },

  learnTactics: function(e) {
    var that = this
    var id = e.currentTarget.dataset.id
    
    if (this.data.learnedTactics.indexOf(id) !== -1) {
      wx.showToast({ title: '已学习过此兵法', icon: 'none' })
      return
    }

    var allTactics = tacticsConfig.formations.concat(tacticsConfig.tactics)
    var tactics = allTactics.find(function(t) { return t.id === id })
    
    if (!tactics) return

    // 检查资源
    if (this.data.paper < tactics.paperCost ||
        this.data.wood < tactics.woodCost ||
        this.data.silver < tactics.silverCost) {
      wx.showToast({ title: '资源不足', icon: 'none' })
      return
    }

    request({
      url: '/tactics/learn',
      method: 'POST',
      data: {
        tacticsId: id,
        paperCost: tactics.paperCost,
        woodCost: tactics.woodCost,
        silverCost: tactics.silverCost
      }
    }).then(function(res) {
      if (res.code === 200) {
        wx.showToast({ title: '学习成功！', icon: 'success' })
        // 更新本地状态
        var learned = that.data.learnedTactics.slice()
        learned.push(id)
        that.setData({
          learnedTactics: learned,
          paper: that.data.paper - tactics.paperCost,
          wood: that.data.wood - tactics.woodCost,
          silver: that.data.silver - tactics.silverCost
        })
        that.updateDisplayList()
      } else {
        wx.showToast({ title: res.message || '学习失败', icon: 'none' })
      }
    }).catch(function(err) {
      console.error('学习兵法失败:', err)
      wx.showToast({ title: '学习失败', icon: 'none' })
    })
  },

  equipTactics: function(e) {
    var that = this
    var id = e.currentTarget.dataset.id
    var general = this.data.currentGeneral
    
    if (!general) {
      wx.showToast({ title: '请先选择武将', icon: 'none' })
      return
    }

    var allTactics = tacticsConfig.formations.concat(tacticsConfig.tactics)
    var tactics = allTactics.find(function(t) { return t.id === id })
    
    if (!tactics) return

    // 检查兵种要求
    if (tactics.troopRequirement && general.troopType !== tactics.troopRequirement) {
      wx.showToast({ title: '兵种不符合要求', icon: 'none' })
      return
    }

    request({
      url: '/tactics/equip',
      method: 'POST',
      data: {
        generalId: general.id,
        tacticsId: id,
        tacticsName: tactics.name,
        tacticsType: tactics.type,
        effect: tactics.effect
      }
    }).then(function(res) {
      if (res.code === 200) {
        wx.showToast({ title: '装备成功！', icon: 'success' })
        // 更新武将状态
        var generals = that.data.generals.slice()
        var idx = generals.findIndex(function(g) { return g.id === general.id })
        if (idx !== -1) {
          generals[idx].tactics = {
            primary: {
              id: id,
              name: tactics.name,
              type: tactics.type,
              effect: tactics.effect
            }
          }
          that.setData({
            generals: generals,
            currentGeneral: generals[idx]
          })
        }
      } else {
        wx.showToast({ title: res.message || '装备失败', icon: 'none' })
      }
    }).catch(function(err) {
      console.error('装备兵法失败:', err)
      wx.showToast({ title: '装备失败', icon: 'none' })
    })
  },

  unequipTactics: function() {
    var that = this
    var general = this.data.currentGeneral
    
    if (!general || !general.tactics || !general.tactics.primary) {
      wx.showToast({ title: '未装备兵法', icon: 'none' })
      return
    }

    request({
      url: '/tactics/unequip',
      method: 'POST',
      data: {
        generalId: general.id
      }
    }).then(function(res) {
      if (res.code === 200) {
        wx.showToast({ title: '已卸下', icon: 'success' })
        // 更新武将状态
        var generals = that.data.generals.slice()
        var idx = generals.findIndex(function(g) { return g.id === general.id })
        if (idx !== -1) {
          generals[idx].tactics = null
          that.setData({
            generals: generals,
            currentGeneral: generals[idx]
          })
        }
      } else {
        wx.showToast({ title: res.message || '卸下失败', icon: 'none' })
      }
    }).catch(function(err) {
      console.error('卸下兵法失败:', err)
      wx.showToast({ title: '卸下失败', icon: 'none' })
    })
  }
})
