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
}
