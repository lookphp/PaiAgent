package com.paiagent.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

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
}
