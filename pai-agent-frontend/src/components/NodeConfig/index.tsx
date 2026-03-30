import React from 'react';
import { Form, Input, Select, Button, Typography, Divider, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useWorkflowStore } from '../../stores/workflowStore';

const { TextArea } = Input;
const { Text, Title } = Typography;

const NodeConfigPanel: React.FC = () => {
  const [form] = Form.useForm();
  const { selectedNode, setConfigDrawerOpen, updateNode, setSelectedNode } = useWorkflowStore();

  React.useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue({
        label: selectedNode.data?.label,
        model: selectedNode.data?.model,
        prompt: selectedNode.data?.prompt,
        toolType: selectedNode.data?.toolType,
        voice: selectedNode.data?.voice,
        outputFormat: selectedNode.data?.outputFormat,
      });
    } else {
      form.resetFields();
    }
  }, [selectedNode, form]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (selectedNode) {
        updateNode(selectedNode.id, values);
        setSelectedNode(null);
      }
    });
  };

  const handleClose = () => {
    setSelectedNode(null);
  };

  if (!selectedNode) {
    return (
      <div
        className="node-config-panel"
        style={{
          width: '100%',
          height: '100%',
          background: '#fff',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 0',
            borderBottom: '1px solid #f0f0f0',
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>节点配置</Title>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
          }}
        >
          <Text>请点击节点进行配置</Text>
        </div>
      </div>
    );
  }

  return (
    <div
      className="node-config-panel"
      style={{
        width: '100%',
        height: '100%',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 头部 */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={5} style={{ margin: 0 }}>节点配置</Title>
        <Button size="small" onClick={handleClose}>关闭</Button>
      </div>

      {/* 配置内容 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <Form form={form} layout="vertical" size="middle">
          {/* 节点 ID */}
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>节点 ID</Text>
            <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500 }}>
              {selectedNode.id}
            </div>
          </div>

          {/* 节点类型 */}
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>节点类型</Text>
            <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500 }}>
              {selectedNode.type}
            </div>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* 节点名称 */}
          <Form.Item
            label="节点名称"
            name="label"
            rules={[{ required: true, message: '请输入节点名称' }]}
          >
            <Input placeholder="请输入节点名称" />
          </Form.Item>

          {/* 大模型节点配置 */}
          {selectedNode.type === 'llm' && (
            <>
              <Form.Item
                label="模型选择"
                name="model"
                rules={[{ required: true, message: '请选择模型' }]}
              >
                <Select>
                  <Select.Option value="qwen-max">通义千问-Max</Select.Option>
                  <Select.Option value="qwen-plus">通义千问-Plus</Select.Option>
                  <Select.Option value="deepseek-chat">DeepSeek Chat</Select.Option>
                  <Select.Option value="deepseek-coder">DeepSeek Coder</Select.Option>
                  <Select.Option value="ai-ping">AI Ping</Select.Option>
                  <Select.Option value="zhipu-chat">智谱 AI</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="系统提示词" name="prompt">
                <TextArea
                  rows={4}
                  placeholder="请输入系统提示词，用于设定 AI 角色..."
                />
              </Form.Item>
            </>
          )}

          {/* 工具节点配置 */}
          {selectedNode.type === 'tool' && (
            <>
              <Form.Item
                label="工具类型"
                name="toolType"
                rules={[{ required: true, message: '请选择工具类型' }]}
              >
                <Select>
                  <Select.Option value="audio-synthesis">
                    超拟人音频合成
                  </Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="音色选择" name="voice">
                <Select>
                  <Select.Option value="female-1">女声 1 号</Select.Option>
                  <Select.Option value="female-2">女声 2 号</Select.Option>
                  <Select.Option value="male-1">男声 1 号</Select.Option>
                  <Select.Option value="male-2">男声 2 号</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}

          {/* 输出节点配置 */}
          {selectedNode.type === 'output' && (
            <>
              <Divider style={{ margin: '16px 0' }} />

              {/* 输出配置 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong>输出配置</Text>
                  <Button type="link" size="small" icon={<PlusOutlined />}>
                    添加
                  </Button>
                </div>

                <Space size="small" style={{ marginBottom: 16 }}>
                  <Input defaultValue="output" style={{ width: 120 }} size="small" />
                  <Select defaultValue="引用" style={{ width: 80 }} size="small" />
                  <Select
                    defaultValue="超拟人音频合成.audioUrl"
                    style={{ width: 200 }}
                    size="small"
                  >
                    <Select.Option value="audio-synthesis.audioUrl">
                      超拟人音频合成.audioUrl
                    </Select.Option>
                  </Select>
                </Space>
              </div>

              {/* 回答内容配置 */}
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  回答内容配置
                </Text>
                <TextArea
                  rows={4}
                  defaultValue="{{output}}"
                  placeholder="使用 {{ 参数名 }} 引用上面定义的参数"
                />
                <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                  💡 提示：使用 {'{{'} 参数名 {'}}'} 引用上面定义的参数
                </Text>
              </div>
            </>
          )}
        </Form>
      </div>

      {/* 底部按钮 */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
        }}
      >
        <Button type="primary" block size="large" onClick={handleSave}>
          保存配置
        </Button>
      </div>
    </div>
  );
};

export default NodeConfigPanel;
