// pages/production/production.js
const request = require('../../utils/request');

Page({
  data: {
    loading: true,
    currentTab: 'produce',  // produce-生产, manufacture-制造
    
    // 生产设施
    facilities: [],
    
    // 制造设施
    manufactureFacilities: [],
    
    // 当前选中的制造设施
    selectedManufacture: null,
    recipes: [],
    
    // 资源
    resource: {
      silver: 0,
      metal: 0,
      food: 0,
      paper: 0
    },
    
    // 配方详情弹窗
    showRecipeModal: false,
    selectedRecipe: null
  },

  onLoad() {
    this.loadProductionInfo();
  },

  onShow() {
    this.loadProductionInfo();
  },

  // 加载生产数据
  async loadProductionInfo() {
    this.setData({ loading: true });
    try {
      const res = await request({
        url: '/production/info',
        method: 'GET'
      });
      
      if (res.success) {
        const production = res.production;
        
        // 整理生产设施数据
        const facilities = [
          { ...production.silverMine, resourceName: '白银', btnText: '生产白银' },
          { ...production.metalMine, resourceName: '金属', btnText: '生产金属' },
          { ...production.farm, resourceName: '粮食', btnText: '生产粮食' },
          { ...production.paperMill, resourceName: '纸张', btnText: '生产纸张' }
        ];
        
        // 整理制造设施数据
        const manufactureFacilities = [
          { ...production.arsenal, icon: '⚔️' },
          { ...production.workshop, icon: '🔮' },
          { ...production.academy, icon: '📚' }
        ];
        
        this.setData({
          facilities,
          manufactureFacilities,
          resource: {
            silver: res.resource.silver || 0,
            metal: res.resource.metal || 0,
            food: res.resource.food || 0,
            paper: res.resource.paper || 0
          },
          loading: false
        });
      }
    } catch (error) {
      console.error('加载生产数据失败:', error);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    
    if (tab === 'manufacture' && !this.data.selectedManufacture) {
      // 默认选中军械局
      this.selectManufacture({ currentTarget: { dataset: { facility: this.data.manufactureFacilities[0] } } });
    }
  },

  // 生产资源
  async produce(e) {
    const facility = e.currentTarget.dataset.facility;
    
    if (facility.usedToday >= facility.dailyLimit) {
      wx.showToast({ title: '今日次数已用完', icon: 'none' });
      return;
    }
    
    try {
      const res = await request({
        url: '/production/produce',
        method: 'POST',
        data: { facilityType: facility.type }
      });
      
      if (res.success) {
        wx.showToast({ title: `+${res.output} ${facility.resourceName}`, icon: 'success' });
        this.loadProductionInfo();
      } else {
        wx.showToast({ title: res.message || '生产失败', icon: 'none' });
      }
    } catch (error) {
      wx.showToast({ title: '生产失败', icon: 'none' });
    }
  },

  // 升级生产设施
  async upgradeFacility(e) {
    const facility = e.currentTarget.dataset.facility;
    
    if (facility.level >= facility.maxLevel) {
      wx.showToast({ title: '已达最大等级', icon: 'none' });
      return;
    }
    
    // 检查资源
    const { resource } = this.data;
    if (resource.silver < facility.upgradeSilver ||
        resource.metal < facility.upgradeMetal ||
        resource.food < facility.upgradeFood ||
        resource.paper < facility.upgradePaper) {
      wx.showToast({ title: '资源不足', icon: 'none' });
      return;
    }
    
    wx.showModal({
      title: '升级设施',
      content: `确定花费 ${facility.upgradeSilver}白银、${facility.upgradeMetal}金属、${facility.upgradeFood}粮食、${facility.upgradePaper}纸张 升级${facility.name}吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await request({
              url: '/production/upgrade-facility',
              method: 'POST',
              data: { facilityType: facility.type }
            });
            
            if (result.success) {
              wx.showToast({ title: '升级成功', icon: 'success' });
              this.loadProductionInfo();
            } else {
              wx.showToast({ title: result.message || '升级失败', icon: 'none' });
            }
          } catch (error) {
            wx.showToast({ title: '升级失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 选择制造设施
  async selectManufacture(e) {
    const facility = e.currentTarget.dataset.facility;
    this.setData({ selectedManufacture: facility });
    
    // 加载配方
    try {
      const res = await request({
        url: `/production/recipes/${facility.type}`,
        method: 'GET'
      });
      
      if (res.success) {
        // 标记是否可制造
        const recipes = res.recipes.map(recipe => ({
          ...recipe,
          canMake: res.facilityLevel >= recipe.requiredLevel &&
                   this.data.resource.silver >= recipe.costSilver &&
                   this.data.resource.metal >= recipe.costMetal &&
                   this.data.resource.food >= recipe.costFood &&
                   this.data.resource.paper >= recipe.costPaper,
          levelEnough: res.facilityLevel >= recipe.requiredLevel
        }));
        
        this.setData({ recipes });
      }
    } catch (error) {
      console.error('加载配方失败:', error);
    }
  },

  // 升级制造设施
  async upgradeManufacture(e) {
    const facility = e.currentTarget.dataset.facility;
    
    if (facility.level >= facility.maxLevel) {
      wx.showToast({ title: '已达最大等级', icon: 'none' });
      return;
    }
    
    wx.showModal({
      title: '升级设施',
      content: `确定花费 ${facility.upgradeSilver}白银、${facility.upgradeMetal}金属、${facility.upgradeFood}粮食、${facility.upgradePaper}纸张 升级${facility.name}吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await request({
              url: '/production/upgrade-manufacture',
              method: 'POST',
              data: { facilityType: facility.type }
            });
            
            if (result.success) {
              wx.showToast({ title: '升级成功', icon: 'success' });
              this.loadProductionInfo();
            } else {
              wx.showToast({ title: result.message || '升级失败', icon: 'none' });
            }
          } catch (error) {
            wx.showToast({ title: '升级失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 显示配方详情
  showRecipeDetail(e) {
    const recipe = e.currentTarget.dataset.recipe;
    this.setData({
      selectedRecipe: recipe,
      showRecipeModal: true
    });
  },

  // 关闭配方弹窗
  closeRecipeModal() {
    this.setData({ showRecipeModal: false });
  },

  // 制造物品
  async manufacture(e) {
    const recipe = e.currentTarget.dataset.recipe || this.data.selectedRecipe;
    
    if (!recipe.canMake) {
      if (!recipe.levelEnough) {
        wx.showToast({ title: `需要${recipe.requiredLevel}级设施`, icon: 'none' });
      } else {
        wx.showToast({ title: '资源不足', icon: 'none' });
      }
      return;
    }
    
    try {
      const res = await request({
        url: '/production/manufacture',
        method: 'POST',
        data: { recipeId: recipe.id }
      });
      
      if (res.success) {
        wx.showToast({ title: `制造成功: ${recipe.name}`, icon: 'success' });
        this.closeRecipeModal();
        this.loadProductionInfo();
        // 刷新配方列表
        if (this.data.selectedManufacture) {
          this.selectManufacture({ currentTarget: { dataset: { facility: this.data.selectedManufacture } } });
        }
      } else {
        wx.showToast({ title: res.message || '制造失败', icon: 'none' });
      }
    } catch (error) {
      wx.showToast({ title: '制造失败', icon: 'none' });
    }
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 获取品质样式类
  getQualityClass(quality) {
    const classMap = {
      '传说': 'legendary',
      '史诗': 'epic',
      '精良': 'rare',
      '优秀': 'good',
      '普通': 'normal',
      '道具': 'item',
      '兵法': 'tactics'
    };
    return classMap[quality] || 'normal';
  }
});
