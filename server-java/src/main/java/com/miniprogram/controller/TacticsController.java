package com.miniprogram.controller;

import com.miniprogram.config.TacticsConfig;
import com.miniprogram.dto.ApiResponse;
import com.miniprogram.model.Tactics;
import com.miniprogram.service.tactics.TacticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 兵法控制器 - 一个武将只能装备一个兵法/阵法
 */
@RestController
@RequestMapping("/tactics")
public class TacticsController {
    
    private static final Logger logger = LoggerFactory.getLogger(TacticsController.class);
    
    @Autowired
    private TacticsService tacticsService;
    
    @Autowired
    private TacticsConfig tacticsConfig;
    
    /**
     * 获取所有兵法列表
     */
    @GetMapping("/list")
    public ApiResponse<List<Tactics>> getAllTactics(HttpServletRequest request) {
        logger.info("获取所有兵法列表");
        List<Tactics> tactics = tacticsService.getAllTactics();
        return ApiResponse.success(tactics);
    }
    
    /**
     * 根据兵种获取可用兵法
     */
    @GetMapping("/list/{troopType}")
    public ApiResponse<List<Tactics>> getTacticsByTroopType(@PathVariable String troopType,
                                                            HttpServletRequest request) {
        logger.info("获取兵种 {} 可用兵法", troopType);
        List<Tactics> tactics = tacticsService.getTacticsByTroopType(troopType);
        return ApiResponse.success(tactics);
    }
    
    /**
     * 获取兵法详情
     */
    @GetMapping("/{tacticsId}")
    public ApiResponse<Map<String, Object>> getTacticsById(@PathVariable String tacticsId,
                                                           HttpServletRequest request) {
        logger.info("获取兵法详情: {}", tacticsId);
        Tactics tactics = tacticsService.getTacticsById(tacticsId);
        if (tactics == null) {
            return ApiResponse.error(404, "兵法不存在");
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("tactics", tactics);
        result.put("learnCost", tacticsService.getTacticsLearnCost(tacticsId));
        
        return ApiResponse.success(result);
    }
    
    /**
     * 获取武将兵法信息（已学习和装备的）
     */
    @GetMapping("/general/{generalId}")
    public ApiResponse<Map<String, Object>> getGeneralTactics(@PathVariable String generalId,
                                                              HttpServletRequest request) {
        Long userIdLong = (Long) request.getAttribute("userId");
        String userId = userIdLong != null ? String.valueOf(userIdLong) : null;
        
        logger.info("获取武将兵法, userId: {}, generalId: {}", userId, generalId);
        
        List<Tactics> learned = tacticsService.getGeneralLearnedTactics(generalId);
        Tactics equipped = tacticsService.getGeneralEquippedTactics(generalId);
        Map<String, Object> bonus = tacticsService.calculateTacticsBonus(generalId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("learnedTactics", learned);
        result.put("equippedTactics", equipped);  // 只有一个
        result.put("tacticsBonus", bonus);
        
        return ApiResponse.success(result);
    }
    
    /**
     * 学习兵法 - 消耗资源
     */
    @PostMapping("/learn")
    public ApiResponse<Map<String, Object>> learnTactics(@RequestBody Map<String, Object> body,
                                                          HttpServletRequest request) {
        Long userIdLong = (Long) request.getAttribute("userId");
        String userId = userIdLong != null ? String.valueOf(userIdLong) : null;
        String generalId = (String) body.get("generalId");
        String tacticsId = (String) body.get("tacticsId");
        
        logger.info("学习兵法, userId: {}, generalId: {}, tacticsId: {}", userId, generalId, tacticsId);
        
        Map<String, Object> result = tacticsService.learnTactics(userId, generalId, tacticsId);
        return ApiResponse.success(result);
    }
    
    /**
     * 装备兵法（只能装备一个）
     */
    @PostMapping("/equip")
    public ApiResponse<Map<String, Object>> equipTactics(@RequestBody Map<String, Object> body,
                                                          HttpServletRequest request) {
        Long userIdLong = (Long) request.getAttribute("userId");
        String userId = userIdLong != null ? String.valueOf(userIdLong) : null;
        String generalId = (String) body.get("generalId");
        String tacticsId = (String) body.get("tacticsId");
        
        logger.info("装备兵法, userId: {}, generalId: {}, tacticsId: {}", 
                   userId, generalId, tacticsId);
        
        Map<String, Object> result = tacticsService.equipTactics(userId, generalId, tacticsId);
        return ApiResponse.success(result);
    }
    
    /**
     * 卸下兵法
     */
    @PostMapping("/unequip")
    public ApiResponse<Map<String, Object>> unequipTactics(@RequestBody Map<String, Object> body,
                                                            HttpServletRequest request) {
        Long userIdLong = (Long) request.getAttribute("userId");
        String userId = userIdLong != null ? String.valueOf(userIdLong) : null;
        String generalId = (String) body.get("generalId");
        
        logger.info("卸下兵法, userId: {}, generalId: {}", userId, generalId);
        
        Map<String, Object> result = tacticsService.unequipTactics(userId, generalId);
        return ApiResponse.success(result);
    }
    
    /**
     * 获取兵法学习消耗
     */
    @GetMapping("/cost/{tacticsId}")
    public ApiResponse<Map<String, Integer>> getTacticsLearnCost(@PathVariable String tacticsId,
                                                                  HttpServletRequest request) {
        logger.info("获取兵法学习消耗: {}", tacticsId);
        Map<String, Integer> cost = tacticsService.getTacticsLearnCost(tacticsId);
        return ApiResponse.success(cost);
    }
    
    /**
     * 获取兵法类型配置
     */
    @GetMapping("/config/types")
    public ApiResponse<Map<Integer, Tactics.TacticsType>> getTacticsTypes(HttpServletRequest request) {
        logger.info("获取兵法类型配置");
        return ApiResponse.success(tacticsConfig.getAllTacticsTypes());
    }
    
    /**
     * 获取兵法品质配置
     */
    @GetMapping("/config/qualities")
    public ApiResponse<Map<Integer, Tactics.TacticsQuality>> getTacticsQualities(HttpServletRequest request) {
        logger.info("获取兵法品质配置");
        return ApiResponse.success(tacticsConfig.getAllTacticsQualities());
    }
}
