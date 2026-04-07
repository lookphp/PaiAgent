package com.paiagent.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paiagent.dto.ExecutionRequest;
import com.paiagent.executor.WorkflowExecutor;
import com.paiagent.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 执行事件控制器
 * 提供 SSE 实时推送节点执行状态
 */
@Slf4j
@RestController
@RequestMapping("/api/execution")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExecutionEventController {

    private final WorkflowExecutor workflowExecutor;
    private final WorkflowService workflowService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    /**
     * SSE 实时执行工作流
     *
     * @param request 执行请求
     * @return SseEmitter 实时推送事件
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter executeStream(@RequestBody ExecutionRequest request) {
        log.info("开始 SSE 实时执行工作流，workflowId={}", request.getWorkflowId());

        // 创建 SSE emitter，超时 5 分钟
        SseEmitter emitter = new SseEmitter(300_000L);

        // 设置超时和错误回调
        emitter.onTimeout(() -> {
            log.warn("SSE 连接超时");
            emitter.complete();
        });
        emitter.onError(e -> {
            log.error("SSE 连接错误", e);
            emitter.completeWithError(e);
        });

        // 异步执行工作流，手动传递 SecurityContext
        final Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        Runnable task = () -> {
            try {
                // 在异步线程中设置认证上下文
                if (authentication != null) {
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }

                String nodesJson;
                String edgesJson;

                if (request.getWorkflowId() != null && request.getWorkflowId() != 0) {
                    // 从数据库加载工作流
                    var workflow = workflowService.findById(request.getWorkflowId());
                    if (workflow == null) {
                        sendEvent(emitter, com.paiagent.dto.ExecutionEvent.workflowError("工作流不存在"));
                        emitter.complete();
                        return;
                    }
                    nodesJson = objectMapper.writeValueAsString(workflow.getNodes());
                    edgesJson = objectMapper.writeValueAsString(workflow.getEdges());
                } else {
                    // 使用传入的节点和边
                    if (request.getParameters() != null) {
                        Object nodesObj = request.getParameters().get("nodes");
                        Object edgesObj = request.getParameters().get("edges");
                        // 将数组对象转换为 JSON 字符串
                        nodesJson = nodesObj instanceof String
                                ? (String) nodesObj
                                : objectMapper.writeValueAsString(nodesObj);
                        edgesJson = edgesObj instanceof String
                                ? (String) edgesObj
                                : objectMapper.writeValueAsString(edgesObj);
                    } else {
                        nodesJson = "[]";
                        edgesJson = "[]";
                    }
                }

                // 执行工作流，推送事件（传递暂停配置和恢复参数）
                workflowExecutor.executeWithEvents(
                        nodesJson, edgesJson, request.getInput(),
                        request.getSuspendOnNodeTypes(), request.getSuspendOnNodeIds(),
                        request.getResumeFromNodeId(), request.getInitialVariables(),
                        emitter
                );

                // 完成 SSE 连接
                emitter.complete();

            } catch (JsonProcessingException e) {
                log.error("JSON 处理失败", e);
                try {
                    sendEvent(emitter, com.paiagent.dto.ExecutionEvent.workflowError("JSON 处理失败: " + e.getMessage()));
                    emitter.completeWithError(e);
                } catch (IOException ignored) {
                }
            } catch (Exception e) {
                log.error("工作流执行失败", e);
                try {
                    sendEvent(emitter, com.paiagent.dto.ExecutionEvent.workflowError("执行失败: " + e.getMessage()));
                    emitter.completeWithError(e);
                } catch (IOException ignored) {
                }
            } finally {
                // 清除异步线程的 SecurityContext
                SecurityContextHolder.clearContext();
            }
        };

        executorService.execute(task);

        return emitter;
    }

    /**
     * 发送 SSE 事件
     */
    private void sendEvent(SseEmitter emitter, com.paiagent.dto.ExecutionEvent event) throws IOException {
        emitter.send(SseEmitter.event()
                .name("message")
                .data(objectMapper.writeValueAsString(event)));
    }
}