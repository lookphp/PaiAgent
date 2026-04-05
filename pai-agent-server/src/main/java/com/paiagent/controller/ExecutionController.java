package com.paiagent.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paiagent.dto.ExecutionRequest;
import com.paiagent.dto.ExecutionResponse;
import com.paiagent.dto.WorkflowDto;
import com.paiagent.executor.WorkflowExecutor;
import com.paiagent.model.ExecutionHistory;
import com.paiagent.service.ExecutionHistoryService;
import com.paiagent.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 执行控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/execution")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExecutionController {

    private final WorkflowService workflowService;
    private final WorkflowExecutor workflowExecutor;
    private final ExecutionHistoryService executionHistoryService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 执行工作流
     */
    @PostMapping
    public ResponseEntity<ExecutionResponse> execute(@RequestBody ExecutionRequest request) {
        try {
            // 获取工作流
            WorkflowDto workflow = workflowService.findById(request.getWorkflowId());
            if (workflow == null) {
                return ResponseEntity.badRequest()
                        .body(ExecutionResponse.error("工作流不存在"));
            }

            // 执行工作流
            WorkflowExecutor.ExecutionResult result = workflowExecutor.executeWorkflow(
                    objectMapper.writeValueAsString(workflow.getNodes()),
                    objectMapper.writeValueAsString(workflow.getEdges()),
                    request.getInput()
            );

            // 保存执行历史
            try {
                executionHistoryService.saveExecutionHistory(
                        request.getWorkflowId(),
                        request.getInput(),
                        result.getOutput(),
                        result.getAudioUrl(),
                        (List<Map<String, Object>>) (List<?>) result.getLogs(),
                        result.getTotalDuration(),
                        result.getTotalTokens(),
                        result.getTotalInputTokens(),
                        result.getTotalOutputTokens(),
                        result.isSuccess(),
                        result.getError(),
                        result.getLogs() != null ? result.getLogs().size() : 0
                );
            } catch (Exception e) {
                log.error("保存执行历史失败", e);
                // 不影响返回结果
            }

            if (!result.isSuccess()) {
                return ResponseEntity.badRequest()
                        .body(ExecutionResponse.error(result.getError(), result.getLogs()));
            }

            return ResponseEntity.ok(ExecutionResponse.success(
                    result.getOutput(),
                    result.getAudioUrl(),
                    result.getLogs(),
                    result.getTotalDuration(),
                    result.getTotalTokens(),
                    result.getTotalInputTokens(),
                    result.getTotalOutputTokens()
            ));

        } catch (JsonProcessingException e) {
            log.error("JSON 处理失败", e);
            return ResponseEntity.internalServerError()
                    .body(ExecutionResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ExecutionResponse.error(e.getMessage()));
        }
    }

    /**
     * 快速执行（用于调试，不需要保存工作流）
     */
    @PostMapping("/quick")
    public ResponseEntity<ExecutionResponse> quickExecute(@RequestBody ExecutionRequest request) {
        try {
            String nodesJson = request.getParameters() != null ? (String) request.getParameters().get("nodes") : "[]";
            String edgesJson = request.getParameters() != null ? (String) request.getParameters().get("edges") : "[]";

            WorkflowExecutor.ExecutionResult result = workflowExecutor.executeWorkflow(
                    nodesJson,
                    edgesJson,
                    request.getInput()
            );

            // 保存执行历史（快速执行也记录，但workflowId为null）
            try {
                executionHistoryService.saveExecutionHistory(
                        null,
                        request.getInput(),
                        result.getOutput(),
                        result.getAudioUrl(),
                        (List<Map<String, Object>>) (List<?>) result.getLogs(),
                        result.getTotalDuration(),
                        result.getTotalTokens(),
                        result.getTotalInputTokens(),
                        result.getTotalOutputTokens(),
                        result.isSuccess(),
                        result.getError(),
                        result.getLogs() != null ? result.getLogs().size() : 0
                );
            } catch (Exception e) {
                log.error("保存执行历史失败", e);
                // 不影响返回结果
            }

            if (!result.isSuccess()) {
                return ResponseEntity.badRequest()
                        .body(ExecutionResponse.error(result.getError(), result.getLogs()));
            }

            return ResponseEntity.ok(ExecutionResponse.success(
                    result.getOutput(),
                    result.getAudioUrl(),
                    result.getLogs(),
                    result.getTotalDuration(),
                    result.getTotalTokens(),
                    result.getTotalInputTokens(),
                    result.getTotalOutputTokens()
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ExecutionResponse.error(e.getMessage()));
        }
    }
}
