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
    private List<String> logs;
    private String error;

    public static ExecutionResponse success(String output, String audioUrl, List<String> logs) {
        return new ExecutionResponse(true, output, audioUrl, logs, null);
    }

    public static ExecutionResponse error(String errorMessage) {
        return new ExecutionResponse(false, null, null, null, errorMessage);
    }
}
