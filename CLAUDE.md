# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PaiAgent** - AI Agent 工作流平台 (AI Agent Workflow Platform)

A full-stack application for visual AI workflow orchestration. Users can drag-and-drop nodes to create workflows that process text through LLMs and convert output to audio.

## Quick Commands

### Frontend (pai-agent-frontend/)
```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend (pai-agent-server/)
```bash
mvn spring-boot:run              # Start backend (http://localhost:8080)
mvn test                         # Run tests
mvn package                      # Build JAR
java -jar target/*.jar           # Run JAR
```

## Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite + React Flow + Ant Design + Zustand
- **Backend**: Spring Boot 3.2 + Java 17 + Spring Data JPA + H2 Database
- **Workflow Engine**: Custom DAG executor with Kahn's topological sort

### Project Structure
```
PaiAgent-Claude/
├── pai-agent-frontend/     # React frontend
│   ├── src/
│   │   ├── components/     # UI components (Header, NodePalette, FlowCanvas, DebugDrawer, NodeConfig)
│   │   ├── nodes/          # Custom React Flow nodes (Input, LLM, Tool, Output)
│   │   ├── stores/         # Zustand state management (workflowStore.ts)
│   │   ├── services/       # API client (workflowApi.ts)
│   │   └── types/          # TypeScript types
│
└── pai-agent-server/       # Spring Boot backend
    ├── src/main/java/com/paiagent/
    │   ├── controller/     # REST API endpoints
    │   ├── service/        # Business logic & AI service integration
    │   ├── executor/       # Workflow execution engine (DAG-based)
    │   ├── model/          # JPA entities
    │   └── repository/     # Data access layer
```

## Key Architectural Patterns

### Frontend State Management
- **Zustand store** (`workflowStore.ts`) manages:
  - `nodes[]`, `edges[]` - React Flow canvas state
  - `selectedNode` - Currently selected node for configuration
  - `debugDrawerOpen` - Debug panel visibility
  - `executionLogs[]`, `executionResult` - Workflow execution state

### React Flow Integration
- Custom node types registered in `FlowCanvas/index.tsx`:
  - `input` → InputNode (user input, source handle only)
  - `llm` → LLMNode (LLM processing, bidirectional handles)
  - `tool` → ToolNode (external tools like audio synthesis)
  - `output` → OutputNode (final output, target handle only)

### Backend Execution Engine
- **WorkflowExecutor** uses Kahn's algorithm for topological sorting
- **NodeExecutor pattern**: Each node type has a dedicated executor
  - `findExecutorByNodeType()` looks up executor from `List<NodeExecutor>`
  - Executors implement `execute(ExecutionContext, nodeData)` method
- **ExecutionContext** passes data between nodes via `variables` map

### API Endpoints
```
GET    /api/workflows         # List all workflows
GET    /api/workflows/{id}    # Get single workflow
POST   /api/workflows         # Create workflow
PUT    /api/workflows/{id}    # Update workflow
DELETE /api/workflows/{id}    # Delete workflow
POST   /api/execution         # Execute workflow
```

## Important Conventions

### Node Data Flow
1. User drags node from NodePalette → FlowCanvas receives `onDrop`
2. Node added with `type` and `modelType` (e.g., `qwen-max`, `audio-synthesis`)
3. Clicking node opens NodeConfig panel for configuration
4. Running workflow sends nodes/edges JSON to backend
5. Backend executes DAG, returns result with audio URL

### Drag-and-Drop Data Transfer
```typescript
// NodePalette → FlowCanvas
event.dataTransfer.setData('application/reactflow', nodeType)
event.dataTransfer.setData('modelType', modelType)
```

### AI Service Integration
- Services located in `pai-agent-server/src/main/java/com/paiagent/service/`
- **LLMProviderService** - Interface for LLM providers (Qwen, DeepSeek)
- **AudioSynthesisService** - Text-to-speech integration
- API keys configured via environment variables in `application.properties`

## Common Development Tasks

### Adding a New Node Type
1. Create node component in `pai-agent-frontend/src/nodes/`
2. Create executor in `pai-agent-server/src/main/java/com/paiagent/executor/`
3. Register node type in `FlowCanvas/index.tsx` (nodeTypes object)
4. Add to NodePalette component

### Modifying Workflow Execution
- Core logic: `WorkflowExecutor.java` - DAG topology and execution flow
- Node-specific logic: Individual `*NodeExecutor.java` classes

## Configuration

### AI API Keys (for real AI integration)
Set environment variables before starting backend:
```bash
export QWEN_API_KEY=your-key
export DEEPSEEK_API_KEY=your-key
export AUDIO_SYNTHESIS_API_KEY=your-key
```

### Database
- **Development**: H2 in-memory (auto-created, accessible at `/h2-console`)
- **Production**: Switch to MySQL in `application.properties`

## Notes
- AI services currently return mock responses (need real API keys)
- Frontend uses `strict: false` in tsconfig for React Flow compatibility
- Drawer `width` prop deprecated, use `size="large"` instead
