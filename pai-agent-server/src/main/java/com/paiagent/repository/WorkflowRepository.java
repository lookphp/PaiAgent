package com.paiagent.repository;

import com.paiagent.model.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, Long> {
    List<Workflow> findAllByOrderByUpdatedAtDesc();

    /**
     * 根据用户ID查询工作流列表
     */
    List<Workflow> findByUserIdOrderByUpdatedAtDesc(Long userId);

    /**
     * 根据ID和用户ID查询工作流
     */
    Optional<Workflow> findByIdAndUserId(Long id, Long userId);
}
