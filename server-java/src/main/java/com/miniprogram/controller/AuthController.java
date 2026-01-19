package com.miniprogram.controller;

import com.miniprogram.dto.ApiResponse;
import com.miniprogram.dto.LoginRequest;
import com.miniprogram.dto.LoginResponse;
import com.miniprogram.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 */
@RestController
@RequestMapping("/auth")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private AuthService authService;
    
    /**
     * 微信登录接口
     */
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request) {
        logger.info("收到登录请求: {}", request);
        LoginResponse response = authService.login(request);
        return ApiResponse.success(response);
    }
}


