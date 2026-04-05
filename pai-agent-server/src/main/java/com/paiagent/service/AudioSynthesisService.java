package com.paiagent.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 音频合成服务接口
 */
public interface AudioSynthesisService {

    /**
     * 合成音频结果
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class SynthesisResult {
        private String audioUrl;
        private int inputTokens;
        private int outputTokens;

        public int getTotalTokens() {
            return inputTokens + outputTokens;
        }
    }

    /**
     * 合成音频
     * @param text 文本内容
     * @param voice 音色 (Cherry, Serena, Ethan)
     * @param languageType 语言类型 (Auto)
     * @param model 模型名称
     * @param apiKey API Key
     * @return 音频 URL
     */
    String synthesize(String text, String voice, String languageType, String model, String apiKey);

    /**
     * 合成音频（返回完整结果包含 token 信息）
     * @param text 文本内容
     * @param voice 音色 (Cherry, Serena, Ethan)
     * @param languageType 语言类型 (Auto)
     * @param model 模型名称
     * @param apiKey API Key
     * @return 合成结果
     */
    SynthesisResult synthesizeWithTokens(String text, String voice, String languageType, String model, String apiKey);
}
