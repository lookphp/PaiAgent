package com.paiagent.executor;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 输入节点执行器
 * 处理用户输入节点
 */
@Component
public class InputNodeExecutor implements NodeExecutor {

    @Override
    public NodeExecutionResult execute(ExecutionContext context, Map<String, Object> nodeConfig) {
        // 输入节点只需将输入存储到上下文中
        String input = context.getInput();
        context.addLog("输入节点执行完成");

        return NodeExecutionResult.success(input);
    }

    @Override
    public String getSupportedNodeType() {
        return "input";
    }
}
