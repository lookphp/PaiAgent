# PaiAgent - AI Agent 工作流平台

一个包含前端、后台、工作流引擎的 AI Agent 项目，核心功能是"Agent 流图执行面板"。

## 功能特性

- **可视化工作流编辑器**: 基于 React Flow 的拖拽式流程图编辑
- **节点库**: 支持大模型节点（通义千问、DeepSeek 等）和工具节点（超拟人音频合成）
- **调试面板**: 支持实时测试工作流，查看执行日志
- **音频播放**: 自动播放 AI 生成的音频内容

## 快速开始

### 前端

```bash
cd pai-agent-frontend
npm install
npm run dev
```

前端将在 http://localhost:5173 启动

### 后台

```bash
cd pai-agent-server
./mvnw spring-boot:run
# 或
mvn spring-boot:run
```

后台将在 http://localhost:8080 启动

H2 控制台：http://localhost:8080/h2-console

## 项目状态

✅ 前端基础架构（React + Vite + TypeScript）
✅ 流程图画布（React Flow）
✅ 自定义节点组件（输入、大模型、工具、输出）
✅ 节点配置面板
✅ 调试抽屉
✅ Spring Boot 后台
✅ 工作流执行引擎（DAG 拓扑排序）
✅ REST API
⏳ AI 服务集成（目前是模拟响应，需要配置真实 API Key）

## 配置 AI 服务

在 `pai-agent-server/src/main/resources/application.properties` 中配置：

```properties
paiagent.ai.qwen.api-key=your-qwen-api-key
paiagent.ai.deepseek.api-key=your-deepseek-api-key
paiagent.ai.audio-synthesis.api-key=your-audio-api-key
```

## API 接口

### 工作流管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/workflows | 获取所有工作流 |
| GET | /api/workflows/{id} | 获取单个工作流 |
| POST | /api/workflows | 创建工作流 |
| PUT | /api/workflows/{id} | 更新工作流 |
| DELETE | /api/workflows/{id} | 删除工作流 |

### 执行

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/execution | 执行工作流 |
| POST | /api/execution/quick | 快速执行（临时节点） |

## 系统架构

```
+-------------------+         +-------------------+
|    用户浏览器      | <-----> |    前端应用       |
|                   |         | (React + Vite)    |
+-------------------+         +-------------------+
                                         |
                                         | HTTP
                                         v
                              +-------------------+
                              |    后台服务        |
                              |  (Spring Boot)    |
                              +-------------------+
                                         |
                    +--------------------+--------------------+
                    |                    |                    |
                    v                    v                    v
          +----------------+   +----------------+   +----------------+
          |  H2 / MySQL    |   |  LLM APIs     |   |  Audio API     |
          |   Database     |   | (DeepSeek等)   |   |  (音频合成)     |
          +----------------+   +----------------+   +----------------+
```

## 核心模块说明

### 工作流执行引擎

位于 `pai-agent-server/src/main/java/com/paiagent/executor/`

- **WorkflowExecutor**: 主执行器，基于 DAG 拓扑排序执行工作流
- **NodeExecutor**: 节点执行器接口
- **InputNodeExecutor**: 输入节点执行器
- **LLMNodeExecutor**: 大模型节点执行器
- **AudioSynthesisNodeExecutor**: 音频合成节点执行器
- **OutputNodeExecutor**: 输出节点执行器

### 前端组件

位于 `pai-agent-frontend/src/components/`

- **NodePalette**: 左侧节点库面板
- **FlowCanvas**: 流程图画布
- **DebugDrawer**: 调试抽屉
- **NodeConfig**: 节点配置面板

## 配置

### 环境变量

在 `pai-agent-server/src/main/resources/application.properties` 中配置：

```properties
# AI API Keys
paiagent.ai.qwen.api-key=your-qwen-api-key
paiagent.ai.deepseek.api-key=your-deepseek-api-key
paiagent.ai.audio-synthesis.api-key=your-audio-api-key
```

## 开发计划

- [ ] 实现真实的通义千问 API 集成
- [ ] 实现真实的 DeepSeek API 集成
- [ ] 实现真实的超拟人音频合成 API 集成
- [ ] 添加工作流历史记录
- [ ] 支持工作流导入导出
- [ ] 支持多工作流并行执行
- [ ] 添加用户认证和权限管理

## License

MIT
