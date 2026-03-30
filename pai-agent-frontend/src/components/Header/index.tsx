import React from 'react';
import { Button, Input, Space, Dropdown, Avatar } from 'antd';
import {
  PlusOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  BugOutlined,
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
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
  const { debugDrawerOpen, setDebugDrawerOpen } = useWorkflowStore();

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '登出',
    },
  ];

  return (
    <div className="app-header">
      {/* 左侧：Logo + 搜索框 */}
      <div className="header-left">
        <div className="logo">
          <span className="logo-text">PaiAgent</span>
        </div>
        <Search
          placeholder="搜索工作流、节点..."
          allowClear
          style={{ width: 200, marginLeft: 16 }}
          prefix={<SearchOutlined />}
        />
      </div>

      {/* 右侧：操作按钮 + 用户信息 */}
      <div className="header-right">
        <Space size="middle">
          <Button icon={<PlusOutlined />} onClick={onNewWorkflow}>
            新建
          </Button>
          <Button icon={<FolderOpenOutlined />} onClick={onLoadWorkflow}>
            加载
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={onSaveWorkflow}
          >
            保存
          </Button>
          <Button
            type={debugDrawerOpen ? 'primary' : 'default'}
            icon={<BugOutlined />}
            onClick={() => setDebugDrawerOpen(!debugDrawerOpen)}
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
                padding: '4px 8px',
                borderRadius: 4,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = '#f5f5f5')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <span style={{ fontSize: 14 }}>admin</span>
            </div>
          </Dropdown>
        </Space>
      </div>
    </div>
  );
};

export default Header;
