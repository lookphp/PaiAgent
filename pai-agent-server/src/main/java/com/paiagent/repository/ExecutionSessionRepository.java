package com.paiagent.repository;

import com.paiagent.model.ExecutionSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 执行会话 Repository
 */
@Repository
public interface ExecutionSessionRepository extends JpaRepository<ExecutionSession, Long> {

    /**
     * 根据工作流ID查询执行会话
     */
    List<ExecutionSession> findByWorkflowId(Long workflowId);

    /**
     * 根据状态查询执行会话
     */
    List<ExecutionSession> findByStatus(String status);

    /**
     * 根据工作流ID和状态查询执行会话
     */
    List<ExecutionSession> findByWorkflowIdAndStatus(Long workflowId, String status);
}