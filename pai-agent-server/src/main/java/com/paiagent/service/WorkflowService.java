package com.paiagent.service;

import com.paiagent.dto.WorkflowDto;
import com.paiagent.model.Workflow;
import com.paiagent.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 工作流服务类
 */
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowRepository workflowRepository;

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
                    workflow.setNodes(dto.getNodes());
                    workflow.setEdges(dto.getEdges());
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
        dto.setNodes(workflow.getNodes());
        dto.setEdges(workflow.getEdges());
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
        workflow.setNodes(dto.getNodes());
        workflow.setEdges(dto.getEdges());
        workflow.setConfig(dto.getConfig());
        return workflow;
    }
}
