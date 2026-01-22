// pages/campaignBattle/campaignBattle.js
const request = require('../../utils/request');

Page({
  data: {
    campaignId: '',
    campaign: null,
    progress: null,
    currentStage: null,
    silver: 0,
    showReplenishModal: false,
    replenishCost: 0,
    showBattleResult: false,
    battleResult: null
  },

  onLoad(options) {
    if (options.campaignId) {
      this.setData({ campaignId: options.campaignId });
      this.loadCampaignStatus();
    }
  },

  onShow() {
    if (this.data.campaignId) {
      this.loadCampaignStatus();
    }
  },

  /**
   * 加载战役状态
   */
  async loadCampaignStatus() {
    try {
      const res = await request({
        url: `/campaign/status/${this.data.campaignId}`,
        method: 'GET'
      });

      if (res.success) {
        // 更新导航栏标题
        wx.setNavigationBarTitle({
          title: res.campaign.name
        });

        this.setData({
          campaign: res.campaign,
          progress: res.progress,
          currentStage: res.currentStage,
          silver: res.silver || 0
        });
      } else {
        wx.showToast({
          title: res.message || '加载失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载战役状态失败:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    }
  },

  /**
   * 选择关卡（查看详情）
   */
  selectStage(e) {
    const index = e.currentTarget.dataset.index;
    const stage = this.data.campaign.stages[index];
    
    this.setData({
      currentStage: stage
    });
  },

  /**
   * 进攻当前关卡
   */
  async attackStage() {
    const { progress, campaignId } = this.data;
    
    if (!progress || !progress.inProgress) {
      wx.showToast({
        title: '战役未开始',
        icon: 'none'
      });
      return;
    }

    if (progress.currentTroops <= 0) {
      wx.showToast({
        title: '兵力不足，请补充兵力',
        icon: 'none'
      });
      this.showReplenishModal();
      return;
    }

    try {
      wx.showLoading({ title: '战斗中...' });

      const res = await request({
        url: `/campaign/attack/${campaignId}`,
        method: 'POST'
      });

      wx.hideLoading();

      if (res.success) {
        this.setData({
          showBattleResult: true,
          battleResult: res.battleResult
        });

        // 刷新状态
        this.loadCampaignStatus();
      } else {
        wx.showToast({
          title: res.message || '战斗失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('攻击失败:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    }
  },

  /**
   * 显示补充兵力弹窗
   */
  showReplenishModal() {
    const { progress } = this.data;
    const neededTroops = progress.maxTroops - progress.currentTroops;
    const cost = Math.ceil(neededTroops / 100) * 100;

    this.setData({
      showReplenishModal: true,
      replenishCost: cost
    });
  },

  /**
   * 补充兵力
   */
  replenishTroops() {
    this.showReplenishModal();
  },

  /**
   * 关闭补充兵力弹窗
   */
  closeReplenishModal() {
    this.setData({
      showReplenishModal: false
    });
  },

  /**
   * 确认补充兵力
   */
  async confirmReplenish() {
    const { campaignId, progress } = this.data;
    const amount = progress.maxTroops - progress.currentTroops;

    try {
      wx.showLoading({ title: '补充中...' });

      const res = await request({
        url: `/campaign/replenish/${campaignId}`,
        method: 'POST',
        data: { amount }
      });

      wx.hideLoading();

      if (res.success) {
        wx.showToast({
          title: `补充 ${res.troopsAdded} 兵力`,
          icon: 'success'
        });
        
        this.setData({
          showReplenishModal: false
        });
        
        // 刷新状态
        this.loadCampaignStatus();
      } else {
        wx.showToast({
          title: res.message || '补充失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('补充兵力失败:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    }
  },

  /**
   * 重生
   */
  async revive() {
    const { campaignId } = this.data;

    try {
      wx.showLoading({ title: '重生中...' });

      const res = await request({
        url: `/campaign/revive/${campaignId}`,
        method: 'POST'
      });

      wx.hideLoading();

      if (res.success) {
        wx.showToast({
          title: '重生成功',
          icon: 'success'
        });
        
        this.setData({
          showBattleResult: false
        });
        
        // 刷新状态
        this.loadCampaignStatus();
      } else {
        wx.showToast({
          title: res.message || '重生失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('重生失败:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    }
  },

  /**
   * 关闭战斗结果弹窗
   */
  closeBattleResult() {
    this.setData({
      showBattleResult: false,
      battleResult: null
    });

    // 检查战役是否结束
    const { progress, campaign } = this.data;
    if (!progress.inProgress || progress.currentStage > campaign.stages.length) {
      // 战役结束，返回列表
      wx.showModal({
        title: '战役完成',
        content: '恭喜通关本次战役！',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    }
  },

  /**
   * 暂停战役
   */
  async pauseCampaign() {
    const { campaignId } = this.data;

    try {
      const res = await request({
        url: `/campaign/pause/${campaignId}`,
        method: 'POST'
      });

      if (res.success) {
        wx.showToast({
          title: '战役已暂停',
          icon: 'success'
        });
        
        // 返回上一页
        wx.navigateBack();
      } else {
        wx.showToast({
          title: res.message || '暂停失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('暂停战役失败:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    }
  },

  /**
   * 结束战役
   */
  endCampaign() {
    wx.showModal({
      title: '确认结束',
      content: '结束战役将放弃当前进度，确定要结束吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await request({
              url: `/campaign/end/${this.data.campaignId}`,
              method: 'POST'
            });

            if (result.success) {
              wx.showToast({
                title: '战役已结束',
                icon: 'success'
              });
              
              // 返回上一页
              wx.navigateBack();
            } else {
              wx.showToast({
                title: result.message || '结束失败',
                icon: 'none'
              });
            }
          } catch (error) {
            console.error('结束战役失败:', error);
            wx.showToast({
              title: '网络错误',
              icon: 'none'
            });
          }
        }
      }
    });
  }
});
