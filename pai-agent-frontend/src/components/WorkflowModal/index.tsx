import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Space, Tag, Input, Empty, message, Popconfirm } from 'antd';
import {
  FolderOpenOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Workflow } from '../../types/workflow';
import { workflowApi } from '../../services/workflowApi';

interface WorkflowModalProps {
  open: boolean;
  mode: 'load' | 'save';
  onClose: () => void;
  onLoadWorkflow?: (workflow: Workflow) => void;
  currentWorkflowName?: string;
}

interface WorkflowTableItem extends Workflow {
  key: string;
  nodeCount: number;
  edgeCount: number;
}

const WorkflowModal: React.FC<WorkflowModalProps> = ({
  open,
  mode,
  onClose,
  onLoadWorkflow,
  currentWorkflowName,
}) => {
  const [workflows, setWorkflows] = useState<WorkflowTableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [newWorkflowName, setNewWorkflowName] = useState('');

  // 加载工作流列表
  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const list = await workflowApi.list();
      const formattedList = list.map((w) => {
        // 解析 nodes 和 edges - 可能是 JSON 字符串或数组
        let nodesArray: any[] = [];
        let edgesArray: any[] = [];

        if (w.nodes) {
          nodesArray = typeof w.nodes === 'string' ? JSON.parse(w.nodes) : w.nodes;
        }
        if (w.edges) {
          edgesArray = typeof w.edges === 'string' ? JSON.parse(w.edges) : w.edges;
        }

        return {
          ...w,
          key: String(w.id),
          nodeCount: Array.isArray(nodesArray) ? nodesArray.length : 0,
          edgeCount: Array.isArray(edgesArray) ? edgesArray.length : 0,
        };
      });
      setWorkflows(formattedList);
    } catch (error) {
      console.error('加载工作流列表失败:', error);
      message.error('加载工作流列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadWorkflows();
      if (mode === 'save' && currentWorkflowName) {
        setNewWorkflowName(currentWorkflowName);
      } else {
        setNewWorkflowName('');
      }
    }
  }, [open, mode, currentWorkflowName]);

  // 过滤搜索
  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (w.description && w.description.toLowerCase().includes(searchText.toLowerCase()))
  );

  // 处理加载工作流
  const handleLoad = (workflow: Workflow) => {
    if (onLoadWorkflow) {
      onLoadWorkflow(workflow);
      onClose();
      message.success(`已加载：${workflow.name}`);
    }
  };

  // 处理删除工作流
  const handleDelete = async (id: number, name: string) => {
    try {
      await workflowApi.delete(id);
      message.success(`已删除：${name}`);
      loadWorkflows();
    } catch (error) {
      console.error('删除工作流失败:', error);
      message.error('删除工作流失败');
    }
  };

  // 删除确认
  const confirmDelete = (record: WorkflowTableItem) => {
    return new Promise<void>((resolve) => {
      Modal.confirm({
        title: '确认删除',
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
        content: (
          <div>
            <p>确定要删除工作流 <strong>{record.name}</strong> 吗？</p>
            <p style={{ color: '#999', fontSize: 13, marginTop: 8 }}>
              此操作不可恢复，该工作流包含 {record.nodeCount} 个节点和 {record.edgeCount} 条连接。
            </p>
          </div>
        ),
        okText: '确认删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: () => {
          handleDelete(Number(record.id), record.name);
          resolve();
        },
      });
    });
  };

  // 处理保存
  const handleSave = () => {
    if (!newWorkflowName.trim()) {
      message.warning('请输入工作流名称');
      return;
    }
    if (onLoadWorkflow) {
      onLoadWorkflow({ name: newWorkflowName } as Workflow);
      onClose();
    }
  };

  const columns: ColumnsType<WorkflowTableItem> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span style={{ fontWeight: 500, color: '#1890ff' }}>{name}</span>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => (
        <span style={{ color: '#666', fontSize: 13 }}>
          {desc || <span style={{ color: '#ccc' }}>无描述</span>}
        </span>
      ),
      ellipsis: true,
      maxWidth: 250,
    },
    {
      title: '节点/连接',
      key: 'stats',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tag color="blue">{record.nodeCount} 节点</Tag>
          <Tag color="green">{record.edgeCount} 连接</Tag>
        </Space>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (time: string) => (
        <span style={{ color: '#666', fontSize: 12 }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {time ? new Date(time).toLocaleString('zh-CN') : '-'}
        </span>
      ),
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {mode === 'load' && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleLoad(record)}
              style={{ padding: 0, color: '#1890ff' }}
            >
              加载
            </Button>
          )}
          <Popconfirm
            title="确认删除"
            description={
              <div>
                <p style={{ marginBottom: 8 }}>
                  确定要删除 <strong>{record.name}</strong> 吗？
                </p>
                <p style={{ color: '#999', fontSize: 12 }}>
                  包含 {record.nodeCount} 个节点，{record.edgeCount} 条连接
                </p>
              </div>
            }
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            onConfirm={() => handleDelete(Number(record.id), record.name)}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              style={{ padding: 0 }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {mode === 'load' ? <FolderOpenOutlined /> : <EditOutlined />}
          <span>{mode === 'load' ? '加载工作流' : '保存工作流'}</span>
        </div>
      }
      open={open}
      onClose={onClose}
      onCancel={onClose}
      width={800}
      footer={
        mode === 'save' ? (
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={handleSave}>
              确认保存
            </Button>
          </Space>
        ) : null
      }
    >
      <div style={{ marginBottom: 16 }}>
        {mode === 'save' ? (
          <Input
            placeholder="请输入工作流名称"
            value={newWorkflowName}
            onChange={(e) => setNewWorkflowName(e.target.value)}
            onPressEnter={handleSave}
            size="large"
            prefix={<EditOutlined />}
            style={{ maxWidth: 400 }}
          />
        ) : (
          <Input
            placeholder="搜索工作流名称或描述..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="large"
            prefix={<SearchOutlined />}
            allowClear
          />
        )}
      </div>

      {filteredWorkflows.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Empty
            description={
              workflows.length === 0
                ? '暂无工作流，点击"新建"创建一个'
                : searchText
                ? '未找到匹配的工作流'
                : '暂无工作流'
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={filteredWorkflows}
          loading={loading}
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 个工作流`,
          }}
          scroll={{ y: 400 }}
          size="middle"
        />
      )}
    </Modal>
  );
};

export default WorkflowModal;
