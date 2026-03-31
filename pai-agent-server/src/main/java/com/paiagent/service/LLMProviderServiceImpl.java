package com.paiagent.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * LLM 服务实现
 */
@Slf4j
@Service
public class LLMProviderServiceImpl implements LLMProviderService {

    @Value("${paiagent.ai.qwen.api-url:https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions}")
    private String qwenApiUrl;

    @Value("${paiagent.ai.qwen.api-key:}")
    private String qwenApiKey;

    @Value("${paiagent.ai.deepseek.api-url:https://api.deepseek.com/v1/chat/completions}")
    private String deepseekApiUrl;

    @Value("${paiagent.ai.deepseek.api-key:}")
    private String deepseekApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String invoke(String model, String systemPrompt, String userPrompt) {
        log.info("调用 LLM 服务：model={}, systemPrompt={}", model, userPrompt);

        // 根据 model 选择对应的 API 服务
        if (model != null && model.toLowerCase().contains("deepseek")) {
            return callDeepSeekApi(model, systemPrompt, userPrompt);
        } else if (model != null && model.toLowerCase().contains("qwen")) {
            return callQwenApi(model, systemPrompt, userPrompt);
        } else {
            return callQwenApi(model, systemPrompt, userPrompt);
        }
    }

    /**
     * 调用通义千问 API
     */
    private String callQwenApi(String model, String systemPrompt, String userPrompt) {
        log.info("调用通义千问 API: model={}, url={}", model, qwenApiUrl);

        if (qwenApiKey == null || qwenApiKey.isEmpty()) {
            throw new RuntimeException("通义千问 API Key 未配置");
        }

        try {
            // 构建请求体
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model != null ? model : "qwen-max");

            // 构建消息
            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt != null ? systemPrompt : "你是一个有用的助手");

            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", userPrompt);

            requestBody.put("messages", List.of(systemMessage, userMessage));

            // 构建请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + qwenApiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // 发送请求
            ResponseEntity<String> response = restTemplate.exchange(
                qwenApiUrl,
                HttpMethod.POST,
                entity,
                String.class
            );

            // 解析响应
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            JsonNode choices = rootNode.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                return choices.get(0).path("message").path("content").asText();
            }

            throw new RuntimeException("通义千问 API 返回格式异常：" + response.getBody());

        } catch (Exception e) {
            log.error("调用通义千问 API 失败", e);
            throw new RuntimeException("调用通义千问 API 失败：" + e.getMessage(), e);
        }
    }

    /**
     * 调用 DeepSeek API
     */
    private String callDeepSeekApi(String model, String systemPrompt, String userPrompt) {
        log.info("调用 DeepSeek API: model={}, url={}", model, deepseekApiUrl);

        if (deepseekApiKey == null || deepseekApiKey.isEmpty()) {
            throw new RuntimeException("DeepSeek API Key 未配置");
        }

        try {
            // 构建请求体
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model != null ? model : "deepseek-chat");

            // 构建消息
            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt != null ? systemPrompt : "你是一个有用的助手");

            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", userPrompt);

            requestBody.put("messages", List.of(systemMessage, userMessage));

            // 构建请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + deepseekApiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // 发送请求
            ResponseEntity<String> response = restTemplate.exchange(
                deepseekApiUrl,
                HttpMethod.POST,
                entity,
                String.class
            );

            // 解析响应
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            JsonNode choices = rootNode.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                return choices.get(0).path("message").path("content").asText();
            }

            throw new RuntimeException("DeepSeek API 返回格式异常：" + response.getBody());

        } catch (Exception e) {
            log.error("调用 DeepSeek API 失败", e);
            throw new RuntimeException("调用 DeepSeek API 失败：" + e.getMessage(), e);
        }
    }
}
