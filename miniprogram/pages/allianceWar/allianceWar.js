// pages/allianceWar/allianceWar.js
const request = require('../../utils/request');

Page({
  data: {
    loading: true,
    war: null,
    status: 'NOT_STARTED',
    registered: false,
    myParticipant: null,
    participants: [],
    allBattles: [],
    myBattles: [],
    allianceRanks: [],
    playerRanks: [],
    
    // 当前标签
    currentTab: 'info',  // info, participants, battles, rankings
    
    // 玩家信息
    playerInfo: null,
    
    // 刷新定时器
    refreshTimer: null
  },

  onLoad() {
    this.loadPlayerInfo();
    this.loadWarStatus();
  },

  onShow() {
    this.loadWarStatus();
    // 每5秒刷新一次状态
    this.data.refreshTimer = setInterval(() => {
      this.loadWarStatus();
    }, 5000);
  },

  onHide() {
    if (this.data.refreshTimer) {
      clearInterval(this.data.refreshTimer);
    }
  },

  onUnload() {
    if (this.data.refreshTimer) {
      clearInterval(this.data.refreshTimer);
    }
  },

  // 加载玩家信息
  loadPlayerInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        playerInfo: {
          name: userInfo.nickname || userInfo.name || '无名君主',
          level: userInfo.level || 1,
          power: userInfo.power || 10000
        }
      });
    }
  },

  // 加载盟战状态
  async loadWarStatus() {
    try {
      const res = await request({
        url: '/alliance-war/status',
        method: 'GET'
      });
      
      if (res.success) {
        this.setData({
          war: res.war,
          status: res.status,
          registered: res.registered,
          myParticipant: res.myParticipant,
          participants: res.war?.participants || [],
          loading: false
        });
        
        // 如果战斗已结束，加载排名
        if (res.status === 'FINISHED') {
          this.loadRankings();
        }
        
        // 加载对战记录
        if (res.status === 'IN_PROGRESS' || res.status === 'FINISHED') {
          this.loadBattles();
        }
      }
    } catch (error) {
      console.error('加载盟战状态失败:', error);
      this.setData({ loading: false });
    }
  },

  // 加载对战记录
  async loadBattles() {
    try {
      const res = await request({
        url: '/alliance-war/battles',
        method: 'GET'
      });
      if (res.success) {
        this.setData({
          allBattles: res.allBattles || [],
          myBattles: res.myBattles || []
        });
      }
    } catch (error) {
      console.error('加载对战记录失败:', error);
    }
  },

  // 加载排名
  async loadRankings() {
    try {
      const res = await request({
        url: '/alliance-war/rankings',
        method: 'GET'
      });
      if (res.success) {
        this.setData({
          allianceRanks: res.allianceRanks || [],
          playerRanks: res.playerRanks || []
        });
      }
    } catch (error) {
      console.error('加载排名失败:', error);
    }
  },

  // 报名参战
  async register() {
    try {
      const res = await request({
        url: '/alliance-war/register',
        method: 'POST',
        data: {
          playerName: this.data.playerInfo?.name || '无名君主',
          level: this.data.playerInfo?.level || 1,
          power: this.data.playerInfo?.power || 10000
        }
      });
      
      if (res.success) {
        wx.showToast({ title: res.message, icon: 'success' });
        this.loadWarStatus();
      } else {
        wx.showToast({ title: res.message || '报名失败', icon: 'none' });
      }
    } catch (error) {
      wx.showToast({ title: '报名失败', icon: 'none' });
    }
  },

  // 取消报名
  async cancelRegister() {
    wx.showModal({
      title: '取消报名',
      content: '确定要取消报名吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await request({
              url: '/alliance-war/cancel',
              method: 'POST'
            });
            if (result.success) {
              wx.showToast({ title: '已取消', icon: 'success' });
              this.loadWarStatus();
            } else {
              wx.showToast({ title: result.message || '取消失败', icon: 'none' });
            }
          } catch (error) {
            wx.showToast({ title: '取消失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    
    if (tab === 'rankings') {
      this.loadRankings();
    } else if (tab === 'battles') {
      this.loadBattles();
    }
  },

  // 手动开启报名（测试用）
  async triggerRegistration() {
    try {
      const res = await request({
        url: '/alliance-war/trigger-registration',
        method: 'POST'
      });
      if (res.success) {
        wx.showToast({ title: '报名已开启', icon: 'success' });
        this.loadWarStatus();
      }
    } catch (error) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 手动开始战斗（测试用）
  async triggerBattle() {
    try {
      const res = await request({
        url: '/alliance-war/trigger-battle',
        method: 'POST'
      });
      if (res.success) {
        wx.showToast({ title: '战斗开始', icon: 'success' });
        this.loadWarStatus();
      } else {
        wx.showToast({ title: res.message || '操作失败', icon: 'none' });
      }
    } catch (error) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 重置盟战（测试用）
  async resetWar() {
    wx.showModal({
      title: '重置盟战',
      content: '确定要重置今日盟战吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await request({
              url: '/alliance-war/reset',
              method: 'POST'
            });
            if (result.success) {
              wx.showToast({ title: '已重置', icon: 'success' });
              this.loadWarStatus();
            }
          } catch (error) {
            wx.showToast({ title: '重置失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 获取状态文本
  getStatusText() {
    const statusMap = {
      'NOT_STARTED': '未开始',
      'REGISTERING': '报名中',
      'IN_PROGRESS': '进行中',
      'FINISHED': '已结束'
    };
    return statusMap[this.data.status] || '未知';
  },

  // 获取玩家状态文本
  getPlayerStatusText(status) {
    const statusMap = {
      'WAITING': '等待配对',
      'IN_BATTLE': '战斗中',
      'SPECTATING': '已淘汰',
      'WINNER': '胜利者'
    };
    return statusMap[status] || '未知';
  }
});
