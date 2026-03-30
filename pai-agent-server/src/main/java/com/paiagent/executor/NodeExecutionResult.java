package com.paiagent.executor;

import lombok.Builder;
import lombok.Data;

/**
 * 节点执行结果
 */
@Data
@Builder
public class NodeExecutionResult {

    /**
     * 是否成功
     */
    private boolean success;

    /**
     * 输出结果
     */
    private String output;

    /**
     * 错误信息
     */
    private String error;

    /**
     * 额外数据（如音频 URL 等）
     */
    private java.util.Map<String, Object> data;

    public static NodeExecutionResult success(String output) {
        return NodeExecutionResult.builder()
                .success(true)
                .output(output)
                .build();
    }

    public static NodeExecutionResult success(String output, java.util.Map<String, Object> data) {
        return NodeExecutionResult.builder()
                .success(true)
                .output(output)
                .data(data)
                .build();
    }

    public static NodeExecutionResult error(String error) {
        return NodeExecutionResult.builder()
                .success(false)
                .error(error)
                .build();
    }
}
