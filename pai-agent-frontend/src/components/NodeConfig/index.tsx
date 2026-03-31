import React, { useState } from 'react';
import { Form, Input, Select, Button, Typography, Divider, Space, Checkbox, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useWorkflowStore } from '../../stores/workflowStore';

const { TextArea } = Input;
const { Text, Title } = Typography;

const NodeConfigPanel: React.FC = () => {
  const [form] = Form.useForm();
  const { selectedNode, setConfigDrawerOpen, updateNode, setSelectedNode, nodes, edges } = useWorkflowStore();
  const [outputConfigs, setOutputConfigs] = useState<any[]>([]);
  const [contentTemplate, setContentTemplate] = useState<string>('');

  // 获取可用的引用节点（除当前输出节点外的所有节点）
  const getAvailableNodes = () => {
    if (!selectedNode) return [];
    return nodes.filter((n: any) => n.id !== selectedNode.id).map((n: any) => ({
      id: n.id,
      label: n.data?.label || '未命名节点',
      type: n.type,
    }));
  };

  // 添加输出配置行
  const handleAddOutputConfig = () => {
    setOutputConfigs([
      ...outputConfigs,
      { id: Date.now(), paramName: '', paramType: 'input', inputValue: '', referenceNode: '', referenceField: '' },
    ]);
  };

  // 删除输出配置行
  const handleRemoveOutputConfig = (id: number) => {
    setOutputConfigs(outputConfigs.filter((item) => item.id !== id));
  };

  // 更新输出配置行
  const handleUpdateOutputConfig = (id: number, field: string, value: string) => {
    setOutputConfigs(
      outputConfigs.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  React.useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue({
        label: selectedNode.data?.label,
        model: selectedNode.data?.model,
        apiUrl: selectedNode.data?.apiUrl,
        apiKey: selectedNode.data?.apiKey,
        temperature: selectedNode.data?.temperature !== undefined ? selectedNode.data?.temperature : 0.7,
        prompt: selectedNode.data?.prompt,
        toolType: selectedNode.data?.toolType,
        voice: selectedNode.data?.voice,
        outputFormat: selectedNode.data?.outputFormat,
        variableName: selectedNode.data?.variableName || 'user_input',
        variableType: selectedNode.data?.variableType || 'String',
        description: selectedNode.data?.description || '用户本轮的输入内容',
        required: selectedNode.data?.required !== false,
      });
      // 加载输出配置
      const data = selectedNode.data as any;
      if (data.outputConfigs) {
        setOutputConfigs(data.outputConfigs);
      }
      if (data.contentTemplate) {
        setContentTemplate(data.contentTemplate);
      }
    } else {
      form.resetFields();
      setOutputConfigs([]);
      setContentTemplate('');
    }
  }, [selectedNode, form]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (selectedNode) {
        // 保存输出配置和内容模板
        const updatedData: any = { ...values };
        if (selectedNode.type === 'output') {
          updatedData.outputConfigs = outputConfigs;
          updatedData.contentTemplate = contentTemplate;
        }
        updateNode(selectedNode.id, updatedData);
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

          {/* 输入节点配置 */}
          {selectedNode.type === 'input' && (
            <>
              <Divider style={{ margin: '16px 0' }} />

              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>
                  输入变量配置
                </Text>

                {/* 变量名 */}
                <Form.Item
                  label="变量名"
                  name="variableName"
                  initialValue="user_input"
                  rules={[{ required: true, message: '请输入变量名' }]}
                >
                  <Input placeholder="例如：user_input" disabled />
                </Form.Item>

                {/* 变量类型 */}
                <Form.Item
                  label="变量类型"
                  name="variableType"
                  initialValue="String"
                  rules={[{ required: true, message: '请选择变量类型' }]}
                >
                  <Select disabled>
                    <Select.Option value="String">String</Select.Option>
                    <Select.Option value="Number">Number</Select.Option>
                    <Select.Option value="Boolean">Boolean</Select.Option>
                    <Select.Option value="Object">Object</Select.Option>
                    <Select.Option value="Array">Array</Select.Option>
                  </Select>
                </Form.Item>

                {/* 描述 */}
                <Form.Item
                  label="描述"
                  name="description"
                  initialValue="用户本轮的输入内容"
                  rules={[{ required: true, message: '请输入描述' }]}
                >
                  <TextArea
                    rows={2}
                    placeholder="例如：用户本轮的输入内容"
                  />
                </Form.Item>

                {/* 是否必要 */}
                <Form.Item
                  label="是否必要"
                  name="required"
                  initialValue={true}
                  valuePropName="checked"
                >
                  <Checkbox disabled />
                </Form.Item>
              </div>
            </>
          )}

          {/* 大模型节点配置 */}
          {selectedNode.type === 'llm' && (
            <>
              <Divider style={{ margin: '16px 0' }} />

              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>
                  基础配置
                </Text>

                {/* 接口地址 */}
                <Form.Item
                  label="接口地址"
                  name="apiUrl"
                  rules={[{ required: true, message: '请输入接口地址' }]}
                >
                  <Input placeholder="例如：https://api.deepseek.com/v1/chat/completions" />
                </Form.Item>

                {/* API 密钥 */}
                <Form.Item
                  label="API 密钥"
                  name="apiKey"
                  rules={[{ required: true, message: '请输入 API 密钥' }]}
                >
                  <Input.Password placeholder="请输入 API 密钥" />
                </Form.Item>

                {/* 模型选择 */}
                <Form.Item
                  label="模型名称"
                  name="model"
                  rules={[{ required: true, message: '请选择或输入模型名称' }]}
                >
                  <Select
                    showSearch
                    allowClear
                    placeholder="选择或输入模型名称"
                  >
                    <Select.Option value="qwen-max">通义千问-Max</Select.Option>
                    <Select.Option value="qwen-plus">通义千问-Plus</Select.Option>
                    <Select.Option value="qwen-turbo">通义千问-Turbo</Select.Option>
                    <Select.Option value="deepseek-chat">DeepSeek Chat</Select.Option>
                    <Select.Option value="deepseek-coder">DeepSeek Coder</Select.Option>
                    <Select.Option value="ai-ping">AI Ping</Select.Option>
                    <Select.Option value="zhipu-chat">智谱 AI</Select.Option>
                  </Select>
                </Form.Item>

                {/* 温度参数 */}
                <Form.Item
                  label="温度 (Temperature)"
                  name="temperature"
                  initialValue={0.7}
                  rules={[{ required: true, message: '请设置温度值' }]}
                  extra="控制输出随机性，范围 0-2，值越大输出越多样"
                >
                  <Select>
                    <Select.Option value={0}>0 - 确定性最高</Select.Option>
                    <Select.Option value={0.3}>0.3 - 较低随机性</Select.Option>
                    <Select.Option value={0.5}>0.5 - 适中</Select.Option>
                    <Select.Option value={0.7}>0.7 - 默认推荐</Select.Option>
                    <Select.Option value={1}>1 - 较高随机性</Select.Option>
                    <Select.Option value={1.5}>1.5 - 高随机性</Select.Option>
                    <Select.Option value={2}>2 - 完全随机</Select.Option>
                  </Select>
                </Form.Item>
              </div>

              <Divider style={{ margin: '16px 0' }} />

              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>
                  提示词配置
                </Text>

                {/* 系统提示词 */}
                <Form.Item label="系统提示词" name="prompt">
                  <TextArea
                    rows={4}
                    placeholder="请输入系统提示词，用于设定 AI 角色..."
                  />
                </Form.Item>
              </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text strong>输出配置</Text>
                  <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddOutputConfig}>
                    添加
                  </Button>
                </div>

                {outputConfigs.length === 0 && (
                  <div style={{ color: '#999', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                    暂无输出配置，请点击"添加"按钮添加
                  </div>
                )}

                {outputConfigs.map((item) => (
                  <Space
                    key={item.id}
                    size="small"
                    style={{
                      marginBottom: 8,
                      padding: '8px',
                      background: '#fafafa',
                      borderRadius: 6,
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    {/* 参数名输入框 */}
                    <Input
                      placeholder="参数名"
                      value={item.paramName}
                      onChange={(e) => handleUpdateOutputConfig(item.id, 'paramName', e.target.value)}
                      style={{ width: 100 }}
                      size="small"
                    />
                    {/* 参数类型 */}
                    <Select
                      value={item.paramType}
                      onChange={(value) => handleUpdateOutputConfig(item.id, 'paramType', value)}
                      style={{ width: 70 }}
                      size="small"
                    >
                      <Select.Option value="input">输入</Select.Option>
                      <Select.Option value="reference">引用</Select.Option>
                    </Select>
                    {/* 输入或引用 */}
                    {item.paramType === 'input' ? (
                      <Input
                        placeholder="请输入"
                        value={item.inputValue}
                        onChange={(e) => handleUpdateOutputConfig(item.id, 'inputValue', e.target.value)}
                        style={{ width: 180 }}
                        size="small"
                      />
                    ) : (
                      <Select
                        placeholder="选择引用"
                        value={item.referenceNode || undefined}
                        onChange={(value) => handleUpdateOutputConfig(item.id, 'referenceNode', value)}
                        style={{ width: 180 }}
                        size="small"
                      >
                        {getAvailableNodes().map((node) => (
                          <Select.Option key={node.id} value={node.id}>
                            {node.label}
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                    {/* 删除按钮 */}
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveOutputConfig(item.id)}
                    />
                  </Space>
                ))}
              </div>

              {/* 回答内容配置 */}
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  回答内容配置
                </Text>
                <TextArea
                  rows={4}
                  value={contentTemplate}
                  onChange={(e) => setContentTemplate(e.target.value)}
                  placeholder="使用 {{ 参数名 }} 引用上面定义的参数"
                />
                <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                  💡 提示：使用 {'{{'} 参数名 {'}}'} 引用上面定义的参数，例如：{`{{output}}`}
                </Text>
              </div>

              {/* 已定义的参数列表 */}
              {outputConfigs.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    已定义的参数
                  </Text>
                  <Space wrap>
                    {outputConfigs.map((item) => (
                      <Tag key={item.id} color="blue" style={{ cursor: 'pointer' }}>
                        {`{{${item.paramName || '未命名'}}}`}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}
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
