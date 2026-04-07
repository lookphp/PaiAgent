package com.paiagent.controller;

import com.paiagent.dto.WorkflowDto;
import com.paiagent.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

    /**
     * 获取当前用户的用户ID
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        // 从用户详情中获取用户ID（需要在 UserDetails 中存储 userId）
        Object principal = authentication.getPrincipal();
        if (principal instanceof org.springframework.security.core.userdetails.User) {
            String username = ((org.springframework.security.core.userdetails.User) principal).getUsername();
            // 通过 username 获取 userId
            return workflowService.getUserIdByUsername(username);
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<List<WorkflowDto>> list() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(workflowService.findByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkflowDto> get(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        WorkflowDto dto = workflowService.findByIdAndUserId(id, userId);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping(consumes = "application/json", produces = "application/json")
    public ResponseEntity<WorkflowDto> create(@RequestBody WorkflowDto dto) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(workflowService.create(dto, userId));
    }

    @PutMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    public ResponseEntity<WorkflowDto> update(
            @PathVariable Long id,
            @RequestBody WorkflowDto dto) {
        Long userId = getCurrentUserId();
        WorkflowDto updated = workflowService.update(id, dto, userId);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        workflowService.delete(id, userId);
        return ResponseEntity.ok().build();
    }
}
