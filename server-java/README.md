# 微信小程序授权登录后端服务（Java版）

基于 Spring Boot 2.7.18 开发的微信小程序授权登录后端服务。

## 技术栈

- Spring Boot 2.7.18
- JWT (JSON Web Token)
- Fastjson
- Lombok
- Maven

## 快速开始

### 1. 环境要求

- JDK 1.8+
- Maven 3.6+

### 2. 配置文件

编辑 `src/main/resources/application.yml`，配置您的微信小程序信息：

```yaml
wechat:
  miniprogram:
    app-id: 你的小程序AppID
    app-secret: 你的小程序AppSecret
```

### 3. 启动服务

```bash
# 方式1：使用Maven启动
mvn spring-boot:run

# 方式2：打包后启动
mvn clean package
java -jar target/miniprogram-auth-1.0.0.jar
```

服务将在 http://localhost:3000 启动。

### 4. 测试接口

健康检查：
```bash
curl http://localhost:3000/api/health
```

## API 文档

### 健康检查
- **URL**: `/api/health`
- **方法**: GET
- **响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "status": "ok",
    "timestamp": 1234567890,
    "message": "微信小程序后端服务运行正常"
  }
}
```

### 微信登录
- **URL**: `/api/auth/login`
- **方法**: POST
- **请求体**:
```json
{
  "code": "微信登录凭证",
  "nickName": "用户昵称",
  "avatarUrl": "用户头像URL"
}
```
- **响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "JWT token",
    "userInfo": {
      "openId": "用户openId",
      "nickName": "用户昵称",
      "avatarUrl": "用户头像URL"
    }
  }
}
```

## 项目结构

```
server-java/
├── src/main/java/com/miniprogram/
│   ├── MiniProgramAuthApplication.java  # 启动类
│   ├── config/                          # 配置类
│   │   ├── JwtConfig.java
│   │   ├── WebConfig.java
│   │   └── WechatConfig.java
│   ├── controller/                      # 控制器
│   │   ├── AuthController.java
│   │   └── HealthController.java
│   ├── dto/                             # 数据传输对象
│   │   ├── ApiResponse.java
│   │   ├── LoginRequest.java
│   │   ├── LoginResponse.java
│   │   └── WxSessionResponse.java
│   ├── entity/                          # 实体类
│   │   └── User.java
│   ├── exception/                       # 异常处理
│   │   ├── BusinessException.java
│   │   └── GlobalExceptionHandler.java
│   ├── interceptor/                     # 拦截器
│   │   └── AuthInterceptor.java
│   ├── service/                         # 服务层
│   │   └── AuthService.java
│   └── util/                            # 工具类
│       ├── JwtUtil.java
│       └── WechatUtil.java
└── src/main/resources/
    ├── application.yml                  # 主配置文件
    ├── application-dev.yml              # 开发环境配置
    └── application-prod.yml             # 生产环境配置
```

## 常见问题

### 1. 端口冲突
如果 3000 端口被占用，可以修改 `application.yml` 中的端口配置。

### 2. JWT密钥安全
生产环境中请使用更强的密钥，建议至少32个字符。

### 3. 跨域问题
已在 `WebConfig` 中配置了CORS，允许所有来源访问（开发环境）。生产环境请根据需要限制。

## License

MIT


