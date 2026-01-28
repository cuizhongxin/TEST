const request = require('../../utils/request');

Page({
  data: {
    // 加载状态
    loading: true,
    
    // 地图数据
    mapData: null,
    nations: [],
    cities: [],
    
    // 玩家信息
    playerNation: null,
    playerMerit: 0,
    playerLevel: 1,
    playerPower: 10000,
    playerName: '玩家',
    
    // 可进攻城市
    attackableCities: [],
    
    // 当前选中城市
    selectedCity: null,
    canAttackSelectedCity: false,
    
    // 城市国战状态
    cityWarStatus: null,
    
    // 弹窗
    showSelectNation: false,
    showCityDetail: false,
    showSignUp: false,
    showExchange: false,
    showWarResult: false,
    showChangeNation: false,
    
    // 转国相关
    canChangeNation: false,
    changeNationReasons: [],
    hasLuoyang: false,
    nationCityCount: 0,
    transferGoldCost: 1000,
    transferSilverCost: 100000,
    targetNation: null,
    
    // 当前国战
    currentWar: null,
    
    // 兑换
    exchangeAmount: 100,
    exchangeRate: 1.0,
    silverPerMerit: 10,
    playerNationCityCount: 0,
    exchangeRateBonus: 0,
    expectedSilver: 0,
    
    // 国战时间
    signUpTime: '19:45 - 20:00',
    battleTime: '20:00 - 20:45',
    
    // 当前时间状态
    timeStatus: 'preparing', // preparing / signup / fighting / finished
    
    // 战斗结果
    warResult: null,
    
    // 历史记录
    warHistory: []
  },

  onLoad() {
    this.loadMapData();
    this.checkTimeStatus();
    
    // 每分钟检查时间状态
    this.timeTimer = setInterval(() => {
      this.checkTimeStatus();
    }, 60000);
  },

  onUnload() {
    if (this.timeTimer) {
      clearInterval(this.timeTimer);
    }
  },

  onShow() {
    this.loadMapData();
  },

  // 加载地图数据
  async loadMapData() {
    try {
      const res = await request({
        url: '/api/nationwar/map',
        method: 'GET'
      });
      
      console.log('国战地图响应:', res);
      
      if (!res) {
        console.error('响应为空');
        this.useDefaultMapData();
        return;
      }
      
      // 处理响应数据，兼容不同格式
      // 可能是 { map: {...}, playerNation: ... } 或直接 { nations: [], cities: [] }
      let mapData, nations, cities;
      
      if (res.map && res.map.nations) {
        // 格式: { map: { nations: [], cities: [] }, playerNation: ... }
        mapData = res.map;
        nations = mapData.nations || [];
        cities = mapData.cities || [];
      } else if (res.nations) {
        // 格式: { nations: [], cities: [], playerNation: ... }
        mapData = res;
        nations = res.nations || [];
        cities = res.cities || [];
      } else {
        // 未知格式，使用默认数据
        console.warn('未知响应格式，使用默认数据');
        this.useDefaultMapData();
        return;
      }
      
      this.setData({
        mapData: mapData,
        nations: nations,
        cities: cities,
        playerNation: res.playerNation || null,
        playerMerit: res.playerMerit || 0,
        attackableCities: res.attackableCities || []
      });
      
      // 如果玩家没有选择国家，显示选择弹窗
      if (!res.playerNation) {
        this.setData({ showSelectNation: true });
      }
    } catch (err) {
      console.error('加载地图失败:', err);
      this.useDefaultMapData();
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 使用默认地图数据（后端不可用时）
  useDefaultMapData() {
    const defaultNations = [
      { id: 'WEI', name: '魏', color: '#0066cc', capitalId: 'YECHENG', capitalName: '邺城', cities: ['YECHENG', 'XUCHANG', 'CHENLIU', 'YINGCHUAN', 'NANYANG_WEI', 'PUYANG', 'JUANCHENG', 'DONGPING', 'BEIHAI', 'LANGYE'] },
      { id: 'SHU', name: '蜀', color: '#00aa00', capitalId: 'CHENGDU', capitalName: '成都', cities: ['CHENGDU', 'HANZHONG', 'JIAMENG', 'ZITONG', 'BAZHONG', 'JIANNING', 'YONGCHANG', 'YIZHOU', 'NANZHONG', 'WUDU'] },
      { id: 'WU', name: '吴', color: '#cc0000', capitalId: 'JIANYE', capitalName: '建业', cities: ['JIANYE', 'WUCHANG', 'CHANGSHA', 'JIANGXIA', 'LUJIANG', 'KUAIJI', 'DANYANG', 'YUZHANG', 'LINGLING', 'GUIYANG'] },
      { id: 'HAN', name: '汉', color: '#ffcc00', capitalId: 'LUOYANG', capitalName: '洛阳', cities: ['LUOYANG', 'CHANGAN', 'HONGNONG', 'HEDONG', 'SHANGDANG', 'TAIYUAN', 'YANMEN', 'DAIJUN', 'YOUZHOU', 'LIAOXI'] }
    ];
    
    const defaultCities = [
      // 魏国城市
      { id: 'YECHENG', name: '邺城', owner: 'WEI', x: 480, y: 120, isCapital: true, defenseBonus: 25 },
      { id: 'XUCHANG', name: '许昌', owner: 'WEI', x: 450, y: 220, isCapital: false, defenseBonus: 15 },
      { id: 'CHENLIU', name: '陈留', owner: 'WEI', x: 480, y: 200, isCapital: false, defenseBonus: 10 },
      { id: 'YINGCHUAN', name: '颍川', owner: 'WEI', x: 420, y: 250, isCapital: false, defenseBonus: 10 },
      { id: 'NANYANG_WEI', name: '南阳', owner: 'WEI', x: 380, y: 280, isCapital: false, defenseBonus: 10 },
      { id: 'PUYANG', name: '濮阳', owner: 'WEI', x: 500, y: 160, isCapital: false, defenseBonus: 10 },
      { id: 'JUANCHENG', name: '鄄城', owner: 'WEI', x: 520, y: 180, isCapital: false, defenseBonus: 10 },
      { id: 'DONGPING', name: '东平', owner: 'WEI', x: 540, y: 150, isCapital: false, defenseBonus: 10 },
      { id: 'BEIHAI', name: '北海', owner: 'WEI', x: 580, y: 140, isCapital: false, defenseBonus: 10 },
      { id: 'LANGYE', name: '琅琊', owner: 'WEI', x: 600, y: 180, isCapital: false, defenseBonus: 10 },
      // 蜀国城市
      { id: 'CHENGDU', name: '成都', owner: 'SHU', x: 180, y: 350, isCapital: true, defenseBonus: 25 },
      { id: 'HANZHONG', name: '汉中', owner: 'SHU', x: 220, y: 280, isCapital: false, defenseBonus: 20 },
      { id: 'JIAMENG', name: '剑阁', owner: 'SHU', x: 200, y: 320, isCapital: false, defenseBonus: 20 },
      { id: 'ZITONG', name: '梓潼', owner: 'SHU', x: 210, y: 300, isCapital: false, defenseBonus: 10 },
      { id: 'BAZHONG', name: '巴中', owner: 'SHU', x: 230, y: 340, isCapital: false, defenseBonus: 10 },
      { id: 'JIANNING', name: '建宁', owner: 'SHU', x: 160, y: 420, isCapital: false, defenseBonus: 10 },
      { id: 'YONGCHANG', name: '永昌', owner: 'SHU', x: 120, y: 450, isCapital: false, defenseBonus: 10 },
      { id: 'YIZHOU', name: '益州', owner: 'SHU', x: 200, y: 380, isCapital: false, defenseBonus: 10 },
      { id: 'NANZHONG', name: '南中', owner: 'SHU', x: 150, y: 480, isCapital: false, defenseBonus: 10 },
      { id: 'WUDU', name: '武都', owner: 'SHU', x: 250, y: 260, isCapital: false, defenseBonus: 15 },
      // 吴国城市
      { id: 'JIANYE', name: '建业', owner: 'WU', x: 560, y: 320, isCapital: true, defenseBonus: 25 },
      { id: 'WUCHANG', name: '武昌', owner: 'WU', x: 440, y: 340, isCapital: false, defenseBonus: 15 },
      { id: 'CHANGSHA', name: '长沙', owner: 'WU', x: 420, y: 400, isCapital: false, defenseBonus: 10 },
      { id: 'JIANGXIA', name: '江夏', owner: 'WU', x: 460, y: 310, isCapital: false, defenseBonus: 10 },
      { id: 'LUJIANG', name: '庐江', owner: 'WU', x: 520, y: 300, isCapital: false, defenseBonus: 10 },
      { id: 'KUAIJI', name: '会稽', owner: 'WU', x: 600, y: 360, isCapital: false, defenseBonus: 10 },
      { id: 'DANYANG', name: '丹阳', owner: 'WU', x: 580, y: 300, isCapital: false, defenseBonus: 10 },
      { id: 'YUZHANG', name: '豫章', owner: 'WU', x: 500, y: 380, isCapital: false, defenseBonus: 10 },
      { id: 'LINGLING', name: '零陵', owner: 'WU', x: 380, y: 450, isCapital: false, defenseBonus: 10 },
      { id: 'GUIYANG', name: '桂阳', owner: 'WU', x: 440, y: 460, isCapital: false, defenseBonus: 10 },
      // 汉/群雄城市
      { id: 'LUOYANG', name: '洛阳', owner: 'HAN', x: 380, y: 200, isCapital: true, defenseBonus: 30 },
      { id: 'CHANGAN', name: '长安', owner: 'HAN', x: 280, y: 200, isCapital: false, defenseBonus: 20 },
      { id: 'HONGNONG', name: '弘农', owner: 'HAN', x: 340, y: 220, isCapital: false, defenseBonus: 10 },
      { id: 'HEDONG', name: '河东', owner: 'HAN', x: 380, y: 150, isCapital: false, defenseBonus: 10 },
      { id: 'SHANGDANG', name: '上党', owner: 'HAN', x: 420, y: 120, isCapital: false, defenseBonus: 15 },
      { id: 'TAIYUAN', name: '太原', owner: 'HAN', x: 400, y: 80, isCapital: false, defenseBonus: 15 },
      { id: 'YANMEN', name: '雁门', owner: 'HAN', x: 380, y: 40, isCapital: false, defenseBonus: 20 },
      { id: 'DAIJUN', name: '代郡', owner: 'HAN', x: 450, y: 50, isCapital: false, defenseBonus: 10 },
      { id: 'YOUZHOU', name: '幽州', owner: 'HAN', x: 520, y: 40, isCapital: false, defenseBonus: 15 },
      { id: 'LIAOXI', name: '辽西', owner: 'HAN', x: 600, y: 50, isCapital: false, defenseBonus: 10 }
    ];
    
    this.setData({
      nations: defaultNations,
      cities: defaultCities,
      playerNation: null,
      playerMerit: 0,
      attackableCities: []
    });
  },

  // 检查时间状态
  checkTimeStatus() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const time = hours * 60 + minutes;
    
    let status = 'preparing';
    
    if (time >= 19 * 60 + 45 && time < 20 * 60) {
      status = 'signup';
    } else if (time >= 20 * 60 && time < 20 * 60 + 45) {
      status = 'fighting';
    } else if (time >= 20 * 60 + 45 && time < 21 * 60) {
      status = 'finished';
    }
    
    this.setData({ timeStatus: status });
  },

  // 选择国家
  selectNation(e) {
    const nationId = e.currentTarget.dataset.nation;
    this.doSelectNation(nationId);
  },

  async doSelectNation(nationId) {
    try {
      await request({
        url: '/api/nationwar/select-nation',
        method: 'POST',
        data: { nationId }
      });
      
      this.setData({
        playerNation: nationId,
        showSelectNation: false
      });
      
      wx.showToast({ title: '选择成功', icon: 'success' });
      this.loadMapData();
    } catch (err) {
      console.error('选择国家失败:', err);
      wx.showToast({ title: err.message || '选择失败', icon: 'none' });
    }
  },

  // 点击城市
  onCityTap(e) {
    const cityId = e.currentTarget.dataset.city;
    const city = this.data.cities.find(c => c.id === cityId);
    
    if (!city) return;
    
    // 计算是否可以进攻该城市
    const canAttack = this.data.attackableCities.some(c => c.id === cityId);
    
    this.setData({ 
      selectedCity: city,
      canAttackSelectedCity: canAttack
    });
    this.loadCityWarStatus(cityId);
  },

  // 加载城市国战状态
  async loadCityWarStatus(cityId) {
    try {
      const res = await request({
        url: `/api/nationwar/city/${cityId}/status`,
        method: 'GET'
      });
      
      this.setData({
        cityWarStatus: res,
        currentWar: res.war || null,
        showCityDetail: true
      });
    } catch (err) {
      console.error('加载城市状态失败:', err);
      this.setData({ showCityDetail: true });
    }
  },

  // 关闭城市详情
  closeCityDetail() {
    this.setData({
      showCityDetail: false,
      selectedCity: null,
      cityWarStatus: null
    });
  },

  // 检查是否可进攻
  canAttackCity(city) {
    if (!this.data.playerNation || !city) return false;
    if (city.owner === this.data.playerNation) return false;
    return this.data.attackableCities.some(c => c.id === city.id);
  },

  // 打开报名
  openSignUp() {
    if (this.data.timeStatus !== 'signup') {
      wx.showToast({ title: '当前不是报名时间', icon: 'none' });
      return;
    }
    
    if (!this.canAttackCity(this.data.selectedCity)) {
      wx.showToast({ title: '无法进攻该城市', icon: 'none' });
      return;
    }
    
    this.setData({ showSignUp: true });
  },

  // 关闭报名
  closeSignUp() {
    this.setData({ showSignUp: false });
  },

  // 报名国战
  async doSignUp() {
    const { selectedCity, playerName, playerLevel, playerPower } = this.data;
    
    if (!selectedCity) return;
    
    try {
      const res = await request({
        url: '/api/nationwar/signup',
        method: 'POST',
        data: {
          targetCityId: selectedCity.id,
          playerName,
          level: playerLevel,
          power: playerPower
        }
      });
      
      wx.showToast({ title: res.message || '报名成功', icon: 'success' });
      
      this.setData({ showSignUp: false });
      this.loadCityWarStatus(selectedCity.id);
    } catch (err) {
      console.error('报名失败:', err);
      wx.showToast({ title: err.message || '报名失败', icon: 'none' });
    }
  },

  // 打开军功兑换
  openExchange() {
    this.loadMeritInfo();
    this.setData({ showExchange: true });
  },

  // 关闭军功兑换
  closeExchange() {
    this.setData({ showExchange: false });
  },

  // 加载军功信息
  async loadMeritInfo() {
    try {
      const res = await request({
        url: '/api/nationwar/merit',
        method: 'GET'
      });
      
      const rate = res.exchangeRate || 1.0;
      const silverPerMerit = Math.floor(10 * rate);
      const bonus = rate > 1 ? Math.floor((rate - 1) * 100) : 0;
      
      // 获取玩家国家城市数
      let cityCount = 0;
      const playerNation = this.data.playerNation;
      if (playerNation && this.data.nations.length > 0) {
        const nation = this.data.nations.find(n => n.id === playerNation);
        if (nation && nation.cities) {
          cityCount = nation.cities.length;
        }
      }
      
      this.setData({
        playerMerit: res.merit,
        exchangeRate: rate,
        silverPerMerit: silverPerMerit,
        playerNationCityCount: cityCount,
        exchangeRateBonus: bonus,
        expectedSilver: Math.floor(this.data.exchangeAmount * silverPerMerit)
      });
    } catch (err) {
      console.error('加载军功失败:', err);
    }
  },

  // 更新预期获得白银
  updateExpectedSilver() {
    const { exchangeAmount, silverPerMerit } = this.data;
    this.setData({
      expectedSilver: Math.floor(exchangeAmount * silverPerMerit)
    });
  },

  // 设置兑换数量
  onExchangeAmountChange(e) {
    const amount = parseInt(e.detail.value) || 0;
    this.setData({ 
      exchangeAmount: Math.max(0, Math.min(amount, this.data.playerMerit)) 
    });
    this.updateExpectedSilver();
  },

  // 快速选择
  quickSelectAmount(e) {
    const ratio = parseFloat(e.currentTarget.dataset.ratio);
    const amount = Math.floor(this.data.playerMerit * ratio);
    this.setData({ exchangeAmount: amount });
    this.updateExpectedSilver();
  },

  // 执行兑换
  async doExchange() {
    const { exchangeAmount, playerMerit } = this.data;
    
    if (exchangeAmount <= 0) {
      wx.showToast({ title: '请输入兑换数量', icon: 'none' });
      return;
    }
    
    if (exchangeAmount > playerMerit) {
      wx.showToast({ title: '军功不足', icon: 'none' });
      return;
    }
    
    try {
      const res = await request({
        url: '/api/nationwar/exchange',
        method: 'POST',
        data: { meritAmount: exchangeAmount }
      });
      
      wx.showToast({ 
        title: `获得 ${res.silverGained} 白银`, 
        icon: 'success' 
      });
      
      this.setData({
        playerMerit: res.remainingMerit,
        exchangeAmount: 0,
        showExchange: false
      });
    } catch (err) {
      console.error('兑换失败:', err);
      wx.showToast({ title: err.message || '兑换失败', icon: 'none' });
    }
  },

  // 查看战斗历史
  async loadWarHistory() {
    try {
      const res = await request({
        url: '/api/nationwar/history',
        method: 'GET'
      });
      
      this.setData({ warHistory: res.history || [] });
    } catch (err) {
      console.error('加载历史失败:', err);
    }
  },

  // 触发测试战斗
  async testStartWar() {
    if (!this.data.currentWar) {
      wx.showToast({ title: '没有进行中的国战', icon: 'none' });
      return;
    }
    
    try {
      await request({
        url: `/api/nationwar/start/${this.data.currentWar.id}`,
        method: 'POST'
      });
      
      wx.showToast({ title: '战斗已开始', icon: 'success' });
      
      // 重新加载状态
      this.loadCityWarStatus(this.data.selectedCity.id);
    } catch (err) {
      console.error('开始战斗失败:', err);
    }
  },

  // 查看战斗详情
  viewWarDetail() {
    if (!this.data.currentWar) return;
    
    this.setData({
      showWarResult: true,
      warResult: this.data.currentWar
    });
  },

  // 关闭战斗结果
  closeWarResult() {
    this.setData({
      showWarResult: false,
      warResult: null
    });
  },

  // 获取国家颜色
  getNationColor(nationId) {
    const nation = this.data.nations.find(n => n.id === nationId);
    return nation ? nation.color : '#666';
  },

  // 获取国家名称
  getNationName(nationId) {
    const nation = this.data.nations.find(n => n.id === nationId);
    return nation ? nation.name : '未知';
  },

  // 返回
  // ========== 转国功能 ==========
  
  // 打开转国弹窗
  async openChangeNation() {
    try {
      const res = await request({
        url: '/api/nationwar/can-change-nation',
        method: 'GET'
      });
      
      this.setData({
        canChangeNation: res.canChange,
        changeNationReasons: res.reasons || [],
        hasLuoyang: res.hasLuoyang,
        nationCityCount: res.cityCount || 0,
        transferGoldCost: res.goldCost || 1000,
        transferSilverCost: res.silverCost || 100000,
        showChangeNation: true,
        targetNation: null
      });
    } catch (err) {
      console.error('检查转国条件失败:', err);
      wx.showToast({ title: '检查失败', icon: 'none' });
    }
  },
  
  // 关闭转国弹窗
  closeChangeNation() {
    this.setData({ showChangeNation: false, targetNation: null });
  },
  
  // 选择目标国家
  selectTargetNation(e) {
    const nationId = e.currentTarget.dataset.nation;
    if (nationId !== this.data.playerNation) {
      this.setData({ targetNation: nationId });
    }
  },
  
  // 确认转国
  async doChangeNation() {
    if (!this.data.targetNation) {
      wx.showToast({ title: '请选择目标国家', icon: 'none' });
      return;
    }
    
    if (!this.data.canChangeNation) {
      wx.showToast({ title: '不满足转国条件', icon: 'none' });
      return;
    }
    
    wx.showModal({
      title: '确认转国',
      content: `转国需要消耗 ${this.data.transferGoldCost} 黄金 + ${this.data.transferSilverCost} 白银，且需退出当前联盟。确定要转国吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await request({
              url: '/api/nationwar/change-nation',
              method: 'POST',
              data: { nationId: this.data.targetNation }
            });
            
            wx.showToast({ title: result.message || '转国成功', icon: 'success' });
            
            this.setData({
              playerNation: this.data.targetNation,
              showChangeNation: false,
              targetNation: null
            });
            
            // 重新加载地图数据
            this.loadMapData();
          } catch (err) {
            console.error('转国失败:', err);
            wx.showToast({ title: err.message || '转国失败', icon: 'none' });
          }
        }
      }
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
