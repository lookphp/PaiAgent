package com.paiagent.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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

    // 接收 JSON 数组对象，会自动转换为字符串
    @JsonProperty("nodes")
    private Object nodesObject;

    @JsonProperty("edges")
    private Object edgesObject;

    // 兼容直接传字符串的情况
    private String nodes;
    private String edges;
    private String config;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
