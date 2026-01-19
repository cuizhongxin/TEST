/**
 * 武将工厂类 - 用于生成武将
 */

const {
  QUALITY,
  GENERAL_TYPE,
  BASE_ATTRIBUTES,
  GROWTH_RATE,
  TROOP_TYPE,
  SOLDIER_RANK,
  SOLDIER_CONFIG
} = require('./GeneralConfig.js')

/**
 * 武将工厂
 */
class GeneralFactory {
  
  /**
   * 创建武将
   * @param {Object} options - 创建选项
   * @param {string} options.name - 武将名称
   * @param {string} options.quality - 品质（ORANGE/PURPLE/RED/BLUE/GREEN/WHITE）
   * @param {string} options.type - 类型（ATTACK/DEFENSE/PURE_ATTACK等）
   * @param {string} options.troopType - 兵种（INFANTRY/CAVALRY/ARCHER）
   * @param {number} options.level - 等级
   * @param {number} options.soldierRank - 士兵等级（1-18）
   * @param {string} options.avatar - 头像URL
   */
  static createGeneral(options) {
    const {
      name = '无名武将',
      quality = 'WHITE',
      type = 'BALANCED',
      troopType = 'INFANTRY',
      level = 1,
      soldierRank = 1,
      avatar = ''
    } = options

    const qualityConfig = QUALITY[quality]
    const typeConfig = GENERAL_TYPE[type]
    const troopConfig = TROOP_TYPE[troopType]
    const soldierInfo = SOLDIER_RANK[troopType][soldierRank - 1]

    if (!qualityConfig || !typeConfig || !troopConfig || !soldierInfo) {
      throw new Error('无效的品质、类型或兵种')
    }

    // 计算属性（包含兵种加成）
    const attributes = this.calculateAttributes(qualityConfig, typeConfig, troopConfig, level)

    // 生成武将对象
    return {
      id: this.generateId(),
      name,
      quality: qualityConfig,
      type: typeConfig,
      troopType: troopConfig,
      level,
      exp: 0,
      maxExp: this.calculateMaxExp(level),
      avatar,
      
      // 基础属性
      attributes,
      
      // 士兵信息
      soldiers: {
        type: troopConfig,
        rank: soldierRank,
        rankInfo: soldierInfo,
        count: SOLDIER_CONFIG.maxCount,
        maxCount: SOLDIER_CONFIG.maxCount
      },
      
      // 装备
      equipment: {
        weapon: null,
        armor: null,
        helmet: null,
        accessory: null
      },
      
      // 兵法
      tactics: {
        primary: null,
        secondary: null
      },
      
      // 状态
      status: {
        locked: false,      // 是否锁定
        inBattle: false,    // 是否在战斗中
        injured: false,     // 是否受伤
        morale: 100         // 士气值（0-100）
      },
      
      // 战斗统计
      stats: {
        totalBattles: 0,    // 总战斗次数
        victories: 0,       // 胜利次数
        defeats: 0,         // 失败次数
        kills: 0,           // 击杀数
        mvpCount: 0         // MVP次数
      },
      
      // 创建时间
      createTime: Date.now()
    }
  }

  /**
   * 计算武将属性（包含兵种加成）
   */
  static calculateAttributes(qualityConfig, typeConfig, troopConfig, level) {
    const qualityMultiplier = qualityConfig.baseMultiplier
    const typeAttributes = typeConfig.attributes
    const troopAttributes = troopConfig.attributes

    // 基础属性 × 品质倍率 × 类型倍率 × 兵种倍率 + 成长值
    const attack = Math.floor(
      (BASE_ATTRIBUTES.attack * qualityMultiplier * typeAttributes.attack * troopAttributes.attack) +
      (GROWTH_RATE.attack * (level - 1))
    )

    const defense = Math.floor(
      (BASE_ATTRIBUTES.defense * qualityMultiplier * typeAttributes.defense * troopAttributes.defense) +
      (GROWTH_RATE.defense * (level - 1))
    )

    const valor = Math.floor(
      (BASE_ATTRIBUTES.valor * qualityMultiplier * typeAttributes.valor) +
      (GROWTH_RATE.valor * (level - 1))
    )

    const command = Math.floor(
      (BASE_ATTRIBUTES.command * qualityMultiplier * typeAttributes.command) +
      (GROWTH_RATE.command * (level - 1))
    )

    // 步兵闪避倍率更高，初始最高可达20%
    const dodge = Math.min(Math.floor(
      (BASE_ATTRIBUTES.dodge * qualityMultiplier * typeAttributes.dodge * troopAttributes.dodge) +
      (GROWTH_RATE.dodge * (level - 1))
    ), 100) // 闪避率上限100%

    const mobility = Math.floor(
      (BASE_ATTRIBUTES.mobility * qualityMultiplier * typeAttributes.mobility) +
      (GROWTH_RATE.mobility * (level - 1))
    )

    return {
      attack,
      defense,
      valor,
      command,
      dodge,
      mobility,
      
      // 计算战力（综合评分）
      power: this.calculatePower({ attack, defense, valor, command, dodge, mobility })
    }
  }

  /**
   * 计算战力
   */
  static calculatePower(attributes) {
    const { attack, defense, valor, command, dodge, mobility } = attributes
    
    // 战力计算公式（可以根据游戏平衡性调整权重）
    return Math.floor(
      attack * 1.2 +
      defense * 1.2 +
      valor * 1.5 +
      command * 1.5 +
      dodge * 2 +
      mobility * 1.0
    )
  }

  /**
   * 计算升级所需经验
   */
  static calculateMaxExp(level) {
    return Math.floor(100 * Math.pow(1.2, level - 1))
  }

  /**
   * 生成唯一ID
   */
  static generateId() {
    return `general_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 批量创建武将
   */
  static createMultipleGenerals(count, options = {}) {
    const generals = []
    for (let i = 0; i < count; i++) {
      generals.push(this.createGeneral(options))
    }
    return generals
  }

  /**
   * 随机创建武将（用于抽卡等）
   */
  static createRandomGeneral(level = 1) {
    // 随机品质（权重：橙1% 紫5% 红15% 蓝30% 绿35% 白14%）
    const qualityRandom = Math.random() * 100
    let quality = 'WHITE'
    
    if (qualityRandom < 1) quality = 'ORANGE'
    else if (qualityRandom < 6) quality = 'PURPLE'
    else if (qualityRandom < 21) quality = 'RED'
    else if (qualityRandom < 51) quality = 'BLUE'
    else if (qualityRandom < 86) quality = 'GREEN'
    
    // 随机类型
    const types = Object.keys(GENERAL_TYPE)
    const type = types[Math.floor(Math.random() * types.length)]
    
    // 随机兵种
    const troopTypes = Object.keys(TROOP_TYPE)
    const troopType = troopTypes[Math.floor(Math.random() * troopTypes.length)]
    
    // 随机士兵等级（1-5级）
    const soldierRank = Math.floor(Math.random() * 5) + 1
    
    // 随机名字（示例）
    const firstNames = ['赵', '李', '王', '张', '刘', '陈', '杨', '黄', '周', '吴']
    const lastNames = ['云', '勇', '强', '刚', '威', '虎', '龙', '凤', '义', '忠']
    const name = firstNames[Math.floor(Math.random() * firstNames.length)] +
                 lastNames[Math.floor(Math.random() * lastNames.length)]
    
    return this.createGeneral({ name, quality, type, troopType, level, soldierRank })
  }
}

module.exports = GeneralFactory

