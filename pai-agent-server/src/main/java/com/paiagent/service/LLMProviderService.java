package com.paiagent.service;

/**
 * LLM 服务接口
 */
public interface LLMProviderService {

    /**
     * 调用大模型
     * @param model 模型名称
     * @param systemPrompt 系统提示词
     * @param userPrompt 用户输入
     * @return 模型响应
     */
    String invoke(String model, String systemPrompt, String userPrompt);

    /**
     * 调用大模型（支持自定义 API 配置）
     * @param model 模型名称
     * @param systemPrompt 系统提示词
     * @param userPrompt 用户输入
     * @param apiUrl API 地址
     * @param apiKey API 密钥
     * @return 模型响应
     */
    String invoke(String model, String systemPrompt, String userPrompt, String apiUrl, String apiKey);
}
