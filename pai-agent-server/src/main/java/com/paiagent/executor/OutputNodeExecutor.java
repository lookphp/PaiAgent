package com.paiagent.executor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 输出节点执行器
 * 处理工作流输出
 */
@Slf4j
@Component
public class OutputNodeExecutor implements NodeExecutor {

    @Override
    public NodeExecutionResult execute(ExecutionContext context, Map<String, Object> nodeConfig) {
        try {
            // 获取上一个节点的输出
            String output = context.getStringVariable("lastOutput");

            if (output == null) {
                return NodeExecutionResult.error("没有可用的输出内容");
            }

            context.addLog("输出节点执行完成");

            return NodeExecutionResult.success(output);

        } catch (Exception e) {
            log.error("输出节点执行失败", e);
            context.addLog("输出节点执行失败：" + e.getMessage());
            return NodeExecutionResult.error(e.getMessage());
        }
    }

    @Override
    public String getSupportedNodeType() {
        return "output";
    }
}
