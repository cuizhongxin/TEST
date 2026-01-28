package com.miniprogram.service.nationwar;

import com.miniprogram.exception.BusinessException;
import com.miniprogram.model.NationWar;
import com.miniprogram.model.NationWar.*;
import com.miniprogram.service.UserResourceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 国战服务
 */
@Service
public class NationWarService {
    
    private static final Logger logger = LoggerFactory.getLogger(NationWarService.class);
    
    @Autowired
    private UserResourceService userResourceService;
    
    // 国战存储
    private final Map<String, NationWar> warStore = new ConcurrentHashMap<>();
    
    // 国家信息
    private final Map<String, Nation> nations = new LinkedHashMap<>();
    
    // 城市信息
    private final Map<String, City> cities = new LinkedHashMap<>();
    
    // 玩家国籍
    private final Map<String, String> playerNations = new ConcurrentHashMap<>();
    
    // 玩家军功
    private final Map<String, Integer> playerMerits = new ConcurrentHashMap<>();
    
    // 报名人数要求
    private static final int MIN_SIGN_UP = 10;
    
    // 胜利点数
    private static final int VICTORY_POINT = 10000;
    
    // 每场战斗积分
    private static final int SCORE_PER_WIN = 500;
    
    // 每场战斗军功
    private static final int MERIT_PER_WIN = 100;
    private static final int MERIT_PER_LOSS = 30;
    
    public NationWarService() {
        initMapData();
    }
    
    /**
     * 初始化地图数据
     */
    private void initMapData() {
        // 初始化三国
        nations.put("WEI", Nation.builder()
            .id("WEI").name("魏").color("#0066cc")
            .capitalId("LUOYANG").capitalName("洛阳")
            .cities(new ArrayList<>(Arrays.asList("LUOYANG", "XUCHANG", "YECHENG", "CHANGAN")))
            .totalPlayers(0)
            .meritExchangeRate(1.0)
            .build());
        
        nations.put("SHU", Nation.builder()
            .id("SHU").name("蜀").color("#00aa00")
            .capitalId("CHENGDU").capitalName("成都")
            .cities(new ArrayList<>(Arrays.asList("CHENGDU", "HANZHONG", "JIAMENG")))
            .totalPlayers(0)
            .meritExchangeRate(1.0)
            .build());
        
        nations.put("WU", Nation.builder()
            .id("WU").name("吴").color("#cc0000")
            .capitalId("JIANYE").capitalName("建业")
            .cities(new ArrayList<>(Arrays.asList("JIANYE", "WUCHANG", "CHANGSHA", "JIANGXIA")))
            .totalPlayers(0)
            .meritExchangeRate(1.0)
            .build());
        
        // 初始化城市
        cities.put("LUOYANG", City.builder()
            .id("LUOYANG").name("洛阳").owner("WEI").x(400).y(200)
            .neighbors(Arrays.asList("XUCHANG", "CHANGAN"))
            .isCapital(true).defenseBonus(20)
            .build());
        
        cities.put("XUCHANG", City.builder()
            .id("XUCHANG").name("许昌").owner("WEI").x(450).y(250)
            .neighbors(Arrays.asList("LUOYANG", "YECHENG", "WUCHANG"))
            .isCapital(false).defenseBonus(10)
            .build());
        
        cities.put("YECHENG", City.builder()
            .id("YECHENG").name("邺城").owner("WEI").x(500).y(150)
            .neighbors(Arrays.asList("XUCHANG"))
            .isCapital(false).defenseBonus(10)
            .build());
        
        cities.put("CHANGAN", City.builder()
            .id("CHANGAN").name("长安").owner("WEI").x(300).y(200)
            .neighbors(Arrays.asList("LUOYANG", "HANZHONG"))
            .isCapital(false).defenseBonus(15)
            .build());
        
        cities.put("CHENGDU", City.builder()
            .id("CHENGDU").name("成都").owner("SHU").x(200).y(350)
            .neighbors(Arrays.asList("HANZHONG", "JIAMENG"))
            .isCapital(true).defenseBonus(20)
            .build());
        
        cities.put("HANZHONG", City.builder()
            .id("HANZHONG").name("汉中").owner("SHU").x(250).y(280)
            .neighbors(Arrays.asList("CHENGDU", "CHANGAN"))
            .isCapital(false).defenseBonus(15)
            .build());
        
        cities.put("JIAMENG", City.builder()
            .id("JIAMENG").name("剑阁").owner("SHU").x(220).y(320)
            .neighbors(Arrays.asList("CHENGDU", "WUCHANG"))
            .isCapital(false).defenseBonus(10)
            .build());
        
        cities.put("JIANYE", City.builder()
            .id("JIANYE").name("建业").owner("WU").x(550).y(350)
            .neighbors(Arrays.asList("WUCHANG", "CHANGSHA"))
            .isCapital(true).defenseBonus(20)
            .build());
        
        cities.put("WUCHANG", City.builder()
            .id("WUCHANG").name("武昌").owner("WU").x(450).y(350)
            .neighbors(Arrays.asList("JIANYE", "XUCHANG", "JIAMENG", "JIANGXIA"))
            .isCapital(false).defenseBonus(10)
            .build());
        
        cities.put("CHANGSHA", City.builder()
            .id("CHANGSHA").name("长沙").owner("WU").x(480).y(400)
            .neighbors(Arrays.asList("JIANYE", "JIANGXIA"))
            .isCapital(false).defenseBonus(10)
            .build());
        
        cities.put("JIANGXIA", City.builder()
            .id("JIANGXIA").name("江夏").owner("WU").x(420).y(380)
            .neighbors(Arrays.asList("WUCHANG", "CHANGSHA"))
            .isCapital(false).defenseBonus(10)
            .build());
    }
    
    /**
     * 获取国战地图
     */
    public WarMap getWarMap() {
        return WarMap.builder()
            .nations(new ArrayList<>(nations.values()))
            .cities(new ArrayList<>(cities.values()))
            .borders(calculateBorders())
            .build();
    }
    
    /**
     * 计算国家边界
     */
    private Map<String, List<String>> calculateBorders() {
        Map<String, List<String>> borders = new HashMap<>();
        
        for (Nation nation : nations.values()) {
            Set<String> borderNations = new HashSet<>();
            
            for (String cityId : nation.getCities()) {
                City city = cities.get(cityId);
                if (city != null && city.getNeighbors() != null) {
                    for (String neighborId : city.getNeighbors()) {
                        City neighbor = cities.get(neighborId);
                        if (neighbor != null && !neighbor.getOwner().equals(nation.getId())) {
                            borderNations.add(neighbor.getOwner());
                        }
                    }
                }
            }
            
            borders.put(nation.getId(), new ArrayList<>(borderNations));
        }
        
        return borders;
    }
    
    /**
     * 设置玩家国籍
     */
    public void setPlayerNation(String odUserId, String nationId) {
        if (!nations.containsKey(nationId)) {
            throw new BusinessException(400, "无效的国家");
        }
        playerNations.put(odUserId, nationId);
        
        // 更新国家玩家数
        Nation nation = nations.get(nationId);
        nation.setTotalPlayers(nation.getTotalPlayers() + 1);
        updateMeritExchangeRate(nationId);
    }
    
    /**
     * 获取玩家国籍
     */
    public String getPlayerNation(String odUserId) {
        return playerNations.getOrDefault(odUserId, null);
    }
    
    /**
     * 获取可进攻的城市列表
     */
    public List<City> getAttackableCities(String odUserId) {
        String playerNation = getPlayerNation(odUserId);
        if (playerNation == null) {
            return new ArrayList<>();
        }
        
        Set<String> attackableCityIds = new HashSet<>();
        Nation nation = nations.get(playerNation);
        
        // 遍历本国城市，找出接壤的敌国城市
        for (String cityId : nation.getCities()) {
            City city = cities.get(cityId);
            if (city != null && city.getNeighbors() != null) {
                for (String neighborId : city.getNeighbors()) {
                    City neighbor = cities.get(neighborId);
                    if (neighbor != null && !neighbor.getOwner().equals(playerNation)) {
                        attackableCityIds.add(neighborId);
                    }
                }
            }
        }
        
        return attackableCityIds.stream()
            .map(cities::get)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }
    
    /**
     * 获取今日国战
     */
    public NationWar getTodayWar(String cityId) {
        String today = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
        String warId = today + "_" + cityId;
        return warStore.get(warId);
    }
    
    /**
     * 报名国战
     */
    public Map<String, Object> signUp(String odUserId, String playerName, Integer level, Integer power, String targetCityId) {
        String playerNation = getPlayerNation(odUserId);
        if (playerNation == null) {
            throw new BusinessException(400, "请先选择国家");
        }
        
        City targetCity = cities.get(targetCityId);
        if (targetCity == null) {
            throw new BusinessException(400, "目标城市不存在");
        }
        
        if (targetCity.getOwner().equals(playerNation)) {
            throw new BusinessException(400, "不能进攻自己国家的城市");
        }
        
        // 检查是否接壤
        List<City> attackable = getAttackableCities(odUserId);
        boolean canAttack = attackable.stream().anyMatch(c -> c.getId().equals(targetCityId));
        if (!canAttack) {
            throw new BusinessException(400, "只能进攻与本国接壤的城市");
        }
        
        // 获取或创建今日国战
        String today = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
        String warId = today + "_" + targetCityId;
        
        NationWar war = warStore.computeIfAbsent(warId, k -> createWar(warId, today, playerNation, targetCity));
        
        // 检查报名时间
        if (war.getStatus() != WarStatus.SIGN_UP) {
            throw new BusinessException(400, "当前不是报名时间");
        }
        
        // 检查是否已报名
        boolean alreadySignedUp = war.getAttackers().stream()
            .anyMatch(p -> p.getOdUserId().equals(odUserId));
        if (alreadySignedUp) {
            throw new BusinessException(400, "已报名，不能重复报名");
        }
        
        // 创建参战者
        WarParticipant participant = WarParticipant.builder()
            .odUserId(odUserId)
            .playerName(playerName)
            .nation(playerNation)
            .level(level)
            .power(power)
            .signUpTime(System.currentTimeMillis())
            .wins(0).losses(0).scoreGained(0).meritGained(0)
            .eliminated(false)
            .build();
        
        war.getAttackers().add(participant);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("warId", warId);
        result.put("attackerCount", war.getAttackers().size());
        result.put("message", "报名成功");
        
        logger.info("国战报名: {} 报名进攻 {}", playerName, targetCity.getName());
        
        return result;
    }
    
    /**
     * 创建国战
     */
    private NationWar createWar(String warId, String date, String attackNation, City targetCity) {
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 19);
        cal.set(Calendar.MINUTE, 45);
        cal.set(Calendar.SECOND, 0);
        long signUpStart = cal.getTimeInMillis();
        
        cal.set(Calendar.HOUR_OF_DAY, 20);
        cal.set(Calendar.MINUTE, 0);
        long signUpEnd = cal.getTimeInMillis();
        long battleStart = signUpEnd;
        
        cal.set(Calendar.MINUTE, 45);
        long battleEnd = cal.getTimeInMillis();
        
        return NationWar.builder()
            .id(warId)
            .warDate(date)
            .status(WarStatus.SIGN_UP)
            .attackNation(attackNation)
            .defendNation(targetCity.getOwner())
            .targetCityId(targetCity.getId())
            .targetCityName(targetCity.getName())
            .attackers(new ArrayList<>())
            .defenders(new ArrayList<>())
            .attackScore(0)
            .defendScore(0)
            .victoryPoint(VICTORY_POINT)
            .battles(new ArrayList<>())
            .signUpStartTime(signUpStart)
            .signUpEndTime(signUpEnd)
            .battleStartTime(battleStart)
            .battleEndTime(battleEnd)
            .createTime(System.currentTimeMillis())
            .build();
    }
    
    /**
     * 获取国战状态
     */
    public Map<String, Object> getWarStatus(String warId) {
        NationWar war = warStore.get(warId);
        if (war == null) {
            throw new BusinessException(404, "国战不存在");
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("war", war);
        result.put("attackerCount", war.getAttackers().size());
        result.put("defenderCount", war.getDefenders().size());
        result.put("canStart", war.getAttackers().size() >= MIN_SIGN_UP);
        
        return result;
    }
    
    /**
     * 开始国战战斗（由定时任务调用）
     */
    public void startWarBattle(String warId) {
        NationWar war = warStore.get(warId);
        if (war == null || war.getStatus() != WarStatus.SIGN_UP) {
            return;
        }
        
        // 检查报名人数
        if (war.getAttackers().size() < MIN_SIGN_UP) {
            war.setStatus(WarStatus.FINISHED);
            war.setWinner(war.getDefendNation());
            logger.info("国战 {} 因进攻方人数不足取消", warId);
            return;
        }
        
        war.setStatus(WarStatus.FIGHTING);
        logger.info("国战 {} 开始战斗", warId);
        
        // 模拟战斗
        simulateBattles(war);
    }
    
    /**
     * 模拟战斗
     */
    private void simulateBattles(NationWar war) {
        List<WarParticipant> attackers = new ArrayList<>(war.getAttackers());
        List<WarParticipant> defenders = new ArrayList<>(war.getDefenders());
        
        // 如果防守方人数不足，随机补充NPC
        while (defenders.size() < attackers.size()) {
            defenders.add(createNpcDefender(war.getDefendNation(), defenders.size()));
        }
        
        Collections.shuffle(attackers);
        Collections.shuffle(defenders);
        
        int round = 1;
        Random random = new Random();
        
        // 循环对战直到一方达到胜利点
        while (war.getAttackScore() < war.getVictoryPoint() && 
               war.getDefendScore() < war.getVictoryPoint()) {
            
            for (int i = 0; i < Math.min(attackers.size(), defenders.size()); i++) {
                WarParticipant attacker = attackers.get(i);
                WarParticipant defender = defenders.get(i);
                
                if (attacker.getEliminated() || defender.getEliminated()) {
                    continue;
                }
                
                // 模拟战斗结果（基于战力+随机）
                int attackPower = attacker.getPower() + random.nextInt(1000);
                int defendPower = defender.getPower() + random.nextInt(1000);
                
                boolean attackerWins = attackPower > defendPower;
                
                WarBattle battle = WarBattle.builder()
                    .battleId(UUID.randomUUID().toString())
                    .round(round)
                    .attackerId(attacker.getOdUserId())
                    .attackerName(attacker.getPlayerName())
                    .attackerPower(attacker.getPower())
                    .defenderId(defender.getOdUserId())
                    .defenderName(defender.getPlayerName())
                    .defenderPower(defender.getPower())
                    .winnerId(attackerWins ? attacker.getOdUserId() : defender.getOdUserId())
                    .winnerName(attackerWins ? attacker.getPlayerName() : defender.getPlayerName())
                    .scoreGained(SCORE_PER_WIN)
                    .meritGained(MERIT_PER_WIN)
                    .battleTime(System.currentTimeMillis())
                    .build();
                
                war.getBattles().add(battle);
                
                if (attackerWins) {
                    war.setAttackScore(war.getAttackScore() + SCORE_PER_WIN);
                    attacker.setWins(attacker.getWins() + 1);
                    attacker.setScoreGained(attacker.getScoreGained() + SCORE_PER_WIN);
                    attacker.setMeritGained(attacker.getMeritGained() + MERIT_PER_WIN);
                    defender.setLosses(defender.getLosses() + 1);
                    defender.setMeritGained(defender.getMeritGained() + MERIT_PER_LOSS);
                    
                    // 更新玩家军功
                    addPlayerMerit(attacker.getOdUserId(), MERIT_PER_WIN);
                    addPlayerMerit(defender.getOdUserId(), MERIT_PER_LOSS);
                } else {
                    war.setDefendScore(war.getDefendScore() + SCORE_PER_WIN);
                    defender.setWins(defender.getWins() + 1);
                    defender.setScoreGained(defender.getScoreGained() + SCORE_PER_WIN);
                    defender.setMeritGained(defender.getMeritGained() + MERIT_PER_WIN);
                    attacker.setLosses(attacker.getLosses() + 1);
                    attacker.setMeritGained(attacker.getMeritGained() + MERIT_PER_LOSS);
                    
                    addPlayerMerit(defender.getOdUserId(), MERIT_PER_WIN);
                    addPlayerMerit(attacker.getOdUserId(), MERIT_PER_LOSS);
                }
                
                // 检查是否达到胜利点
                if (war.getAttackScore() >= war.getVictoryPoint() ||
                    war.getDefendScore() >= war.getVictoryPoint()) {
                    break;
                }
            }
            
            round++;
            
            // 防止无限循环
            if (round > 100) {
                break;
            }
        }
        
        // 判定胜负
        if (war.getAttackScore() >= war.getVictoryPoint()) {
            war.setWinner(war.getAttackNation());
            // 转移城市所有权
            transferCity(war.getTargetCityId(), war.getAttackNation());
        } else if (war.getDefendScore() >= war.getVictoryPoint()) {
            war.setWinner(war.getDefendNation());
        } else {
            // 超时，分数高者胜
            war.setWinner(war.getAttackScore() > war.getDefendScore() ? 
                         war.getAttackNation() : war.getDefendNation());
            if (war.getWinner().equals(war.getAttackNation())) {
                transferCity(war.getTargetCityId(), war.getAttackNation());
            }
        }
        
        war.setStatus(WarStatus.FINISHED);
        logger.info("国战 {} 结束，胜利方: {}", war.getId(), war.getWinner());
    }
    
    /**
     * 创建NPC防守者
     */
    private WarParticipant createNpcDefender(String nation, int index) {
        return WarParticipant.builder()
            .odUserId("NPC_" + nation + "_" + index)
            .playerName(nation + "守军" + (index + 1))
            .nation(nation)
            .level(30 + new Random().nextInt(20))
            .power(5000 + new Random().nextInt(3000))
            .signUpTime(System.currentTimeMillis())
            .wins(0).losses(0).scoreGained(0).meritGained(0)
            .eliminated(false)
            .build();
    }
    
    /**
     * 转移城市所有权
     */
    private void transferCity(String cityId, String newOwner) {
        City city = cities.get(cityId);
        if (city == null) return;
        
        String oldOwner = city.getOwner();
        
        // 从旧国家移除
        Nation oldNation = nations.get(oldOwner);
        if (oldNation != null) {
            oldNation.getCities().remove(cityId);
            updateMeritExchangeRate(oldOwner);
        }
        
        // 添加到新国家
        Nation newNation = nations.get(newOwner);
        if (newNation != null) {
            newNation.getCities().add(cityId);
            updateMeritExchangeRate(newOwner);
        }
        
        city.setOwner(newOwner);
        logger.info("城市 {} 所有权从 {} 转移到 {}", city.getName(), oldOwner, newOwner);
    }
    
    /**
     * 更新军功兑换比例
     */
    private void updateMeritExchangeRate(String nationId) {
        Nation nation = nations.get(nationId);
        if (nation == null) return;
        
        // 基础比例 1.0，每多一座城市 +0.1
        int cityCount = nation.getCities().size();
        nation.setMeritExchangeRate(1.0 + (cityCount - 3) * 0.1);
    }
    
    /**
     * 添加玩家军功
     */
    private void addPlayerMerit(String odUserId, int merit) {
        if (odUserId.startsWith("NPC_")) return;
        playerMerits.merge(odUserId, merit, Integer::sum);
    }
    
    /**
     * 获取玩家军功
     */
    public int getPlayerMerit(String odUserId) {
        return playerMerits.getOrDefault(odUserId, 0);
    }
    
    /**
     * 军功兑换白银
     */
    public Map<String, Object> exchangeMerit(String odUserId, int meritAmount) {
        int currentMerit = getPlayerMerit(odUserId);
        if (meritAmount > currentMerit) {
            throw new BusinessException(400, "军功不足");
        }
        
        String playerNation = getPlayerNation(odUserId);
        if (playerNation == null) {
            throw new BusinessException(400, "请先选择国家");
        }
        
        Nation nation = nations.get(playerNation);
        double rate = nation != null ? nation.getMeritExchangeRate() : 1.0;
        
        // 1军功 = 10白银 * 比例
        long silverGained = (long)(meritAmount * 10 * rate);
        
        // 扣除军功
        playerMerits.put(odUserId, currentMerit - meritAmount);
        
        // 发放白银
        userResourceService.addSilver(odUserId, silverGained);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("meritUsed", meritAmount);
        result.put("silverGained", silverGained);
        result.put("exchangeRate", rate);
        result.put("remainingMerit", currentMerit - meritAmount);
        
        logger.info("军功兑换: {} 使用 {} 军功兑换 {} 白银", odUserId, meritAmount, silverGained);
        
        return result;
    }
    
    /**
     * 获取所有活跃国战
     */
    public List<NationWar> getActiveWars() {
        return warStore.values().stream()
            .filter(w -> w.getStatus() != WarStatus.FINISHED)
            .collect(Collectors.toList());
    }
    
    /**
     * 获取国战历史
     */
    public List<NationWar> getWarHistory(int limit) {
        return warStore.values().stream()
            .filter(w -> w.getStatus() == WarStatus.FINISHED)
            .sorted((a, b) -> Long.compare(b.getCreateTime(), a.getCreateTime()))
            .limit(limit)
            .collect(Collectors.toList());
    }
}
