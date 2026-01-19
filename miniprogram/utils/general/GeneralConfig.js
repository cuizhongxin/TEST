/**
 * 武将系统配置
 */

// 武将品质等级
const QUALITY = {
  ORANGE: {
    id: 6,
    name: '橙色',
    color: '#FF8C00',
    baseMultiplier: 1.5,    // 基础属性倍率
    star: 5,                // 初始星级
    icon: '🟠'
  },
  PURPLE: {
    id: 5,
    name: '紫色',
    color: '#9370DB',
    baseMultiplier: 1.3,
    star: 4,
    icon: '🟣'
  },
  RED: {
    id: 4,
    name: '红色',
    color: '#DC143C',
    baseMultiplier: 1.1,
    star: 4,
    icon: '🔴'
  },
  BLUE: {
    id: 3,
    name: '蓝色',
    color: '#4169E1',
    baseMultiplier: 0.9,
    star: 3,
    icon: '🔵'
  },
  GREEN: {
    id: 2,
    name: '绿色',
    color: '#32CD32',
    baseMultiplier: 0.7,
    star: 2,
    icon: '🟢'
  },
  WHITE: {
    id: 1,
    name: '白色',
    color: '#FFFFFF',
    baseMultiplier: 0.5,
    star: 1,
    icon: '⚪'
  }
}

// 武将类型
const GENERAL_TYPE = {
  ATTACK: {
    id: 1,
    name: '攻击型',
    description: '高攻击、高武勇，低防御、低统御',
    icon: '⚔️',
    attributes: {
      attack: 1.3,      // 攻击力倍率
      defense: 0.7,     // 防御力倍率
      valor: 1.3,       // 武勇倍率
      command: 0.7,     // 统御倍率
      dodge: 1.0,       // 闪避率倍率
      mobility: 1.1     // 机动性倍率
    }
  },
  DEFENSE: {
    id: 2,
    name: '防御型',
    description: '低攻击、低武勇，高防御、高统御',
    icon: '🛡️',
    attributes: {
      attack: 0.7,
      defense: 1.3,
      valor: 0.7,
      command: 1.3,
      dodge: 1.0,
      mobility: 0.9
    }
  },
  PURE_ATTACK: {
    id: 3,
    name: '纯攻击型',
    description: '极高攻击，武勇一般',
    icon: '🗡️',
    attributes: {
      attack: 1.5,
      defense: 0.8,
      valor: 0.9,
      command: 0.8,
      dodge: 1.0,
      mobility: 1.0
    }
  },
  PURE_VALOR: {
    id: 4,
    name: '纯武勇型',
    description: '极高武勇，其他属性均衡',
    icon: '💪',
    attributes: {
      attack: 1.0,
      defense: 1.0,
      valor: 1.5,
      command: 0.8,
      dodge: 1.0,
      mobility: 1.0
    }
  },
  BALANCED: {
    id: 5,
    name: '均衡型',
    description: '各项属性均衡发展',
    icon: '⚖️',
    attributes: {
      attack: 1.0,
      defense: 1.0,
      valor: 1.0,
      command: 1.0,
      dodge: 1.0,
      mobility: 1.0
    }
  },
  AGILE: {
    id: 6,
    name: '敏捷型',
    description: '高闪避、高机动，攻防一般',
    icon: '🏃',
    attributes: {
      attack: 0.9,
      defense: 0.9,
      valor: 0.9,
      command: 0.9,
      dodge: 1.4,
      mobility: 1.4
    }
  },
  COMMANDER: {
    id: 7,
    name: '统帅型',
    description: '高统御、高机动，降低己方损失',
    icon: '👑',
    attributes: {
      attack: 0.9,
      defense: 1.1,
      valor: 0.8,
      command: 1.4,
      dodge: 1.0,
      mobility: 1.2
    }
  }
}

// 基础属性值（1级白色武将的基础值）
const BASE_ATTRIBUTES = {
  attack: 100,      // 基础攻击力
  defense: 100,     // 基础防御力
  valor: 50,        // 基础武勇
  command: 50,      // 基础统御
  dodge: 10,        // 基础闪避率（%）
  mobility: 50      // 基础机动性
}

// 每级成长率
const GROWTH_RATE = {
  attack: 5,        // 每级+5攻击
  defense: 5,       // 每级+5防御
  valor: 2,         // 每级+2武勇
  command: 2,       // 每级+2统御
  dodge: 0.5,       // 每级+0.5闪避
  mobility: 2       // 每级+2机动
}

// 装备槽位
const EQUIPMENT_SLOT = {
  WEAPON: { id: 1, name: '武器', icon: '⚔️' },
  ARMOR: { id: 2, name: '护甲', icon: '🛡️' },
  HELMET: { id: 3, name: '头盔', icon: '🪖' },
  ACCESSORY: { id: 4, name: '饰品', icon: '💍' }
}

// 兵法槽位
const TACTIC_SLOT = {
  PRIMARY: { id: 1, name: '主战法', icon: '📜' },
  SECONDARY: { id: 2, name: '副战法', icon: '📃' }
}

// 兵种类型
const TROOP_TYPE = {
  INFANTRY: {
    id: 1,
    name: '步兵',
    icon: '🛡️',
    description: '攻击较低，防御和闪避较高',
    attributes: {
      attack: 0.8,      // 攻击倍率
      defense: 1.3,     // 防御倍率
      dodge: 1.5        // 闪避倍率（初始最高20%）
    },
    restrains: 'ARCHER',  // 克制弓兵
    restrainedBy: 'CAVALRY', // 被骑兵克制
    restrainBonus: 0.3    // 克制伤害加成30%
  },
  CAVALRY: {
    id: 2,
    name: '骑兵',
    icon: '🐎',
    description: '各项属性均衡',
    attributes: {
      attack: 1.0,
      defense: 1.0,
      dodge: 1.0
    },
    restrains: 'INFANTRY',
    restrainedBy: 'ARCHER',
    restrainBonus: 0.3
  },
  ARCHER: {
    id: 3,
    name: '弓兵',
    icon: '🏹',
    description: '攻击较高，防御较低',
    attributes: {
      attack: 1.3,
      defense: 0.7,
      dodge: 1.0
    },
    restrains: 'CAVALRY',
    restrainedBy: 'INFANTRY',
    restrainBonus: 0.3
  }
}

// 士兵等级（18级）
const SOLDIER_RANK = {
  // 步兵等级
  INFANTRY: [
    { level: 1, name: '民兵', icon: '🔰', powerMultiplier: 1.0 },
    { level: 2, name: '征召兵', icon: '🔰', powerMultiplier: 1.1 },
    { level: 3, name: '新兵', icon: '🔰', powerMultiplier: 1.2 },
    { level: 4, name: '列兵', icon: '⚔️', powerMultiplier: 1.3 },
    { level: 5, name: '精兵', icon: '⚔️', powerMultiplier: 1.4 },
    { level: 6, name: '老兵', icon: '⚔️', powerMultiplier: 1.5 },
    { level: 7, name: '盾卫', icon: '🛡️', powerMultiplier: 1.6 },
    { level: 8, name: '重盾兵', icon: '🛡️', powerMultiplier: 1.75 },
    { level: 9, name: '刀盾兵', icon: '🛡️', powerMultiplier: 1.9 },
    { level: 10, name: '精锐盾卫', icon: '⭐', powerMultiplier: 2.1 },
    { level: 11, name: '禁卫军', icon: '⭐', powerMultiplier: 2.3 },
    { level: 12, name: '虎贲军', icon: '⭐', powerMultiplier: 2.5 },
    { level: 13, name: '陷阵营', icon: '💫', powerMultiplier: 2.8 },
    { level: 14, name: '白马义从', icon: '💫', powerMultiplier: 3.1 },
    { level: 15, name: '青州兵', icon: '💫', powerMultiplier: 3.4 },
    { level: 16, name: '无当飞军', icon: '✨', powerMultiplier: 3.8 },
    { level: 17, name: '大戟士', icon: '✨', powerMultiplier: 4.2 },
    { level: 18, name: '虎豹骑卫', icon: '👑', powerMultiplier: 5.0 }
  ],
  
  // 骑兵等级
  CAVALRY: [
    { level: 1, name: '游骑', icon: '🔰', powerMultiplier: 1.0 },
    { level: 2, name: '轻骑', icon: '🔰', powerMultiplier: 1.1 },
    { level: 3, name: '斥候骑', icon: '🔰', powerMultiplier: 1.2 },
    { level: 4, name: '骑士', icon: '⚔️', powerMultiplier: 1.3 },
    { level: 5, name: '骁骑', icon: '⚔️', powerMultiplier: 1.4 },
    { level: 6, name: '精骑', icon: '⚔️', powerMultiplier: 1.5 },
    { level: 7, name: '突骑', icon: '🐎', powerMultiplier: 1.6 },
    { level: 8, name: '铁骑', icon: '🐎', powerMultiplier: 1.75 },
    { level: 9, name: '重骑兵', icon: '🐎', powerMultiplier: 1.9 },
    { level: 10, name: '玄甲骑', icon: '⭐', powerMultiplier: 2.1 },
    { level: 11, name: '虎骑营', icon: '⭐', powerMultiplier: 2.3 },
    { level: 12, name: '飞熊军', icon: '⭐', powerMultiplier: 2.5 },
    { level: 13, name: '西凉铁骑', icon: '💫', powerMultiplier: 2.8 },
    { level: 14, name: '并州狼骑', icon: '💫', powerMultiplier: 3.1 },
    { level: 15, name: '幽州突骑', icon: '💫', powerMultiplier: 3.4 },
    { level: 16, name: '白马从骑', icon: '✨', powerMultiplier: 3.8 },
    { level: 17, name: '虎豹骑', icon: '✨', powerMultiplier: 4.2 },
    { level: 18, name: '西园禁军', icon: '👑', powerMultiplier: 5.0 }
  ],
  
  // 弓兵等级
  ARCHER: [
    { level: 1, name: '猎户', icon: '🔰', powerMultiplier: 1.0 },
    { level: 2, name: '弓手', icon: '🔰', powerMultiplier: 1.1 },
    { level: 3, name: '射手', icon: '🔰', powerMultiplier: 1.2 },
    { level: 4, name: '弩手', icon: '⚔️', powerMultiplier: 1.3 },
    { level: 5, name: '强弩手', icon: '⚔️', powerMultiplier: 1.4 },
    { level: 6, name: '精锐弓手', icon: '⚔️', powerMultiplier: 1.5 },
    { level: 7, name: '连弩手', icon: '🏹', powerMultiplier: 1.6 },
    { level: 8, name: '重弩兵', icon: '🏹', powerMultiplier: 1.75 },
    { level: 9, name: '神臂弩手', icon: '🏹', powerMultiplier: 1.9 },
    { level: 10, name: '床弩营', icon: '⭐', powerMultiplier: 2.1 },
    { level: 11, name: '虎翼军', icon: '⭐', powerMultiplier: 2.3 },
    { level: 12, name: '长弓军', icon: '⭐', powerMultiplier: 2.5 },
    { level: 13, name: '神射营', icon: '💫', powerMultiplier: 2.8 },
    { level: 14, name: '百步穿杨', icon: '💫', powerMultiplier: 3.1 },
    { level: 15, name: '连珠弩营', icon: '💫', powerMultiplier: 3.4 },
    { level: 16, name: '白毦兵', icon: '✨', powerMultiplier: 3.8 },
    { level: 17, name: '弓神营', icon: '✨', powerMultiplier: 4.2 },
    { level: 18, name: '飞羽军', icon: '👑', powerMultiplier: 5.0 }
  ]
}

// 士兵配置
const SOLDIER_CONFIG = {
  maxCount: 1000,  // 每个武将固定1000名士兵
  defaultRank: 1   // 默认士兵等级
}

module.exports = {
  QUALITY,
  GENERAL_TYPE,
  BASE_ATTRIBUTES,
  GROWTH_RATE,
  EQUIPMENT_SLOT,
  TACTIC_SLOT,
  TROOP_TYPE,
  SOLDIER_RANK,
  SOLDIER_CONFIG
}

