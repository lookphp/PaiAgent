package com.paiagent.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * 工作流数据传输对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowDto {

    private Long id;
    private String name;
    private String description;

    // 接收 JSON 数组对象，在 Service 层转换为字符串存储
    @JsonProperty("nodes")
    private Object nodes;

    @JsonProperty("edges")
    private Object edges;

    private String config;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 所属用户ID
     */
    private Long userId;
}
