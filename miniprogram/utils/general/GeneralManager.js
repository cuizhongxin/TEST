/**
 * 武将管理器 - 管理武将的升级、装备、兵法等
 */

const { GROWTH_RATE } = require('./GeneralConfig.js')
const GeneralFactory = require('./GeneralFactory.js')

/**
 * 武将管理器
 */
class GeneralManager {
  
  /**
   * 武将升级
   * @param {Object} general - 武将对象
   * @param {number} exp - 获得的经验值
   * @returns {Object} 升级结果 { levelUp: boolean, level: number, attributes: Object }
   */
  static addExp(general, exp) {
    general.exp += exp
    let levelUp = false
    
    // 检查是否升级
    while (general.exp >= general.maxExp && general.level < 100) {
      general.exp -= general.maxExp
      general.level += 1
      general.maxExp = GeneralFactory.calculateMaxExp(general.level)
      levelUp = true
      
      // 重新计算属性
      general.attributes = GeneralFactory.calculateAttributes(
        general.quality,
        general.type,
        general.level
      )
    }
    
    return {
      levelUp,
      level: general.level,
      attributes: general.attributes
    }
  }

  /**
   * 装备武器
   */
  static equipItem(general, slot, equipment) {
    if (!general.equipment.hasOwnProperty(slot)) {
      throw new Error(`无效的装备槽位: ${slot}`)
    }
    
    // 卸下旧装备
    const oldEquipment = general.equipment[slot]
    
    // 装备新装备
    general.equipment[slot] = equipment
    
    // 重新计算属性
    this.recalculateAttributes(general)
    
    return {
      success: true,
      oldEquipment,
      newEquipment: equipment
    }
  }

  /**
   * 卸下装备
   */
  static unequipItem(general, slot) {
    const equipment = general.equipment[slot]
    general.equipment[slot] = null
    
    // 重新计算属性
    this.recalculateAttributes(general)
    
    return equipment
  }

  /**
   * 装备兵法
   */
  static equipTactic(general, slot, tactic) {
    if (!general.tactics.hasOwnProperty(slot)) {
      throw new Error(`无效的兵法槽位: ${slot}`)
    }
    
    const oldTactic = general.tactics[slot]
    general.tactics[slot] = tactic
    
    return {
      success: true,
      oldTactic,
      newTactic: tactic
    }
  }

  /**
   * 卸下兵法
   */
  static unequipTactic(general, slot) {
    const tactic = general.tactics[slot]
    general.tactics[slot] = null
    return tactic
  }

  /**
   * 重新计算属性（包含装备加成）
   */
  static recalculateAttributes(general) {
    // 先计算基础属性
    let baseAttributes = GeneralFactory.calculateAttributes(
      general.quality,
      general.type,
      general.level
    )
    
    // 应用装备加成
    const equipmentBonus = this.calculateEquipmentBonus(general.equipment)
    
    // 合并属性
    general.attributes = {
      attack: baseAttributes.attack + equipmentBonus.attack,
      defense: baseAttributes.defense + equipmentBonus.defense,
      valor: baseAttributes.valor + equipmentBonus.valor,
      command: baseAttributes.command + equipmentBonus.command,
      dodge: Math.min(baseAttributes.dodge + equipmentBonus.dodge, 100),
      mobility: baseAttributes.mobility + equipmentBonus.mobility,
      power: 0
    }
    
    // 重新计算战力
    general.attributes.power = GeneralFactory.calculatePower(general.attributes)
  }

  /**
   * 计算装备加成
   */
  static calculateEquipmentBonus(equipment) {
    const bonus = {
      attack: 0,
      defense: 0,
      valor: 0,
      command: 0,
      dodge: 0,
      mobility: 0
    }
    
    // 遍历所有装备槽位
    Object.values(equipment).forEach(item => {
      if (item && item.attributes) {
        Object.keys(bonus).forEach(attr => {
          if (item.attributes[attr]) {
            bonus[attr] += item.attributes[attr]
          }
        })
      }
    })
    
    return bonus
  }

  /**
   * 锁定/解锁武将
   */
  static toggleLock(general) {
    general.status.locked = !general.status.locked
    return general.status.locked
  }

  /**
   * 武将受伤
   */
  static injure(general, duration = 3600000) { // 默认1小时
    general.status.injured = true
    general.status.injuredUntil = Date.now() + duration
  }

  /**
   * 检查并恢复武将伤势
   */
  static checkInjury(general) {
    if (general.status.injured && Date.now() >= general.status.injuredUntil) {
      general.status.injured = false
      delete general.status.injuredUntil
      return true
    }
    return false
  }

  /**
   * 更新战斗统计
   */
  static updateBattleStats(general, result) {
    general.stats.totalBattles += 1
    
    if (result.victory) {
      general.stats.victories += 1
    } else {
      general.stats.defeats += 1
    }
    
    if (result.kills) {
      general.stats.kills += result.kills
    }
    
    if (result.isMVP) {
      general.stats.mvpCount += 1
    }
  }

  /**
   * 计算武将胜率
   */
  static getWinRate(general) {
    if (general.stats.totalBattles === 0) return 0
    return Math.floor((general.stats.victories / general.stats.totalBattles) * 100)
  }

  /**
   * 获取武将详细信息（用于展示）
   */
  static getGeneralInfo(general) {
    return {
      ...general,
      winRate: this.getWinRate(general),
      isInjured: general.status.injured && Date.now() < general.status.injuredUntil,
      injuryRemaining: general.status.injured ? 
        Math.max(0, general.status.injuredUntil - Date.now()) : 0
    }
  }
}

module.exports = GeneralManager


