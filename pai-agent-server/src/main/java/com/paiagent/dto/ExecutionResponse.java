package com.paiagent.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

/**
 * 执行响应 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionResponse {

    private boolean success;
    private String output;
    private String audioUrl;
    private List<?> logs;
    private String error;
    private long totalDuration;
    private int totalTokens;
    private int totalInputTokens;
    private int totalOutputTokens;

    /**
     * 执行会话ID
     */
    private Long executionId;

    /**
     * 执行状态：RUNNING | SUSPENDED | COMPLETED | FAILED
     */
    private String status;

    /**
     * 暂停节点ID
     */
    private String suspendedNodeId;

    /**
     * 暂停节点类型
     */
    private String suspendedNodeType;

    /**
     * 暂停节点的输出（供编辑）
     */
    private String suspendedOutput;

    public static ExecutionResponse success(String output, String audioUrl, List<?> logs,
                                             long totalDuration, int totalTokens, int totalInputTokens, int totalOutputTokens) {
        return new ExecutionResponse(true, output, audioUrl, logs, null, totalDuration, totalTokens, totalInputTokens, totalOutputTokens, null, "COMPLETED", null, null, null);
    }

    public static ExecutionResponse suspended(Long executionId, String suspendedNodeId, String suspendedNodeType,
                                               String suspendedOutput, List<?> logs) {
        return new ExecutionResponse(true, null, null, logs, null, 0, 0, 0, 0, executionId, "SUSPENDED", suspendedNodeId, suspendedNodeType, suspendedOutput);
    }

    public static ExecutionResponse running(Long executionId, List<?> logs) {
        return new ExecutionResponse(true, null, null, logs, null, 0, 0, 0, 0, executionId, "RUNNING", null, null, null);
    }

    public static ExecutionResponse error(String errorMessage) {
        return new ExecutionResponse(false, null, null, null, errorMessage, 0, 0, 0, 0, null, "FAILED", null, null, null);
    }

    public static ExecutionResponse error(String errorMessage, List<?> logs) {
        return new ExecutionResponse(false, null, null, logs, errorMessage, 0, 0, 0, 0, null, "FAILED", null, null, null);
    }
}
