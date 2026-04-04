# PaiAgent - AI Agent 工作流平台

一个包含前端、后台、工作流引擎的 AI Agent 项目，核心功能是"Agent 流图执行面板"。

## 功能特性

- **可视化工作流编辑器**: 基于 React Flow 的拖拽式流程图编辑
- **节点库**: 支持大模型节点（通义千问、DeepSeek 等）和工具节点（超拟人音频合成）
- **调试面板**: 支持实时测试工作流，查看执行日志、节点输出和耗时
- **音频播放**: 自动播放 AI 生成的音频内容
- **MySQL 持久化**: 工作流数据持久化存储
- **MinIO 存储**: 音频文件存储和分发

## 技术栈

### 前端
- React 19 + TypeScript + Vite
- React Flow (流程图编辑)
- Ant Design (UI 组件)
- Zustand (状态管理)

### 后端
- Spring Boot 3.2 + Java 17
- Spring Data JPA + MySQL
- DashScope SDK 2.21.9 (阿里百炼 TTS)
- MinIO (对象存储)

## 快速开始

### 环境要求

- Node.js 18+
- Java 17+
- MySQL 8.0+
- MinIO (可选，用于音频存储)

### 1. 克隆项目

```bash
git clone https://github.com/your-repo/PaiAgent-Claude.git
cd PaiAgent-Claude
```

### 2. 配置数据库

创建 MySQL 数据库：

```sql
CREATE DATABASE paiagent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 配置后端

编辑 `pai-agent-server/src/main/resources/application.properties`：

```properties
# MySQL 配置
spring.datasource.url=jdbc:mysql://localhost:3306/paiagent?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&characterEncoding=utf8
spring.datasource.username=root
spring.datasource.password=your-password

# MinIO 配置
minio.endpoint=http://localhost:9000
minio.access-key=minioadmin
minio.secret-key=minioadmin
minio.bucket-name=paiagent
minio.public-url=http://localhost:9000
```

### 4. 启动后端

```bash
cd pai-agent-server
./mvnw spring-boot:run
```

后端将在 http://localhost:8080 启动

### 5. 启动前端

```bash
cd pai-agent-frontend
npm install
npm run dev
```

前端将在 http://localhost:5173 启动

### 6. 启动 MinIO (可选)

```bash
docker run -p 9000:9000 -p 9001:9001 --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v /mnt/data:/data \
  -d minio/minio server /data --console-address ":9001"
```

MinIO 控制台：http://localhost:9001

## 项目状态

✅ 前端基础架构（React + Vite + TypeScript）
✅ 流程图画布（React Flow）
✅ 自定义节点组件（输入、大模型、工具、输出）
✅ 节点配置面板（支持输入/输出参数配置）
✅ 调试抽屉（执行日志、节点输出、音频播放）
✅ Spring Boot 后台
✅ MySQL 数据持久化
✅ 工作流执行引擎（DAG 拓扑排序）
✅ REST API
✅ 通义千问 API 集成
✅ 阿里百炼 qwen3-tts-flash 音频合成
✅ MinIO 音频存储

## 配置 AI 服务

### 通义千问 / 音频合成

在节点配置中直接填写 API Key，或配置环境变量：

```bash
export QWEN_API_KEY=your-qwen-api-key
```

### 音色选项 (qwen3-tts-flash)

| 音色 | 描述 |
|------|------|
| Cherry | 女声 |
| Serena | 女声 |
| Ethan | 男声 |

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

**请求示例：**

```json
{
  "workflowId": 1,
  "input": "你好，欢迎使用 PaiAgent"
}
```

**响应示例：**

```json
{
  "success": true,
  "output": "http://localhost:9000/paiagent/audio/xxx.wav",
  "audioUrl": "http://localhost:9000/paiagent/audio/xxx.wav",
  "logs": [
    {
      "message": "完成 llm 节点: 通义千问",
      "durationMs": 2876,
      "nodeType": "llm",
      "nodeId": "llm-xxx",
      "output": "你好！有什么我能帮助你的吗？"
    }
  ]
}
```

### 音频文件

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/audio/{filename} | 获取音频文件（本地存储模式） |

## 系统架构

```
+-------------------+         +-------------------+
|    用户浏览器      | <-----> |    前端应用       |
|                   |         | (React + Vite)    |
+-------------------+         +-------------------+
                                         |
                                         | HTTP (Vite Proxy)
                                         v
                              +-------------------+
                              |    后台服务        |
                              |  (Spring Boot)    |
                              +-------------------+
                                         |
                    +--------------------+--------------------+--------------------+
                    |                    |                    |                    |
                    v                    v                    v                    v
          +----------------+   +----------------+   +----------------+   +----------------+
          |     MySQL      |   |    MinIO       |   |  阿里百炼 API   |   |  通义千问 API   |
          |   (持久化)      |   |  (音频存储)     |   |  (TTS 合成)     |   |   (LLM)        |
          +----------------+   +----------------+   +----------------+   +----------------+
```

## 工作流示例

### 典型流程：文本输入 → LLM 处理 → 音频合成 → 输出

```
[用户输入] ---> [通义千问] ---> [超拟人音频合成] ---> [输出]
    |              |                  |               |
    |              |                  |               |
  "你好"     "你好！有什么       音频 URL         播放音频
             我能帮助你的？"
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

### 服务层

位于 `pai-agent-server/src/main/java/com/paiagent/service/`

- **LLMProviderService**: 大模型服务接口
- **AudioSynthesisService**: 音频合成服务接口
- **MinioService**: MinIO 存储服务

### 前端组件

位于 `pai-agent-frontend/src/components/`

- **NodePalette**: 左侧节点库面板
- **FlowCanvas**: 流程图画布
- **DebugDrawer**: 调试抽屉
- **NodeConfig**: 节点配置面板

### 自定义节点

位于 `pai-agent-frontend/src/nodes/`

- **InputNode**: 用户输入节点
- **LLMNode**: 大模型节点
- **ToolNode**: 工具节点（音频合成）
- **OutputNode**: 输出节点

## 配置

### application.properties

```properties
# Server
server.port=8080

# MySQL
spring.datasource.url=jdbc:mysql://localhost:3306/paiagent
spring.datasource.username=root
spring.datasource.password=your-password

# JPA
spring.jpa.hibernate.ddl-auto=update

# MinIO
minio.endpoint=http://localhost:9000
minio.access-key=minioadmin
minio.secret-key=minioadmin
minio.bucket-name=paiagent
minio.public-url=http://localhost:9000
```

## 开发计划

- [ ] 支持 DeepSeek API 集成
- [ ] 添加工作流历史记录
- [ ] 支持工作流导入导出
- [ ] 支持多工作流并行执行
- [ ] 添加用户认证和权限管理
- [ ] 支持更多 TTS 模型和音色
- [ ] WebSocket 实时日志推送

## License

MIT