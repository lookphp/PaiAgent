import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Space, Tag, Input, Empty, message, Popconfirm, Typography } from 'antd';
import {
  FolderOpenOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Workflow } from '../../types/workflow';
import { workflowApi } from '../../services/workflowApi';

const { Text } = Typography;

interface WorkflowModalProps {
  open: boolean;
  mode: 'load' | 'save';
  onClose: () => void;
  onLoadWorkflow?: (workflow: Workflow) => void;
  currentWorkflowName?: string;
  nodes?: any[];
  edges?: any[];
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
  nodes = [],
  edges = [],
}) => {
  const [workflows, setWorkflows] = useState<WorkflowTableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');

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
      } else if (mode === 'save') {
        setNewWorkflowName('');
      }
      // 保存模式下重置描述
      if (mode === 'save') {
        setNewWorkflowDescription('');
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
      await workflowApi.delete(String(id));
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
      // 返回完整的工作流数据，包括名称、描述、节点和边
      onLoadWorkflow({
        name: newWorkflowName,
        description: newWorkflowDescription,
        nodes,
        edges,
      } as Workflow);
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
      width: 250,
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
      {mode === 'save' ? (
        // 保存模式：显示名称、描述和工作流统计
        <div>
          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder="请输入工作流名称"
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              onPressEnter={handleSave}
              size="large"
              prefix={<EditOutlined />}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Input.TextArea
              placeholder="请输入工作流描述（可选）"
              value={newWorkflowDescription}
              onChange={(e) => setNewWorkflowDescription(e.target.value)}
              rows={3}
              size="large"
              showCount
              maxLength={200}
            />
          </div>

          <div
            style={{
              background: '#f5f7fa',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileTextOutlined style={{ color: '#1890ff' }} />
              工作流预览
            </div>
            <Space size="large" style={{ flexWrap: 'wrap' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>节点数量</Text>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#667eea' }}>{nodes.length}</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>连接数量</Text>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>{edges.length}</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>工作流类型</Text>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {currentWorkflowName ? '更新现有' : '创建新的'}
                </div>
              </div>
            </Space>
          </div>

          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
            💡 提示：工作流将包含上述节点和连接配置，可在保存后随时修改
          </Text>
        </div>
      ) : (
        // 加载模式：显示搜索框
        <Input
          placeholder="搜索工作流名称或描述..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          size="large"
          prefix={<SearchOutlined />}
          allowClear
        />
      )}

      {/* 加载模式：显示工作流列表 */}
      {mode === 'load' && (
        <>
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
        </>
      )}
    </Modal>
  );
};

export default WorkflowModal;
