package com.miniprogram.config;

import com.miniprogram.model.Campaign;
import com.miniprogram.model.Campaign.*;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.*;

/**
 * 战役配置
 */
@Component
public class CampaignConfig {
    
    private final List<Campaign> campaigns = new ArrayList<>();
    
    @PostConstruct
    public void init() {
        // 第一章：乱世华雄
        campaigns.add(createCampaign(
            "campaign_1", "乱世华雄", 1, 
            1, 30, 500, 2000, 10, 1, 5,
            Arrays.asList("普通装备", "优秀装备"),
            createStages1()
        ));
        
        // 第二章：四世三公
        campaigns.add(createCampaign(
            "campaign_2", "四世三公", 2,
            25, 50, 1500, 5000, 8, 20, 6,
            Arrays.asList("优秀装备", "精良装备"),
            createStages2()
        ));
        
        // 第三章：战神吕布
        campaigns.add(createCampaign(
            "campaign_3", "战神吕布", 3,
            45, 70, 4000, 12000, 6, 40, 7,
            Arrays.asList("精良装备", "史诗装备"),
            createStages3()
        ));
        
        // 第四章：官渡之战
        campaigns.add(createCampaign(
            "campaign_4", "官渡之战", 4,
            65, 90, 8000, 20000, 5, 60, 8,
            Arrays.asList("史诗装备", "传说装备"),
            createStages4()
        ));
        
        // 第五章：赤壁鏖兵
        campaigns.add(createCampaign(
            "campaign_5", "赤壁鏖兵", 5,
            85, 100, 15000, 35000, 4, 80, 9,
            Arrays.asList("传说装备", "神话装备"),
            createStages5()
        ));
    }
    
    private Campaign createCampaign(String id, String name, int chapter,
                                    int minLevel, int maxLevel, int minExp, int maxExp,
                                    int dailyLimit, int requiredLevel, int staminaCost,
                                    List<String> drops, List<CampaignStage> stages) {
        return Campaign.builder()
                .id(id)
                .name(name)
                .chapter(chapter)
                .description("第" + chapter + "章：" + name)
                .icon("/images/campaign_" + chapter + ".png")
                .minEnemyLevel(minLevel)
                .maxEnemyLevel(maxLevel)
                .minExp(minExp)
                .maxExp(maxExp)
                .dailyLimit(dailyLimit)
                .requiredLevel(requiredLevel)
                .staminaCost(staminaCost)
                .dropRewards(drops)
                .stages(stages)
                .build();
    }
    
    private List<CampaignStage> createStages1() {
        List<CampaignStage> stages = new ArrayList<>();
        String[] bosses = {"张角", "张宝", "张梁", "程远志", "邓茂", "韩忠", "孙仲", "华雄"};
        for (int i = 0; i < 8; i++) {
            stages.add(createStage(i + 1, bosses[i], 5 + i * 3, 500 + i * 200, 
                    i < 4 ? "普通" : "优秀"));
        }
        return stages;
    }
    
    private List<CampaignStage> createStages2() {
        List<CampaignStage> stages = new ArrayList<>();
        String[] bosses = {"纪灵", "袁术", "颜良", "文丑", "高览", "张郃", "淳于琼", "袁绍"};
        for (int i = 0; i < 8; i++) {
            stages.add(createStage(i + 1, bosses[i], 25 + i * 3, 1500 + i * 400,
                    i < 4 ? "优秀" : "精良"));
        }
        return stages;
    }
    
    private List<CampaignStage> createStages3() {
        List<CampaignStage> stages = new ArrayList<>();
        String[] bosses = {"李傕", "郭汜", "张济", "樊稠", "高顺", "陈宫", "张辽", "吕布"};
        for (int i = 0; i < 8; i++) {
            stages.add(createStage(i + 1, bosses[i], 45 + i * 3, 4000 + i * 1000,
                    i < 4 ? "精良" : "史诗"));
        }
        return stages;
    }
    
    private List<CampaignStage> createStages4() {
        List<CampaignStage> stages = new ArrayList<>();
        String[] bosses = {"蒋奇", "韩猛", "吕旷", "吕翔", "审配", "逢纪", "许攸", "曹操"};
        for (int i = 0; i < 8; i++) {
            stages.add(createStage(i + 1, bosses[i], 65 + i * 3, 8000 + i * 1500,
                    i < 4 ? "史诗" : "传说"));
        }
        return stages;
    }
    
    private List<CampaignStage> createStages5() {
        List<CampaignStage> stages = new ArrayList<>();
        String[] bosses = {"蔡瑁", "张允", "蒋干", "庞统", "黄盖", "程普", "鲁肃", "周瑜"};
        for (int i = 0; i < 8; i++) {
            stages.add(createStage(i + 1, bosses[i], 85 + i * 2, 15000 + i * 2500,
                    i < 4 ? "传说" : "神话"));
        }
        return stages;
    }
    
    private CampaignStage createStage(int num, String boss, int level, int exp, String dropQuality) {
        int baseAttack = 50 + level * 8;
        int baseDefense = 30 + level * 5;
        int baseHp = 500 + level * 50;
        
        List<DropItem> drops = new ArrayList<>();
        // 装备掉落
        drops.add(DropItem.builder()
                .itemType("equipment")
                .itemName(dropQuality + "装备")
                .quality(dropQuality)
                .dropRate(0.3)
                .build());
        // 材料掉落
        drops.add(DropItem.builder()
                .itemType("material")
                .itemName("强化石")
                .quality("普通")
                .dropRate(0.5)
                .build());
        
        return CampaignStage.builder()
                .stageNum(num)
                .bossName(boss)
                .bossAvatar("/images/boss_" + boss + ".png")
                .bossLevel(level)
                .bossAttack(baseAttack)
                .bossDefense(baseDefense)
                .bossHp(baseHp)
                .expReward(exp)
                .silverReward(exp / 2)
                .drops(drops)
                .build();
    }
    
    public List<Campaign> getAllCampaigns() {
        return campaigns;
    }
    
    public Campaign getCampaignById(String id) {
        return campaigns.stream()
                .filter(c -> c.getId().equals(id))
                .findFirst()
                .orElse(null);
    }
    
    public Campaign getCampaignByChapter(int chapter) {
        return campaigns.stream()
                .filter(c -> c.getChapter() == chapter)
                .findFirst()
                .orElse(null);
    }
}
