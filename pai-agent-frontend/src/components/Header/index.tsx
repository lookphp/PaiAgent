import React, { useEffect, useState } from 'react';
import { Button, Space, Dropdown, Avatar, Tooltip, Badge, Switch, Tag } from 'antd';
import {
  PlusOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  BugOutlined,
  UserOutlined,
  LogoutOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../../stores/workflowStore';
import ExecutionHistoryModal from '../ExecutionHistoryModal';

interface HeaderProps {
  onNewWorkflow: () => void;
  onLoadWorkflow: () => void;
  onSaveWorkflow: () => void;
  onRunWorkflow?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onNewWorkflow,
  onLoadWorkflow,
  onSaveWorkflow,
  onRunWorkflow,
}) => {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const {
    debugDrawerOpen,
    setDebugDrawerOpen,
    currentWorkflow,
    nodes,
    edges,
    hasUnsavedChanges,
  } = useWorkflowStore();

  // 快捷键支持 Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSaveWorkflow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSaveWorkflow]);

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '登出',
    },
  ];

  return (
    <div className="app-header">
      {/* 左侧：Logo + 工作流信息 */}
      <div className="header-left">
        {/* Logo */}
        <div className="logo">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="28" height="28" rx="6" fill="#2563eb" />
            <path
              d="M8 14C8 11.7909 9.79086 10 12 10H16C18.2091 10 20 11.7909 20 14V18C20 20.2091 18.2091 22 16 22H12C9.79086 22 8 20.2091 8 18V14Z"
              fill="white"
              fillOpacity="0.9"
            />
            <circle cx="14" cy="8" r="3" fill="white" fillOpacity="0.6" />
          </svg>
          <span className="logo-text">PaiAgent</span>
        </div>

        {/* 分隔线 */}
        <div style={{ width: 1, height: 24, background: '#e5e7eb' }} />

        {/* 当前工作流信息 */}
        {currentWorkflow ? (
          <Tooltip title={`${nodes.length} 个节点 · ${edges.length} 条连接`}>
            <div className="current-workflow-info">
              <FileTextOutlined style={{ fontSize: 14 }} />
              <span className="workflow-name">{currentWorkflow.name}</span>
              {/* 保存状态指示器 */}
              {hasUnsavedChanges ? (
                <Tag
                  color="warning"
                  style={{ marginLeft: 8, fontSize: 11, padding: '0 6px' }}
                >
                  <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                  未保存
                </Tag>
              ) : (
                <Tag
                  color="success"
                  style={{ marginLeft: 8, fontSize: 11, padding: '0 6px' }}
                >
                  <CheckCircleOutlined style={{ marginRight: 4 }} />
                  已保存
                </Tag>
              )}
            </div>
          </Tooltip>
        ) : (
          <span className="new-workflow-hint">
            <FileTextOutlined />
            未命名工作流
            {hasUnsavedChanges && (
              <Tag
                color="warning"
                style={{ marginLeft: 8, fontSize: 11, padding: '0 6px' }}
              >
                未保存
              </Tag>
            )}
          </span>
        )}
      </div>

      {/* 右侧：操作按钮 + 调试开关 + 用户 */}
      <div className="header-right">
        <Space size={8}>
          {/* 文件操作按钮组 */}
          <Space.Compact>
            <Button
              icon={<PlusOutlined />}
              onClick={onNewWorkflow}
              title="新建工作流"
            >
              新建
            </Button>
            <Button
              icon={<FolderOpenOutlined />}
              onClick={onLoadWorkflow}
              title="加载工作流"
            >
              加载
            </Button>
            <Button
              type={hasUnsavedChanges ? 'primary' : 'default'}
              icon={<SaveOutlined />}
              onClick={onSaveWorkflow}
              title="保存工作流 (Ctrl+S)"
              style={hasUnsavedChanges ? {
                background: '#faad14',
                borderColor: '#faad14',
                color: '#fff',
              } : {}}
            >
              保存
            </Button>
          </Space.Compact>

          {/* 分隔线 */}
          <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 4px' }} />

          {/* 运行按钮 */}
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={onRunWorkflow}
            style={{
              background: '#10b981',
              borderColor: '#10b981',
            }}
            title="运行工作流"
          >
            运行
          </Button>

          {/* 执行历史按钮 */}
          <Button
            icon={<HistoryOutlined />}
            onClick={() => setHistoryModalOpen(true)}
            title="执行历史"
          >
            历史
          </Button>

          {/* 调试开关 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              background: debugDrawerOpen ? '#ecfdf5' : '#f9fafb',
              border: `1px solid ${debugDrawerOpen ? '#10b981' : '#e5e7eb'}`,
              borderRadius: 6,
              transition: 'all 0.2s ease',
            }}
          >
            <BugOutlined
              style={{
                color: debugDrawerOpen ? '#10b981' : '#6b7280',
                fontSize: 14,
              }}
            />
            <Switch
              size="small"
              checked={debugDrawerOpen}
              onChange={(checked) => setDebugDrawerOpen(checked)}
              style={{
                backgroundColor: debugDrawerOpen ? '#10b981' : undefined,
              }}
            />
          </div>

          {/* 分隔线 */}
          <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 4px' }} />

          {/* 用户信息 */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                transition: 'all 0.2s ease',
              }}
              className="user-dropdown-trigger"
            >
              <Badge dot color="#10b981" offset={[-2, 2]}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  A
                </Avatar>
              </Badge>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                admin
              </span>
            </div>
          </Dropdown>
        </Space>
      </div>

      {/* 执行历史弹窗 */}
      <ExecutionHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />
    </div>
  );
};

export default Header;
