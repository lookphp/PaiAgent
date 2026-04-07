package com.paiagent.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 执行请求 DTO
 */
@Data
@NoArgsConstructor
public class ExecutionRequest {

    private Long workflowId;
    private String input;
    private Map<String, Object> parameters;

    /**
     * 在哪些节点类型后暂停（如 ["llm"]）
     */
    private List<String> suspendOnNodeTypes;

    /**
     * 在哪些节点ID后暂停
     */
    private List<String> suspendOnNodeIds;

    /**
     * 从哪个节点开始执行（用于恢复执行）
     */
    private String resumeFromNodeId;

    /**
     * 初始变量（用于恢复执行时传递已完成的变量）
     */
    private Map<String, Object> initialVariables;
}
