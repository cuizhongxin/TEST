package com.miniprogram.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 战役系统模型
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Campaign {
    
    private String id;
    private String name;                    // 战役名称（如：乱世华雄）
    private String description;             // 战役描述
    private Integer chapter;                // 章节序号
    private String icon;                    // 战役图标
    private Integer minEnemyLevel;          // 敌人最低等级
    private Integer maxEnemyLevel;          // 敌人最高等级
    private Integer minExp;                 // 最低经验
    private Integer maxExp;                 // 最高经验
    private Integer dailyLimit;             // 每日次数限制
    private Integer requiredLevel;          // 需要玩家等级
    private Integer staminaCost;            // 每关消耗精力
    private List<String> dropRewards;       // 掉落奖励预览
    private List<CampaignStage> stages;     // 关卡列表
    
    /**
     * 战役关卡
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CampaignStage {
        private Integer stageNum;           // 关卡序号
        private String bossName;            // 将领名称
        private String bossAvatar;          // 将领头像
        private Integer bossLevel;          // 将领等级
        private Integer bossAttack;         // 将领攻击
        private Integer bossDefense;        // 将领防御
        private Integer bossHp;             // 将领血量
        private Integer expReward;          // 经验奖励
        private Integer silverReward;       // 白银奖励
        private List<DropItem> drops;       // 掉落物品
    }
    
    /**
     * 掉落物品
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DropItem {
        private String itemType;            // 物品类型: equipment, material, item
        private String itemId;
        private String itemName;
        private String quality;             // 品质
        private Double dropRate;            // 掉落概率
        private String icon;
    }
    
    /**
     * 用户战役进度
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CampaignProgress {
        private String odUserId;
        private String campaignId;
        private Integer currentStage;       // 当前关卡（0表示未开始）
        private Integer maxClearedStage;    // 最高通关关卡
        private Boolean inProgress;         // 是否正在进行中
        private Integer todayAttempts;      // 今日已尝试次数
        private String lastAttemptDate;     // 上次尝试日期
        private Integer currentTroops;      // 当前兵力
        private Integer maxTroops;          // 最大兵力
        private Integer reviveCount;        // 重生次数
    }
    
    /**
     * 战斗结果
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BattleResult {
        private Boolean victory;
        private Integer expGained;
        private Integer silverGained;
        private List<DropItem> itemsDropped;
        private Integer troopsLost;
        private Integer remainingTroops;
        private List<String> battleLog;
    }
    
    /**
     * 扫荡结果
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SweepResult {
        private Integer stagesCleared;      // 扫荡通过的关卡数
        private Integer totalExp;           // 获得总经验
        private Integer totalSilver;        // 获得总白银
        private List<DropItem> allDrops;    // 所有掉落
        private Integer tigerTalismanUsed;  // 消耗虎符数
        private Integer silverUsed;         // 消耗白银（补兵）
        private String stopReason;          // 停止原因
    }
}
