package com.paiagent.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paiagent.dto.WorkflowDto;
import com.paiagent.model.Workflow;
import com.paiagent.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 工作流服务类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<WorkflowDto> findAll() {
        return workflowRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkflowDto findById(Long id) {
        return workflowRepository.findById(id)
                .map(this::toDto)
                .orElse(null);
    }

    @Transactional
    public WorkflowDto create(WorkflowDto dto) {
        Workflow workflow = toEntity(dto);
        workflow.setId(null);
        Workflow saved = workflowRepository.save(workflow);
        return toDto(saved);
    }

    @Transactional
    public WorkflowDto update(Long id, WorkflowDto dto) {
        return workflowRepository.findById(id)
                .map(workflow -> {
                    workflow.setName(dto.getName());
                    workflow.setDescription(dto.getDescription());
                    // 将 Object 类型转换为 String 存储
                    try {
                        if (dto.getNodes() instanceof String) {
                            workflow.setNodes((String) dto.getNodes());
                        } else {
                            workflow.setNodes(objectMapper.writeValueAsString(dto.getNodes()));
                        }
                        if (dto.getEdges() instanceof String) {
                            workflow.setEdges((String) dto.getEdges());
                        } else {
                            workflow.setEdges(objectMapper.writeValueAsString(dto.getEdges()));
                        }
                    } catch (JsonProcessingException e) {
                        log.error("JSON 处理错误：", e);
                    }
                    workflow.setConfig(dto.getConfig());
                    Workflow saved = workflowRepository.save(workflow);
                    return toDto(saved);
                })
                .orElse(null);
    }

    @Transactional
    public void delete(Long id) {
        workflowRepository.deleteById(id);
    }

    private WorkflowDto toDto(Workflow workflow) {
        WorkflowDto dto = new WorkflowDto();
        dto.setId(workflow.getId());
        dto.setName(workflow.getName());
        dto.setDescription(workflow.getDescription());

        // 将 JSON 字符串解析为 Object 返回给前端
        try {
            dto.setNodes(objectMapper.readValue(workflow.getNodes(), Object.class));
            dto.setEdges(objectMapper.readValue(workflow.getEdges(), Object.class));
        } catch (JsonProcessingException e) {
            log.warn("解析工作流节点或边失败，使用空数组", e);
            dto.setNodes("[]");
            dto.setEdges("[]");
        }

        dto.setConfig(workflow.getConfig());
        dto.setCreatedAt(workflow.getCreatedAt());
        dto.setUpdatedAt(workflow.getUpdatedAt());
        return dto;
    }

    private Workflow toEntity(WorkflowDto dto) {
        Workflow workflow = new Workflow();
        workflow.setId(dto.getId());
        workflow.setName(dto.getName());
        workflow.setDescription(dto.getDescription());

        // 将 JSON 数组转换为字符串存储
        try {
            // 处理 nodes - 接收 Object 类型，序列化为 JSON 字符串
            if (dto.getNodes() != null) {
                if (dto.getNodes() instanceof String) {
                    workflow.setNodes((String) dto.getNodes());
                } else {
                    workflow.setNodes(objectMapper.writeValueAsString(dto.getNodes()));
                }
            } else {
                workflow.setNodes("[]");
            }

            // 处理 edges
            if (dto.getEdges() != null) {
                if (dto.getEdges() instanceof String) {
                    workflow.setEdges((String) dto.getEdges());
                } else {
                    workflow.setEdges(objectMapper.writeValueAsString(dto.getEdges()));
                }
            } else {
                workflow.setEdges("[]");
            }
        } catch (JsonProcessingException e) {
            log.error("JSON 处理错误：", e);
            workflow.setNodes("[]");
            workflow.setEdges("[]");
        }

        workflow.setConfig(dto.getConfig());
        return workflow;
    }
}
