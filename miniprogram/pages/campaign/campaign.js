// pages/campaign/campaign.js
const request = require('../../utils/request');

Page({
  data: {
    campaigns: [],
    selectedCampaign: null,
    stamina: 0,
    tigerTalisman: 0,
    showSweepModal: false,
    showSweepResult: false,
    sweepTarget: 10,
    sweepResult: null
  },

  onLoad() {
    this.loadCampaigns();
  },

  onShow() {
    this.loadCampaigns();
  },

  /**
   * 加载战役列表
   */
  async loadCampaigns() {
    try {
      const res = await request({
        url: '/campaign/list',
        method: 'GET'
      });

      if (res.success) {
        this.setData({
          campaigns: res.campaigns,
          selectedCampaign: res.campaigns.length > 0 ? res.campaigns[0] : null
        });
        
        // 加载资源信息
        this.loadResources();
      } else {
        wx.showToast({
          title: res.message || '加载失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载战役列表失败:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    }
  },

  /**
   * 加载资源信息
   */
  async loadResources() {
    try {
      const res = await request({
        url: '/user/resources',
        method: 'GET'
      });

      if (res.success) {
        this.setData({
          stamina: res.resource.stamina || 100,
          tigerTalisman: res.resource.generalOrder || 10
        });
      }
    } catch (error) {
      console.error('加载资源失败:', error);
    }
  },

  /**
   * 选择战役
   */
  selectCampaign(e) {
    const index = e.currentTarget.dataset.index;
    const campaign = this.data.campaigns[index];
    
    if (!campaign.unlocked) {
      wx.showToast({
        title: `需要等级 ${campaign.campaign.requiredLevel}`,
        icon: 'none'
      });
      return;
    }

    this.setData({
      selectedCampaign: campaign
    });
  },

  /**
   * 进入战役
   */
  async enterCampaign() {
    const { selectedCampaign } = this.data;
    if (!selectedCampaign) return;

    try {
      wx.showLoading({ title: '进入战役...' });

      const res = await request({
        url: `/campaign/start/${selectedCampaign.campaign.id}`,
        method: 'POST'
      });

      wx.hideLoading();

      if (res.success) {
        // 跳转到战役关卡页面
        wx.navigateTo({
          url: `/pages/campaignBattle/campaignBattle?campaignId=${selectedCampaign.campaign.id}`
        });
      } else {
        wx.showToast({
          title: res.message || '进入失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('进入战役失败:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    }
  },

  /**
   * 显示扫荡弹窗
   */
  showSweepModal() {
    const { selectedCampaign } = this.data;
    if (!selectedCampaign) return;

    this.setData({
      showSweepModal: true,
      sweepTarget: Math.min(20, selectedCampaign.progress.maxClearedStage)
    });
  },

  /**
   * 关闭扫荡弹窗
   */
  closeSweepModal() {
    this.setData({
      showSweepModal: false
    });
  },

  /**
   * 增加扫荡目标
   */
  increaseSweepTarget() {
    const { sweepTarget, selectedCampaign } = this.data;
    if (sweepTarget < selectedCampaign.progress.maxClearedStage) {
      this.setData({
        sweepTarget: sweepTarget + 1
      });
    }
  },

  /**
   * 减少扫荡目标
   */
  decreaseSweepTarget() {
    const { sweepTarget } = this.data;
    if (sweepTarget > 1) {
      this.setData({
        sweepTarget: sweepTarget - 1
      });
    }
  },

  /**
   * 开始扫荡
   */
  async startSweep() {
    const { selectedCampaign, sweepTarget, tigerTalisman } = this.data;
    if (!selectedCampaign) return;

    if (tigerTalisman <= 0) {
      wx.showToast({
        title: '虎符不足',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '扫荡中...' });

      const res = await request({
        url: `/campaign/sweep/${selectedCampaign.campaign.id}`,
        method: 'POST',
        data: {
          targetStage: sweepTarget
        }
      });

      wx.hideLoading();

      if (res.success) {
        this.setData({
          showSweepModal: false,
          showSweepResult: true,
          sweepResult: res.sweepResult
        });
        
        // 刷新数据
        this.loadCampaigns();
      } else {
        wx.showToast({
          title: res.message || '扫荡失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('扫荡失败:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    }
  },

  /**
   * 关闭扫荡结果弹窗
   */
  closeSweepResult() {
    this.setData({
      showSweepResult: false,
      sweepResult: null
    });
  },

  /**
   * 获取品质样式类
   */
  getQualityClass(quality) {
    const qualityMap = {
      '普通': 'normal',
      '普通装备': 'normal',
      '优秀': 'excellent',
      '优秀装备': 'excellent',
      '精良': 'rare',
      '精良装备': 'rare',
      '史诗': 'epic',
      '史诗装备': 'epic',
      '传说': 'legend',
      '传说装备': 'legend',
      '神话': 'myth',
      '神话装备': 'myth'
    };
    return qualityMap[quality] || 'normal';
  },

  /**
   * 返回
   */
  goBack() {
    wx.navigateBack();
  }
});
