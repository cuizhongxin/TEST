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
      { id: 'WEI', name: '魏', color: '#0066cc', capitalId: 'LUOYANG', capitalName: '洛阳', cities: ['LUOYANG', 'XUCHANG', 'YECHENG', 'CHANGAN'] },
      { id: 'SHU', name: '蜀', color: '#00aa00', capitalId: 'CHENGDU', capitalName: '成都', cities: ['CHENGDU', 'HANZHONG', 'JIAMENG'] },
      { id: 'WU', name: '吴', color: '#cc0000', capitalId: 'JIANYE', capitalName: '建业', cities: ['JIANYE', 'WUCHANG', 'CHANGSHA', 'JIANGXIA'] }
    ];
    
    const defaultCities = [
      { id: 'LUOYANG', name: '洛阳', owner: 'WEI', x: 400, y: 200, isCapital: true, defenseBonus: 20, neighbors: ['XUCHANG', 'CHANGAN'] },
      { id: 'XUCHANG', name: '许昌', owner: 'WEI', x: 450, y: 250, isCapital: false, defenseBonus: 10, neighbors: ['LUOYANG', 'YECHENG', 'WUCHANG'] },
      { id: 'YECHENG', name: '邺城', owner: 'WEI', x: 500, y: 150, isCapital: false, defenseBonus: 10, neighbors: ['XUCHANG'] },
      { id: 'CHANGAN', name: '长安', owner: 'WEI', x: 300, y: 200, isCapital: false, defenseBonus: 15, neighbors: ['LUOYANG', 'HANZHONG'] },
      { id: 'CHENGDU', name: '成都', owner: 'SHU', x: 200, y: 350, isCapital: true, defenseBonus: 20, neighbors: ['HANZHONG', 'JIAMENG'] },
      { id: 'HANZHONG', name: '汉中', owner: 'SHU', x: 250, y: 280, isCapital: false, defenseBonus: 15, neighbors: ['CHENGDU', 'CHANGAN'] },
      { id: 'JIAMENG', name: '剑阁', owner: 'SHU', x: 220, y: 320, isCapital: false, defenseBonus: 10, neighbors: ['CHENGDU', 'WUCHANG'] },
      { id: 'JIANYE', name: '建业', owner: 'WU', x: 550, y: 350, isCapital: true, defenseBonus: 20, neighbors: ['WUCHANG', 'CHANGSHA'] },
      { id: 'WUCHANG', name: '武昌', owner: 'WU', x: 450, y: 350, isCapital: false, defenseBonus: 10, neighbors: ['JIANYE', 'XUCHANG', 'JIAMENG', 'JIANGXIA'] },
      { id: 'CHANGSHA', name: '长沙', owner: 'WU', x: 480, y: 400, isCapital: false, defenseBonus: 10, neighbors: ['JIANYE', 'JIANGXIA'] },
      { id: 'JIANGXIA', name: '江夏', owner: 'WU', x: 420, y: 380, isCapital: false, defenseBonus: 10, neighbors: ['WUCHANG', 'CHANGSHA'] }
    ];
    
    this.setData({
      nations: defaultNations,
      cities: defaultCities,
      playerNation: null,
      playerMerit: 0,
      attackableCities: [],
      showSelectNation: true
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
  goBack() {
    wx.navigateBack();
  }
});
