package com.paiagent.controller;

import com.paiagent.dto.WorkflowDto;
import com.paiagent.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 工作流控制器
 */
@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkflowController {

    private final WorkflowService workflowService;

    @GetMapping
    public ResponseEntity<List<WorkflowDto>> list() {
        return ResponseEntity.ok(workflowService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkflowDto> get(@PathVariable Long id) {
        WorkflowDto dto = workflowService.findById(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping(consumes = "application/json", produces = "application/json")
    public ResponseEntity<WorkflowDto> create(@RequestBody WorkflowDto dto) {
        return ResponseEntity.ok(workflowService.create(dto));
    }

    @PutMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    public ResponseEntity<WorkflowDto> update(
            @PathVariable Long id,
            @RequestBody WorkflowDto dto) {
        WorkflowDto updated = workflowService.update(id, dto);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        workflowService.delete(id);
        return ResponseEntity.ok().build();
    }
}
