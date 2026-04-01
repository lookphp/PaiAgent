import React from 'react';
import { Button, Input, Space, Dropdown, Avatar, Tag } from 'antd';
import {
  PlusOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  BugOutlined,
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../../stores/workflowStore';

const { Search } = Input;

interface HeaderProps {
  onNewWorkflow: () => void;
  onLoadWorkflow: () => void;
  onSaveWorkflow: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onNewWorkflow,
  onLoadWorkflow,
  onSaveWorkflow,
}) => {
  const { debugDrawerOpen, setDebugDrawerOpen, currentWorkflow, nodes, edges } = useWorkflowStore();

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '登出',
    },
  ];

  return (
    <div className="app-header">
      {/* 左侧：Logo + 当前工作流信息 */}
      <div className="header-left">
        <div className="logo">
          <span className="logo-text">PaiAgent</span>
        </div>

        {/* 当前工作流信息 */}
        {currentWorkflow ? (
          <div className="current-workflow-info">
            <FileTextOutlined style={{ color: '#1890ff', marginRight: 6 }} />
            <span className="workflow-name" title={currentWorkflow.name}>
              {currentWorkflow.name}
            </span>
            <Tag color="blue" style={{ marginLeft: 8, borderRadius: 4 }}>
              {nodes.length} 节点
            </Tag>
            <Tag color="green" style={{ borderRadius: 4 }}>
              {edges.length} 连接
            </Tag>
            {currentWorkflow.updatedAt && (
              <span className="workflow-updated-time">
                更新于 {new Date(currentWorkflow.updatedAt).toLocaleString('zh-CN')}
              </span>
            )}
          </div>
        ) : (
          <span className="new-workflow-hint">
            <FileTextOutlined style={{ marginRight: 6 }} />
            新建工作流
          </span>
        )}

        <Search
          placeholder="搜索工作流、节点..."
          allowClear
          style={{ width: 220, marginLeft: 16 }}
          prefix={<SearchOutlined />}
          className="header-search"
        />
      </div>

      {/* 右侧：操作按钮 + 用户信息 */}
      <div className="header-right">
        <Space size="small">
          <Button
            icon={<PlusOutlined />}
            onClick={onNewWorkflow}
            size="middle"
            style={{ borderRadius: 6 }}
          >
            新建
          </Button>
          <Button
            icon={<FolderOpenOutlined />}
            onClick={onLoadWorkflow}
            size="middle"
            style={{ borderRadius: 6 }}
          >
            加载
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={onSaveWorkflow}
            size="middle"
            style={{
              borderRadius: 6,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              fontWeight: 500,
            }}
          >
            保存
          </Button>
          <Button
            type={debugDrawerOpen ? 'primary' : 'default'}
            icon={<BugOutlined />}
            onClick={() => setDebugDrawerOpen(!debugDrawerOpen)}
            size="middle"
            style={{
              borderRadius: 6,
              background: debugDrawerOpen
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : undefined,
              borderColor: debugDrawerOpen ? '#10b981' : undefined,
            }}
          >
            调试
          </Button>

          {/* 用户信息 */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 8,
                transition: 'all 0.2s',
                border: '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f9ff';
                e.currentTarget.style.borderColor = '#bae6fd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <Avatar
                icon={<UserOutlined />}
                style={{
                  backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontWeight: 600,
                }}
              >
                A
              </Avatar>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>admin</span>
            </div>
          </Dropdown>
        </Space>
      </div>
    </div>
  );
};

export default Header;
