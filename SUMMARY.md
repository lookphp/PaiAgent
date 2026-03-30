# PaiAgent 项目总结文档

## 项目概述

**项目名称**: PaiAgent - AI Agent 工作流平台

**项目定位**: 一个包含前端、后台、工作流引擎的 AI Agent 项目，核心功能是"Agent 流图执行面板"

**开发日期**: 2026-03-30

---

## 核心功能

### 1. 可视化工作流编辑器
- 基于 React Flow 的拖拽式流程图编辑
- 支持节点添加、删除、连线
- 实时画布预览和小地图导航

### 2. 节点系统
| 节点类型 | 图标 | 颜色 | 功能描述 |
|---------|------|------|---------|
| 输入节点 | UserOutlined | 绿色 | 工作流起点，接收用户输入 |
| 大模型节点 | ApiOutlined | 紫色 | 调用 AI 大模型处理文本 |
| 工具节点 | ToolOutlined | 橙色 | 调用外部工具或服务（如音频合成） |
| 输出节点 | CheckCircleOutlined | 蓝色 | 工作流终点，输出结果 |

### 3. 调试功能
- 调试抽屉：输入测试文本
- 执行日志：实时显示执行过程
- 音频播放：自动播放合成的音频

### 4. 节点配置
- 大模型节点：选择模型（通义千问-Max/Plus、DeepSeek Chat/Coder）、设置系统提示词
- 工具节点：选择工具类型、音色选择
- 输出节点：设置输出格式（文本/音频/两者）

---

## 技术架构

### 前端技术栈
```
React 18 + TypeScript
├── Vite (构建工具)
├── React Flow (流程图引擎)
├── Ant Design (UI 组件库)
├── Zustand (状态管理)
└── Axios (HTTP 客户端)
```

### 后台技术栈
```
Spring Boot 3.x + Java 17
├── Spring Data JPA (数据持久化)
├── H2 Database (开发数据库)
├── Lombok (代码简化)
└── OkHttp (HTTP 客户端，用于 AI API 调用)
```

### 工作流引擎
```
DAG 执行引擎
├── 拓扑排序（Kahn 算法）
├── 环路检测
├── 节点执行器模式
└── 执行上下文传递
```

---

## 项目结构

```
PaiAgent-Claude/
├── pai-agent-frontend/           # React 前端项目
│   ├── src/
│   │   ├── components/
│   │   │   ├── NodePalette/      # 左侧节点面板
│   │   │   ├── FlowCanvas/       # 流程图画布
│   │   │   ├── DebugDrawer/      # 调试抽屉
│   │   │   └── NodeConfig/       # 节点配置面板
│   │   ├── nodes/                # 自定义节点类型
│   │   │   ├── InputNode.tsx
│   │   │   ├── LLMNode.tsx
│   │   │   ├── ToolNode.tsx
│   │   │   └── OutputNode.tsx
│   │   ├── stores/               # Zustand 状态管理
│   │   │   └── workflowStore.ts
│   │   ├── services/             # API 调用服务
│   │   │   ├── api.ts
│   │   │   └── workflowApi.ts
│   │   └── types/                # TypeScript 类型定义
│   │       └── workflow.ts
│   ├── package.json
│   └── tsconfig.*.json
│
├── pai-agent-server/             # Spring Boot 后台
│   ├── src/main/java/com/paiagent/
│   │   ├── PaiAgentServerApplication.java  # 启动类
│   │   ├── controller/           # REST API 控制器
│   │   │   ├── WorkflowController.java
│   │   │   └── ExecutionController.java
│   │   ├── service/              # 业务逻辑层
│   │   │   ├── WorkflowService.java
│   │   │   ├── LLMProviderService.java
│   │   │   └── AudioSynthesisService.java
│   │   ├── model/                # 数据模型
│   │   │   └── Workflow.java
│   │   ├── repository/           # 数据访问层
│   │   │   └── WorkflowRepository.java
│   │   ├── config/               # 配置类
│   │   │   └── CorsConfig.java
│   │   ├── dto/                  # 数据传输对象
│   │   │   ├── WorkflowDto.java
│   │   │   ├── ExecutionRequest.java
│   │   │   └── ExecutionResponse.java
│   │   └── executor/             # 工作流执行引擎
│   │       ├── WorkflowExecutor.java
│   │       ├── ExecutionContext.java
│   │       ├── NodeExecutor.java
│   │       ├── NodeExecutionResult.java
│   │       ├── InputNodeExecutor.java
│   │       ├── LLMNodeExecutor.java
│   │       ├── AudioSynthesisNodeExecutor.java
│   │       └── OutputNodeExecutor.java
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
│
└── README.md
```

---

## API 接口文档

### 工作流管理 API

| 方法 | 路径 | 描述 | 请求参数 | 响应 |
|------|------|------|---------|------|
| GET | /api/workflows | 获取所有工作流 | - | Workflow[] |
| GET | /api/workflows/{id} | 获取单个工作流 | id: Long | WorkflowDto |
| POST | /api/workflows | 创建工作流 | WorkflowDto | WorkflowDto |
| PUT | /api/workflows/{id} | 更新工作流 | id: Long, WorkflowDto | WorkflowDto |
| DELETE | /api/workflows/{id} | 删除工作流 | id: Long | void |

### 执行 API

| 方法 | 路径 | 描述 | 请求参数 | 响应 |
|------|------|------|---------|------|
| POST | /api/execution | 执行工作流 | ExecutionRequest | ExecutionResponse |
| POST | /api/execution/quick | 快速执行 | ExecutionRequest | ExecutionResponse |

### 数据模型

**WorkflowDto**
```java
{
  id: number,
  name: string,
  description: string,
  nodes: string (JSON),
  edges: string (JSON),
  config: string (JSON),
  createdAt: string,
  updatedAt: string
}
```

**ExecutionRequest**
```java
{
  workflowId: number,
  input: string,
  parameters: object
}
```

**ExecutionResponse**
```java
{
  success: boolean,
  output: string,
  audioUrl: string,
  logs: string[],
  error: string
}
```

---

## 核心代码说明

### 1. 工作流执行流程

```
用户输入 → InputNodeExecutor → LLMNodeExecutor → AudioSynthesisNodeExecutor → OutputNodeExecutor
              ↓                    ↓                      ↓                        ↓
          存储输入              调用大模型              音频合成                 输出结果
```

### 2. DAG 拓扑排序算法

```java
// 位于 WorkflowExecutor.java
1. 构建邻接表
2. 计算各节点入度
3. Kahn 算法进行拓扑排序
4. 按排序顺序执行节点
5. 检测环路（结果节点数 < 总节点数）
```

### 3. 执行上下文

```java
ExecutionContext {
  input: String,              // 用户输入
  variables: Map<String, Object>,  // 节点间传递的数据
  logs: List<String>          // 执行日志
}
```

---

## 完成状态

| 模块 | 状态 | 说明 |
|------|------|------|
| 前端基础架构 | ✅ 完成 | React + Vite + TypeScript |
| 流程图画布 | ✅ 完成 | React Flow 集成 |
| 自定义节点 | ✅ 完成 | 4 种节点类型 |
| 节点配置面板 | ✅ 完成 | 右侧抽屉配置 |
| 调试抽屉 | ✅ 完成 | 执行测试功能 |
| 状态管理 | ✅ 完成 | Zustand Store |
| API 服务层 | ✅ 完成 | Axios + REST |
| Spring Boot 后台 | ✅ 完成 | 项目框架 |
| 工作流 CRUD | ✅ 完成 | 完整增删改查 |
| DAG 执行引擎 | ✅ 完成 | 拓扑排序 + 环路检测 |
| 节点执行器 | ✅ 完成 | 4 种执行器实现 |
| AI 服务集成 | ⏳ 待配置 | 需真实 API Key |

---

## 待办事项

### 高优先级
1. **集成真实 AI 服务**
   - [ ] 通义千问 API 接入
   - [ ] DeepSeek API 接入
   - [ ] 超拟人音频合成 API 接入

2. **完善执行功能**
   - [ ] 前后端联调测试
   - [ ] 执行错误处理
   - [ ] 流式响应支持

### 中优先级
3. **工作流管理**
   - [ ] 工作流列表展示
   - [ ] 工作流导入导出
   - [ ] 历史记录功能

4. **用户体验优化**
   - [ ] 节点复制功能
   - [ ] 撤销/重做
   - [ ] 快捷键支持

### 低优先级
5. **扩展功能**
   - [ ] 更多节点类型
   - [ ] 条件分支支持
   - [ ] 并行执行支持

---

## 技术难点与解决方案

### 1. React Flow 节点类型定义
**问题**: TypeScript 严格类型检查与 React Flow 泛型不兼容
**解决**: 使用 `any` 类型配合运行时检查

### 2. DAG 环路检测
**问题**: 工作流可能存在循环依赖
**解决**: Kahn 算法拓扑排序，结果节点数少于总数则存在环路

### 3. 跨域访问
**问题**: 前后端分离导致的 CORS 问题
**解决**: Spring Boot 配置 CorsFilter，允许所有源

---

## 性能指标

### 前端构建
- 构建时间：~7 秒
- 打包大小：944 KB (压缩后 310 KB)
- CSS 大小：16 KB (压缩后 3 KB)

### 后台启动
- 启动时间：~5 秒 (H2 内存模式)
- 内存占用：~200 MB

---

## 安全考虑

1. **API 密钥管理**: 通过环境变量配置，不提交到代码库
2. **CORS 配置**: 生产环境应限制允许的源
3. **输入验证**: 所有 API 接口使用 `@Valid` 注解验证

---

## 部署建议

### 开发环境
```bash
# 前端
cd pai-agent-frontend
npm run dev

# 后台
cd pai-agent-server
mvn spring-boot:run
```

### 生产环境
```bash
# 前端构建
cd pai-agent-frontend
npm run build
# 部署 dist 目录到 Nginx

# 后台打包
cd pai-agent-server
mvn package
# 运行 jar 文件
java -jar target/pai-agent-server-0.0.1-SNAPSHOT.jar
```

---

## 团队与分工

| 模块 | 负责人 | 完成日期 |
|------|--------|---------|
| 前端架构 | - | 2026-03-30 |
| 后台架构 | - | 2026-03-30 |
| 执行引擎 | - | 2026-03-30 |
| UI 设计 | - | 2026-03-30 |

---

## 参考资料

- [React Flow 文档](https://reactflow.dev/)
- [Ant Design 文档](https://ant.design/)
- [Spring Boot 文档](https://spring.io/projects/spring-boot)
- [通义千问 API](https://help.aliyun.com/zh/dashscope/)
- [DeepSeek API](https://platform.deepseek.com/api-docs/)

---

*文档生成日期: 2026-03-30*
