package com.paiagent.service;

/**
 * 音频合成服务接口
 */
public interface AudioSynthesisService {

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
}
