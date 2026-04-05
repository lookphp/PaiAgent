import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Empty,
  Popconfirm,
  Drawer,
  Timeline,
  Card,
  Badge,
  Tooltip,
  message,
} from 'antd';
import {
  HistoryOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  SoundOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { workflowApi } from '../../services/workflowApi';
import type { ExecutionHistory } from '../../types/workflow';

const { Text, Title } = Typography;

interface ExecutionHistoryModalProps {
  open: boolean;
  onClose: () => void;
  workflowId?: number;
}

const ExecutionHistoryModal: React.FC<ExecutionHistoryModalProps> = ({
  open,
  onClose,
  workflowId,
}) => {
  const [histories, setHistories] = useState<ExecutionHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<ExecutionHistory | null>(null);

  // 加载执行历史
  const loadHistories = async () => {
    setLoading(true);
    try {
      let data: ExecutionHistory[];
      if (workflowId) {
        data = await workflowApi.getExecutionHistoryByWorkflowId(workflowId);
      } else {
        data = await workflowApi.getExecutionHistory();
      }
      setHistories(data);
    } catch (error) {
      console.error('加载执行历史失败:', error);
      message.error('加载执行历史失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadHistories();
    }
  }, [open, workflowId]);

  // 删除执行历史
  const handleDelete = async (id: number) => {
    try {
      await workflowApi.deleteExecutionHistory(id);
      message.success('已删除');
      loadHistories();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 查看详情
  const handleViewDetail = (record: ExecutionHistory) => {
    setSelectedHistory(record);
    setDetailOpen(true);
  };

  // 格式化时间
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    if (status === 'success') {
      return <Tag icon={<CheckCircleOutlined />} color="success">成功</Tag>;
    }
    return <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>;
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '工作流',
      dataIndex: 'workflowName',
      key: 'workflowName',
      width: 150,
      render: (name: string) => name || <Text type="secondary">未命名</Text>,
    },
    {
      title: '输入内容',
      dataIndex: 'inputText',
      key: 'inputText',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text?.slice(0, 30) || '-'}{text?.length > 30 ? '...' : ''}</span>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Token',
      key: 'tokens',
      width: 100,
      render: (record: ExecutionHistory) => (
        <span>
          {record.totalTokens ? (
            <span style={{ color: '#1677ff' }}>{record.totalTokens.toLocaleString()}</span>
          ) : (
            '-'
          )}
        </span>
      ),
    },
    {
      title: '耗时',
      dataIndex: 'totalDuration',
      key: 'totalDuration',
      width: 80,
      render: (duration: number) => duration ? `${duration}ms` : '-',
    },
    {
      title: '节点数',
      dataIndex: 'nodeCount',
      key: 'nodeCount',
      width: 70,
      render: (count: number) => count || '-',
    },
    {
      title: '执行时间',
      dataIndex: 'executedAt',
      key: 'executedAt',
      width: 140,
      render: (time: string) => formatTime(time),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: ExecutionHistory) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          />
          <Popconfirm
            title="确认删除？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 解析执行日志
  const parseLogs = (logsJson?: string) => {
    if (!logsJson) return [];
    try {
      return JSON.parse(logsJson);
    } catch {
      return [];
    }
  };

  // 获取节点图标
  const getNodeIcon = (type?: string) => {
    switch (type) {
      case 'input':
        return <UserOutlined />;
      case 'llm':
        return <RobotOutlined />;
      case 'tool':
        return <ToolOutlined />;
      default:
        return <CheckCircleOutlined />;
    }
  };

  return (
    <>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HistoryOutlined style={{ color: '#1677ff' }} />
            <span>执行历史</span>
            <Badge count={histories.length} style={{ backgroundColor: '#1677ff' }} />
          </div>
        }
        open={open}
        onCancel={onClose}
        width={1000}
        footer={[
          <Button key="close" onClick={onClose}>
            关闭
          </Button>,
        ]}
      >
        <Table
          dataSource={histories}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          size="small"
          locale={{
            emptyText: <Empty description="暂无执行记录" />,
          }}
        />
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="执行详情"
        placement="right"
        width={600}
        onClose={() => setDetailOpen(false)}
        open={detailOpen}
      >
        {selectedHistory && (
          <div>
            {/* 基本信息 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#999' }}>状态</div>
                  <div>{getStatusTag(selectedHistory.status)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#999' }}>总耗时</div>
                  <div style={{ fontWeight: 600 }}>{selectedHistory.totalDuration}ms</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#999' }}>Token 使用</div>
                  <div style={{ fontWeight: 600, color: '#1677ff' }}>
                    {selectedHistory.totalTokens?.toLocaleString() || 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#999' }}>节点数</div>
                  <div style={{ fontWeight: 600 }}>{selectedHistory.nodeCount}</div>
                </div>
              </div>
            </Card>

            {/* 输入 */}
            <Card
              size="small"
              title={<span><FileTextOutlined /> 输入内容</span>}
              style={{ marginBottom: 16 }}
            >
              <div
                style={{
                  padding: 12,
                  background: '#f6ffed',
                  borderRadius: 6,
                  maxHeight: 150,
                  overflow: 'auto',
                }}
              >
                <Text style={{ whiteSpace: 'pre-wrap' }}>{selectedHistory.inputText}</Text>
              </div>
            </Card>

            {/* 输出 */}
            {selectedHistory.outputText && (
              <Card
                size="small"
                title={<span><FileTextOutlined /> 输出内容</span>}
                style={{ marginBottom: 16 }}
              >
                <div
                  style={{
                    padding: 12,
                    background: '#f0f5ff',
                    borderRadius: 6,
                    maxHeight: 200,
                    overflow: 'auto',
                  }}
                >
                  <Text style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {selectedHistory.outputText}
                  </Text>
                </div>
              </Card>
            )}

            {/* 音频 */}
            {selectedHistory.audioUrl && (
              <Card
                size="small"
                title={<span><SoundOutlined /> 音频输出</span>}
                style={{ marginBottom: 16 }}
              >
                <audio controls src={selectedHistory.audioUrl} style={{ width: '100%' }} />
              </Card>
            )}

            {/* 错误信息 */}
            {selectedHistory.errorMessage && (
              <Card
                size="small"
                title={<span><CloseCircleOutlined /> 错误信息</span>}
                style={{ marginBottom: 16 }}
              >
                <div
                  style={{
                    padding: 12,
                    background: '#fff2f0',
                    border: '1px solid #ffccc7',
                    borderRadius: 6,
                    color: '#cf1322',
                  }}
                >
                  {selectedHistory.errorMessage}
                </div>
              </Card>
            )}

            {/* 执行日志 */}
            <Card size="small" title="执行日志">
              <Timeline>
                {parseLogs(selectedHistory.executionLogs).map((log: any, index: number) => (
                  <Timeline.Item
                    key={index}
                    dot={getNodeIcon(log.nodeType)}
                  >
                    <div style={{ fontSize: 13 }}>{log.message}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {log.durationMs > 0 && <span>耗时: {log.durationMs}ms</span>}
                      {log.totalTokens > 0 && (
                        <span style={{ marginLeft: 8, color: '#1677ff' }}>
                          Token: {log.totalTokens}
                        </span>
                      )}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </div>
        )}
      </Drawer>
    </>
  );
};

export default ExecutionHistoryModal;
