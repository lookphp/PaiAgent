package com.paiagent.dto;

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
    private String nodes;
    private String edges;
    private String config;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
