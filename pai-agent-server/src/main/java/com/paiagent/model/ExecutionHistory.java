package com.paiagent.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * 执行历史记录实体类
 * 存储每次工作流执行的完整信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "execution_history")
public class ExecutionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 工作流ID（可选，如果是快速执行可能为空）
     */
    @Column(name = "workflow_id")
    private Long workflowId;

    /**
     * 工作流名称
     */
    @Column(name = "workflow_name")
    private String workflowName;

    /**
     * 执行输入
     */
    @Column(name = "input_text", columnDefinition = "TEXT")
    private String inputText;

    /**
     * 执行输出
     */
    @Column(name = "output_text", columnDefinition = "TEXT")
    private String outputText;

    /**
     * 音频URL
     */
    @Column(name = "audio_url")
    private String audioUrl;

    /**
     * 执行日志（JSON格式）
     */
    @Column(name = "execution_logs", columnDefinition = "LONGTEXT")
    private String executionLogs;

    /**
     * 总耗时（毫秒）
     */
    @Column(name = "total_duration")
    private Long totalDuration;

    /**
     * 总Token使用量
     */
    @Column(name = "total_tokens")
    private Integer totalTokens;

    /**
     * 输入Token数量
     */
    @Column(name = "input_tokens")
    private Integer inputTokens;

    /**
     * 输出Token数量
     */
    @Column(name = "output_tokens")
    private Integer outputTokens;

    /**
     * 执行状态：success / error
     */
    @Column(name = "status", length = 20)
    private String status;

    /**
     * 错误信息
     */
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /**
     * 执行的节点数量
     */
    @Column(name = "node_count")
    private Integer nodeCount;

    /**
     * 执行时间
     */
    @Column(name = "executed_at")
    private LocalDateTime executedAt;

    @PrePersist
    protected void onCreate() {
        executedAt = LocalDateTime.now();
    }
}
