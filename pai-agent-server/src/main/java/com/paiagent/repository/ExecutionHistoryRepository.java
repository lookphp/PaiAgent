package com.paiagent.repository;

import com.paiagent.model.ExecutionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 执行历史记录仓库
 */
@Repository
public interface ExecutionHistoryRepository extends JpaRepository<ExecutionHistory, Long> {

    /**
     * 根据工作流ID查询执行历史，按时间倒序
     */
    List<ExecutionHistory> findByWorkflowIdOrderByExecutedAtDesc(Long workflowId);

    /**
     * 查询所有执行历史，按时间倒序
     */
    List<ExecutionHistory> findAllByOrderByExecutedAtDesc();

    /**
     * 根据状态查询执行历史
     */
    List<ExecutionHistory> findByStatusOrderByExecutedAtDesc(String status);

    /**
     * 查询时间范围内的执行历史
     */
    @Query("SELECT e FROM ExecutionHistory e WHERE e.executedAt BETWEEN :startTime AND :endTime ORDER BY e.executedAt DESC")
    List<ExecutionHistory> findByTimeRange(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * 根据工作流ID和时间范围查询
     */
    @Query("SELECT e FROM ExecutionHistory e WHERE e.workflowId = :workflowId AND e.executedAt BETWEEN :startTime AND :endTime ORDER BY e.executedAt DESC")
    List<ExecutionHistory> findByWorkflowIdAndTimeRange(@Param("workflowId") Long workflowId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * 统计工作流执行次数
     */
    long countByWorkflowId(Long workflowId);

    /**
     * 统计成功/失败次数
     */
    long countByStatus(String status);
}
