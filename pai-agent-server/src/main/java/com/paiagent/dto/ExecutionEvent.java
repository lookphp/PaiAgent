package com.paiagent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 执行事件 DTO
 * 用于 SSE 实时推送节点执行状态
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionEvent {

    /**
     * 事件类型
     */
    private String eventType;

    /**
     * 节点 ID
     */
    private String nodeId;

    /**
     * 节点类型 (input, llm, tool, output)
     */
    private String nodeType;

    /**
     * 节点名称
     */
    private String nodeLabel;

    /**
     * 执行状态 (running, completed, error)
     */
    private String status;

    /**
     * 输出内容
     */
    private String output;

    /**
     * 错误信息
     */
    private String error;

    /**
     * 执行耗时 (毫秒)
     */
    private Long durationMs;

    /**
     * 输入 token 数量
     */
    private Integer inputTokens;

    /**
     * 输出 token 数量
     */
    private Integer outputTokens;

    /**
     * 总 token 数量
     */
    private Integer totalTokens;

    /**
     * 音频 URL
     */
    private String audioUrl;

    /**
     * 最终输出内容
     */
    private String finalOutput;

    /**
     * 总执行耗时
     */
    private Long totalDuration;

    /**
     * 事件时间戳
     */
    private Long timestamp;

    /**
     * 事件类型常量
     */
    public static final String EVENT_NODE_START = "node_start";
    public static final String EVENT_NODE_COMPLETE = "node_complete";
    public static final String EVENT_WORKFLOW_COMPLETE = "workflow_complete";
    public static final String EVENT_WORKFLOW_ERROR = "workflow_error";

    /**
     * 创建节点开始事件
     */
    public static ExecutionEvent nodeStart(String nodeId, String nodeType, String nodeLabel) {
        return ExecutionEvent.builder()
                .eventType(EVENT_NODE_START)
                .nodeId(nodeId)
                .nodeType(nodeType)
                .nodeLabel(nodeLabel)
                .status("running")
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * 创建节点完成事件
     */
    public static ExecutionEvent nodeComplete(String nodeId, String nodeType, String nodeLabel,
                                              String output, Long durationMs,
                                              Integer inputTokens, Integer outputTokens, Integer totalTokens) {
        return ExecutionEvent.builder()
                .eventType(EVENT_NODE_COMPLETE)
                .nodeId(nodeId)
                .nodeType(nodeType)
                .nodeLabel(nodeLabel)
                .status("completed")
                .output(output)
                .durationMs(durationMs)
                .inputTokens(inputTokens)
                .outputTokens(outputTokens)
                .totalTokens(totalTokens)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * 创建工作流完成事件
     */
    public static ExecutionEvent workflowComplete(String output, String audioUrl,
                                                   Long totalDuration, Integer totalTokens,
                                                   Integer totalInputTokens, Integer totalOutputTokens) {
        return ExecutionEvent.builder()
                .eventType(EVENT_WORKFLOW_COMPLETE)
                .status("completed")
                .finalOutput(output)
                .audioUrl(audioUrl)
                .totalDuration(totalDuration)
                .totalTokens(totalTokens)
                .inputTokens(totalInputTokens)
                .outputTokens(totalOutputTokens)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * 创建工作流错误事件
     */
    public static ExecutionEvent workflowError(String error) {
        return ExecutionEvent.builder()
                .eventType(EVENT_WORKFLOW_ERROR)
                .status("error")
                .error(error)
                .timestamp(System.currentTimeMillis())
                .build();
    }
}