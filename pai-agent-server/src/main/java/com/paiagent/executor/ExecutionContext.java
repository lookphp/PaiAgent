package com.paiagent.executor;

import lombok.Builder;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;

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
    private java.util.List<String> logs = new java.util.ArrayList<>();

    /**
     * 添加日志
     */
    public void addLog(String log) {
        logs.add(log);
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
}
