package com.miniprogram.service.campaign;

import com.miniprogram.config.CampaignConfig;
import com.miniprogram.exception.BusinessException;
import com.miniprogram.model.Campaign;
import com.miniprogram.model.Campaign.*;
import com.miniprogram.model.Equipment;
import com.miniprogram.model.UserResource;
import com.miniprogram.repository.EquipmentRepository;
import com.miniprogram.service.UserResourceService;
import com.miniprogram.service.general.GeneralService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 战役服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CampaignService {
    
    private final CampaignConfig campaignConfig;
    private final UserResourceService userResourceService;
    private final EquipmentRepository equipmentRepository;
    private final GeneralService generalService;
    
    // 用户战役进度存储
    private final Map<String, Map<String, CampaignProgress>> progressStore = new ConcurrentHashMap<>();
    
    // 补兵消耗白银（每100兵）
    private static final int SILVER_PER_100_TROOPS = 100;
    
    /**
     * 获取所有战役列表
     */
    public List<Map<String, Object>> getCampaignList(String odUserId) {
        List<Campaign> campaigns = campaignConfig.getAllCampaigns();
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Campaign campaign : campaigns) {
            Map<String, Object> info = new HashMap<>();
            info.put("campaign", campaign);
            
            CampaignProgress progress = getProgress(odUserId, campaign.getId());
            info.put("progress", progress);
            info.put("unlocked", isUnlocked(odUserId, campaign));
            info.put("todayRemaining", campaign.getDailyLimit() - progress.getTodayAttempts());
            
            result.add(info);
        }
        
        return result;
    }
    
    /**
     * 获取战役详情
     */
    public Map<String, Object> getCampaignDetail(String odUserId, String campaignId) {
        Campaign campaign = campaignConfig.getCampaignById(campaignId);
        if (campaign == null) {
            throw new BusinessException("战役不存在");
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("campaign", campaign);
        
        CampaignProgress progress = getProgress(odUserId, campaignId);
        result.put("progress", progress);
        result.put("unlocked", isUnlocked(odUserId, campaign));
        result.put("todayRemaining", campaign.getDailyLimit() - progress.getTodayAttempts());
        
        // 获取用户资源
        UserResource resource = userResourceService.getUserResource(odUserId);
        result.put("stamina", resource.getStamina());
        result.put("tigerTalisman", resource.getGeneralOrder()); // 暂用将令代替虎符
        
        return result;
    }
    
    /**
     * 开始战役
     */
    public Map<String, Object> startCampaign(String odUserId, String campaignId) {
        Campaign campaign = campaignConfig.getCampaignById(campaignId);
        if (campaign == null) {
            throw new BusinessException("战役不存在");
        }
        
        if (!isUnlocked(odUserId, campaign)) {
            throw new BusinessException("战役未解锁，需要等级" + campaign.getRequiredLevel());
        }
        
        CampaignProgress progress = getProgress(odUserId, campaignId);
        
        // 检查每日次数
        resetDailyIfNeeded(progress);
        if (progress.getTodayAttempts() >= campaign.getDailyLimit()) {
            throw new BusinessException("今日次数已用完");
        }
        
        // 检查是否已在进行中
        if (progress.getInProgress()) {
            // 继续之前的进度
            return getCampaignStatus(odUserId, campaignId);
        }
        
        // 初始化战役
        progress.setInProgress(true);
        progress.setCurrentStage(1);
        progress.setCurrentTroops(progress.getMaxTroops());
        progress.setReviveCount(3);
        progress.setTodayAttempts(progress.getTodayAttempts() + 1);
        
        log.info("用户 {} 开始战役: {}", odUserId, campaign.getName());
        
        return getCampaignStatus(odUserId, campaignId);
    }
    
    /**
     * 获取战役状态
     */
    public Map<String, Object> getCampaignStatus(String odUserId, String campaignId) {
        Campaign campaign = campaignConfig.getCampaignById(campaignId);
        if (campaign == null) {
            throw new BusinessException("战役不存在");
        }
        
        CampaignProgress progress = getProgress(odUserId, campaignId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("campaign", campaign);
        result.put("progress", progress);
        result.put("inProgress", progress.getInProgress());
        
        if (progress.getInProgress() && progress.getCurrentStage() <= campaign.getStages().size()) {
            CampaignStage currentStage = campaign.getStages().get(progress.getCurrentStage() - 1);
            result.put("currentStage", currentStage);
        }
        
        // 获取用户资源
        UserResource resource = userResourceService.getUserResource(odUserId);
        result.put("silver", resource.getSilver());
        
        return result;
    }
    
    /**
     * 补充兵力
     */
    public Map<String, Object> replenishTroops(String odUserId, String campaignId, int amount) {
        CampaignProgress progress = getProgress(odUserId, campaignId);
        
        if (!progress.getInProgress()) {
            throw new BusinessException("战役未开始");
        }
        
        int neededTroops = progress.getMaxTroops() - progress.getCurrentTroops();
        if (neededTroops <= 0) {
            throw new BusinessException("兵力已满");
        }
        
        int actualAmount = Math.min(amount, neededTroops);
        int silverCost = (actualAmount / 100 + 1) * SILVER_PER_100_TROOPS;
        
        // 检查并扣除白银
        UserResource resource = userResourceService.getUserResource(odUserId);
        if (resource.getSilver() < silverCost) {
            throw new BusinessException("白银不足");
        }
        resource.setSilver(resource.getSilver() - silverCost);
        
        // 补充兵力
        progress.setCurrentTroops(progress.getCurrentTroops() + actualAmount);
        
        Map<String, Object> result = new HashMap<>();
        result.put("troopsAdded", actualAmount);
        result.put("silverCost", silverCost);
        result.put("currentTroops", progress.getCurrentTroops());
        result.put("maxTroops", progress.getMaxTroops());
        
        return result;
    }
    
    /**
     * 进攻关卡
     */
    public BattleResult attackStage(String odUserId, String campaignId) {
        Campaign campaign = campaignConfig.getCampaignById(campaignId);
        if (campaign == null) {
            throw new BusinessException("战役不存在");
        }
        
        CampaignProgress progress = getProgress(odUserId, campaignId);
        
        if (!progress.getInProgress()) {
            throw new BusinessException("战役未开始");
        }
        
        if (progress.getCurrentTroops() <= 0) {
            throw new BusinessException("兵力不足，请补充兵力");
        }
        
        int stageIndex = progress.getCurrentStage() - 1;
        if (stageIndex >= campaign.getStages().size()) {
            throw new BusinessException("已通关所有关卡");
        }
        
        CampaignStage stage = campaign.getStages().get(stageIndex);
        
        // 消耗精力
        UserResource resource = userResourceService.getUserResource(odUserId);
        if (resource.getStamina() < campaign.getStaminaCost()) {
            throw new BusinessException("精力不足");
        }
        resource.setStamina(resource.getStamina() - campaign.getStaminaCost());
        
        // 模拟战斗
        BattleResult result = simulateBattle(odUserId, progress, stage);
        
        if (result.getVictory()) {
            // 胜利：更新进度
            progress.setCurrentStage(progress.getCurrentStage() + 1);
            if (progress.getCurrentStage() - 1 > progress.getMaxClearedStage()) {
                progress.setMaxClearedStage(progress.getCurrentStage() - 1);
            }
            
            // 发放奖励
            resource.setSilver(resource.getSilver() + result.getSilverGained());
            
            // 给武将加经验
            generalService.addExpToFormation(odUserId, result.getExpGained());
            
            // 生成掉落装备
            generateDrops(odUserId, result, stage);
            
            // 检查是否通关
            if (progress.getCurrentStage() > campaign.getStages().size()) {
                progress.setInProgress(false);
                log.info("用户 {} 通关战役: {}", odUserId, campaign.getName());
            }
        } else {
            // 失败：扣除兵力
            progress.setCurrentTroops(Math.max(0, progress.getCurrentTroops() - result.getTroopsLost()));
            
            if (progress.getCurrentTroops() <= 0 && progress.getReviveCount() <= 0) {
                // 战役失败
                progress.setInProgress(false);
            }
        }
        
        result.setRemainingTroops(progress.getCurrentTroops());
        return result;
    }
    
    /**
     * 暂停战役
     */
    public void pauseCampaign(String odUserId, String campaignId) {
        CampaignProgress progress = getProgress(odUserId, campaignId);
        // 保持进度，不做任何改变
        log.info("用户 {} 暂停战役: {}", odUserId, campaignId);
    }
    
    /**
     * 结束战役
     */
    public void endCampaign(String odUserId, String campaignId) {
        CampaignProgress progress = getProgress(odUserId, campaignId);
        progress.setInProgress(false);
        progress.setCurrentStage(0);
        progress.setCurrentTroops(progress.getMaxTroops());
        log.info("用户 {} 结束战役: {}", odUserId, campaignId);
    }
    
    /**
     * 重生（恢复兵力）
     */
    public Map<String, Object> revive(String odUserId, String campaignId) {
        CampaignProgress progress = getProgress(odUserId, campaignId);
        
        if (!progress.getInProgress()) {
            throw new BusinessException("战役未开始");
        }
        
        if (progress.getReviveCount() <= 0) {
            throw new BusinessException("重生次数已用完");
        }
        
        progress.setReviveCount(progress.getReviveCount() - 1);
        progress.setCurrentTroops(progress.getMaxTroops());
        
        Map<String, Object> result = new HashMap<>();
        result.put("remainingRevives", progress.getReviveCount());
        result.put("currentTroops", progress.getCurrentTroops());
        
        return result;
    }
    
    /**
     * 扫荡
     */
    public SweepResult sweep(String odUserId, String campaignId, int targetStage) {
        Campaign campaign = campaignConfig.getCampaignById(campaignId);
        if (campaign == null) {
            throw new BusinessException("战役不存在");
        }
        
        CampaignProgress progress = getProgress(odUserId, campaignId);
        
        // 检查是否已通关（只有通关过的关卡才能扫荡）
        if (targetStage > progress.getMaxClearedStage()) {
            throw new BusinessException("只能扫荡已通关的关卡");
        }
        
        // 检查虎符
        UserResource resource = userResourceService.getUserResource(odUserId);
        int tigerTalisman = resource.getGeneralOrder(); // 暂用将令代替虎符
        if (tigerTalisman <= 0) {
            throw new BusinessException("虎符不足");
        }
        
        // 检查每日次数
        resetDailyIfNeeded(progress);
        if (progress.getTodayAttempts() >= campaign.getDailyLimit()) {
            throw new BusinessException("今日次数已用完");
        }
        
        // 开始扫荡
        int stagesCleared = 0;
        int totalExp = 0;
        int totalSilver = 0;
        int silverUsed = 0;
        int tigerUsed = 0;
        List<DropItem> allDrops = new ArrayList<>();
        String stopReason = "扫荡完成";
        
        int currentTroops = progress.getMaxTroops();
        
        for (int i = 1; i <= targetStage && i <= progress.getMaxClearedStage(); i++) {
            // 检查虎符
            if (resource.getGeneralOrder() <= 0) {
                stopReason = "虎符不足";
                break;
            }
            
            // 检查精力
            if (resource.getStamina() < campaign.getStaminaCost()) {
                stopReason = "精力不足";
                break;
            }
            
            CampaignStage stage = campaign.getStages().get(i - 1);
            
            // 消耗资源
            resource.setGeneralOrder(resource.getGeneralOrder() - 1);
            resource.setStamina(resource.getStamina() - campaign.getStaminaCost());
            tigerUsed++;
            
            // 模拟战斗（简化版，扫荡必定胜利但有损耗）
            int troopsLost = stage.getBossAttack() / 5;
            currentTroops -= troopsLost;
            
            // 自动补兵
            if (currentTroops < progress.getMaxTroops() / 2) {
                int neededTroops = progress.getMaxTroops() - currentTroops;
                int cost = (neededTroops / 100 + 1) * SILVER_PER_100_TROOPS;
                if (resource.getSilver() >= cost) {
                    resource.setSilver(resource.getSilver() - cost);
                    silverUsed += cost;
                    currentTroops = progress.getMaxTroops();
                } else {
                    stopReason = "白银不足，无法补兵";
                    break;
                }
            }
            
            // 获得奖励
            totalExp += stage.getExpReward();
            totalSilver += stage.getSilverReward();
            
            // 掉落
            for (DropItem drop : stage.getDrops()) {
                if (Math.random() < drop.getDropRate()) {
                    allDrops.add(drop);
                }
            }
            
            stagesCleared++;
        }
        
        // 发放奖励
        resource.setSilver(resource.getSilver() + totalSilver);
        generalService.addExpToFormation(odUserId, totalExp);
        
        // 更新进度
        progress.setTodayAttempts(progress.getTodayAttempts() + 1);
        
        // 生成掉落装备
        for (DropItem drop : allDrops) {
            if ("equipment".equals(drop.getItemType())) {
                Equipment equip = createDropEquipment(drop);
                equipmentRepository.save(equip);
            }
        }
        
        return SweepResult.builder()
                .stagesCleared(stagesCleared)
                .totalExp(totalExp)
                .totalSilver(totalSilver)
                .allDrops(allDrops)
                .tigerTalismanUsed(tigerUsed)
                .silverUsed(silverUsed)
                .stopReason(stopReason)
                .build();
    }
    
    // ==================== 私有方法 ====================
    
    private CampaignProgress getProgress(String odUserId, String campaignId) {
        Map<String, CampaignProgress> userProgress = progressStore.computeIfAbsent(
                odUserId, k -> new ConcurrentHashMap<>());
        
        return userProgress.computeIfAbsent(campaignId, k -> 
            CampaignProgress.builder()
                    .odUserId(odUserId)
                    .campaignId(campaignId)
                    .currentStage(0)
                    .maxClearedStage(0)
                    .inProgress(false)
                    .todayAttempts(0)
                    .lastAttemptDate("")
                    .currentTroops(4600)
                    .maxTroops(4600)
                    .reviveCount(3)
                    .build()
        );
    }
    
    private boolean isUnlocked(String odUserId, Campaign campaign) {
        // 简化：默认解锁前3章
        return campaign.getChapter() <= 3;
    }
    
    private void resetDailyIfNeeded(CampaignProgress progress) {
        String today = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
        if (!today.equals(progress.getLastAttemptDate())) {
            progress.setTodayAttempts(0);
            progress.setLastAttemptDate(today);
        }
    }
    
    private BattleResult simulateBattle(String odUserId, CampaignProgress progress, CampaignStage stage) {
        Random random = new Random();
        List<String> battleLog = new ArrayList<>();
        
        int playerPower = progress.getCurrentTroops();
        int bossPower = stage.getBossHp();
        
        battleLog.add("战斗开始！");
        battleLog.add("我方兵力: " + playerPower);
        battleLog.add("敌将 " + stage.getBossName() + " Lv." + stage.getBossLevel());
        
        // 简化战斗：根据战力比较
        double winChance = (double) playerPower / (playerPower + bossPower) + 0.1;
        boolean victory = random.nextDouble() < winChance;
        
        int troopsLost = victory ? 
                stage.getBossAttack() / 3 + random.nextInt(100) : 
                stage.getBossAttack() + random.nextInt(200);
        
        if (victory) {
            battleLog.add("击败敌将 " + stage.getBossName() + "！");
            battleLog.add("获得经验: " + stage.getExpReward());
            battleLog.add("获得白银: " + stage.getSilverReward());
        } else {
            battleLog.add("战斗失败，损失兵力: " + troopsLost);
        }
        
        return BattleResult.builder()
                .victory(victory)
                .expGained(victory ? stage.getExpReward() : 0)
                .silverGained(victory ? stage.getSilverReward() : 0)
                .itemsDropped(new ArrayList<>())
                .troopsLost(troopsLost)
                .battleLog(battleLog)
                .build();
    }
    
    private void generateDrops(String odUserId, BattleResult result, CampaignStage stage) {
        Random random = new Random();
        List<DropItem> drops = new ArrayList<>();
        
        for (DropItem dropTemplate : stage.getDrops()) {
            if (random.nextDouble() < dropTemplate.getDropRate()) {
                drops.add(dropTemplate);
                
                if ("equipment".equals(dropTemplate.getItemType())) {
                    Equipment equip = createDropEquipment(dropTemplate);
                    equip.setUserId(odUserId);
                    equipmentRepository.save(equip);
                }
            }
        }
        
        result.setItemsDropped(drops);
    }
    
    private Equipment createDropEquipment(DropItem drop) {
        Random random = new Random();
        String[] slots = {"weapon", "helmet", "armor", "ring", "shoes", "necklace"};
        String slot = slots[random.nextInt(slots.length)];
        
        int qualityId = getQualityId(drop.getQuality());
        int multiplier = qualityId;
        
        Equipment.SlotType slotType = Equipment.SlotType.builder()
                .id(random.nextInt(6) + 1)
                .name(getSlotName(slot))
                .build();
        
        Equipment.Quality quality = Equipment.Quality.builder()
                .id(qualityId)
                .name(drop.getQuality())
                .multiplier((double) multiplier)
                .build();
        
        Equipment.Attributes attrs = Equipment.Attributes.builder()
                .attack(10 * multiplier + random.nextInt(5 * multiplier))
                .defense(8 * multiplier + random.nextInt(4 * multiplier))
                .hp(50 * multiplier + random.nextInt(20 * multiplier))
                .build();
        
        Equipment.Source source = Equipment.Source.builder()
                .type("CAMPAIGN")
                .name("战役掉落")
                .build();
        
        return Equipment.builder()
                .id("equip_" + System.currentTimeMillis() + "_" + random.nextInt(1000))
                .name(drop.getQuality() + getSlotName(slot))
                .slotType(slotType)
                .quality(quality)
                .level(1)
                .baseAttributes(attrs)
                .source(source)
                .createTime(System.currentTimeMillis())
                .build();
    }
    
    private int getQualityId(String quality) {
        switch (quality) {
            case "神话": return 7;
            case "传说": return 6;
            case "史诗": return 5;
            case "精良": return 4;
            case "优秀": return 3;
            case "普通": return 2;
            default: return 1;
        }
    }
    
    private String getSlotName(String slot) {
        switch (slot) {
            case "weapon": return "武器";
            case "helmet": return "头盔";
            case "armor": return "铠甲";
            case "ring": return "戒指";
            case "shoes": return "鞋子";
            case "necklace": return "项链";
            default: return "装备";
        }
    }
}
