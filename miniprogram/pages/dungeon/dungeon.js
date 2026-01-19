// pages/dungeon/dungeon.js
var app = getApp()
var request = require('../../utils/request.js')

Page({
  data: {
    playerLevel: 1,
    stamina: 100,
    
    // 战役列表
    dungeons: [],
    selectedDungeon: null,
    progress: {},
    
    // 阵型（从阵型系统加载）
    formation: [],
    formationCount: 0,
    totalPower: 0,
    
    // 战斗状态
    inBattle: false,
    inCombat: false,
    currentNpcIndex: 0,
    currentNpc: null,
    
    // 回合制战斗
    currentRound: 1,
    myUnits: [],
    enemyUnits: [],
    myTotalHp: 0,
    myMaxHp: 0,
    enemyTotalHp: 0,
    enemyMaxHp: 0,
    
    // 动画
    showEffect: false,
    effectText: '',
    showDamage: false,
    damageText: '',
    damageColor: '#ff0',
    
    // 日志
    combatLogs: [],
    
    // 结果
    combatEnded: false,
    combatVictory: false,
    showClearModal: false
  },

  onLoad: function() {
    this.loadPlayerInfo()
    this.loadFormation()
    this.fetchDungeons()
  },

  onShow: function() {
    this.loadFormation()
  },

  loadPlayerInfo: function() {
    var that = this
    // 获取等级
    request({ url: '/level', method: 'GET' }).then(function(res) {
      console.log('等级接口返回:', res)
      if (res.code === 200 && res.data) {
        that.setData({ playerLevel: res.data.level || 1 })
      }
    }).catch(function(err) {
      console.error('获取等级失败:', err)
    })

    // 从后端获取体力
    request({ url: '/resource/summary', method: 'GET' }).then(function(res) {
      console.log('资源接口返回:', res)
      if (res.code === 200 && res.data) {
        that.setData({ stamina: res.data.stamina || 100 })
      }
    }).catch(function(err) {
      console.error('获取资源失败:', err)
      // 如果获取失败，使用默认值
      that.setData({ stamina: 100 })
    })
  },

  // 从阵型系统加载阵型
  loadFormation: function() {
    var that = this
    request({ url: '/formation', method: 'GET' }).then(function(res) {
      console.log('阵型接口返回:', res)
      if (res.code === 200 && res.data) {
        var slots = res.data.slots || []
        var formation = []
        var totalPower = 0
        
        slots.forEach(function(slot) {
          if (!slot.empty && slot.generalId) {
            // 获取兵种信息
            var troopType = slot.troopType || slot.soldiers && slot.soldiers.type || {}
            var troopName = troopType.name || slot.troopName || '步兵'
            var troopIcon = that.getTroopIcon(troopName)
            
            formation.push({
              id: slot.generalId,
              name: slot.generalName,
              quality: slot.quality,
              mobility: slot.mobility || 0,
              avatar: slot.avatar,
              slotIndex: slot.index,
              // 属性需要从详情获取
              attack: slot.attack || 100,
              defense: slot.defense || 100,
              valor: slot.valor || 50,
              command: slot.command || 50,
              dodge: slot.dodge || 10,
              power: slot.power || 0,
              troopName: troopName,
              troopIcon: troopIcon
            })
            totalPower += slot.power || 0
          }
        })
        
        console.log('解析阵型:', { formation: formation, formationCount: formation.length })
        that.setData({
          formation: formation,
          formationCount: formation.length,
          totalPower: totalPower
        })
      }
    }).catch(function(err) {
      console.error('加载阵型失败:', err)
    })
  },

  fetchDungeons: function() {
    var that = this
    // 获取所有副本，而不只是已解锁的
    request({
      url: '/dungeon/list',
      method: 'GET'
    }).then(function(res) {
      console.log('副本列表返回:', res)
      if (res.code === 200 && res.data) {
        // 后端返回的是 Map，转换为数组并按 unlockLevel 排序
        var dungeonMap = res.data
        var dungeonList = []
        for (var key in dungeonMap) {
          if (dungeonMap.hasOwnProperty(key)) {
            var dungeon = dungeonMap[key]
            // 只显示100级及以下的副本
            if (dungeon.unlockLevel <= 100) {
              dungeonList.push(dungeon)
            }
          }
        }
        // 按解锁等级排序
        dungeonList.sort(function(a, b) {
          return a.unlockLevel - b.unlockLevel
        })
        
        console.log('解析副本列表:', dungeonList.length + '个副本')
        
        // 找到第一个已解锁的副本作为默认选中
        var firstUnlocked = null
        for (var i = 0; i < dungeonList.length; i++) {
          if (dungeonList[i].unlockLevel <= that.data.playerLevel) {
            firstUnlocked = dungeonList[i]
            break
          }
        }
        
        that.setData({
          dungeons: dungeonList,
          selectedDungeon: firstUnlocked
        })
        
        if (firstUnlocked) {
          console.log('默认选中副本:', firstUnlocked.name, '包含NPC:', firstUnlocked.npcs ? firstUnlocked.npcs.length : 0)
          that.fetchProgress(firstUnlocked.id)
        }
      }
    }).catch(function(err) {
      console.error('获取战役失败:', err)
    })
  },

  fetchProgress: function(dungeonId) {
    var that = this
    request({
      url: '/dungeon/progress/' + dungeonId,
      method: 'GET'
    }).then(function(res) {
      if (res.code === 200 && res.data) {
        that.setData({ progress: res.data })
      }
    }).catch(function(err) {
      console.error('获取进度失败:', err)
    })
  },

  selectDungeon: function(e) {
    var dungeonId = e.currentTarget.dataset.id
    var dungeon = null
    for (var i = 0; i < this.data.dungeons.length; i++) {
      if (this.data.dungeons[i].id === dungeonId) {
        dungeon = this.data.dungeons[i]
        break
      }
    }
    
    if (dungeon) {
      this.setData({ selectedDungeon: dungeon })
      // 锁定的副本也可以查看，但进度只有解锁后才获取
      if (this.data.playerLevel >= dungeon.unlockLevel) {
        this.fetchProgress(dungeonId)
      }
    }
  },

  goToFormation: function() {
    wx.navigateTo({ url: '/pages/formation/formation' })
  },

  enterDungeon: function() {
    var that = this
    var selectedDungeon = this.data.selectedDungeon
    var stamina = this.data.stamina
    var playerLevel = this.data.playerLevel
    var formationCount = this.data.formationCount
    
    console.log('进入副本检查:', {
      selectedDungeon: selectedDungeon ? selectedDungeon.name : null,
      unlockLevel: selectedDungeon ? selectedDungeon.unlockLevel : null,
      playerLevel: playerLevel,
      formationCount: formationCount,
      stamina: stamina,
      staminaCost: selectedDungeon ? selectedDungeon.staminaCost : null
    })
    
    if (!selectedDungeon) {
      wx.showToast({ title: '请先选择副本', icon: 'none' })
      return
    }
    
    // 检查等级
    if (playerLevel < selectedDungeon.unlockLevel) {
      wx.showToast({ title: '等级不足，需要Lv.' + selectedDungeon.unlockLevel, icon: 'none' })
      return
    }
    
    if (formationCount === 0) {
      wx.showModal({
        title: '提示',
        content: '请先配置阵型',
        confirmText: '去配置',
        success: function(res) {
          if (res.confirm) {
            that.goToFormation()
          }
        }
      })
      return
    }
    
    if (stamina < selectedDungeon.staminaCost) {
      wx.showToast({ title: '体力不足', icon: 'none' })
      return
    }
    
    console.log('开始请求进入副本...')
    wx.showLoading({ title: '进入中...' })
    
    request({
      url: '/dungeon/enter',
      method: 'POST',
      data: {
        dungeonId: selectedDungeon.id,
        playerLevel: playerLevel,
        currentStamina: stamina
      }
    }).then(function(res) {
      wx.hideLoading()
      console.log('进入副本返回:', res)
      
      if (res.code === 200) {
        var newStamina = stamina - selectedDungeon.staminaCost
        
        // 确保 npcs 存在
        if (!selectedDungeon.npcs || selectedDungeon.npcs.length === 0) {
          wx.showToast({ title: '副本数据异常', icon: 'none' })
          return
        }
        
        console.log('进入副本成功，NPC列表:', selectedDungeon.npcs)
        
        that.setData({
          stamina: newStamina,
          inBattle: true,
          currentNpcIndex: 0,
          currentNpc: selectedDungeon.npcs[0]
        })
      } else {
        wx.showToast({ title: res.message || '进入失败', icon: 'none' })
      }
    }).catch(function(err) {
      wx.hideLoading()
      console.error('进入副本失败:', err)
      wx.showToast({ title: err.message || '进入失败', icon: 'none' })
    })
  },

  // 获取兵种图标
  getTroopIcon: function(troopName) {
    if (!troopName) return '🛡️'
    if (troopName.indexOf('骑') >= 0) return '🐎'
    if (troopName.indexOf('弓') >= 0) return '🏹'
    return '🛡️'  // 默认步兵
  },

  startCombat: function() {
    var that = this
    var formation = this.data.formation
    var currentNpc = this.data.currentNpc
    var playerLevel = this.data.playerLevel || 1
    
    // 先获取完整的武将信息（包含装备加成）
    request({ url: '/formation/battle-order', method: 'GET' }).then(function(res) {
      var generals = res.code === 200 && res.data ? res.data : formation
      
      var myUnits = generals.map(function(g, index) {
        var attrs = g.attributes || {}
        // 装备加成（如果有）
        var equipBonus = g.equipmentBonus || {}
        
        // 基础属性 + 装备加成 + 等级加成
        var levelBonus = playerLevel * 2
        var baseAttack = (attrs.attack || g.attack || 100) + (equipBonus.attack || 0) + levelBonus
        var baseDefense = (attrs.defense || g.defense || 80) + (equipBonus.defense || 0) + levelBonus
        var baseValor = (attrs.valor || g.valor || 50) + (equipBonus.valor || 0) + Math.floor(levelBonus * 0.5)
        var baseCommand = (attrs.command || g.command || 50) + (equipBonus.command || 0) + Math.floor(levelBonus * 0.5)
        var baseDodge = (attrs.dodge || g.dodge || 10) + (equipBonus.dodge || 0)
        var baseMobility = (attrs.mobility || g.mobility || 50) + (equipBonus.mobility || 0)
        
        // 统一血量为1000兵
        var maxHp = 1000
        
        // 获取兵种图标
        var troopType = g.troopType || g.soldiers && g.soldiers.type || {}
        var troopName = troopType.name || g.troopName || '步兵'
        var troopIcon = that.getTroopIcon(troopName)
        
        return {
          id: g.id,
          name: g.name,
          avatar: g.avatar,
          quality: g.quality,
          attack: baseAttack,
          defense: baseDefense,
          valor: baseValor,
          command: baseCommand,
          dodge: baseDodge,
          mobility: baseMobility,
          maxHp: maxHp,
          currentHp: maxHp,
          isDead: false,
          isAttacking: false,
          isHit: false,
          isPlayer: true,
          order: index,
          troopName: troopName,
          troopIcon: troopIcon
        }
      })
      
      // 敌人单位 - 统一血量1000
      var enemyTroopName = currentNpc.troopName || '步兵'
      var enemyTroopIcon = that.getTroopIcon(enemyTroopName)
      
      var enemyUnits = [{
        id: 'npc_' + currentNpc.index,
        name: currentNpc.name,
        qualityColor: currentNpc.qualityColor,
        isBoss: currentNpc.isBoss,
        attack: currentNpc.attack || 100,
        defense: currentNpc.defense || 60,
        valor: currentNpc.valor || 40,
        command: currentNpc.command || 40,
        dodge: currentNpc.dodge || 8,
        mobility: currentNpc.mobility || 60,
        maxHp: 1000,
        currentHp: 1000,
        isDead: false,
        isAttacking: false,
        isHit: false,
        isPlayer: false,
        order: 0,
        troopName: enemyTroopName,
        troopIcon: enemyTroopIcon
      }]
      
      var myTotalHp = myUnits.reduce(function(sum, u) { return sum + u.currentHp }, 0)
      var enemyTotalHp = enemyUnits.reduce(function(sum, u) { return sum + u.currentHp }, 0)
      
      console.log('战斗开始 - 我方总血量:', myTotalHp, '敌方总血量:', enemyTotalHp)
      console.log('我方单位:', myUnits.map(function(u) { return u.name + '(攻' + u.attack + '/防' + u.defense + '/血' + u.maxHp + ')' }))
      console.log('敌方单位:', enemyUnits.map(function(u) { return u.name + '(攻' + u.attack + '/防' + u.defense + '/血' + u.maxHp + ')' }))
      
      that.setData({
        inCombat: true,
        currentRound: 1,
        myUnits: myUnits,
        enemyUnits: enemyUnits,
        myTotalHp: myTotalHp,
        myMaxHp: myTotalHp,
        enemyTotalHp: enemyTotalHp,
        enemyMaxHp: enemyTotalHp,
        combatLogs: [{ type: 'info', text: '⚔️ 战斗开始！' }],
        combatEnded: false,
        combatVictory: false
      })
      
      setTimeout(function() { that.executeRound() }, 500)
    }).catch(function(err) {
      console.error('获取战斗顺序失败:', err)
      wx.showToast({ title: '获取阵型失败', icon: 'none' })
    })
  },

  executeRound: function() {
    var that = this
    var myUnits = this.data.myUnits
    var enemyUnits = this.data.enemyUnits
    var currentRound = this.data.currentRound
    var combatLogs = this.data.combatLogs.slice()
    
    // 限制回合数，防止无限循环
    if (currentRound > 50) {
      console.log('回合数超过50，强制结束')
      combatLogs.push({ type: 'info', text: '战斗超时，平局！' })
      this.setData({
        combatLogs: combatLogs,
        combatEnded: true,
        combatVictory: false
      })
      return
    }
    
    console.log('开始第 ' + currentRound + ' 回合')
    combatLogs.push({ type: 'info', text: '─── 第 ' + currentRound + ' 回合 ───' })
    this.setData({ combatLogs: combatLogs })
    
    var allUnits = []
    myUnits.forEach(function(u) { if (!u.isDead) allUnits.push(u) })
    enemyUnits.forEach(function(u) { if (!u.isDead) allUnits.push(u) })
    
    console.log('存活单位数:', allUnits.length)
    
    if (allUnits.length === 0) {
      console.log('没有存活单位，结束战斗')
      this.checkBattleEnd()
      return
    }
    
    // 按机动性排序
    allUnits.sort(function(a, b) {
      if (b.mobility !== a.mobility) {
        return b.mobility - a.mobility
      }
      if (a.isPlayer !== b.isPlayer) {
        return a.isPlayer ? -1 : 1
      }
      return a.order - b.order
    })
    
    this.executeAttacksSequentially(allUnits, 0)
  },

  executeAttacksSequentially: function(allUnits, index) {
    var that = this
    
    console.log('执行攻击序列，索引=' + index + '/' + allUnits.length)
    
    if (index >= allUnits.length) {
      // 回合结束，检查是否战斗结束
      console.log('回合结束，检查战斗状态')
      if (!this.checkBattleEnd()) {
        this.setData({ currentRound: this.data.currentRound + 1 })
        setTimeout(function() { that.executeRound() }, 800)
      }
      return
    }
    
    var attacker = allUnits[index]
    
    // 检查攻击者是否还活着
    if (attacker.isDead) {
      console.log(attacker.name + ' 已死亡，跳过')
      this.executeAttacksSequentially(allUnits, index + 1)
      return
    }
    
    // 获取目标
    var targets = attacker.isPlayer 
      ? this.data.enemyUnits.filter(function(u) { return !u.isDead })
      : this.data.myUnits.filter(function(u) { return !u.isDead })
    
    if (targets.length === 0) {
      console.log('没有可攻击目标，结束战斗')
      this.checkBattleEnd()
      return
    }
    
    var target = targets[0]
    this.executeAttack(attacker, target, function() {
      // 攻击结束后继续下一个
      if (!that.checkBattleEnd()) {
        that.executeAttacksSequentially(allUnits, index + 1)
      }
    })
  },

  executeAttack: function(attacker, target, callback) {
    var that = this
    var combatLogs = this.data.combatLogs.slice()
    
    console.log('执行攻击:', attacker.name, '->', target.name)
    
    // 显示攻击效果
    this.setData({ showEffect: true, effectText: '⚔️' })
    
    setTimeout(function() {
      // 计算闪避
      var dodgeRoll = Math.random() * 100
      var dodged = dodgeRoll < (target.dodge || 5)
      
      if (dodged) {
        combatLogs.push({ type: 'info', text: target.name + ' 闪避了攻击！' })
        that.setData({
          combatLogs: combatLogs,
          showEffect: false,
          showDamage: true,
          damageText: 'MISS',
          damageColor: '#888'
        })
      } else {
        // 新的伤害计算公式，更合理
        // 基础伤害 = 攻击力 * (100 / (100 + 防御力)) + 武勇加成
        var attackPower = attacker.attack || 100
        var defensePower = target.defense || 50
        var valorBonus = Math.max(0, (attacker.valor || 50) - (target.command || 50)) * 0.5
        
        // 减伤率 = 防御 / (防御 + 100)，最高70%减伤
        var damageReduction = Math.min(0.7, defensePower / (defensePower + 100))
        var baseDamage = attackPower * (1 - damageReduction) + valorBonus
        
        // 随机浮动 ±20%
        var damage = Math.floor(baseDamage * (0.8 + Math.random() * 0.4))
        // 保底伤害
        damage = Math.max(15, damage)
        
        // 更新目标HP
        var myUnits = that.data.myUnits.slice()
        var enemyUnits = that.data.enemyUnits.slice()
        
        if (target.isPlayer) {
          for (var i = 0; i < myUnits.length; i++) {
            if (myUnits[i].id === target.id) {
              myUnits[i].currentHp = Math.max(0, myUnits[i].currentHp - damage)
              myUnits[i].isHit = true
              if (myUnits[i].currentHp <= 0) {
                myUnits[i].isDead = true
                combatLogs.push({ type: 'damage', text: '💀 ' + target.name + ' 阵亡！' })
              }
              break
            }
          }
          that.setData({ myUnits: myUnits })
        } else {
          for (var i = 0; i < enemyUnits.length; i++) {
            if (enemyUnits[i].id === target.id) {
              enemyUnits[i].currentHp = Math.max(0, enemyUnits[i].currentHp - damage)
              enemyUnits[i].isHit = true
              if (enemyUnits[i].currentHp <= 0) {
                enemyUnits[i].isDead = true
                combatLogs.push({ type: 'damage', text: '💀 ' + target.name + ' 阵亡！' })
              }
              break
            }
          }
          that.setData({ enemyUnits: enemyUnits })
        }
        
        // 更新血条
        var myTotalHp = that.data.myUnits.reduce(function(sum, u) { return sum + u.currentHp }, 0)
        var enemyTotalHp = that.data.enemyUnits.reduce(function(sum, u) { return sum + u.currentHp }, 0)
        
        combatLogs.push({ type: 'attack', text: attacker.name + ' 攻击 ' + target.name + '，造成 ' + damage + ' 伤害！' })
        
        that.setData({
          combatLogs: combatLogs,
          myTotalHp: myTotalHp,
          enemyTotalHp: enemyTotalHp,
          showEffect: false,
          showDamage: true,
          damageText: '-' + damage,
          damageColor: '#ff4444'
        })
      }
      
      // 延迟后清除动画并继续
      setTimeout(function() {
        // 清除受击动画
        var myUnits2 = that.data.myUnits.slice()
        var enemyUnits2 = that.data.enemyUnits.slice()
        
        for (var i = 0; i < myUnits2.length; i++) {
          myUnits2[i].isHit = false
          myUnits2[i].isAttacking = false
        }
        for (var i = 0; i < enemyUnits2.length; i++) {
          enemyUnits2[i].isHit = false
          enemyUnits2[i].isAttacking = false
        }
        
        that.setData({
          myUnits: myUnits2,
          enemyUnits: enemyUnits2,
          showDamage: false
        })
        
        console.log('攻击结束，调用回调')
        if (callback) callback()
      }, 400)
    }, 300)
  },

  checkBattleEnd: function() {
    var myAlive = this.data.myUnits.filter(function(u) { return !u.isDead }).length
    var enemyAlive = this.data.enemyUnits.filter(function(u) { return !u.isDead }).length
    
    console.log('检查战斗结束: 我方存活=' + myAlive + ', 敌方存活=' + enemyAlive)
    
    if (myAlive === 0 || enemyAlive === 0) {
      var victory = enemyAlive === 0
      var combatLogs = this.data.combatLogs.slice()
      
      combatLogs.push({ type: 'info', text: victory ? '🎉 战斗胜利！' : '💔 战斗失败...' })
      
      console.log('=====================================')
      console.log('战斗结束，胜利=' + victory)
      console.log('准备设置 combatEnded=true')
      
      var that = this
      this.setData({
        combatLogs: combatLogs,
        combatEnded: true,
        combatVictory: victory
      }, function() {
        console.log('setData 回调执行完毕')
        console.log('当前 combatEnded=' + that.data.combatEnded)
        console.log('当前 combatVictory=' + that.data.combatVictory)
        console.log('=====================================')
      })
      
      return true
    }
    return false
  },

  handleCombatEnd: function() {
    var that = this
    var combatVictory = this.data.combatVictory
    var selectedDungeon = this.data.selectedDungeon
    var currentNpcIndex = this.data.currentNpcIndex
    var currentNpc = this.data.currentNpc
    
    if (combatVictory) {
      // 调用后端接口获取经验奖励
      wx.showLoading({ title: '结算中...' })
      
      request({
        url: '/dungeon/victory',
        method: 'POST',
        data: {
          dungeonId: selectedDungeon.id,
          npcIndex: currentNpcIndex + 1, // NPC索引从1开始
          npcName: currentNpc.name,
          baseExp: currentNpc.expReward || 100
        }
      }).then(function(res) {
        wx.hideLoading()
        console.log('战斗胜利结算:', res)
        
        if (res.code === 200 && res.data) {
          var result = res.data
          
          // 显示经验获取提示
          var expMsg = '获得经验 +' + result.expGained
          if (result.levelUp) {
            expMsg += '，升级了！当前Lv.' + result.currentLevel
          }
          
          wx.showToast({
            title: expMsg,
            icon: 'none',
            duration: 2000
          })
          
          // 更新玩家等级
          if (result.currentLevel) {
            that.setData({ playerLevel: result.currentLevel })
          }
        }
        
        // 继续下一关或显示通关弹窗
        if (currentNpcIndex + 1 >= selectedDungeon.npcCount) {
          that.setData({ inCombat: false, showClearModal: true })
        } else {
          var nextIndex = currentNpcIndex + 1
          that.setData({
            inCombat: false,
            currentNpcIndex: nextIndex,
            currentNpc: selectedDungeon.npcs[nextIndex]
          })
        }
      }).catch(function(err) {
        wx.hideLoading()
        console.error('战斗结算失败:', err)
        
        // 即使结算失败也继续游戏流程
        if (currentNpcIndex + 1 >= selectedDungeon.npcCount) {
          that.setData({ inCombat: false, showClearModal: true })
        } else {
          var nextIndex = currentNpcIndex + 1
          that.setData({
            inCombat: false,
            currentNpcIndex: nextIndex,
            currentNpc: selectedDungeon.npcs[nextIndex]
          })
        }
      })
    } else {
      this.exitBattle()
    }
  },

  exitBattle: function() {
    this.setData({
      inBattle: false,
      inCombat: false,
      showClearModal: false,
      currentNpcIndex: 0,
      currentNpc: null,
      combatLogs: [],
      combatEnded: false
    })
    
    if (this.data.selectedDungeon) {
      this.fetchProgress(this.data.selectedDungeon.id)
    }
  },

  goBack: function() {
    var that = this
    if (this.data.inCombat) {
      wx.showModal({ title: '提示', content: '战斗中无法退出！', showCancel: false })
      return
    }
    
    if (this.data.inBattle) {
      wx.showModal({
        title: '提示',
        content: '确定要放弃当前战役吗？',
        success: function(res) {
          if (res.confirm) that.exitBattle()
        }
      })
    } else {
      wx.navigateBack()
    }
  }
})
