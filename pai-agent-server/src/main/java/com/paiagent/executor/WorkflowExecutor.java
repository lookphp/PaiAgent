package com.paiagent.executor;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * 工作流执行引擎
 * 基于 DAG 拓扑排序执行工作流
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
     * 执行工作流
     */
    public ExecutionResult executeWorkflow(String nodesJson, String edgesJson, String input) {
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

            // 执行节点
            ExecutionContext context = ExecutionContext.builder()
                    .input(input)
                    .variables(new HashMap<>())
                    .logs(new ArrayList<>())
                    .build();

            context.addLog("工作流开始执行，共 " + sortedNodes.size() + " 个节点");

            Map<String, NodeExecutionResult> results = new HashMap<>();

            for (String nodeId : sortedNodes) {
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

                // 记录节点执行完成（包含输出）
                context.endStep(nodeType, nodeId, nodeLabel, result.getOutput());

                results.put(nodeId, result);

                if (!result.isSuccess()) {
                    return ExecutionResult.error(result.getError(), context.getLogs());
                }

                // 将结果存储到上下文
                context.setVariable("lastOutput", result.getOutput());
                // 保存节点输出，供后续节点引用
                context.setVariable("node_output_" + nodeId, result.getOutput());
                if (result.getData() != null) {
                    context.getVariables().putAll(result.getData());
                }
            }

            long totalDuration = System.currentTimeMillis() - workflowStartTime;
            context.addLog("工作流执行完成，总耗时: " + totalDuration + "ms");

            return ExecutionResult.success(
                    context.getStringVariable("lastOutput"),
                    (String) context.getVariable("audioUrl"),
                    context.getLogs()
            );

        } catch (Exception e) {
            log.error("工作流执行失败", e);
            return ExecutionResult.error(e.getMessage());
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
     * 执行结果
     */
    @lombok.Data
    @lombok.Builder
    public static class ExecutionResult {
        private boolean success;
        private String output;
        private String audioUrl;
        private List<ExecutionContext.LogEntry> logs;
        private String error;

        public static ExecutionResult success(String output, String audioUrl, List<ExecutionContext.LogEntry> logs) {
            return ExecutionResult.builder()
                    .success(true)
                    .output(output)
                    .audioUrl(audioUrl)
                    .logs(logs)
                    .build();
        }

        public static ExecutionResult error(String error, List<ExecutionContext.LogEntry> logs) {
            return ExecutionResult.builder()
                    .success(false)
                    .error(error)
                    .logs(logs)
                    .build();
        }

        public static ExecutionResult error(String error) {
            return ExecutionResult.builder()
                    .success(false)
                    .error(error)
                    .logs(new ArrayList<>())
                    .build();
        }
    }
}
