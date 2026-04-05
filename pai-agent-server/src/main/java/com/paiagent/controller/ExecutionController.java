package com.paiagent.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paiagent.dto.ExecutionRequest;
import com.paiagent.dto.ExecutionResponse;
import com.paiagent.dto.WorkflowDto;
import com.paiagent.executor.ExecutionContext;
import com.paiagent.executor.WorkflowExecutor;
import com.paiagent.model.ExecutionSession;
import com.paiagent.service.ExecutionHistoryService;
import com.paiagent.service.ExecutionSessionService;
import com.paiagent.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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
    private final ExecutionSessionService executionSessionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 开始执行（支持暂停点配置）
     */
    @PostMapping("/start")
    public ResponseEntity<ExecutionResponse> startExecution(@RequestBody ExecutionRequest request) {
        try {
            String nodesJson;
            String edgesJson;
            Long workflowId = request.getWorkflowId();

            if (workflowId != null && workflowId != 0) {
                WorkflowDto workflow = workflowService.findById(workflowId);
                if (workflow == null) {
                    return ResponseEntity.badRequest()
                            .body(ExecutionResponse.error("工作流不存在"));
                }
                nodesJson = objectMapper.writeValueAsString(workflow.getNodes());
                edgesJson = objectMapper.writeValueAsString(workflow.getEdges());
            } else {
                nodesJson = request.getParameters() != null ? (String) request.getParameters().get("nodes") : "[]";
                edgesJson = request.getParameters() != null ? (String) request.getParameters().get("edges") : "[]";
            }

            // 序列化暂停配置
            String suspendConfig = null;
            if (request.getSuspendOnNodeTypes() != null || request.getSuspendOnNodeIds() != null) {
                Map<String, Object> config = new HashMap<>();
                config.put("suspendOnNodeTypes", request.getSuspendOnNodeTypes());
                config.put("suspendOnNodeIds", request.getSuspendOnNodeIds());
                suspendConfig = objectMapper.writeValueAsString(config);
            }

            // 创建执行会话
            ExecutionSession session = executionSessionService.createSession(
                    workflowId != 0 ? workflowId : null,
                    nodesJson, edgesJson, request.getInput(), suspendConfig
            );

            // 执行工作流（增量模式）
            WorkflowExecutor.ExecutionResult result = workflowExecutor.executeWorkflowIncremental(
                    nodesJson, edgesJson, request.getInput(),
                    request.getSuspendOnNodeTypes(), request.getSuspendOnNodeIds(),
                    0, null, null
            );

            // 处理执行结果
            if (result.isSuspended()) {
                // 暂停状态：保存会话
                executionSessionService.suspendSession(
                        session.getId(),
                        result.getNextNodeIndex(),
                        result.getSuspendedNodeId(),
                        result.getSuspendedNodeType(),
                        result.getSuspendedOutput(),
                        result.getContextSnapshot(),
                        objectMapper.writeValueAsString(result.getLogs())
                );

                return ResponseEntity.ok(ExecutionResponse.suspended(
                        session.getId(),
                        result.getSuspendedNodeId(),
                        result.getSuspendedNodeType(),
                        result.getSuspendedOutput(),
                        result.getLogs()
                ));
            }

            // 完成/失败状态
            if (!result.isSuccess()) {
                executionSessionService.failSession(session.getId(), objectMapper.writeValueAsString(result.getLogs()));
                return ResponseEntity.badRequest()
                        .body(ExecutionResponse.error(result.getError(), result.getLogs()));
            }

            executionSessionService.completeSession(session.getId(), objectMapper.writeValueAsString(result.getLogs()));

            // 保存执行历史
            saveExecutionHistory(workflowId != 0 ? workflowId : null, request.getInput(), result);

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
            log.error("开始执行失败", e);
            return ResponseEntity.internalServerError()
                    .body(ExecutionResponse.error(e.getMessage()));
        }
    }

    /**
     * 获取执行状态
     */
    @GetMapping("/{id}/status")
    public ResponseEntity<ExecutionResponse> getExecutionStatus(@PathVariable Long id) {
        try {
            ExecutionSession session = executionSessionService.getSession(id)
                    .orElse(null);

            if (session == null) {
                return ResponseEntity.badRequest()
                        .body(ExecutionResponse.error("执行会话不存在"));
            }

            // 解析日志
            List<?> logs = null;
            if (session.getExecutionLogs() != null) {
                logs = objectMapper.readValue(session.getExecutionLogs(), List.class);
            }

            ExecutionResponse response;
            switch (session.getStatus()) {
                case "SUSPENDED":
                    response = ExecutionResponse.suspended(
                            session.getId(),
                            session.getSuspendedNodeId(),
                            session.getSuspendedNodeType(),
                            session.getSuspendedOutput(),
                            logs
                    );
                    break;
                case "RUNNING":
                    response = ExecutionResponse.running(session.getId(), logs);
                    break;
                case "COMPLETED":
                    response = new ExecutionResponse(true, null, null, logs, null, 0, 0, 0, 0,
                            session.getId(), "COMPLETED", null, null, null);
                    break;
                case "FAILED":
                    response = ExecutionResponse.error("执行失败", logs);
                    response.setExecutionId(session.getId());
                    break;
                case "CANCELLED":
                    response = new ExecutionResponse(false, null, null, logs, "已取消", 0, 0, 0, 0,
                            session.getId(), "CANCELLED", null, null, null);
                    break;
                default:
                    response = ExecutionResponse.error("未知状态: " + session.getStatus());
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("获取执行状态失败", e);
            return ResponseEntity.internalServerError()
                    .body(ExecutionResponse.error(e.getMessage()));
        }
    }

    /**
     * 恢复执行
     */
    @PostMapping("/{id}/resume")
    public ResponseEntity<ExecutionResponse> resumeExecution(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            ExecutionSession session = executionSessionService.getSession(id)
                    .orElse(null);

            if (session == null) {
                return ResponseEntity.badRequest()
                        .body(ExecutionResponse.error("执行会话不存在"));
            }

            if (!"SUSPENDED".equals(session.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(ExecutionResponse.error("执行会话不在暂停状态，无法恢复"));
            }

            // 获取修改后的输出（如果有）
            String modifiedOutput = request.get("modifiedOutput") != null
                    ? (String) request.get("modifiedOutput")
                    : session.getSuspendedOutput();

            // 恢复执行会话状态
            executionSessionService.resumeSession(id, modifiedOutput);

            // 继续执行工作流
            WorkflowExecutor.ExecutionResult result = workflowExecutor.executeWorkflowIncremental(
                    session.getNodesJson(),
                    session.getEdgesJson(),
                    session.getInputText(),
                    null, // 已经过暂停点，不再暂停
                    null,
                    session.getCurrentNodeIndex(),
                    session.getContextSnapshot(),
                    modifiedOutput
            );

            // 处理执行结果
            if (result.isSuspended()) {
                // 再次暂停（可能配置了多个暂停点）
                executionSessionService.suspendSession(
                        session.getId(),
                        result.getNextNodeIndex(),
                        result.getSuspendedNodeId(),
                        result.getSuspendedNodeType(),
                        result.getSuspendedOutput(),
                        result.getContextSnapshot(),
                        objectMapper.writeValueAsString(result.getLogs())
                );

                return ResponseEntity.ok(ExecutionResponse.suspended(
                        session.getId(),
                        result.getSuspendedNodeId(),
                        result.getSuspendedNodeType(),
                        result.getSuspendedOutput(),
                        result.getLogs()
                ));
            }

            if (!result.isSuccess()) {
                executionSessionService.failSession(id, objectMapper.writeValueAsString(result.getLogs()));
                return ResponseEntity.badRequest()
                        .body(ExecutionResponse.error(result.getError(), result.getLogs()));
            }

            executionSessionService.completeSession(id, objectMapper.writeValueAsString(result.getLogs()));

            // 保存执行历史
            saveExecutionHistory(session.getWorkflowId(), session.getInputText(), result);

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
            log.error("恢复执行失败", e);
            return ResponseEntity.internalServerError()
                    .body(ExecutionResponse.error(e.getMessage()));
        }
    }

    /**
     * 取消执行
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ExecutionResponse> cancelExecution(@PathVariable Long id) {
        try {
            ExecutionSession session = executionSessionService.getSession(id)
                    .orElse(null);

            if (session == null) {
                return ResponseEntity.badRequest()
                        .body(ExecutionResponse.error("执行会话不存在"));
            }

            if ("COMPLETED".equals(session.getStatus()) || "CANCELLED".equals(session.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(ExecutionResponse.error("执行会话已结束，无法取消"));
            }

            executionSessionService.cancelSession(id);

            ExecutionResponse response = new ExecutionResponse();
            response.setSuccess(true);
            response.setExecutionId(id);
            response.setStatus("CANCELLED");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("取消执行失败", e);
            return ResponseEntity.internalServerError()
                    .body(ExecutionResponse.error(e.getMessage()));
        }
    }

    /**
     * 执行工作流（同步模式，保持向后兼容）
     */
    @PostMapping
    public ResponseEntity<ExecutionResponse> execute(@RequestBody ExecutionRequest request) {
        try {
            // 如果配置了暂停点，使用增量执行
            if (request.getSuspendOnNodeTypes() != null || request.getSuspendOnNodeIds() != null) {
                return startExecution(request);
            }

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

            if (!result.isSuccess()) {
                return ResponseEntity.badRequest()
                        .body(ExecutionResponse.error(result.getError(), result.getLogs()));
            }

            // 保存执行历史
            saveExecutionHistory(request.getWorkflowId(), request.getInput(), result);

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
            // 如果配置了暂停点，使用增量执行
            if (request.getSuspendOnNodeTypes() != null || request.getSuspendOnNodeIds() != null) {
                request.setWorkflowId(0L); // 快速执行标记
                return startExecution(request);
            }

            String nodesJson = request.getParameters() != null ? (String) request.getParameters().get("nodes") : "[]";
            String edgesJson = request.getParameters() != null ? (String) request.getParameters().get("edges") : "[]";

            WorkflowExecutor.ExecutionResult result = workflowExecutor.executeWorkflow(
                    nodesJson,
                    edgesJson,
                    request.getInput()
            );

            // 保存执行历史（快速执行也记录，但workflowId为null）
            saveExecutionHistory(null, request.getInput(), result);

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

    /**
     * 保存执行历史
     */
    private void saveExecutionHistory(Long workflowId, String input, WorkflowExecutor.ExecutionResult result) {
        try {
            executionHistoryService.saveExecutionHistory(
                    workflowId,
                    input,
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
        }
    }
}