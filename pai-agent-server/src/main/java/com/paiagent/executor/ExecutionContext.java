package com.paiagent.executor;

import lombok.Builder;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;

/**
 * 执行上下文
 * 用于在工作流节点之间传递数据
 */
@Data
@Builder
public class ExecutionContext {

    /**
     * 用户输入
     */
    private String input;

    /**
     * 节点执行结果存储
     */
    @Builder.Default
    private Map<String, Object> variables = new HashMap<>();

    /**
     * 执行日志
     */
    @Builder.Default
    private List<LogEntry> logs = new ArrayList<>();

    /**
     * 当前步骤开始时间
     */
    private long stepStartTime;

    /**
     * 日志条目
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    public static class LogEntry {
        private String message;
        private long durationMs;
        private String nodeType;
        private String nodeId;
        private String nodeLabel;
        private String output;
        private int inputTokens;
        private int outputTokens;
        private int totalTokens;

        public LogEntry(String message, long durationMs, String nodeType) {
            this.message = message;
            this.durationMs = durationMs;
            this.nodeType = nodeType;
        }

        public LogEntry(String message, long durationMs, String nodeType, String nodeId, String nodeLabel, String output) {
            this.message = message;
            this.durationMs = durationMs;
            this.nodeType = nodeType;
            this.nodeId = nodeId;
            this.nodeLabel = nodeLabel;
            this.output = output;
        }

        public LogEntry(String message, long durationMs, String nodeType, String nodeId, String nodeLabel, String output,
                        int inputTokens, int outputTokens, int totalTokens) {
            this.message = message;
            this.durationMs = durationMs;
            this.nodeType = nodeType;
            this.nodeId = nodeId;
            this.nodeLabel = nodeLabel;
            this.output = output;
            this.inputTokens = inputTokens;
            this.outputTokens = outputTokens;
            this.totalTokens = totalTokens;
        }

        public LogEntry(String message) {
            this.message = message;
            this.durationMs = 0;
            this.nodeType = null;
        }
    }

    /**
     * 开始计时
     */
    public void startStep(String nodeType) {
        this.stepStartTime = System.currentTimeMillis();
        addLog("开始执行 " + nodeType + " 节点...");
    }

    /**
     * 结束计时并添加日志（带节点输出）
     */
    public void endStep(String nodeType, String nodeId, String nodeLabel, String output) {
        long duration = System.currentTimeMillis() - this.stepStartTime;
        String summary = output != null && output.length() > 100
            ? output.substring(0, 100) + "..."
            : (output != null ? output : "完成");
        addLog("完成 " + nodeType + " 节点: " + nodeLabel, duration, nodeType, nodeId, nodeLabel, output);
    }

    /**
     * 添加日志（带耗时）
     */
    public void addLog(String message, long durationMs, String nodeType) {
        logs.add(new LogEntry(message, durationMs, nodeType));
    }

    /**
     * 添加日志（带节点输出）
     */
    public void addLog(String message, long durationMs, String nodeType, String nodeId, String nodeLabel, String output) {
        logs.add(new LogEntry(message, durationMs, nodeType, nodeId, nodeLabel, output));
    }

    /**
     * 添加日志（不带耗时）
     */
    public void addLog(String message) {
        logs.add(new LogEntry(message));
    }

    /**
     * 设置变量
     */
    public void setVariable(String key, Object value) {
        variables.put(key, value);
    }

    /**
     * 获取变量
     */
    public Object getVariable(String key) {
        return variables.get(key);
    }

    /**
     * 获取字符串变量
     */
    public String getStringVariable(String key) {
        Object value = variables.get(key);
        return value != null ? value.toString() : null;
    }

    /**
     * 结束计时并添加日志（带节点输出和 token 使用量）
     */
    public void endStep(String nodeType, String nodeId, String nodeLabel, String output, int inputTokens, int outputTokens) {
        long duration = System.currentTimeMillis() - this.stepStartTime;
        String summary = output != null && output.length() > 100
            ? output.substring(0, 100) + "..."
            : (output != null ? output : "完成");
        int totalTokens = inputTokens + outputTokens;
        addLog("完成 " + nodeType + " 节点: " + nodeLabel, duration, nodeType, nodeId, nodeLabel, output, inputTokens, outputTokens, totalTokens);
    }

    /**
     * 添加日志（带节点输出和 token 使用量）
     */
    public void addLog(String message, long durationMs, String nodeType, String nodeId, String nodeLabel, String output,
                       int inputTokens, int outputTokens, int totalTokens) {
        logs.add(new LogEntry(message, durationMs, nodeType, nodeId, nodeLabel, output, inputTokens, outputTokens, totalTokens));
    }

    /**
     * 获取总 token 使用量
     */
    public int getTotalTokens() {
        return logs.stream()
                .mapToInt(LogEntry::getTotalTokens)
                .sum();
    }

    /**
     * 获取总输入 token
     */
    public int getTotalInputTokens() {
        return logs.stream()
                .mapToInt(LogEntry::getInputTokens)
                .sum();
    }

    /**
     * 获取总输出 token
     */
    public int getTotalOutputTokens() {
        return logs.stream()
                .mapToInt(LogEntry::getOutputTokens)
                .sum();
    }
}
