package com.paiagent.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * 音频合成服务实现 - 阿里百炼 qwen3-tts-flash
 */
@Slf4j
@Service
public class AudioSynthesisServiceImpl implements AudioSynthesisService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 阿里百炼 TTS API 地址
    private static final String DASHSCOPE_TTS_URL = "https://dashscope.aliyuncs.com/api/v1/services/audio/tts";

    @Override
    public String synthesize(String text, String voice, String languageType, String model, String apiKey) {
        log.info("调用阿里百炼 TTS 服务：textLength={}, voice={}, languageType={}, model={}",
                text != null ? text.length() : 0, voice, languageType, model);

        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("API Key 未配置，返回模拟音频 URL");
            return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
        }

        try {
            // 构建请求体
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model != null ? model : "qwen3-tts-flash");

            Map<String, Object> input = new HashMap<>();
            input.put("text", text);
            requestBody.put("input", input);

            Map<String, Object> parameters = new HashMap<>();
            parameters.put("voice", voice != null ? voice : "Cherry");
            if (languageType != null) {
                parameters.put("language_type", languageType);
            }
            requestBody.put("parameters", parameters);

            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.debug("发送 TTS 请求到阿里百炼 API...");
            ResponseEntity<String> response = restTemplate.exchange(
                    DASHSCOPE_TTS_URL,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());

                // 检查是否有错误
                if (responseJson.has("code")) {
                    String errorCode = responseJson.get("code").asText();
                    String errorMessage = responseJson.has("message") ? responseJson.get("message").asText() : "未知错误";
                    log.error("阿里百炼 TTS API 返回错误：code={}, message={}", errorCode, errorMessage);
                    throw new RuntimeException("TTS API 错误：" + errorMessage);
                }

                // 获取音频 URL
                if (responseJson.has("output") && responseJson.get("output").has("audio_url")) {
                    String audioUrl = responseJson.get("output").get("audio_url").asText();
                    log.info("音频合成成功，URL: {}", audioUrl);
                    return audioUrl;
                }

                // 尝试其他可能的响应格式
                if (responseJson.has("data") && responseJson.get("data").has("audio_url")) {
                    String audioUrl = responseJson.get("data").get("audio_url").asText();
                    log.info("音频合成成功，URL: {}", audioUrl);
                    return audioUrl;
                }

                log.error("无法解析阿里百炼 TTS API 响应：{}", response.getBody());
                throw new RuntimeException("无法解析 TTS API 响应");
            }

            throw new RuntimeException("TTS API 请求失败：" + response.getStatusCode());

        } catch (Exception e) {
            log.error("调用阿里百炼 TTS API 失败", e);
            throw new RuntimeException("音频合成失败：" + e.getMessage(), e);
        }
    }
}
