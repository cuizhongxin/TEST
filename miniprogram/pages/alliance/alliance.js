// pages/alliance/alliance.js
const request = require('../../utils/request');

Page({
  data: {
    loading: true,
    hasAlliance: false,         // 是否已加入联盟
    myAlliance: null,           // 我的联盟
    allianceList: [],           // 联盟列表
    playerInfo: null,           // 玩家信息
    
    // 筛选
    currentFaction: '',         // 当前筛选的国家
    factions: ['全部', '魏', '蜀', '吴'],
    
    // 创建联盟弹窗
    showCreateModal: false,
    newAllianceName: '',
    selectedFaction: '蜀',
    
    // 联盟详情弹窗（联盟信息页面）
    showDetailModal: false,
    detailAlliance: null,
    currentTab: 'info',         // info-联盟信息, members-成员管理, rewards-联盟奖励
    
    // 申请列表弹窗
    showApplicationModal: false,
    applicationList: []
  },

  onLoad() {
    this.loadPlayerInfo();
    this.loadAllianceList();
  },

  onShow() {
    this.loadAllianceList();
  },

  // 加载玩家信息
  loadPlayerInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        playerInfo: {
          id: userInfo.odUserId || userInfo.id,
          name: userInfo.nickname || userInfo.name || '无名君主',
          level: userInfo.level || 1,
          power: userInfo.power || 10000,
          faction: userInfo.faction || '蜀'
        }
      });
    }
  },

  // 加载联盟列表
  async loadAllianceList() {
    this.setData({ loading: true });
    try {
      const faction = this.data.currentFaction === '全部' ? '' : this.data.currentFaction;
      const res = await request({ 
        url: '/alliance/list', 
        method: 'GET',
        data: { faction }
      });
      
      if (res.success) {
        this.setData({
          allianceList: res.alliances || [],
          hasAlliance: res.hasAlliance,
          myAlliance: res.myAlliance,
          loading: false
        });
        
        // 如果已有联盟，直接显示详情
        if (res.hasAlliance && res.myAlliance) {
          this.setData({
            showDetailModal: true,
            detailAlliance: res.myAlliance
          });
        }
      }
    } catch (error) {
      console.error('加载联盟列表失败:', error);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 切换国家筛选
  onFactionChange(e) {
    const faction = this.data.factions[e.detail.value];
    this.setData({ currentFaction: faction });
    this.loadAllianceList();
  },

  // 点击申请加入
  async applyJoin(e) {
    const alliance = e.currentTarget.dataset.alliance;
    
    // 检查是否同国
    if (this.data.playerInfo && this.data.playerInfo.faction !== alliance.faction) {
      wx.showModal({
        title: '提示',
        content: `只能申请加入${this.data.playerInfo.faction}国联盟`,
        showCancel: false
      });
      return;
    }
    
    wx.showModal({
      title: '申请加入',
      content: `确定要申请加入"${alliance.name}"联盟吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await request({
              url: `/alliance/apply/${alliance.id}`,
              method: 'POST',
              data: {
                playerName: this.data.playerInfo?.name || '无名君主',
                playerLevel: this.data.playerInfo?.level || 1,
                playerPower: this.data.playerInfo?.power || 10000
              }
            });
            
            if (result.success) {
              wx.showToast({ title: '申请已提交', icon: 'success' });
            } else {
              wx.showToast({ title: result.message || '申请失败', icon: 'none' });
            }
          } catch (error) {
            wx.showToast({ title: '申请失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 显示创建联盟弹窗
  showCreateAlliance() {
    this.setData({
      showCreateModal: true,
      newAllianceName: '',
      selectedFaction: this.data.playerInfo?.faction || '蜀'
    });
  },

  // 关闭创建弹窗
  closeCreateModal() {
    this.setData({ showCreateModal: false });
  },

  // 输入联盟名称
  onAllianceNameInput(e) {
    this.setData({ newAllianceName: e.detail.value });
  },

  // 选择国家
  onFactionSelect(e) {
    // 只能创建自己国家的联盟
    if (this.data.playerInfo && e.currentTarget.dataset.faction !== this.data.playerInfo.faction) {
      wx.showToast({ title: '只能创建本国联盟', icon: 'none' });
      return;
    }
    this.setData({ selectedFaction: e.currentTarget.dataset.faction });
  },

  // 创建联盟
  async createAlliance() {
    const { newAllianceName, selectedFaction, playerInfo } = this.data;
    
    if (!newAllianceName.trim()) {
      wx.showToast({ title: '请输入联盟名称', icon: 'none' });
      return;
    }
    
    if (newAllianceName.length < 2 || newAllianceName.length > 8) {
      wx.showToast({ title: '联盟名称2-8个字', icon: 'none' });
      return;
    }
    
    try {
      const res = await request({
        url: '/alliance/create',
        method: 'POST',
        data: {
          name: newAllianceName,
          faction: selectedFaction,
          playerName: playerInfo?.name || '无名君主',
          playerLevel: playerInfo?.level || 1,
          playerPower: playerInfo?.power || 10000
        }
      });
      
      if (res.success) {
        wx.showToast({ title: '创建成功', icon: 'success' });
        this.closeCreateModal();
        this.loadAllianceList();
      } else {
        wx.showToast({ title: res.message || '创建失败', icon: 'none' });
      }
    } catch (error) {
      wx.showToast({ title: '创建失败', icon: 'none' });
    }
  },

  // 查看联盟详情
  viewAllianceDetail(e) {
    const alliance = e.currentTarget.dataset.alliance;
    this.setData({
      showDetailModal: true,
      detailAlliance: alliance,
      currentTab: 'info'
    });
  },

  // 关闭详情弹窗
  closeDetailModal() {
    this.setData({ showDetailModal: false });
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  // 查看申请列表
  async viewApplications() {
    if (!this.data.myAlliance) return;
    
    try {
      const res = await request({
        url: `/alliance/applications/${this.data.myAlliance.id}`,
        method: 'GET'
      });
      if (res.success) {
        this.setData({
          applicationList: res.applications || [],
          showApplicationModal: true
        });
      }
    } catch (error) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 关闭申请列表弹窗
  closeApplicationModal() {
    this.setData({ showApplicationModal: false });
  },

  // 同意申请
  async approveApplication(e) {
    const applicantId = e.currentTarget.dataset.applicantId;
    await this._processApplication(applicantId, true);
  },

  // 拒绝申请
  async rejectApplication(e) {
    const applicantId = e.currentTarget.dataset.applicantId;
    await this._processApplication(applicantId, false);
  },

  // 处理申请（内部方法）
  async _processApplication(applicantId, approve) {
    const alliance = this.data.myAlliance;
    
    try {
      const res = await request({
        url: '/alliance/process-application',
        method: 'POST',
        data: {
          allianceId: alliance.id,
          applicantId,
          approve
        }
      });
      
      if (res.success) {
        wx.showToast({ title: approve ? '已同意' : '已拒绝', icon: 'success' });
        this.viewApplications(); // 刷新申请列表
        this.loadAllianceList(); // 刷新联盟信息
      } else {
        wx.showToast({ title: res.message || '操作失败', icon: 'none' });
      }
    } catch (error) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 踢出成员
  kickMember(e) {
    const member = e.currentTarget.dataset.member;
    const alliance = this.data.myAlliance;
    
    wx.showModal({
      title: '踢出成员',
      content: `确定要踢出"${member.name}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await request({
              url: '/alliance/kick',
              method: 'POST',
              data: {
                allianceId: alliance.id,
                memberId: member.odUserId
              }
            });
            
            if (result.success) {
              wx.showToast({ title: '已踢出', icon: 'success' });
              this.loadAllianceList();
            } else {
              wx.showToast({ title: result.message || '操作失败', icon: 'none' });
            }
          } catch (error) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 设置职位
  setPosition(e) {
    const member = e.currentTarget.dataset.member;
    const alliance = this.data.myAlliance;
    
    wx.showActionSheet({
      itemList: ['设为副盟主', '设为精英', '设为成员'],
      success: async (res) => {
        const positions = ['副盟主', '精英', '成员'];
        const position = positions[res.tapIndex];
        
        try {
          const result = await request({
            url: '/alliance/set-position',
            method: 'POST',
            data: {
              allianceId: alliance.id,
              memberId: member.odUserId,
              position
            }
          });
          
          if (result.success) {
            wx.showToast({ title: '设置成功', icon: 'success' });
            this.loadAllianceList();
          } else {
            wx.showToast({ title: result.message || '设置失败', icon: 'none' });
          }
        } catch (error) {
          wx.showToast({ title: '设置失败', icon: 'none' });
        }
      }
    });
  },

  // 退出联盟
  leaveAlliance() {
    wx.showModal({
      title: '退出联盟',
      content: '确定要退出联盟吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await request({
              url: '/alliance/leave',
              method: 'POST'
            });
            if (result.success) {
              wx.showToast({ title: '已退出', icon: 'success' });
              this.setData({ showDetailModal: false });
              this.loadAllianceList();
            } else {
              wx.showToast({ title: result.message || '操作失败', icon: 'none' });
            }
          } catch (error) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 解散联盟
  dissolveAlliance() {
    const alliance = this.data.myAlliance;
    
    wx.showModal({
      title: '解散联盟',
      content: '确定要解散联盟吗？此操作不可撤销！',
      confirmColor: '#ff4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await request({
              url: '/alliance/dissolve',
              method: 'POST',
              data: {
                allianceId: alliance.id
              }
            });
            
            if (result.success) {
              wx.showToast({ title: '联盟已解散', icon: 'success' });
              this.setData({ showDetailModal: false });
              this.loadAllianceList();
            } else {
              wx.showToast({ title: result.message || '操作失败', icon: 'none' });
            }
          } catch (error) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 获取国家颜色
  getFactionColor(faction) {
    const colors = {
      '魏': '#4a90d9',
      '蜀': '#e74c3c',
      '吴': '#27ae60'
    };
    return colors[faction] || '#999';
  },

  // 判断是否是盟主或副盟主
  isLeaderOrVice() {
    if (!this.data.myAlliance || !this.data.playerInfo) return false;
    const member = this.data.myAlliance.members?.find(m => m.odUserId === this.data.playerInfo.id);
    return member && (member.position === '盟主' || member.position === '副盟主');
  },

  // 进入盟战
  goToAllianceWar() {
    wx.navigateTo({ url: '/pages/allianceWar/allianceWar' });
  }
});
