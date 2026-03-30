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
            String toolType = (String) nodeConfig.getOrDefault("toolType", "audio-synthesis");
            String voice = (String) nodeConfig.getOrDefault("voice", "female-1");

            // 获取上一个节点的输出作为输入
            String text = context.getStringVariable("lastOutput");

            if (text == null || text.isEmpty()) {
                return NodeExecutionResult.error("没有可用的输入文本");
            }

            context.addLog("调用音频合成服务，音色：" + voice);

            // 调用音频合成服务
            String audioUrl = audioSynthesisService.synthesize(text, voice);

            context.addLog("音频合成完成：" + audioUrl);

            Map<String, Object> data = new HashMap<>();
            data.put("audioUrl", audioUrl);

            return NodeExecutionResult.success(audioUrl, data);

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
