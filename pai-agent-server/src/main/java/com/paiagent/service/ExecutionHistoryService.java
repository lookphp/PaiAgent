package com.paiagent.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paiagent.dto.WorkflowDto;
import com.paiagent.model.ExecutionHistory;
import com.paiagent.repository.ExecutionHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 执行历史记录服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExecutionHistoryService {

    private final ExecutionHistoryRepository executionHistoryRepository;
    private final WorkflowService workflowService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 保存执行历史记录
     */
    public ExecutionHistory saveExecutionHistory(
            Long workflowId,
            String inputText,
            String outputText,
            String audioUrl,
            List<Map<String, Object>> executionLogs,
            Long totalDuration,
            Integer totalTokens,
            Integer inputTokens,
            Integer outputTokens,
            boolean success,
            String errorMessage,
            Integer nodeCount) {

        try {
            ExecutionHistory history = new ExecutionHistory();
            history.setWorkflowId(workflowId);

            // 获取工作流名称
            if (workflowId != null) {
                WorkflowDto workflow = workflowService.findById(workflowId);
                if (workflow != null) {
                    history.setWorkflowName(workflow.getName());
                }
            }

            history.setInputText(inputText);
            history.setOutputText(outputText);
            history.setAudioUrl(audioUrl);
            history.setExecutionLogs(objectMapper.writeValueAsString(executionLogs));
            history.setTotalDuration(totalDuration);
            history.setTotalTokens(totalTokens);
            history.setInputTokens(inputTokens);
            history.setOutputTokens(outputTokens);
            history.setStatus(success ? "success" : "error");
            history.setErrorMessage(errorMessage);
            history.setNodeCount(nodeCount);

            ExecutionHistory saved = executionHistoryRepository.save(history);
            log.info("执行历史已保存: id={}, workflowId={}", saved.getId(), workflowId);
            return saved;

        } catch (JsonProcessingException e) {
            log.error("保存执行历史失败：日志序列化错误", e);
            throw new RuntimeException("保存执行历史失败", e);
        }
    }

    /**
     * 根据ID查询执行历史
     */
    public ExecutionHistory findById(Long id) {
        return executionHistoryRepository.findById(id).orElse(null);
    }

    /**
     * 根据工作流ID查询执行历史
     */
    public List<ExecutionHistory> findByWorkflowId(Long workflowId) {
        return executionHistoryRepository.findByWorkflowIdOrderByExecutedAtDesc(workflowId);
    }

    /**
     * 查询所有执行历史
     */
    public List<ExecutionHistory> findAll() {
        return executionHistoryRepository.findAllByOrderByExecutedAtDesc();
    }

    /**
     * 删除执行历史
     */
    public void deleteById(Long id) {
        executionHistoryRepository.deleteById(id);
    }

    /**
     * 统计工作流执行次数
     */
    public long countByWorkflowId(Long workflowId) {
        return executionHistoryRepository.countByWorkflowId(workflowId);
    }
}
