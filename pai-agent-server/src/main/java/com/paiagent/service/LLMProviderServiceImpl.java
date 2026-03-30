package com.paiagent.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * LLM 服务实现
 * 目前为模拟实现，实际使用时需要接入真实的 AI API
 */
@Slf4j
@Service
public class LLMProviderServiceImpl implements LLMProviderService {

    @Value("${paiagent.ai.qwen.api-key:}")
    private String qwenApiKey;

    @Value("${paiagent.ai.deepseek.api-key:}")
    private String deepseekApiKey;

    @Override
    public String invoke(String model, String systemPrompt, String userPrompt) {
        log.info("调用 LLM 服务：model={}, systemPrompt={}", model, systemPrompt);

        // TODO: 根据 model 选择对应的 API 服务
        // 目前为模拟响应
        try {
            // 模拟 API 调用延迟
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // 返回模拟响应
        return "这是一个模拟的 AI 响应。在实际部署中，我将调用 " + model + " API 来处理您的请求：" + userPrompt;
    }

    /**
     * 调用通义千问 API
     */
    private String callQwenApi(String model, String systemPrompt, String userPrompt) {
        // TODO: 实现真实的通义千问 API 调用
        // 参考：https://help.aliyun.com/zh/dashscope/
        return null;
    }

    /**
     * 调用 DeepSeek API
     */
    private String callDeepSeekApi(String model, String systemPrompt, String userPrompt) {
        // TODO: 实现真实的 DeepSeek API 调用
        // 参考：https://platform.deepseek.com/api-docs/
        return null;
    }
}
