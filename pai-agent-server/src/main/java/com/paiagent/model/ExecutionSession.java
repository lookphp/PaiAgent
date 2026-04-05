package com.paiagent.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * 执行会话实体类
 * 保存工作流执行的中间状态，支持暂停后恢复
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "execution_session")
public class ExecutionSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 工作流ID（可选，如果是快速执行可能为空）
     */
    @Column(name = "workflow_id")
    private Long workflowId;

    /**
     * 节点定义（JSON格式）
     */
    @Column(name = "nodes_json", columnDefinition = "LONGTEXT")
    private String nodesJson;

    /**
     * 边定义（JSON格式）
     */
    @Column(name = "edges_json", columnDefinition = "LONGTEXT")
    private String edgesJson;

    /**
     * 用户输入
     */
    @Column(name = "input_text", columnDefinition = "TEXT")
    private String inputText;

    /**
     * 执行状态：RUNNING | SUSPENDED | COMPLETED | FAILED | CANCELLED
     */
    @Column(name = "status", length = 20)
    private String status;

    /**
     * 当前执行到第几个节点（索引）
     */
    @Column(name = "current_node_index")
    private Integer currentNodeIndex;

    /**
     * 暂停节点ID
     */
    @Column(name = "suspended_node_id")
    private String suspendedNodeId;

    /**
     * 暂停节点类型
     */
    @Column(name = "suspended_node_type")
    private String suspendedNodeType;

    /**
     * 暂停节点的输出（用户可编辑）
     */
    @Column(name = "suspended_output", columnDefinition = "LONGTEXT")
    private String suspendedOutput;

    /**
     * ExecutionContext 快照（JSON格式）
     */
    @Column(name = "context_snapshot", columnDefinition = "LONGTEXT")
    private String contextSnapshot;

    /**
     * 已执行的日志（JSON格式）
     */
    @Column(name = "execution_logs", columnDefinition = "LONGTEXT")
    private String executionLogs;

    /**
     * 暂停配置（JSON格式）- 在哪些节点类型后暂停
     */
    @Column(name = "suspend_config", columnDefinition = "TEXT")
    private String suspendConfig;

    /**
     * 创建时间
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "RUNNING";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}