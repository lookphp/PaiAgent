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

    public static ExecutionResponse success(String output, String audioUrl, List<?> logs,
                                             long totalDuration, int totalTokens, int totalInputTokens, int totalOutputTokens) {
        return new ExecutionResponse(true, output, audioUrl, logs, null, totalDuration, totalTokens, totalInputTokens, totalOutputTokens);
    }

    public static ExecutionResponse error(String errorMessage) {
        return new ExecutionResponse(false, null, null, null, errorMessage, 0, 0, 0, 0);
    }

    public static ExecutionResponse error(String errorMessage, List<?> logs) {
        return new ExecutionResponse(false, null, null, logs, errorMessage, 0, 0, 0, 0);
    }
}
