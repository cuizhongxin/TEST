package com.miniprogram.controller;

import com.miniprogram.dto.ApiResponse;
import com.miniprogram.service.training.TrainingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

/**
 * 训练控制器
 */
@RestController
@RequestMapping("/training")
public class TrainingController {
    
    private static final Logger logger = LoggerFactory.getLogger(TrainingController.class);
    
    @Autowired
    private TrainingService trainingService;
    
    /**
     * 获取训练配置
     */
    @GetMapping("/config")
    public ApiResponse<Map<String, Object>> getTrainingConfig() {
        logger.info("获取训练配置");
        Map<String, Object> config = trainingService.getTrainingConfig();
        return ApiResponse.success(config);
    }
    
    /**
     * 获取用户粮食数量
     */
    @GetMapping("/food")
    public ApiResponse<Map<String, Object>> getUserFood(HttpServletRequest request) {
        Long userIdLong = (Long) request.getAttribute("userId");
        String userId = userIdLong != null ? String.valueOf(userIdLong) : null;
        
        logger.info("获取用户粮食数量, userId: {}", userId);
        Map<String, Object> food = trainingService.getUserFood(userId);
        return ApiResponse.success(food);
    }
    
    /**
     * 执行训练
     */
    @PostMapping("/train")
    public ApiResponse<Map<String, Object>> train(@RequestBody Map<String, Object> body,
                                                  HttpServletRequest request) {
        Long userIdLong = (Long) request.getAttribute("userId");
        String userId = userIdLong != null ? String.valueOf(userIdLong) : null;
        
        String generalId = (String) body.get("generalId");
        String trainingType = (String) body.get("trainingType");
        String foodGrade = (String) body.get("foodGrade");
        Integer count = body.get("count") != null ? Integer.parseInt(body.get("count").toString()) : 1;
        
        logger.info("执行训练, userId: {}, generalId: {}, type: {}, grade: {}, count: {}",
            userId, generalId, trainingType, foodGrade, count);
        
        Map<String, Object> result = trainingService.train(userId, generalId, trainingType, foodGrade, count);
        return ApiResponse.success(result);
    }
    
    /**
     * 批量训练
     */
    @PostMapping("/train/batch")
    public ApiResponse<Map<String, Object>> trainBatch(@RequestBody Map<String, Object> body,
                                                       HttpServletRequest request) {
        Long userIdLong = (Long) request.getAttribute("userId");
        String userId = userIdLong != null ? String.valueOf(userIdLong) : null;
        
        @SuppressWarnings("unchecked")
        List<String> generalIds = (List<String>) body.get("generalIds");
        String trainingType = (String) body.get("trainingType");
        String foodGrade = (String) body.get("foodGrade");
        Integer countPerGeneral = body.get("countPerGeneral") != null ? 
            Integer.parseInt(body.get("countPerGeneral").toString()) : 1;
        
        logger.info("批量训练, userId: {}, generalIds: {}, type: {}, grade: {}, countPerGeneral: {}",
            userId, generalIds, trainingType, foodGrade, countPerGeneral);
        
        Map<String, Object> result = trainingService.trainBatch(userId, generalIds, trainingType, foodGrade, countPerGeneral);
        return ApiResponse.success(result);
    }
    
    /**
     * 购买粮食
     */
    @PostMapping("/food/buy")
    public ApiResponse<Map<String, Object>> buyFood(@RequestBody Map<String, Object> body,
                                                    HttpServletRequest request) {
        Long userIdLong = (Long) request.getAttribute("userId");
        String userId = userIdLong != null ? String.valueOf(userIdLong) : null;
        
        String foodGrade = (String) body.get("foodGrade");
        Integer count = body.get("count") != null ? Integer.parseInt(body.get("count").toString()) : 1;
        
        logger.info("购买粮食, userId: {}, grade: {}, count: {}", userId, foodGrade, count);
        
        Map<String, Object> result = trainingService.buyFood(userId, foodGrade, count);
        return ApiResponse.success(result);
    }
}
