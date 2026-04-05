package com.paiagent.controller;

import com.paiagent.model.ExecutionHistory;
import com.paiagent.service.ExecutionHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 执行历史记录控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/execution-history")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExecutionHistoryController {

    private final ExecutionHistoryService executionHistoryService;

    /**
     * 获取所有执行历史
     */
    @GetMapping
    public ResponseEntity<List<ExecutionHistory>> getAllExecutionHistory() {
        List<ExecutionHistory> histories = executionHistoryService.findAll();
        return ResponseEntity.ok(histories);
    }

    /**
     * 根据ID获取执行历史
     */
    @GetMapping("/{id}")
    public ResponseEntity<ExecutionHistory> getExecutionHistoryById(@PathVariable Long id) {
        ExecutionHistory history = executionHistoryService.findById(id);
        if (history == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(history);
    }

    /**
     * 根据工作流ID获取执行历史
     */
    @GetMapping("/workflow/{workflowId}")
    public ResponseEntity<List<ExecutionHistory>> getExecutionHistoryByWorkflowId(
            @PathVariable Long workflowId) {
        List<ExecutionHistory> histories = executionHistoryService.findByWorkflowId(workflowId);
        return ResponseEntity.ok(histories);
    }

    /**
     * 删除执行历史
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExecutionHistory(@PathVariable Long id) {
        executionHistoryService.deleteById(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 统计工作流执行次数
     */
    @GetMapping("/count/{workflowId}")
    public ResponseEntity<Long> countByWorkflowId(@PathVariable Long workflowId) {
        long count = executionHistoryService.countByWorkflowId(workflowId);
        return ResponseEntity.ok(count);
    }
}
