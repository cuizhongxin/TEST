const request = require('../../utils/request');

Page({
  data: {
    campaigns: [],
    loading: true,
    selectedCampaign: null,
    showDetail: false,
    userStamina: 0,
    maxStamina: 100
  },

  onLoad() {
    this.loadCampaigns();
  },

  onShow() {
    this.loadCampaigns();
  },

  async loadCampaigns() {
    try {
      this.setData({ loading: true });
      const res = await request({ url: '/campaign/list', method: 'GET' });
      if (res.success) {
        this.setData({
          campaigns: res.campaigns || [],
          loading: false
        });
      } else {
        wx.showToast({ title: res.message || '加载失败', icon: 'none' });
        this.setData({ loading: false });
      }
    } catch (err) {
      console.error('加载战役列表失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 选择战役查看详情
  selectCampaign(e) {
    const campaign = e.currentTarget.dataset.campaign;
    if (!campaign.unlocked) {
      wx.showToast({ 
        title: `需要达到${campaign.requiredLevel}级才能解锁`, 
        icon: 'none' 
      });
      return;
    }
    this.setData({
      selectedCampaign: campaign,
      showDetail: true
    });
  },

  // 关闭详情
  closeDetail() {
    this.setData({
      showDetail: false,
      selectedCampaign: null
    });
  },

  // 进入战役
  enterCampaign() {
    const campaign = this.data.selectedCampaign;
    if (!campaign) return;

    // 检查是否有进行中的战役
    if (campaign.status === 'IN_PROGRESS' || campaign.status === 'PAUSED') {
      // 继续战役
      wx.navigateTo({
        url: `/pages/campaignBattle/campaignBattle?campaignId=${campaign.id}&resume=true`
      });
    } else {
      // 新开始战役
      wx.navigateTo({
        url: `/pages/campaignBattle/campaignBattle?campaignId=${campaign.id}`
      });
    }
  },

  // 开始扫荡
  startSweep() {
    const campaign = this.data.selectedCampaign;
    if (!campaign || !campaign.canSweep) {
      wx.showToast({ title: '需要先通关战役', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/campaignBattle/campaignBattle?campaignId=${campaign.id}&sweep=true`
    });
  },

  // 阻止冒泡
  preventClose() {},

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
