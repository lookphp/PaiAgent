package com.paiagent.executor;

import com.paiagent.service.AudioSynthesisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * 工具节点执行器 - 超拟人音频合成
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AudioSynthesisNodeExecutor implements NodeExecutor {

    private final AudioSynthesisService audioSynthesisService;

    @Override
    public NodeExecutionResult execute(ExecutionContext context, Map<String, Object> nodeConfig) {
        try {
            // 获取基础配置
            String apiKey = (String) nodeConfig.get("apiKey");
            String model = (String) nodeConfig.getOrDefault("model", "qwen3-tts-flash");

            log.info("AudioSynthesisNodeExecutor - nodeConfig keys: {}", nodeConfig.keySet());
            log.info("AudioSynthesisNodeExecutor - apiKey present: {}, model: {}",
                    apiKey != null && !apiKey.isEmpty(), model);

            // 获取输入参数配置
            @SuppressWarnings("unchecked")
            Map<String, Object> toolInputConfig = (Map<String, Object>) nodeConfig.get("toolInputConfig");

            log.info("AudioSynthesisNodeExecutor - toolInputConfig: {}", toolInputConfig);

            String text = null;
            String voice = "Cherry";
            String languageType = "Auto";

            if (toolInputConfig != null) {
                // 获取文本输入
                String textType = (String) toolInputConfig.getOrDefault("textType", "reference");
                if ("input".equals(textType)) {
                    // 直接输入模式
                    text = (String) toolInputConfig.get("textValue");
                } else {
                    // 引用节点模式
                    String referenceNodeId = (String) toolInputConfig.get("textReferenceNode");
                    if (referenceNodeId != null && !referenceNodeId.isEmpty()) {
                        // 尝试从上下文获取引用节点的输出
                        String refKey = "node_output_" + referenceNodeId;
                        text = context.getStringVariable(refKey);
                        if (text == null) {
                            // 兜底：使用 lastOutput
                            text = context.getStringVariable("lastOutput");
                        }
                    } else {
                        // 没有指定引用节点，使用 lastOutput
                        text = context.getStringVariable("lastOutput");
                    }
                }

                voice = (String) toolInputConfig.getOrDefault("voice", "Cherry");
                languageType = (String) toolInputConfig.getOrDefault("languageType", "Auto");
            } else {
                // 兼容旧配置：从上下文获取上一个节点的输出
                text = context.getStringVariable("lastOutput");
            }

            if (text == null || text.isEmpty()) {
                return NodeExecutionResult.error("没有可用的输入文本");
            }

            context.addLog("调用音频合成服务，模型：" + model + "，音色：" + voice);

            // 调用音频合成服务（带 token 信息）
            AudioSynthesisService.SynthesisResult synthesisResult =
                    audioSynthesisService.synthesizeWithTokens(text, voice, languageType, model, apiKey);

            String audioUrl = synthesisResult.getAudioUrl();
            int inputTokens = synthesisResult.getInputTokens();
            int outputTokens = synthesisResult.getOutputTokens();

            context.addLog("音频合成完成：" + audioUrl);
            if (inputTokens > 0 || outputTokens > 0) {
                context.addLog("Token 消耗 - 输入: " + inputTokens + ", 输出: " + outputTokens);
            }

            // 获取输出参数配置
            @SuppressWarnings("unchecked")
            Map<String, Object> toolOutputConfig = (Map<String, Object>) nodeConfig.get("toolOutputConfig");
            String voiceUrlVar = "voice_url";
            if (toolOutputConfig != null && toolOutputConfig.get("voiceUrl") != null) {
                voiceUrlVar = (String) toolOutputConfig.get("voiceUrl");
            }

            Map<String, Object> data = new HashMap<>();
            data.put("audioUrl", audioUrl);
            data.put(voiceUrlVar, audioUrl);
            data.put("voice_url", audioUrl);

            return NodeExecutionResult.success(audioUrl, data, inputTokens, outputTokens);

        } catch (Exception e) {
            log.error("音频合成节点执行失败", e);
            context.addLog("音频合成节点执行失败：" + e.getMessage());
            return NodeExecutionResult.error(e.getMessage());
        }
    }

    @Override
    public String getSupportedNodeType() {
        return "tool";
    }
}