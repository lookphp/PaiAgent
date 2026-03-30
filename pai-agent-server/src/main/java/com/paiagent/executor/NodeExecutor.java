package com.paiagent.executor;

import java.util.Map;

/**
 * 节点执行器接口
 * 每个节点类型都有对应的执行器实现
 */
public interface NodeExecutor {

    /**
     * 执行节点
     * @param context 执行上下文
     * @param nodeConfig 节点配置
     * @return 执行结果
     */
    NodeExecutionResult execute(ExecutionContext context, Map<String, Object> nodeConfig);

    /**
     * 支持的节点类型
     */
    String getSupportedNodeType();
}
