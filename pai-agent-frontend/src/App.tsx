import { Button } from 'antd';
import { BugOutlined, FolderOpenOutlined } from '@ant-design/icons';
import NodePalette from './components/NodePalette';
import FlowCanvas from './components/FlowCanvas';
import DebugDrawer from './components/DebugDrawer';
import NodeConfigDrawer from './components/NodeConfig';
import { useWorkflowStore } from './stores/workflowStore';
import './App.css';

function App() {
  const { setDebugDrawerOpen, debugDrawerOpen } = useWorkflowStore();

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="app-container">
      {/* 左侧节点面板 */}
      <div className="sidebar">
        <NodePalette onDragStart={handleDragStart} />
      </div>

      {/* 中间画布区域 */}
      <div className="main-content">
        <FlowCanvas />
      </div>

      {/* 右侧调试按钮 */}
      <div
        style={{
          position: 'absolute',
          right: 20,
          top: 20,
          zIndex: 1000,
          display: 'flex',
          gap: 8,
        }}
      >
        <Button
          type={debugDrawerOpen ? 'primary' : 'default'}
          icon={<BugOutlined />}
          onClick={() => setDebugDrawerOpen(!debugDrawerOpen)}
        >
          调试
        </Button>
        <Button icon={<FolderOpenOutlined />}>
          加载
        </Button>
      </div>

      {/* 调试抽屉 */}
      <DebugDrawer />

      {/* 节点配置抽屉 */}
      <NodeConfigDrawer />
    </div>
  );
}

export default App;
