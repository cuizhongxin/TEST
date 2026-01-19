package com.miniprogram.service.tactics;

import com.miniprogram.config.TacticsConfig;
import com.miniprogram.exception.BusinessException;
import com.miniprogram.model.General;
import com.miniprogram.model.Tactics;
import com.miniprogram.model.UserResource;
import com.miniprogram.repository.GeneralRepository;
import com.miniprogram.service.UserResourceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 兵法服务 - 一个武将只能装备一个兵法/阵法
 */
@Service
public class TacticsService {
    
    private static final Logger logger = LoggerFactory.getLogger(TacticsService.class);
    
    @Autowired
    private TacticsConfig tacticsConfig;
    
    @Autowired
    private GeneralRepository generalRepository;
    
    @Autowired
    private UserResourceService userResourceService;
    
    // 用户已学习的兵法 - key: generalId, value: 已学习的兵法列表
    private final Map<String, List<Tactics>> generalLearnedTactics = new ConcurrentHashMap<>();
    
    // 武将装备的兵法（只有一个）- key: generalId, value: 装备的兵法
    private final Map<String, Tactics> generalEquippedTactics = new ConcurrentHashMap<>();
    
    /**
     * 获取所有兵法列表
     */
    public List<Tactics> getAllTactics() {
        return new ArrayList<>(tacticsConfig.getAllTactics().values());
    }
    
    /**
     * 根据兵种获取可用兵法
     */
    public List<Tactics> getTacticsByTroopType(String troopType) {
        List<Tactics> result = new ArrayList<>();
        for (Tactics tactics : tacticsConfig.getAllTactics().values()) {
            String condition = tactics.getLearnCondition();
            if ("ALL".equals(condition) || condition == null || condition.equalsIgnoreCase(troopType)) {
                result.add(tactics);
            }
        }
        return result;
    }
    
    /**
     * 获取兵法详情
     */
    public Tactics getTacticsById(String tacticsId) {
        return tacticsConfig.getTacticsById(tacticsId);
    }
    
    /**
     * 获取兵法学习消耗
     */
    public Map<String, Integer> getTacticsLearnCost(String tacticsId) {
        return tacticsConfig.getTacticsLearnCost(tacticsId);
    }
    
    /**
     * 获取武将已学习的兵法
     */
    public List<Tactics> getGeneralLearnedTactics(String generalId) {
        return generalLearnedTactics.getOrDefault(generalId, new ArrayList<>());
    }
    
    /**
     * 获取武将装备的兵法（只有一个）
     */
    public Tactics getGeneralEquippedTactics(String generalId) {
        return generalEquippedTactics.get(generalId);
    }
    
    /**
     * 学习兵法 - 消耗资源
     */
    public Map<String, Object> learnTactics(String userId, String generalId, String tacticsId) {
        // 检查武将
        General general = generalRepository.findById(generalId);
        if (general == null) {
            throw new BusinessException(400, "武将不存在");
        }
        if (!userId.equals(general.getUserId())) {
            throw new BusinessException(403, "无权操作此武将");
        }
        
        // 检查兵法
        Tactics tactics = tacticsConfig.getTacticsById(tacticsId);
        if (tactics == null) {
            throw new BusinessException(400, "兵法不存在");
        }
        
        // 检查兵种限制
        String troopCondition = tactics.getLearnCondition();
        if (troopCondition != null && !"ALL".equals(troopCondition)) {
            String generalTroopType = general.getTroopType() != null ? general.getTroopType().getName() : "步兵";
            String troopTypeCode = getTroopTypeCode(generalTroopType);
            if (!troopCondition.equalsIgnoreCase(troopTypeCode)) {
                throw new BusinessException(400, "此兵法仅限" + getTroopTypeName(troopCondition) + "学习");
            }
        }
        
        // 检查等级要求
        int generalLevel = general.getLevel() != null ? general.getLevel() : 1;
        if (generalLevel < tactics.getLearnLevel()) {
            throw new BusinessException(400, "武将等级不足，需要达到" + tactics.getLearnLevel() + "级");
        }
        
        // 检查是否已学习
        List<Tactics> learned = generalLearnedTactics.computeIfAbsent(generalId, k -> new ArrayList<>());
        for (Tactics t : learned) {
            if (t.getId().equals(tacticsId)) {
                throw new BusinessException(400, "已学习该兵法");
            }
        }
        
        // 检查并消耗资源
        Map<String, Integer> cost = tacticsConfig.getTacticsLearnCost(tacticsId);
        UserResource resource = userResourceService.getUserResource(userId);
        
        int paperCost = cost.getOrDefault("paper", 0);
        int woodCost = cost.getOrDefault("wood", 0);
        int silverCost = cost.getOrDefault("silver", 0);
        
        if (resource.getPaper() < paperCost) {
            throw new BusinessException(400, "纸张不足，需要" + paperCost + "张");
        }
        if (resource.getWood() < woodCost) {
            throw new BusinessException(400, "木材不足，需要" + woodCost);
        }
        if (resource.getSilver() < silverCost) {
            throw new BusinessException(400, "银两不足，需要" + silverCost);
        }
        
        // 扣除资源
        resource.setPaper(resource.getPaper() - paperCost);
        resource.setWood(resource.getWood() - woodCost);
        resource.setSilver(resource.getSilver() - silverCost);
        userResourceService.saveUserResource(resource);
        
        // 创建兵法副本并学习
        Tactics learnedTactics = copyTactics(tactics);
        learned.add(learnedTactics);
        
        logger.info("武将 {} 学习了兵法: {}，消耗纸张{}，木材{}，银两{}", 
            general.getName(), tactics.getName(), paperCost, woodCost, silverCost);
        
        Map<String, Object> result = new HashMap<>();
        result.put("generalId", generalId);
        result.put("generalName", general.getName());
        result.put("tactics", learnedTactics);
        result.put("learnedCount", learned.size());
        result.put("costPaper", paperCost);
        result.put("costWood", woodCost);
        result.put("costSilver", silverCost);
        result.put("remainingPaper", resource.getPaper());
        result.put("remainingWood", resource.getWood());
        result.put("remainingSilver", resource.getSilver());
        
        return result;
    }
    
    /**
     * 装备兵法（只能装备一个）
     */
    public Map<String, Object> equipTactics(String userId, String generalId, String tacticsId) {
        // 检查武将
        General general = generalRepository.findById(generalId);
        if (general == null) {
            throw new BusinessException(400, "武将不存在");
        }
        if (!userId.equals(general.getUserId())) {
            throw new BusinessException(403, "无权操作此武将");
        }
        
        // 检查是否已学习该兵法
        List<Tactics> learned = generalLearnedTactics.get(generalId);
        Tactics tacticsToEquip = null;
        if (learned != null) {
            for (Tactics t : learned) {
                if (t.getId().equals(tacticsId)) {
                    tacticsToEquip = t;
                    break;
                }
            }
        }
        
        if (tacticsToEquip == null) {
            throw new BusinessException(400, "未学习该兵法");
        }
        
        // 装备兵法（替换原有的）
        Tactics oldTactics = generalEquippedTactics.put(generalId, tacticsToEquip);
        
        // 更新武将的兵法信息
        if (general.getTactics() == null) {
            general.setTactics(General.Tactics.builder().build());
        }
        general.getTactics().setTacticsId(tacticsId);
        general.getTactics().setTacticsName(tacticsToEquip.getName());
        general.getTactics().setTacticsType(tacticsToEquip.getType().getName());
        generalRepository.update(general);
        
        logger.info("武将 {} 装备兵法 {}", general.getName(), tacticsToEquip.getName());
        
        Map<String, Object> result = new HashMap<>();
        result.put("generalId", generalId);
        result.put("generalName", general.getName());
        result.put("equippedTactics", tacticsToEquip);
        result.put("previousTactics", oldTactics);
        
        return result;
    }
    
    /**
     * 卸下兵法
     */
    public Map<String, Object> unequipTactics(String userId, String generalId) {
        // 检查武将
        General general = generalRepository.findById(generalId);
        if (general == null) {
            throw new BusinessException(400, "武将不存在");
        }
        if (!userId.equals(general.getUserId())) {
            throw new BusinessException(403, "无权操作此武将");
        }
        
        Tactics removedTactics = generalEquippedTactics.remove(generalId);
        if (removedTactics == null) {
            throw new BusinessException(400, "该武将没有装备兵法");
        }
        
        // 清除武将的兵法信息
        if (general.getTactics() != null) {
            general.getTactics().setTacticsId(null);
            general.getTactics().setTacticsName(null);
            general.getTactics().setTacticsType(null);
            generalRepository.update(general);
        }
        
        logger.info("武将 {} 卸下兵法 {}", general.getName(), removedTactics.getName());
        
        Map<String, Object> result = new HashMap<>();
        result.put("generalId", generalId);
        result.put("generalName", general.getName());
        result.put("removedTactics", removedTactics);
        
        return result;
    }
    
    /**
     * 初始化武将的固有兵法（根据兵种和品质）
     */
    public void initGeneralTactics(General general) {
        String generalId = general.getId();
        int qualityId = general.getQuality() != null ? general.getQuality().getId() : 1;
        String troopType = general.getTroopType() != null ? general.getTroopType().getName() : "步兵";
        String troopTypeCode = getTroopTypeCode(troopType);
        
        // 获取该兵种可用的兵法
        List<Tactics> availableTactics = new ArrayList<>();
        for (Tactics t : tacticsConfig.getAllTactics().values()) {
            String condition = t.getLearnCondition();
            int tacticsQuality = t.getQuality().getId();
            
            // 品质匹配（同级或低一级）且兵种匹配
            if (tacticsQuality <= qualityId && tacticsQuality >= qualityId - 1) {
                if ("ALL".equals(condition) || condition == null || condition.equalsIgnoreCase(troopTypeCode)) {
                    availableTactics.add(t);
                }
            }
        }
        
        if (availableTactics.isEmpty()) {
            return;
        }
        
        // 随机选择一个作为固有兵法
        Collections.shuffle(availableTactics);
        Tactics primaryTactics = copyTactics(availableTactics.get(0));
        
        List<Tactics> learned = generalLearnedTactics.computeIfAbsent(generalId, k -> new ArrayList<>());
        learned.add(primaryTactics);
        
        // 自动装备
        generalEquippedTactics.put(generalId, primaryTactics);
        
        // 更新武将信息
        if (general.getTactics() == null) {
            general.setTactics(General.Tactics.builder().build());
        }
        general.getTactics().setTacticsId(primaryTactics.getId());
        general.getTactics().setTacticsName(primaryTactics.getName());
        general.getTactics().setTacticsType(primaryTactics.getType().getName());
        List<String> learnedIds = new ArrayList<>();
        learnedIds.add(primaryTactics.getId());
        general.getTactics().setLearnedTacticsIds(learnedIds);
        
        logger.info("武将 {} 初始化兵法: {} ({})", general.getName(), primaryTactics.getName(), troopType);
    }
    
    /**
     * 计算战斗中的兵法效果
     */
    public Map<String, Object> calculateTacticsBonus(String generalId) {
        Map<String, Object> result = new HashMap<>();
        Map<String, Integer> attributeBonus = new HashMap<>();
        Map<String, Object> tacticsInfo = null;
        
        Tactics equipped = generalEquippedTactics.get(generalId);
        if (equipped == null) {
            result.put("attributeBonus", attributeBonus);
            result.put("equippedTactics", null);
            return result;
        }
        
        // 计算被动效果
        for (Tactics.TacticsEffect effect : equipped.getEffects()) {
            if ("BUFF".equals(effect.getEffectType()) && effect.getDuration() == 0) {
                String attr = effect.getAttribute();
                int value = effect.getBaseValue();
                attributeBonus.merge(attr, value, Integer::sum);
            }
        }
        
        // 记录兵法信息
        tacticsInfo = new HashMap<>();
        tacticsInfo.put("id", equipped.getId());
        tacticsInfo.put("name", equipped.getName());
        tacticsInfo.put("type", equipped.getType().getName());
        tacticsInfo.put("triggerRate", equipped.getTriggerRate());
        tacticsInfo.put("effects", equipped.getEffects());
        tacticsInfo.put("description", equipped.getDescription());
        
        result.put("attributeBonus", attributeBonus);
        result.put("equippedTactics", tacticsInfo);
        
        return result;
    }
    
    private String getTroopTypeCode(String troopTypeName) {
        if (troopTypeName == null) return "INFANTRY";
        switch (troopTypeName) {
            case "步兵": return "INFANTRY";
            case "骑兵": return "CAVALRY";
            case "弓兵": return "ARCHER";
            default: return "INFANTRY";
        }
    }
    
    private String getTroopTypeName(String code) {
        if (code == null) return "步兵";
        switch (code.toUpperCase()) {
            case "INFANTRY": return "步兵";
            case "CAVALRY": return "骑兵";
            case "ARCHER": return "弓兵";
            default: return "步兵";
        }
    }
    
    /**
     * 复制兵法（创建副本）
     */
    private Tactics copyTactics(Tactics source) {
        List<Tactics.TacticsEffect> copiedEffects = new ArrayList<>();
        for (Tactics.TacticsEffect effect : source.getEffects()) {
            copiedEffects.add(Tactics.TacticsEffect.builder()
                .effectType(effect.getEffectType())
                .targetType(effect.getTargetType())
                .attribute(effect.getAttribute())
                .baseValue(effect.getBaseValue())
                .ratio(effect.getRatio())
                .duration(effect.getDuration())
                .description(effect.getDescription())
                .build());
        }
        
        return Tactics.builder()
            .id(source.getId())
            .name(source.getName())
            .type(source.getType())
            .quality(source.getQuality())
            .description(source.getDescription())
            .icon(source.getIcon())
            .effects(copiedEffects)
            .triggerRate(source.getTriggerRate())
            .triggerCondition(source.getTriggerCondition())
            .learnLevel(source.getLearnLevel())
            .learnCondition(source.getLearnCondition())
            .level(1)
            .maxLevel(10)
            .exp(0)
            .maxExp(100)
            .createTime(System.currentTimeMillis())
            .updateTime(System.currentTimeMillis())
            .build();
    }
}
