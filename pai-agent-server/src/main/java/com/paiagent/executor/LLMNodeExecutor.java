package com.paiagent.executor;

import com.paiagent.service.LLMProviderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 大模型节点执行器
 * 调用 LLM 服务处理文本
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LLMNodeExecutor implements NodeExecutor {

    private final LLMProviderService llmProviderService;

    @Override
    public NodeExecutionResult execute(ExecutionContext context, Map<String, Object> nodeConfig) {
        try {
            String model = (String) nodeConfig.getOrDefault("model", "qwen-max");
            String prompt = (String) nodeConfig.get("prompt");
            String input = context.getStringVariable("input");

            // 从节点配置中获取 API Key 和 API 地址（优先使用节点配置）
            String apiUrl = (String) nodeConfig.get("apiUrl");
            String apiKey = (String) nodeConfig.get("apiKey");

            context.addLog("调用大模型：" + model);

            // 调用 LLM 服务
            String response;
            if (apiUrl != null && !apiUrl.isEmpty() && apiKey != null && !apiKey.isEmpty()) {
                // 使用节点配置的 API 配置
                context.addLog("使用节点配置的 API 地址");
                response = llmProviderService.invoke(model, prompt, input, apiUrl, apiKey);
            } else {
                // 使用全局配置
                context.addLog("使用全局 API 配置");
                response = llmProviderService.invoke(model, prompt, input);
            }

            context.addLog("大模型响应成功");

            return NodeExecutionResult.success(response);

        } catch (Exception e) {
            log.error("LLM 节点执行失败", e);
            context.addLog("LLM 节点执行失败：" + e.getMessage());
            return NodeExecutionResult.error(e.getMessage());
        }
    }

    @Override
    public String getSupportedNodeType() {
        return "llm";
    }
}
