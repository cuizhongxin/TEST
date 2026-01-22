package com.miniprogram.controller.campaign;

import com.miniprogram.model.Campaign.*;
import com.miniprogram.service.campaign.CampaignService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 战役控制器
 */
@Slf4j
@RestController
@RequestMapping("/campaign")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    /**
     * 获取战役列表
     */
    @GetMapping("/list")
    public Map<String, Object> getCampaignList(@RequestHeader("X-User-ID") String odUserId) {
        Map<String, Object> result = new HashMap<>();
        try {
            List<Map<String, Object>> campaigns = campaignService.getCampaignList(odUserId);
            result.put("success", true);
            result.put("campaigns", campaigns);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 获取战役详情
     */
    @GetMapping("/detail/{campaignId}")
    public Map<String, Object> getCampaignDetail(
            @RequestHeader("X-User-ID") String odUserId,
            @PathVariable String campaignId) {
        Map<String, Object> result = new HashMap<>();
        try {
            Map<String, Object> detail = campaignService.getCampaignDetail(odUserId, campaignId);
            result.put("success", true);
            result.putAll(detail);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 开始战役
     */
    @PostMapping("/start/{campaignId}")
    public Map<String, Object> startCampaign(
            @RequestHeader("X-User-ID") String odUserId,
            @PathVariable String campaignId) {
        Map<String, Object> result = new HashMap<>();
        try {
            Map<String, Object> status = campaignService.startCampaign(odUserId, campaignId);
            result.put("success", true);
            result.putAll(status);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 获取战役状态
     */
    @GetMapping("/status/{campaignId}")
    public Map<String, Object> getCampaignStatus(
            @RequestHeader("X-User-ID") String odUserId,
            @PathVariable String campaignId) {
        Map<String, Object> result = new HashMap<>();
        try {
            Map<String, Object> status = campaignService.getCampaignStatus(odUserId, campaignId);
            result.put("success", true);
            result.putAll(status);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 进攻当前关卡
     */
    @PostMapping("/attack/{campaignId}")
    public Map<String, Object> attackStage(
            @RequestHeader("X-User-ID") String odUserId,
            @PathVariable String campaignId) {
        Map<String, Object> result = new HashMap<>();
        try {
            BattleResult battleResult = campaignService.attackStage(odUserId, campaignId);
            result.put("success", true);
            result.put("battleResult", battleResult);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 补充兵力
     */
    @PostMapping("/replenish/{campaignId}")
    public Map<String, Object> replenishTroops(
            @RequestHeader("X-User-ID") String odUserId,
            @PathVariable String campaignId,
            @RequestParam(defaultValue = "1000") int amount) {
        Map<String, Object> result = new HashMap<>();
        try {
            Map<String, Object> replenishResult = campaignService.replenishTroops(odUserId, campaignId, amount);
            result.put("success", true);
            result.putAll(replenishResult);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 重生
     */
    @PostMapping("/revive/{campaignId}")
    public Map<String, Object> revive(
            @RequestHeader("X-User-ID") String odUserId,
            @PathVariable String campaignId) {
        Map<String, Object> result = new HashMap<>();
        try {
            Map<String, Object> reviveResult = campaignService.revive(odUserId, campaignId);
            result.put("success", true);
            result.putAll(reviveResult);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 暂停战役
     */
    @PostMapping("/pause/{campaignId}")
    public Map<String, Object> pauseCampaign(
            @RequestHeader("X-User-ID") String odUserId,
            @PathVariable String campaignId) {
        Map<String, Object> result = new HashMap<>();
        try {
            campaignService.pauseCampaign(odUserId, campaignId);
            result.put("success", true);
            result.put("message", "战役已暂停");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 结束战役
     */
    @PostMapping("/end/{campaignId}")
    public Map<String, Object> endCampaign(
            @RequestHeader("X-User-ID") String odUserId,
            @PathVariable String campaignId) {
        Map<String, Object> result = new HashMap<>();
        try {
            campaignService.endCampaign(odUserId, campaignId);
            result.put("success", true);
            result.put("message", "战役已结束");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 扫荡
     */
    @PostMapping("/sweep/{campaignId}")
    public Map<String, Object> sweep(
            @RequestHeader("X-User-ID") String odUserId,
            @PathVariable String campaignId,
            @RequestParam(defaultValue = "20") int targetStage) {
        Map<String, Object> result = new HashMap<>();
        try {
            SweepResult sweepResult = campaignService.sweep(odUserId, campaignId, targetStage);
            result.put("success", true);
            result.put("sweepResult", sweepResult);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }
}
