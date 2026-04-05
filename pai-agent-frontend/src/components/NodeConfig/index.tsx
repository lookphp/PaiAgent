import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Typography,
  Tabs,
  Card,
  Tag,
  Space,
  Tooltip,
  Empty,
  Table,
  Popconfirm,
} from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
  UserOutlined,
  RobotOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../../stores/workflowStore';
import type { Node } from '@xyflow/react';

const { TextArea } = Input;
const { Text, Title } = Typography;

// 节点类型配置
const nodeTypeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  input: { icon: <UserOutlined />, label: '输入节点', color: '#22c55e' },
  llm: { icon: <RobotOutlined />, label: '大模型节点', color: '#8b5cf6' },
  tool: { icon: <ToolOutlined />, label: '工具节点', color: '#f59e0b' },
  output: { icon: <CheckCircleOutlined />, label: '输出节点', color: '#3b82f6' },
};

// 模型选项
const modelOptions = [
  { value: 'qwen-max', label: '通义千问-Max' },
  { value: 'qwen-plus', label: '通义千问-Plus' },
  { value: 'qwen-turbo', label: '通义千问-Turbo' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'deepseek-coder', label: 'DeepSeek Coder' },
  { value: 'ai-ping', label: 'AI Ping' },
  { value: 'zhipu-chat', label: '智谱 AI' },
];

// 温度选项
const temperatureOptions = [
  { value: 0, label: '0 - 确定性最高' },
  { value: 0.3, label: '0.3 - 较低随机性' },
  { value: 0.5, label: '0.5 - 适中' },
  { value: 0.7, label: '0.7 - 默认推荐' },
  { value: 1, label: '1 - 较高随机性' },
  { value: 1.5, label: '1.5 - 高随机性' },
  { value: 2, label: '2 - 完全随机' },
];

const NodeConfigPanel: React.FC = () => {
  const [form] = Form.useForm();
  const { selectedNode, setSelectedNode, updateNode, nodes } = useWorkflowStore();
  const [activeTab, setActiveTab] = useState('basic');

  // 根据选中节点类型获取可用引用节点
  const getAvailableNodes = () => {
    if (!selectedNode) return [];
    return nodes.filter((n: Node) => n.id !== selectedNode.id).map((n: any) => ({
      id: n.id,
      label: n.data?.label || '未命名节点',
      type: n.type,
    }));
  };

  // 节点类型改变时重置 Tab
  useEffect(() => {
    setActiveTab('basic');
    if (selectedNode) {
      form.setFieldsValue({
        label: selectedNode.data?.label,
        model: selectedNode.data?.model,
        apiUrl: selectedNode.data?.apiUrl,
        apiKey: selectedNode.data?.apiKey,
        temperature: selectedNode.data?.temperature ?? 0.7,
        prompt: selectedNode.data?.prompt,
        userPrompt: selectedNode.data?.userPrompt,
        toolType: selectedNode.data?.toolType,
        outputFormat: selectedNode.data?.outputFormat,
        ...selectedNode.data,
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

  // 空状态
  if (!selectedNode) {
    return (
      <div className="node-config-panel">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text type="secondary" style={{ fontSize: 14 }}>
              点击画布上的节点进行配置
            </Text>
          }
          style={{ marginTop: 100 }}
        />
      </div>
    );
  }

  const nodeConfig = nodeTypeConfig[selectedNode.type] || nodeTypeConfig.llm;
  const availableNodes = getAvailableNodes();

  // 基础配置 Tab
  const renderBasicTab = () => {
    const commonFields = (
      <>
        <Form.Item
          label="节点名称"
          name="label"
          rules={[{ required: true, message: '请输入节点名称' }]}
        >
          <Input placeholder="请输入节点名称" />
        </Form.Item>
      </>
    );

    switch (selectedNode.type) {
      case 'input':
        return (
          <>
            {commonFields}
            <Form.Item label="变量名" name="variableName">
              <Input disabled placeholder="user_input" />
            </Form.Item>
            <Form.Item label="描述" name="description">
              <TextArea rows={2} placeholder="描述此输入的用途" />
            </Form.Item>
          </>
        );

      case 'llm':
        return (
          <>
            {commonFields}
            <Form.Item label="API 地址" name="apiUrl">
              <Input placeholder="https://api.example.com/v1/chat/completions" />
            </Form.Item>
            <Form.Item label="API Key" name="apiKey">
              <Input.Password placeholder="输入 API Key" />
            </Form.Item>
            <Form.Item label="模型" name="model">
              <Select options={modelOptions} placeholder="选择模型" />
            </Form.Item>
            <Form.Item label="温度" name="temperature">
              <Select options={temperatureOptions} placeholder="选择温度值" />
            </Form.Item>
          </>
        );

      case 'tool':
        return (
          <>
            {commonFields}
            <Form.Item label="工具类型" name="toolType">
              <Select>
                <Select.Option value="audio-synthesis">音频合成</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="API Key" name="apiKey">
              <Input.Password placeholder="输入 API Key" />
            </Form.Item>
            <Form.Item label="模型" name="model">
              <Input placeholder="qwen3-tts-flash" />
            </Form.Item>
          </>
        );

      case 'output':
        return (
          <>
            {commonFields}
            <Form.Item label="输出格式" name="outputFormat">
              <Select>
                <Select.Option value="text">文本</Select.Option>
                <Select.Option value="audio">音频</Select.Option>
              </Select>
            </Form.Item>
          </>
        );

      default:
        return commonFields;
    }
  };

  // 输入配置 Tab（仅 LLM 和 Tool）
  const renderInputTab = () => {
    if (selectedNode.type === 'llm') {
      return (
        <div style={{ padding: '8px 0' }}>
          <Text type="secondary" style={{ fontSize: 13, marginBottom: 16, display: 'block' }}>
            配置 LLM 节点的输入参数，可引用上游节点输出
          </Text>
          <Form.List name="inputConfigs">
            {(fields, { add, remove }) => (
              <>
                {fields.length === 0 && (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无输入参数" />
                )}
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    style={{ marginBottom: 12 }}
                    extra={
                      <Popconfirm title="确认删除？" onConfirm={() => remove(field.name)}>
                        <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                      </Popconfirm>
                    }
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Form.Item
                        {...field}
                        label={`参数 ${index + 1} 名称`}
                        name={[field.name, 'paramName']}
                        rules={[{ required: true, message: '请输入参数名' }]}
                        style={{ marginBottom: 8 }}
                      >
                        <Input placeholder="如：content" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        label="参数类型"
                        name={[field.name, 'paramType']}
                        initialValue="input"
                        style={{ marginBottom: 8 }}
                      >
                        <Select>
                          <Select.Option value="input">直接输入</Select.Option>
                          <Select.Option value="reference">引用节点</Select.Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...field}
                        label="参数值"
                        name={[field.name, 'paramValue']}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="输入值或选择引用节点" />
                      </Form.Item>
                    </Space>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => add({ paramName: '', paramType: 'input', paramValue: '' })}
                >
                  添加输入参数
                </Button>
              </>
            )}
          </Form.List>
        </div>
      );
    }

    if (selectedNode.type === 'tool') {
      return (
        <div style={{ padding: '8px 0' }}>
          <Text type="secondary" style={{ fontSize: 13, marginBottom: 16, display: 'block' }}>
            配置音频合成的输入参数
          </Text>

          {/* 文本来源 */}
          <Card size="small" title="文本来源" style={{ marginBottom: 16 }}>
            <Form.Item name={['toolInputConfig', 'textType']} label="来源类型" initialValue="reference">
              <Select>
                <Select.Option value="input">直接输入</Select.Option>
                <Select.Option value="reference">引用节点</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name={['toolInputConfig', 'textValue']} label="文本内容">
              <TextArea rows={3} placeholder="输入要合成的文本内容" />
            </Form.Item>
            <Form.Item name={['toolInputConfig', 'textReferenceNode']} label="引用节点">
              <Select placeholder="选择引用节点" allowClear>
                {availableNodes.map((node) => (
                  <Select.Option key={node.id} value={node.id}>
                    {node.label} ({node.type})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Card>

          {/* 音色选择 */}
          <Card size="small" title="音色配置" style={{ marginBottom: 16 }}>
            <Form.Item name={['toolInputConfig', 'voice']} label="音色" initialValue="Cherry">
              <Select>
                <Select.Option value="Cherry">Cherry（女声-活力）</Select.Option>
                <Select.Option value="Serena">Serena（女声-温柔）</Select.Option>
                <Select.Option value="Amber">Amber（女声-自然）</Select.Option>
                <Select.Option value="Anna">Anna（女声-甜美）</Select.Option>
                <Select.Option value="Ethan">Ethan（男声-沉稳）</Select.Option>
                <Select.Option value="Adam">Adam（男声-磁性）</Select.Option>
                <Select.Option value="Daniel">Daniel（男声-成熟）</Select.Option>
                <Select.Option value="Harry">Harry（男声-年轻）</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name={['toolInputConfig', 'languageType']} label="语言类型" initialValue="Auto">
              <Select>
                <Select.Option value="Auto">自动检测</Select.Option>
                <Select.Option value="zh">中文</Select.Option>
                <Select.Option value="en">英文</Select.Option>
              </Select>
            </Form.Item>
          </Card>
        </div>
      );
    }

    return null;
  };

  // 输出配置 Tab
  const renderOutputTab = () => {
    if (selectedNode.type === 'input') return null;

    // 工具节点的输出配置
    if (selectedNode.type === 'tool') {
      return (
        <div style={{ padding: '8px 0' }}>
          <Text type="secondary" style={{ fontSize: 13, marginBottom: 16, display: 'block' }}>
            配置音频合成的输出参数
          </Text>
          <Card size="small" title="输出配置">
            <Form.Item
              name={['toolOutputConfig', 'voiceUrl']}
              label="音频 URL 变量名"
              initialValue="voice_url"
            >
              <Input placeholder="voice_url" />
            </Form.Item>
            <Text type="secondary" style={{ fontSize: 12 }}>
              用于存储合成后的音频 URL，可供后续节点引用
            </Text>
          </Card>
        </div>
      );
    }

    // LLM 和输出节点的输出配置
    return (
      <div style={{ padding: '8px 0' }}>
        <Text type="secondary" style={{ fontSize: 13, marginBottom: 16, display: 'block' }}>
          配置节点的输出参数
        </Text>
        <Form.List name="outputConfigs">
          {(fields, { add, remove }) => (
            <>
              {fields.length === 0 && (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无输出参数" />
              )}
              {fields.map((field, index) => (
                <Card
                  key={field.key}
                  size="small"
                  style={{ marginBottom: 12 }}
                  extra={
                    <Popconfirm title="确认删除？" onConfirm={() => remove(field.name)}>
                      <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Form.Item
                      {...field}
                      label={`输出 ${index + 1} 名称`}
                      name={[field.name, 'paramName']}
                      rules={[{ required: true, message: '请输入输出名' }]}
                      style={{ marginBottom: 8 }}
                    >
                      <Input placeholder="如：result" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      label="输出类型"
                      name={[field.name, 'paramType']}
                      initialValue="string"
                      style={{ marginBottom: 0 }}
                    >
                      <Select>
                        <Select.Option value="string">字符串</Select.Option>
                        <Select.Option value="number">数字</Select.Option>
                        <Select.Option value="boolean">布尔</Select.Option>
                        <Select.Option value="object">对象</Select.Option>
                      </Select>
                    </Form.Item>
                  </Space>
                </Card>
              ))}
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() => add({ paramName: '', paramType: 'string' })}
              >
                添加输出参数
              </Button>
            </>
          )}
        </Form.List>
      </div>
    );
  };

  // 高级配置 Tab
  const renderAdvancedTab = () => {
    if (selectedNode.type !== 'llm') {
      return (
        <Empty description="当前节点类型无高级配置" />
      );
    }

    return (
      <div style={{ padding: '8px 0' }}>
        <Form.Item
          label="系统提示词"
          name="prompt"
          extra="设定 AI 的角色和行为规范"
        >
          <TextArea
            rows={6}
            placeholder="例如：你是一位专业的播客节目编辑..."
          />
        </Form.Item>
        <Form.Item
          label="用户提示词模板"
          name="userPrompt"
          extra="使用 {{参数名}} 引用输入参数"
        >
          <TextArea
            rows={8}
            placeholder={`# 任务\n将原始内容改编为适合播客节目的逐字稿\n\n# 原始内容：{{input}}`}
          />
        </Form.Item>
      </div>
    );
  };

  // 构建 Tab 项
  const tabItems = [
    {
      key: 'basic',
      label: '基础',
      children: renderBasicTab(),
    },
  ];

  // LLM 节点：输入 + 高级 + 输出
  if (selectedNode.type === 'llm') {
    tabItems.push(
      {
        key: 'input',
        label: '输入',
        children: renderInputTab(),
      },
      {
        key: 'advanced',
        label: '高级',
        children: renderAdvancedTab(),
      }
    );
  }

  // 工具节点：输入 + 输出
  if (selectedNode.type === 'tool') {
    tabItems.push(
      {
        key: 'input',
        label: '输入',
        children: renderInputTab(),
      }
    );
  }

  // 非输入节点都有输出 Tab
  if (selectedNode.type !== 'input') {
    tabItems.push({
      key: 'output',
      label: '输出',
      children: renderOutputTab(),
    });
  }

  return (
    <div className="node-config-panel">
      {/* 头部 */}
      <div className="node-config-header">
        <div className="node-config-title">
          <div
            className="node-config-icon"
            style={{ background: nodeConfig.color }}
          >
            {nodeConfig.icon}
          </div>
          <div>
            <Title level={5} style={{ margin: 0, fontSize: 16 }}>
              节点配置
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {nodeConfig.label} · {selectedNode.id.slice(0, 8)}...
            </Text>
          </div>
        </div>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={handleClose}
          style={{ color: '#6b7280' }}
        />
      </div>

      {/* Tab 内容 */}
      <div className="node-config-body">
        <Form form={form} layout="vertical" size="middle">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            style={{ marginBottom: 0 }}
          />
        </Form>
      </div>

      {/* 底部按钮 */}
      <div className="node-config-footer">
        <Button onClick={handleClose} style={{ flex: 1 }}>
          取消
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          style={{ flex: 1 }}
        >
          保存配置
        </Button>
      </div>
    </div>
  );
};

export default NodeConfigPanel;
