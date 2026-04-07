package com.paiagent.executor;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paiagent.dto.ExecutionEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;

/**
 * 工作流执行引擎
 * 基于 DAG 拓扑排序执行工作流
 * 支持增量执行和暂停/恢复机制
 */
@Slf4j
@Component
public class WorkflowExecutor {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final List<NodeExecutor> nodeExecutors;

    public WorkflowExecutor(List<NodeExecutor> nodeExecutors) {
        this.nodeExecutors = nodeExecutors;
    }

    /**
     * 执行工作流（同步模式，不暂停）
     */
    public ExecutionResult executeWorkflow(String nodesJson, String edgesJson, String input) {
        return executeWorkflowIncremental(nodesJson, edgesJson, input, null, null, 0, null, null);
    }

    /**
     * 执行工作流并实时推送 SSE 事件
     *
     * @param nodesJson 节点定义
     * @param edgesJson 边定义
     * @param input 用户输入
     * @param suspendOnNodeTypes 暂停节点类型列表
     * @param suspendOnNodeIds 暂停节点ID列表
     * @param resumeFromNodeId 从哪个节点之后开始执行（用于恢复）
     * @param initialVariables 初始变量（用于恢复时传递已完成的变量）
     * @param emitter SSE emitter，用于推送事件
     */
    public void executeWithEvents(String nodesJson, String edgesJson, String input,
                                   List<String> suspendOnNodeTypes, List<String> suspendOnNodeIds,
                                   String resumeFromNodeId, Map<String, Object> initialVariables,
                                   SseEmitter emitter) {
        long workflowStartTime = System.currentTimeMillis();
        try {
            List<Map<String, Object>> nodes = parseNodes(nodesJson);
            List<Map<String, Object>> edges = parseEdges(edgesJson);

            // 构建执行图
            Map<String, List<String>> adjacencyList = buildAdjacencyList(nodes, edges);
            Map<String, Integer> inDegree = calculateInDegree(nodes, edges);

            // 拓扑排序
            List<String> sortedNodes = topologicalSort(adjacencyList, inDegree, nodes);
            if (sortedNodes == null) {
                sendEvent(emitter, ExecutionEvent.workflowError("工作流存在环路，无法执行"));
                return;
            }

            // 初始化执行上下文
            ExecutionContext context = ExecutionContext.builder()
                    .input(input)
                    .variables(initialVariables != null ? initialVariables : new HashMap<>())
                    .logs(new ArrayList<>())
                    .build();

            // 如果是恢复执行，设置lastOutput
            if (initialVariables != null && initialVariables.containsKey("lastOutput")) {
                context.setVariable("lastOutput", initialVariables.get("lastOutput"));
            }

            Map<String, NodeExecutionResult> results = new HashMap<>();
            int totalInputTokens = 0;
            int totalOutputTokens = 0;

            // 确定开始执行的节点索引
            int startIndex = 0;
            if (resumeFromNodeId != null && !resumeFromNodeId.isEmpty()) {
                // 找到暂停节点的索引，从下一个节点开始执行
                int resumeIndex = sortedNodes.indexOf(resumeFromNodeId);
                if (resumeIndex >= 0 && resumeIndex < sortedNodes.size() - 1) {
                    startIndex = resumeIndex + 1;
                } else if (resumeIndex >= 0) {
                    // 暂停节点是最后一个节点，无需继续执行
                    sendEvent(emitter, ExecutionEvent.workflowComplete(
                            context.getStringVariable("lastOutput"),
                            null,
                            0L, 0, 0, 0
                    ));
                    return;
                }
            }

            // 执行每个节点
            for (int i = startIndex; i < sortedNodes.size(); i++) {
                String nodeId = sortedNodes.get(i);
                Map<String, Object> node = findNodeById(nodes, nodeId);
                if (node == null) {
                    continue;
                }

                String nodeType = (String) node.get("type");
                NodeExecutor executor = findExecutorByNodeType(nodeType);

                if (executor == null) {
                    sendEvent(emitter, ExecutionEvent.workflowError("未找到节点类型 '" + nodeType + "' 的执行器"));
                    return;
                }

                @SuppressWarnings("unchecked")
                Map<String, Object> nodeData = (Map<String, Object>) node.get("data");
                String nodeLabel = nodeData != null ? (String) nodeData.get("label") : nodeType;

                // 推送节点开始事件
                sendEvent(emitter, ExecutionEvent.nodeStart(nodeId, nodeType, nodeLabel));

                // 记录节点开始执行
                long nodeStartTime = System.currentTimeMillis();
                context.startStep(nodeType);

                NodeExecutionResult result = executor.execute(context, nodeData != null ? nodeData : new HashMap<>());

                // 记录节点执行完成
                long nodeDuration = System.currentTimeMillis() - nodeStartTime;
                context.endStep(nodeType, nodeId, nodeLabel, result.getOutput(), result.getInputTokens(), result.getOutputTokens());

                // 推送节点完成事件
                sendEvent(emitter, ExecutionEvent.nodeComplete(
                        nodeId, nodeType, nodeLabel,
                        result.getOutput(), nodeDuration,
                        result.getInputTokens(), result.getOutputTokens(),
                        result.getInputTokens() + result.getOutputTokens()
                ));

                results.put(nodeId, result);

                if (!result.isSuccess()) {
                    sendEvent(emitter, ExecutionEvent.workflowError(result.getError()));
                    return;
                }

                // 将结果存储到上下文
                context.setVariable("lastOutput", result.getOutput());
                context.setVariable("node_output_" + nodeId, result.getOutput());
                if (result.getData() != null) {
                    context.getVariables().putAll(result.getData());
                }

                totalInputTokens += result.getInputTokens();
                totalOutputTokens += result.getOutputTokens();

                // 检查是否需要暂停
                boolean shouldSuspend = shouldSuspend(nodeId, nodeType, suspendOnNodeTypes, suspendOnNodeIds);
                if (shouldSuspend) {
                    context.addLog("节点 " + nodeLabel + " 执行完成，按配置暂停等待用户干预");

                    // 推送暂停事件
                    sendEvent(emitter, ExecutionEvent.builder()
                            .eventType("workflow_suspended")
                            .nodeId(nodeId)
                            .nodeType(nodeType)
                            .nodeLabel(nodeLabel)
                            .status("suspended")
                            .output(result.getOutput())
                            .inputTokens(totalInputTokens)
                            .outputTokens(totalOutputTokens)
                            .totalTokens(totalInputTokens + totalOutputTokens)
                            .timestamp(System.currentTimeMillis())
                            .build());

                    // 暂停状态下结束执行
                    return;
                }
            }

            long totalDuration = System.currentTimeMillis() - workflowStartTime;
            int totalTokens = context.getTotalTokens();
            context.addLog("工作流执行完成，总耗时: " + totalDuration + "ms，总 Token: " + totalTokens);

            // 推送工作流完成事件
            sendEvent(emitter, ExecutionEvent.workflowComplete(
                    context.getStringVariable("lastOutput"),
                    (String) context.getVariable("audioUrl"),
                    totalDuration,
                    totalTokens,
                    totalInputTokens,
                    totalOutputTokens
            ));

        } catch (Exception e) {
            log.error("工作流执行失败", e);
            try {
                sendEvent(emitter, ExecutionEvent.workflowError("执行失败: " + e.getMessage()));
            } catch (Exception sendError) {
                log.error("发送错误事件失败", sendError);
            }
        }
    }

    /**
     * 发送 SSE 事件
     */
    private void sendEvent(SseEmitter emitter, ExecutionEvent event) {
        try {
            emitter.send(SseEmitter.event()
                    .name("message")
                    .data(objectMapper.writeValueAsString(event)));
        } catch (Exception e) {
            log.error("发送 SSE 事件失败", e);
        }
    }

    /**
     * 增量执行工作流（支持暂停和恢复）
     *
     * @param nodesJson 节点定义
     * @param edgesJson 边定义
     * @param input 用户输入
     * @param suspendOnNodeTypes 在哪些节点类型后暂停
     * @param suspendOnNodeIds 在哪些节点ID后暂停
     * @param startFromIndex 从第几个节点开始执行（恢复时使用）
     * @param contextSnapshot 执行上下文快照（恢复时使用）
     * @param modifiedOutput 修改后的输出（恢复时使用，替换暂停节点的输出）
     */
    public ExecutionResult executeWorkflowIncremental(String nodesJson, String edgesJson, String input,
                                                       List<String> suspendOnNodeTypes, List<String> suspendOnNodeIds,
                                                       int startFromIndex, String contextSnapshot, String modifiedOutput) {
        long workflowStartTime = System.currentTimeMillis();
        try {
            List<Map<String, Object>> nodes = parseNodes(nodesJson);
            List<Map<String, Object>> edges = parseEdges(edgesJson);

            // 构建执行图
            Map<String, List<String>> adjacencyList = buildAdjacencyList(nodes, edges);
            Map<String, Integer> inDegree = calculateInDegree(nodes, edges);

            // 拓扑排序
            List<String> sortedNodes = topologicalSort(adjacencyList, inDegree, nodes);
            if (sortedNodes == null) {
                return ExecutionResult.error("工作流存在环路，无法执行");
            }

            // 初始化或恢复执行上下文
            ExecutionContext context;
            if (contextSnapshot != null && startFromIndex > 0) {
                // 恢复执行：加载上下文快照
                context = deserializeContext(contextSnapshot);
                context.addLog("从暂停点恢复执行，继续执行剩余节点");

                // 如果有修改后的输出，替换暂停节点的输出
                if (modifiedOutput != null && startFromIndex > 0) {
                    String prevNodeId = sortedNodes.get(startFromIndex - 1);
                    context.setVariable("lastOutput", modifiedOutput);
                    context.setVariable("node_output_" + prevNodeId, modifiedOutput);
                    context.addLog("用户修改了节点输出，使用修改后的内容继续执行");
                }
            } else {
                // 新执行：创建新上下文
                context = ExecutionContext.builder()
                        .input(input)
                        .variables(new HashMap<>())
                        .logs(new ArrayList<>())
                        .build();
                context.addLog("工作流开始执行，共 " + sortedNodes.size() + " 个节点");
            }

            Map<String, NodeExecutionResult> results = new HashMap<>();

            // 从指定索引开始执行
            for (int i = startFromIndex; i < sortedNodes.size(); i++) {
                String nodeId = sortedNodes.get(i);
                Map<String, Object> node = findNodeById(nodes, nodeId);
                if (node == null) {
                    continue;
                }

                String nodeType = (String) node.get("type");
                NodeExecutor executor = findExecutorByNodeType(nodeType);

                if (executor == null) {
                    return ExecutionResult.error("未找到节点类型 '" + nodeType + "' 的执行器", context.getLogs());
                }

                @SuppressWarnings("unchecked")
                Map<String, Object> nodeData = (Map<String, Object>) node.get("data");
                String nodeLabel = nodeData != null ? (String) nodeData.get("label") : nodeType;

                // 记录节点开始执行
                context.startStep(nodeType);

                NodeExecutionResult result = executor.execute(context, nodeData != null ? nodeData : new HashMap<>());

                // 记录节点执行完成（包含输出和 token 使用量）
                context.endStep(nodeType, nodeId, nodeLabel, result.getOutput(), result.getInputTokens(), result.getOutputTokens());

                results.put(nodeId, result);

                if (!result.isSuccess()) {
                    return ExecutionResult.error(result.getError(), context.getLogs());
                }

                // 将结果存储到上下文
                context.setVariable("lastOutput", result.getOutput());
                context.setVariable("node_output_" + nodeId, result.getOutput());
                if (result.getData() != null) {
                    context.getVariables().putAll(result.getData());
                }

                // 检查是否需要暂停
                boolean shouldSuspend = shouldSuspend(nodeId, nodeType, suspendOnNodeTypes, suspendOnNodeIds);
                if (shouldSuspend) {
                    context.addLog("节点 " + nodeLabel + " 执行完成，按配置暂停等待用户干预");

                    // 返回暂停状态
                    return ExecutionResult.suspended(
                            nodeId,
                            nodeType,
                            result.getOutput(),
                            i + 1,
                            serializeContext(context),
                            context.getLogs()
                    );
                }
            }

            long totalDuration = System.currentTimeMillis() - workflowStartTime;
            int totalTokens = context.getTotalTokens();
            int totalInputTokens = context.getTotalInputTokens();
            int totalOutputTokens = context.getTotalOutputTokens();
            context.addLog("工作流执行完成，总耗时: " + totalDuration + "ms，总 Token: " + totalTokens);

            return ExecutionResult.success(
                    context.getStringVariable("lastOutput"),
                    (String) context.getVariable("audioUrl"),
                    context.getLogs(),
                    totalDuration,
                    totalTokens,
                    totalInputTokens,
                    totalOutputTokens
            );

        } catch (Exception e) {
            log.error("工作流执行失败", e);
            return ExecutionResult.error(e.getMessage());
        }
    }

    /**
     * 判断是否应该暂停
     */
    private boolean shouldSuspend(String nodeId, String nodeType,
                                   List<String> suspendOnNodeTypes, List<String> suspendOnNodeIds) {
        if (suspendOnNodeTypes != null && suspendOnNodeTypes.contains(nodeType)) {
            return true;
        }
        if (suspendOnNodeIds != null && suspendOnNodeIds.contains(nodeId)) {
            return true;
        }
        return false;
    }

    /**
     * 序列化执行上下文
     */
    private String serializeContext(ExecutionContext context) {
        try {
            Map<String, Object> snapshot = new HashMap<>();
            snapshot.put("input", context.getInput());
            snapshot.put("variables", context.getVariables());
            snapshot.put("logs", context.getLogs());
            return objectMapper.writeValueAsString(snapshot);
        } catch (JsonProcessingException e) {
            log.error("序列化执行上下文失败", e);
            return null;
        }
    }

    /**
     * 反序列化执行上下文
     */
    private ExecutionContext deserializeContext(String snapshot) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(snapshot, Map.class);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> logsData = (List<Map<String, Object>>) data.get("logs");
            List<ExecutionContext.LogEntry> logs = new ArrayList<>();
            for (Map<String, Object> logData : logsData) {
                ExecutionContext.LogEntry entry = new ExecutionContext.LogEntry();
                entry.setMessage((String) logData.get("message"));
                entry.setDurationMs(((Number) logData.get("durationMs")).longValue());
                entry.setNodeType((String) logData.get("nodeType"));
                entry.setNodeId((String) logData.get("nodeId"));
                entry.setNodeLabel((String) logData.get("nodeLabel"));
                entry.setOutput((String) logData.get("output"));
                entry.setInputTokens(((Number) logData.getOrDefault("inputTokens", 0)).intValue());
                entry.setOutputTokens(((Number) logData.getOrDefault("outputTokens", 0)).intValue());
                entry.setTotalTokens(((Number) logData.getOrDefault("totalTokens", 0)).intValue());
                logs.add(entry);
            }

            return ExecutionContext.builder()
                    .input((String) data.get("input"))
                    .variables((Map<String, Object>) data.get("variables"))
                    .logs(logs)
                    .build();
        } catch (JsonProcessingException e) {
            log.error("反序列化执行上下文失败", e);
            return ExecutionContext.builder()
                    .input("")
                    .variables(new HashMap<>())
                    .logs(new ArrayList<>())
                    .build();
        }
    }

    private List<Map<String, Object>> parseNodes(String nodesJson) throws JsonProcessingException {
        return objectMapper.readValue(nodesJson, List.class);
    }

    private List<Map<String, Object>> parseEdges(String edgesJson) throws JsonProcessingException {
        return objectMapper.readValue(edgesJson, List.class);
    }

    private Map<String, List<String>> buildAdjacencyList(List<Map<String, Object>> nodes, List<Map<String, Object>> edges) {
        Map<String, List<String>> adj = new HashMap<>();
        for (Map<String, Object> node : nodes) {
            adj.put((String) node.get("id"), new ArrayList<>());
        }
        for (Map<String, Object> edge : edges) {
            String source = (String) edge.get("source");
            String target = (String) edge.get("target");
            adj.computeIfAbsent(source, k -> new ArrayList<>()).add(target);
        }
        return adj;
    }

    private Map<String, Integer> calculateInDegree(List<Map<String, Object>> nodes, List<Map<String, Object>> edges) {
        Map<String, Integer> inDegree = new HashMap<>();
        for (Map<String, Object> node : nodes) {
            inDegree.put((String) node.get("id"), 0);
        }
        for (Map<String, Object> edge : edges) {
            String target = (String) edge.get("target");
            inDegree.put(target, inDegree.get(target) + 1);
        }
        return inDegree;
    }

    private List<String> topologicalSort(Map<String, List<String>> adj, Map<String, Integer> inDegree, List<Map<String, Object>> nodes) {
        List<String> result = new ArrayList<>();
        Queue<String> queue = new LinkedList<>();

        // 找到所有入度为 0 的节点
        for (Map.Entry<String, Integer> entry : inDegree.entrySet()) {
            if (entry.getValue() == 0) {
                queue.offer(entry.getKey());
            }
        }

        while (!queue.isEmpty()) {
            String node = queue.poll();
            result.add(node);

            for (String neighbor : adj.getOrDefault(node, new ArrayList<>())) {
                int newDegree = inDegree.get(neighbor) - 1;
                inDegree.put(neighbor, newDegree);
                if (newDegree == 0) {
                    queue.offer(neighbor);
                }
            }
        }

        // 如果结果中的节点数少于总节点数，说明存在环路
        if (result.size() < nodes.size()) {
            return null;
        }

        return result;
    }

    private Map<String, Object> findNodeById(List<Map<String, Object>> nodes, String id) {
        for (Map<String, Object> node : nodes) {
            if (id.equals(node.get("id"))) {
                return node;
            }
        }
        return null;
    }

    private NodeExecutor findExecutorByNodeType(String nodeType) {
        return nodeExecutors.stream()
                .filter(executor -> executor.getSupportedNodeType().equals(nodeType))
                .findFirst()
                .orElse(null);
    }

    /**
     * 执行结果（支持暂停状态）
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    public static class ExecutionResult {
        private boolean success;
        private String output;
        private String audioUrl;
        private List<ExecutionContext.LogEntry> logs;
        private String error;
        private long totalDuration;
        private int totalTokens;
        private int totalInputTokens;
        private int totalOutputTokens;

        // 暂停相关字段
        private boolean suspended;
        private String suspendedNodeId;
        private String suspendedNodeType;
        private String suspendedOutput;
        private int nextNodeIndex;
        private String contextSnapshot;

        public ExecutionResult(boolean success, String output, String audioUrl, List<ExecutionContext.LogEntry> logs,
                               String error, long totalDuration, int totalTokens, int totalInputTokens, int totalOutputTokens) {
            this.success = success;
            this.output = output;
            this.audioUrl = audioUrl;
            this.logs = logs;
            this.error = error;
            this.totalDuration = totalDuration;
            this.totalTokens = totalTokens;
            this.totalInputTokens = totalInputTokens;
            this.totalOutputTokens = totalOutputTokens;
            this.suspended = false;
        }

        public static ExecutionResult success(String output, String audioUrl, List<ExecutionContext.LogEntry> logs,
                                              long totalDuration, int totalTokens, int totalInputTokens, int totalOutputTokens) {
            return new ExecutionResult(true, output, audioUrl, logs, null, totalDuration, totalTokens, totalInputTokens, totalOutputTokens);
        }

        public static ExecutionResult error(String error, List<ExecutionContext.LogEntry> logs) {
            return new ExecutionResult(false, null, null, logs, error, 0, 0, 0, 0);
        }

        public static ExecutionResult error(String error) {
            return new ExecutionResult(false, null, null, new ArrayList<>(), error, 0, 0, 0, 0);
        }

        public static ExecutionResult suspended(String suspendedNodeId, String suspendedNodeType,
                                                String suspendedOutput, int nextNodeIndex,
                                                String contextSnapshot, List<ExecutionContext.LogEntry> logs) {
            ExecutionResult result = new ExecutionResult();
            result.setSuccess(true);
            result.setSuspended(true);
            result.setSuspendedNodeId(suspendedNodeId);
            result.setSuspendedNodeType(suspendedNodeType);
            result.setSuspendedOutput(suspendedOutput);
            result.setNextNodeIndex(nextNodeIndex);
            result.setContextSnapshot(contextSnapshot);
            result.setLogs(logs);
            return result;
        }
    }
}