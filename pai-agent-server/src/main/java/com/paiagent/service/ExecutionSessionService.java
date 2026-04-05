package com.paiagent.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paiagent.model.ExecutionSession;
import com.paiagent.repository.ExecutionSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 执行会话服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExecutionSessionService {

    private final ExecutionSessionRepository executionSessionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 创建执行会话
     */
    @Transactional
    public ExecutionSession createSession(Long workflowId, String nodesJson, String edgesJson,
                                           String inputText, String suspendConfig) {
        ExecutionSession session = new ExecutionSession();
        session.setWorkflowId(workflowId);
        session.setNodesJson(nodesJson);
        session.setEdgesJson(edgesJson);
        session.setInputText(inputText);
        session.setSuspendConfig(suspendConfig);
        session.setStatus("RUNNING");
        session.setCurrentNodeIndex(0);
        return executionSessionRepository.save(session);
    }

    /**
     * 获取执行会话
     */
    public Optional<ExecutionSession> getSession(Long id) {
        return executionSessionRepository.findById(id);
    }

    /**
     * 更新执行会话状态
     */
    @Transactional
    public ExecutionSession updateStatus(Long id, String status) {
        ExecutionSession session = executionSessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("执行会话不存在: " + id));
        session.setStatus(status);
        return executionSessionRepository.save(session);
    }

    /**
     * 暂停执行会话
     */
    @Transactional
    public ExecutionSession suspendSession(Long id, Integer currentNodeIndex, String suspendedNodeId,
                                            String suspendedNodeType, String suspendedOutput,
                                            String contextSnapshot, String executionLogs) {
        ExecutionSession session = executionSessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("执行会话不存在: " + id));
        session.setStatus("SUSPENDED");
        session.setCurrentNodeIndex(currentNodeIndex);
        session.setSuspendedNodeId(suspendedNodeId);
        session.setSuspendedNodeType(suspendedNodeType);
        session.setSuspendedOutput(suspendedOutput);
        session.setContextSnapshot(contextSnapshot);
        session.setExecutionLogs(executionLogs);
        return executionSessionRepository.save(session);
    }

    /**
     * 恢复执行会话
     */
    @Transactional
    public ExecutionSession resumeSession(Long id, String modifiedOutput) {
        ExecutionSession session = executionSessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("执行会话不存在: " + id));
        session.setStatus("RUNNING");
        session.setSuspendedOutput(modifiedOutput);
        return executionSessionRepository.save(session);
    }

    /**
     * 完成执行会话
     */
    @Transactional
    public ExecutionSession completeSession(Long id, String executionLogs) {
        ExecutionSession session = executionSessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("执行会话不存在: " + id));
        session.setStatus("COMPLETED");
        session.setExecutionLogs(executionLogs);
        return executionSessionRepository.save(session);
    }

    /**
     * 失败执行会话
     */
    @Transactional
    public ExecutionSession failSession(Long id, String executionLogs) {
        ExecutionSession session = executionSessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("执行会话不存在: " + id));
        session.setStatus("FAILED");
        session.setExecutionLogs(executionLogs);
        return executionSessionRepository.save(session);
    }

    /**
     * 取消执行会话
     */
    @Transactional
    public ExecutionSession cancelSession(Long id) {
        ExecutionSession session = executionSessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("执行会话不存在: " + id));
        session.setStatus("CANCELLED");
        return executionSessionRepository.save(session);
    }

    /**
     * 根据工作流ID查询执行会话
     */
    public List<ExecutionSession> findByWorkflowId(Long workflowId) {
        return executionSessionRepository.findByWorkflowId(workflowId);
    }

    /**
     * 查询所有运行中的执行会话
     */
    public List<ExecutionSession> findRunningSessions() {
        return executionSessionRepository.findByStatus("RUNNING");
    }

    /**
     * 查询所有暂停的执行会话
     */
    public List<ExecutionSession> findSuspendedSessions() {
        return executionSessionRepository.findByStatus("SUSPENDED");
    }

    /**
     * 删除执行会话
     */
    @Transactional
    public void deleteSession(Long id) {
        executionSessionRepository.deleteById(id);
    }
}