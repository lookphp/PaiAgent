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
    public static class LogEntry {
        private String message;
        private long durationMs;
        private String nodeType;

        public LogEntry(String message, long durationMs, String nodeType) {
            this.message = message;
            this.durationMs = durationMs;
            this.nodeType = nodeType;
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
     * 结束计时并添加日志
     */
    public void endStep(String nodeType, String resultSummary) {
        long duration = System.currentTimeMillis() - this.stepStartTime;
        addLog("完成 " + nodeType + " 节点: " + resultSummary + " (耗时: " + duration + "ms)", duration, nodeType);
    }

    /**
     * 添加日志（带耗时）
     */
    public void addLog(String message, long durationMs, String nodeType) {
        logs.add(new LogEntry(message, durationMs, nodeType));
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
     * 获取总耗时
     */
    public long getTotalDuration() {
        return logs.stream()
                .filter(log -> log.getDurationMs() > 0)
                .mapToLong(LogEntry::getDurationMs)
                .sum();
    }
}
