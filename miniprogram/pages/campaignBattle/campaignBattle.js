const request = require('../../utils/request');

Page({
  data: {
    campaignId: '',
    campaign: null,
    progress: null,
    currentStage: null,
    resource: null,
    loading: true,
    
    // 阵型中的武将（自动获取）
    formationGenerals: [],
    mainGeneral: null,
    
    // 战斗相关
    isBattling: false,
    currentRound: 1,
    enemyCurrentTroops: 0,
    battleLogs: [],
    
    // 动画相关
    showAttackAnimation: false,
    attackDirection: '',
    isPlayerAttacking: false,
    isEnemyAttacking: false,
    showClash: false,
    
    // 阵型
    playerFormation: [],
    enemyFormation: [],
    
    // 结果
    showBattleResult: false,
    battleResult: null
  },

  onLoad(options) {
    const { campaignId } = options;
    this.setData({ campaignId });
    this.loadFormationGenerals();
    this.loadCampaignDetail();
  },

  // 加载阵型中的武将
  async loadFormationGenerals() {
    try {
      // 获取阵型配置
      const formationRes = await request({ url: '/formation/info', method: 'GET' });
      if (formationRes.success || formationRes.code === 200) {
        const formation = formationRes.formation || formationRes.data;
        if (formation && formation.positions) {
          // 获取武将列表
          const generalRes = await request({ url: '/general/list', method: 'GET' });
          if (generalRes.success || generalRes.code === 200) {
            const generals = generalRes.generals || generalRes.data || [];
            const formationGenerals = [];
            
            // 匹配阵型位置的武将
            for (let pos of formation.positions) {
              if (pos && pos.generalId) {
                const general = generals.find(g => g.id === pos.generalId);
                if (general) {
                  formationGenerals.push(general);
                }
              }
            }
            
            // 如果阵型为空，使用第一个武将
            if (formationGenerals.length === 0 && generals.length > 0) {
              formationGenerals.push(generals[0]);
            }
            
            const mainGeneral = formationGenerals[0] || null;
            this.setData({ 
              formationGenerals, 
              mainGeneral 
            });
          }
        }
      }
    } catch (err) {
      console.error('加载阵型武将失败:', err);
      // 尝试直接获取武将列表作为后备
      try {
        const res = await request({ url: '/general/list', method: 'GET' });
        if (res.success || res.code === 200) {
          const generals = res.generals || res.data || [];
          if (generals.length > 0) {
            this.setData({ 
              formationGenerals: [generals[0]], 
              mainGeneral: generals[0] 
            });
          }
        }
      } catch (e) {
        console.error('获取武将失败:', e);
      }
    }
  },

  async loadCampaignDetail() {
    try {
      this.setData({ loading: true });
      const res = await request({ url: `/campaign/detail/${this.data.campaignId}`, method: 'GET' });
      if (res.success) {
        const progress = res.progress;
        const campaign = res.campaign;
        let currentStage = null;
        
        // 获取当前关卡
        const stageIndex = (progress.currentStage || 1) - 1;
        if (stageIndex >= 0 && stageIndex < campaign.stages.length) {
          currentStage = campaign.stages[stageIndex];
        }
        
        this.setData({
          campaign,
          progress,
          currentStage,
          resource: res.resource,
          loading: false,
          enemyCurrentTroops: currentStage ? currentStage.enemyTroops : 0
        });
        
        // 初始化阵型
        this.initFormations();
      } else {
        wx.showToast({ title: res.message || '加载失败', icon: 'none' });
      }
    } catch (err) {
      console.error('加载战役详情失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 初始化阵型
  initFormations() {
    // 玩家阵型 - 3排
    const playerFormation = [
      [
        { type: 'infantry', flag: '前' },
        { type: 'infantry', flag: '前' },
        { type: 'infantry', flag: '前' },
        { type: 'infantry', flag: '前' }
      ],
      [
        { type: 'cavalry', flag: '中' },
        { type: 'cavalry', flag: '中' },
        { type: 'infantry', flag: '中' },
        { type: 'infantry', flag: '中' }
      ],
      [
        { type: 'archer', flag: '后' },
        { type: 'archer', flag: '后' },
        { type: 'archer', flag: '后' }
      ]
    ];
    
    // 敌方阵型
    const enemyFormation = [
      [
        { type: 'infantry', flag: '前' },
        { type: 'infantry', flag: '前' },
        { type: 'infantry', flag: '前' },
        { type: 'infantry', flag: '前' }
      ],
      [
        { type: 'cavalry', flag: '中' },
        { type: 'infantry', flag: '中' },
        { type: 'infantry', flag: '中' },
        { type: 'cavalry', flag: '中' }
      ],
      [
        { type: 'archer', flag: '后' },
        { type: 'archer', flag: '后' },
        { type: 'archer', flag: '后' }
      ]
    ];
    
    this.setData({ playerFormation, enemyFormation });
  },

  // 开始战役（直接使用阵型武将）
  async startCampaign() {
    if (!this.data.mainGeneral) {
      wx.showToast({ title: '请先配置阵型武将', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '出征中...' });
      const res = await request({ 
        url: '/campaign/start', 
        method: 'POST',
        data: {
          campaignId: this.data.campaignId,
          generalId: this.data.mainGeneral.id
        }
      });
      wx.hideLoading();

      if (res.success) {
        const campaign = res.campaign;
        const currentStage = campaign.stages[0];
        
        this.setData({
          progress: res.progress,
          campaign: res.campaign,
          currentStage: currentStage,
          enemyCurrentTroops: currentStage.enemyTroops,
          currentRound: 1,
          battleLogs: [{ type: 'system', text: '【战役开始】准备迎战！' }]
        });
        
        this.initFormations();
        wx.showToast({ title: '战役开始', icon: 'success' });
      } else {
        wx.showToast({ title: res.message || '出征失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('开始战役失败:', err);
      wx.showToast({ title: '出征失败', icon: 'none' });
    }
  },

  // 开始战斗（回合制）
  async startBattle() {
    if (this.data.isBattling) return;
    
    this.setData({ 
      isBattling: true,
      battleLogs: [...this.data.battleLogs, { type: 'system', text: `【第${this.data.currentRound}回合开始】` }]
    });
    
    // 获取双方属性
    const general = this.data.mainGeneral;
    const stage = this.data.currentStage;
    
    const playerMobility = general?.attributes?.mobility || 50;
    const enemyMobility = Math.floor((stage?.enemyLevel || 10) * 0.8);
    
    // 根据机动性决定先手
    const playerFirst = playerMobility >= enemyMobility;
    
    this.addLog('system', playerFirst ? '我军机动性较高，获得先手！' : '敌军抢得先手！');
    
    await this.delay(500);
    
    // 执行回合战斗
    await this.executeBattleRound(playerFirst);
  },

  // 执行战斗回合
  async executeBattleRound(playerFirst) {
    const maxRounds = 10;
    let round = this.data.currentRound;
    
    while (round <= maxRounds && this.data.progress.currentTroops > 0 && this.data.enemyCurrentTroops > 0) {
      // 根据先手顺序执行攻击
      if (playerFirst) {
        await this.playerAttack();
        if (this.data.enemyCurrentTroops <= 0) break;
        await this.delay(500);
        await this.enemyAttack();
      } else {
        await this.enemyAttack();
        if (this.data.progress.currentTroops <= 0) break;
        await this.delay(500);
        await this.playerAttack();
      }
      
      round++;
      
      if (this.data.progress.currentTroops > 0 && this.data.enemyCurrentTroops > 0 && round <= maxRounds) {
        this.setData({ currentRound: round });
        this.addLog('system', `【第${round}回合开始】`);
        await this.delay(800);
      }
    }
    
    // 战斗结束，处理结果
    await this.processBattleResult();
  },

  // 玩家攻击
  async playerAttack() {
    const general = this.data.mainGeneral;
    const stage = this.data.currentStage;
    
    const attack = (general?.attributes?.attack || 100) + (general?.attributes?.valor || 50) / 2;
    const enemyDefense = stage?.enemyDefense || 50;
    
    // 计算伤害
    let damage = Math.max(20, Math.floor(attack - enemyDefense / 2 + Math.random() * 30));
    
    // 播放攻击动画
    this.setData({ 
      showAttackAnimation: true, 
      attackDirection: 'player-attack',
      isPlayerAttacking: true,
      showClash: true
    });
    
    await this.delay(300);
    
    // 扣除敌方兵力
    const newEnemyTroops = Math.max(0, this.data.enemyCurrentTroops - damage);
    this.setData({ 
      enemyCurrentTroops: newEnemyTroops,
      showAttackAnimation: false,
      isPlayerAttacking: false,
      showClash: false
    });
    
    this.addLog('player', `${general?.name || '我军'} 发动攻击，造成 ${damage} 点伤害！`);
    
    if (newEnemyTroops <= 0) {
      this.addLog('system', `敌军溃败！`);
    }
  },

  // 敌方攻击
  async enemyAttack() {
    const general = this.data.mainGeneral;
    const stage = this.data.currentStage;
    const progress = this.data.progress;
    
    const attack = stage?.enemyAttack || 80;
    const playerDefense = (general?.attributes?.defense || 50) + (general?.attributes?.command || 50) / 2;
    
    // 计算伤害
    let damage = Math.max(15, Math.floor(attack - playerDefense / 2 + Math.random() * 25));
    
    // 播放攻击动画
    this.setData({ 
      showAttackAnimation: true, 
      attackDirection: 'enemy-attack',
      isEnemyAttacking: true,
      showClash: true
    });
    
    await this.delay(300);
    
    // 扣除玩家兵力
    const newTroops = Math.max(0, progress.currentTroops - damage);
    this.setData({ 
      'progress.currentTroops': newTroops,
      showAttackAnimation: false,
      isEnemyAttacking: false,
      showClash: false
    });
    
    this.addLog('enemy', `${stage?.enemyGeneralName || '敌军'} 发动攻击，造成 ${damage} 点伤害！`);
    
    if (newTroops <= 0) {
      this.addLog('system', `我军伤亡惨重！`);
    }
  },

  // 处理战斗结果
  async processBattleResult() {
    const victory = this.data.enemyCurrentTroops <= 0;
    const progress = this.data.progress;
    const stage = this.data.currentStage;
    
    // 调用后端接口记录结果
    try {
      const res = await request({ 
        url: '/campaign/attack', 
        method: 'POST',
        data: {
          campaignId: this.data.campaignId
        }
      });
      
      if (res.success) {
        this.setData({
          battleResult: res.battleResult,
          showBattleResult: true,
          isBattling: false
        });
      }
    } catch (err) {
      console.error('记录战斗结果失败:', err);
      
      // 本地模拟结果
      const troopsLost = (progress?.maxTroops || 1000) - (progress?.currentTroops || 0);
      this.setData({
        battleResult: {
          victory,
          stageNum: progress?.currentStage || 1,
          expGained: victory ? (stage?.expReward || 100) : 0,
          silverGained: victory ? (stage?.silverReward || 50) : 0,
          troopsLost,
          remainingTroops: progress?.currentTroops || 0,
          drops: [],
          isLastStage: (progress?.currentStage || 1) >= (this.data.campaign?.stages?.length || 7)
        },
        showBattleResult: true,
        isBattling: false
      });
    }
  },

  // 添加战斗日志
  addLog(type, text) {
    const logs = [...this.data.battleLogs, { type, text }];
    if (logs.length > 20) {
      logs.shift();
    }
    this.setData({ battleLogs: logs });
  },

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // 关闭战斗结果
  closeBattleResult() {
    const battleResult = this.data.battleResult;
    this.setData({ showBattleResult: false, battleResult: null });
    
    if (battleResult.victory) {
      if (battleResult.isLastStage) {
        wx.showToast({ title: '恭喜通关！', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        // 进入下一关
        this.loadCampaignDetail();
        this.setData({
          currentRound: 1,
          battleLogs: [{ type: 'system', text: '【准备进入下一关】' }]
        });
      }
    } else {
      // 失败，检查重生次数
      if (this.data.progress?.reviveCount > 0) {
        wx.showModal({
          title: '战败',
          content: `是否使用重生？剩余${this.data.progress.reviveCount}次`,
          success: (res) => {
            if (res.confirm) {
              this.revive();
            } else {
              wx.navigateBack();
            }
          }
        });
      } else {
        wx.showToast({ title: '战役失败', icon: 'none' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }
  },

  // 重生
  async revive() {
    try {
      const res = await request({ 
        url: '/campaign/revive', 
        method: 'POST',
        data: {
          campaignId: this.data.campaignId
        }
      });

      if (res.success) {
        wx.showToast({ title: '重生成功', icon: 'success' });
        this.loadCampaignDetail();
        this.setData({
          currentRound: 1,
          battleLogs: [{ type: 'system', text: '【重生成功，重新挑战】' }]
        });
      } else {
        wx.showToast({ title: res.message || '重生失败', icon: 'none' });
      }
    } catch (err) {
      console.error('重生失败:', err);
    }
  },

  // 暂停/撤退
  pauseCampaign() {
    wx.showModal({
      title: '确认撤退',
      content: '确定要撤退吗？战役进度将被保存。',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request({ 
              url: '/campaign/pause', 
              method: 'POST',
              data: { campaignId: this.data.campaignId }
            });
            wx.showToast({ title: '已撤退', icon: 'success' });
            setTimeout(() => {
              wx.navigateBack();
            }, 1000);
          } catch (err) {
            wx.navigateBack();
          }
        }
      }
    });
  },

  // 阻止冒泡
  preventClose() {},

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
