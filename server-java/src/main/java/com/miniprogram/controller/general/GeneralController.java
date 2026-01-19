package com.miniprogram.controller.general;

import com.miniprogram.dto.ApiResponse;
import com.miniprogram.model.General;
import com.miniprogram.service.general.GeneralService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * 武将控制器
 */
@RestController
@RequestMapping("/general")
public class GeneralController {
    
    private static final Logger logger = LoggerFactory.getLogger(GeneralController.class);
    
    @Autowired
    private GeneralService generalService;
    
    /**
     * 获取用户武将列表
     */
    @GetMapping("/list")
    public ApiResponse<List<General>> getGeneralList(HttpServletRequest request) {
        // 从request attribute获取userId（由拦截器设置）
        Long userIdLong = (Long) request.getAttribute("userId");
        String userId = userIdLong != null ? String.valueOf(userIdLong) : null;
        
        logger.info("获取武将列表, userId: {}", userId);
        
        List<General> generals = generalService.getUserGenerals(userId);
        
        return ApiResponse.success(generals);
    }
    
    /**
     * 获取单个武将详情
     */
    @GetMapping("/{generalId}")
    public ApiResponse<General> getGeneralDetail(@PathVariable String generalId, 
                                                  HttpServletRequest request) {
        Long userIdLong = (Long) request.getAttribute("userId");
        String userId = userIdLong != null ? String.valueOf(userIdLong) : null;
        
        logger.info("获取武将详情, userId: {}, generalId: {}", userId, generalId);
        
        General general = generalService.getGeneralById(generalId);
        
        if (general == null) {
            return ApiResponse.error(404, "武将不存在");
        }
        
        // 验证武将是否属于当前用户
        if (!general.getUserId().equals(userId)) {
            return ApiResponse.error(403, "无权访问该武将");
        }
        
        return ApiResponse.success(general);
    }
    
    /**
     * 初始化用户武将（首次登录）
     */
    @PostMapping("/init")
    public ApiResponse<List<General>> initGenerals(HttpServletRequest request) {
        Long userIdLong = (Long) request.getAttribute("userId");
        String userId = userIdLong != null ? String.valueOf(userIdLong) : null;
        
        logger.info("初始化武将, userId: {}", userId);
        
        List<General> generals = generalService.initUserGenerals(userId);
        
        return ApiResponse.success(generals);
    }
}


