package com.miniprogram.config;

import com.miniprogram.model.Tactics;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.*;

/**
 * 兵法配置
 */
@Component
public class TacticsConfig {
    
    // 兵法类型配置
    private final Map<Integer, Tactics.TacticsType> tacticsTypes = new HashMap<>();
    
    // 兵法品质配置
    private final Map<Integer, Tactics.TacticsQuality> tacticsQualities = new HashMap<>();
    
    // 兵法模板（所有可用的兵法）
    private final Map<String, Tactics> tacticsTemplates = new HashMap<>();
    
    @PostConstruct
    public void init() {
        initTacticsTypes();
        initTacticsQualities();
        initTacticsTemplates();
    }
    
    private void initTacticsTypes() {
        tacticsTypes.put(1, Tactics.TacticsType.builder()
            .id(1).name("主动").description("主动发动的兵法，消耗行动回合").icon("⚔️").build());
        tacticsTypes.put(2, Tactics.TacticsType.builder()
            .id(2).name("被动").description("满足条件自动触发").icon("🛡️").build());
        tacticsTypes.put(3, Tactics.TacticsType.builder()
            .id(3).name("指挥").description("战斗开始时对己方全体生效").icon("📯").build());
        tacticsTypes.put(4, Tactics.TacticsType.builder()
            .id(4).name("阵法").description("根据阵型提供额外加成").icon("🔄").build());
    }
    
    private void initTacticsQualities() {
        tacticsQualities.put(1, Tactics.TacticsQuality.builder()
            .id(1).name("白色").color("#FFFFFF").multiplier(1.0).build());
        tacticsQualities.put(2, Tactics.TacticsQuality.builder()
            .id(2).name("绿色").color("#00FF00").multiplier(1.2).build());
        tacticsQualities.put(3, Tactics.TacticsQuality.builder()
            .id(3).name("蓝色").color("#0080FF").multiplier(1.5).build());
        tacticsQualities.put(4, Tactics.TacticsQuality.builder()
            .id(4).name("紫色").color("#9370DB").multiplier(1.8).build());
        tacticsQualities.put(5, Tactics.TacticsQuality.builder()
            .id(5).name("橙色").color("#FF8C00").multiplier(2.2).build());
        tacticsQualities.put(6, Tactics.TacticsQuality.builder()
            .id(6).name("红色").color("#DC143C").multiplier(2.8).build());
    }
    
    private void initTacticsTemplates() {
        // ==================== 步兵专属阵法 ====================
        
        // 方圆阵 - 步兵专属
        addTacticsWithCost("tactics_f01", "方圆阵", 4, 4, "INFANTRY",
            "步兵专属阵法：全体防御+10%，形成坚固防线",
            Arrays.asList(
                createBuffEffect("ALL_ALLIES", "defense", 0, 10, "全体防御+10%")
            ), 100, "阵型生效时",
            50, 30, 500);  // 纸张50，木材30，银两500
        
        // 却月阵 - 步兵专属
        addTacticsWithCost("tactics_f02", "却月阵", 4, 5, "INFANTRY",
            "步兵专属阵法：对弓兵造成30%反伤，但骑兵对此阵伤害增加10%",
            Arrays.asList(
                createBuffEffect("SELF", "reflect_archer", 0, 30, "对弓兵反伤30%"),
                createDebuffEffect("SELF", "cavalry_weakness", 0, 10, "受骑兵伤害+10%")
            ), 100, "阵型生效时",
            80, 50, 1000);
        
        // 八门金锁阵 - 步兵专属
        addTacticsWithCost("tactics_f03", "八门金锁阵", 4, 5, "INFANTRY",
            "步兵专属阵法：提升己方全体防御15%和闪避5%",
            Arrays.asList(
                createBuffEffect("ALL_ALLIES", "defense", 0, 15, "全体防御+15%"),
                createBuffEffect("ALL_ALLIES", "dodge", 0, 5, "全体闪避+5%")
            ), 100, "阵型生效时",
            100, 60, 1500);
        
        // ==================== 骑兵专属兵法 ====================
        
        // 铁骑冲锋 - 骑兵专属
        addTacticsWithCost("tactics_c01", "铁骑冲锋", 1, 4, "CAVALRY",
            "骑兵专属兵法：对敌方单体造成150%伤害，对步兵额外+20%",
            Arrays.asList(
                createDamageEffect("SINGLE_ENEMY", 150, 1.5, "造成150%伤害"),
                createBuffEffect("SELF", "infantry_bonus", 0, 20, "对步兵伤害+20%")
            ), 40, "攻击时触发",
            40, 60, 600);
        
        // 突袭 - 骑兵专属
        addTacticsWithCost("tactics_c02", "突袭", 1, 3, "CAVALRY",
            "骑兵专属兵法：先手攻击，机动性+20",
            Arrays.asList(
                createBuffEffect("SELF", "mobility", 0, 20, "机动性+20")
            ), 100, "战斗开始时",
            30, 40, 400);
        
        // 虎豹骑 - 骑兵专属
        addTacticsWithCost("tactics_c03", "虎豹骑", 1, 5, "CAVALRY",
            "骑兵专属兵法：造成200%伤害并降低目标防御50点",
            Arrays.asList(
                createDamageEffect("SINGLE_ENEMY", 200, 2.0, "造成200%伤害"),
                createDebuffEffect("SINGLE_ENEMY", "defense", 2, -50, "降低防御50点")
            ), 35, "攻击时触发",
            100, 80, 2000);
        
        // ==================== 弓兵专属兵法 ====================
        
        // 长虹贯日 - 弓兵专属（核心兵法）
        addTacticsWithCost("tactics_a01", "长虹贯日", 1, 5, "ARCHER",
            "弓兵专属兵法：对一排三个敌人造成伤害，比例分别为50%、40%、30%",
            Arrays.asList(
                createDamageEffect("ROW_FIRST", 100, 0.5, "第一目标受到50%伤害"),
                createDamageEffect("ROW_SECOND", 80, 0.4, "第二目标受到40%伤害"),
                createDamageEffect("ROW_THIRD", 60, 0.3, "第三目标受到30%伤害")
            ), 35, "攻击时触发",
            120, 40, 2500);
        
        // 箭雨 - 弓兵专属
        addTacticsWithCost("tactics_a02", "箭雨", 1, 4, "ARCHER",
            "弓兵专属兵法：对敌方全体造成80%伤害",
            Arrays.asList(
                createDamageEffect("ALL_ENEMIES", 80, 0.8, "全体敌人受到80%伤害")
            ), 30, "每2回合触发",
            60, 30, 800);
        
        // 穿云箭 - 弓兵专属
        addTacticsWithCost("tactics_a03", "穿云箭", 1, 3, "ARCHER",
            "弓兵专属兵法：对单体造成120%伤害，无视20%防御",
            Arrays.asList(
                createDamageEffect("SINGLE_ENEMY", 120, 1.2, "造成120%伤害"),
                createBuffEffect("SELF", "armor_pierce", 0, 20, "无视20%防御")
            ), 45, "攻击时触发",
            40, 20, 500);
        
        // ==================== 通用兵法 ====================
        
        // 铁壁 - 通用
        addTacticsWithCost("tactics_g01", "铁壁", 2, 3, "ALL",
            "通用兵法：永久提升防御80点",
            Arrays.asList(
                createBuffEffect("SELF", "defense", 0, 80, "防御+80")
            ), 100, "永久生效",
            30, 20, 300);
        
        // 猛攻 - 通用
        addTacticsWithCost("tactics_g02", "猛攻", 2, 3, "ALL",
            "通用兵法：永久提升攻击100点",
            Arrays.asList(
                createBuffEffect("SELF", "attack", 0, 100, "攻击+100")
            ), 100, "永久生效",
            30, 20, 300);
        
        // 疾行 - 通用
        addTacticsWithCost("tactics_g03", "疾行", 2, 3, "ALL",
            "通用兵法：永久提升机动性30点",
            Arrays.asList(
                createBuffEffect("SELF", "mobility", 0, 30, "机动性+30")
            ), 100, "永久生效",
            30, 20, 300);
        
        // 鼓舞 - 通用指挥
        addTacticsWithCost("tactics_g04", "鼓舞", 3, 4, "ALL",
            "通用指挥兵法：战斗开始时全体攻击+50，持续3回合",
            Arrays.asList(
                createBuffEffect("ALL_ALLIES", "attack", 3, 50, "全体攻击+50")
            ), 100, "战斗开始时",
            60, 40, 800);
    }
    
    private void addTacticsWithCost(String id, String name, int typeId, int qualityId, 
                                    String troopRequirement, String description, 
                                    List<Tactics.TacticsEffect> effects, 
                                    int triggerRate, String triggerCondition,
                                    int paperCost, int woodCost, int silverCost) {
        Map<String, Integer> learnCost = new HashMap<>();
        learnCost.put("paper", paperCost);
        learnCost.put("wood", woodCost);
        learnCost.put("silver", silverCost);
        
        Tactics tactics = Tactics.builder()
            .id(id)
            .name(name)
            .type(tacticsTypes.get(typeId))
            .quality(tacticsQualities.get(qualityId))
            .description(description)
            .icon(getIconByType(typeId))
            .effects(effects)
            .triggerRate(triggerRate)
            .triggerCondition(triggerCondition)
            .learnLevel(qualityId * 10)
            .learnCondition(troopRequirement)  // 兵种要求
            .level(1)
            .maxLevel(10)
            .exp(0)
            .maxExp(100)
            .createTime(System.currentTimeMillis())
            .updateTime(System.currentTimeMillis())
            .build();
        
        // 存储学习消耗
        tacticsLearnCosts.put(id, learnCost);
        tacticsTemplates.put(id, tactics);
    }
    
    // 兵法学习消耗
    private final Map<String, Map<String, Integer>> tacticsLearnCosts = new HashMap<>();
    
    public Map<String, Integer> getTacticsLearnCost(String tacticsId) {
        return tacticsLearnCosts.getOrDefault(tacticsId, new HashMap<>());
    }
    
    private void addTactics(String id, String name, int typeId, int qualityId, 
                           String description, List<Tactics.TacticsEffect> effects, 
                           int triggerRate, String triggerCondition) {
        Tactics tactics = Tactics.builder()
            .id(id)
            .name(name)
            .type(tacticsTypes.get(typeId))
            .quality(tacticsQualities.get(qualityId))
            .description(description)
            .icon(getIconByType(typeId))
            .effects(effects)
            .triggerRate(triggerRate)
            .triggerCondition(triggerCondition)
            .learnLevel(qualityId * 10)  // 白10级，绿20级...
            .learnCondition(null)
            .level(1)
            .maxLevel(10)
            .exp(0)
            .maxExp(100)
            .createTime(System.currentTimeMillis())
            .updateTime(System.currentTimeMillis())
            .build();
        
        tacticsTemplates.put(id, tactics);
    }
    
    private String getIconByType(int typeId) {
        switch (typeId) {
            case 1: return "⚔️";
            case 2: return "🛡️";
            case 3: return "📯";
            case 4: return "🔄";
            default: return "📜";
        }
    }
    
    private Tactics.TacticsEffect createDamageEffect(String targetType, int baseValue, 
                                                      double ratio, String description) {
        return Tactics.TacticsEffect.builder()
            .effectType("DAMAGE")
            .targetType(targetType)
            .attribute("hp")
            .baseValue(baseValue)
            .ratio(ratio)
            .duration(0)
            .description(description)
            .build();
    }
    
    private Tactics.TacticsEffect createHealEffect(String targetType, int baseValue, 
                                                    double ratio, String description) {
        return Tactics.TacticsEffect.builder()
            .effectType("HEAL")
            .targetType(targetType)
            .attribute("hp")
            .baseValue(baseValue)
            .ratio(ratio)
            .duration(0)
            .description(description)
            .build();
    }
    
    private Tactics.TacticsEffect createBuffEffect(String targetType, String attribute, 
                                                    int duration, int value, String description) {
        return Tactics.TacticsEffect.builder()
            .effectType("BUFF")
            .targetType(targetType)
            .attribute(attribute)
            .baseValue(value)
            .ratio(0.0)
            .duration(duration)
            .description(description)
            .build();
    }
    
    private Tactics.TacticsEffect createDebuffEffect(String targetType, String attribute, 
                                                      int duration, int value, String description) {
        return Tactics.TacticsEffect.builder()
            .effectType("DEBUFF")
            .targetType(targetType)
            .attribute(attribute)
            .baseValue(value)
            .ratio(0.0)
            .duration(duration)
            .description(description)
            .build();
    }
    
    // ==================== 公开方法 ====================
    
    public Map<String, Tactics> getAllTactics() {
        return Collections.unmodifiableMap(tacticsTemplates);
    }
    
    public Tactics getTacticsById(String id) {
        return tacticsTemplates.get(id);
    }
    
    public List<Tactics> getTacticsByType(int typeId) {
        List<Tactics> result = new ArrayList<>();
        for (Tactics tactics : tacticsTemplates.values()) {
            if (tactics.getType().getId() == typeId) {
                result.add(tactics);
            }
        }
        return result;
    }
    
    public List<Tactics> getTacticsByQuality(int qualityId) {
        List<Tactics> result = new ArrayList<>();
        for (Tactics tactics : tacticsTemplates.values()) {
            if (tactics.getQuality().getId() == qualityId) {
                result.add(tactics);
            }
        }
        return result;
    }
    
    public Tactics.TacticsType getTacticsType(int typeId) {
        return tacticsTypes.get(typeId);
    }
    
    public Tactics.TacticsQuality getTacticsQuality(int qualityId) {
        return tacticsQualities.get(qualityId);
    }
    
    public Map<Integer, Tactics.TacticsType> getAllTacticsTypes() {
        return Collections.unmodifiableMap(tacticsTypes);
    }
    
    public Map<Integer, Tactics.TacticsQuality> getAllTacticsQualities() {
        return Collections.unmodifiableMap(tacticsQualities);
    }
}
