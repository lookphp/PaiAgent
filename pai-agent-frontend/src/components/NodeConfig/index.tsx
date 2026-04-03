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
  const [inputConfigs, setInputConfigs] = useState<any[]>([]);
  const [outputParamConfigs, setOutputParamConfigs] = useState<any[]>([]);
  const [contentTemplate, setContentTemplate] = useState<string>('');

  // 工具节点输入参数配置
  const [toolInputConfig, setToolInputConfig] = useState<{
    textType: 'input' | 'reference';
    textValue: string;
    textReferenceNode: string;
    voice: string;
    languageType: string;
  }>({
    textType: 'input',
    textValue: '',
    textReferenceNode: '',
    voice: 'Cherry',
    languageType: 'Auto',
  });

  // 获取可用的引用节点（除当前 LLM 节点外的所有节点）
  const getAvailableNodes = () => {
    if (!selectedNode) return [];
    return nodes.filter((n: any) => n.id !== selectedNode.id).map((n: any) => ({
      id: n.id,
      label: n.data?.label || '未命名节点',
      type: n.type,
      data: n.data,
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

  // 添加输入配置行
  const handleAddInputConfig = () => {
    setInputConfigs([
      ...inputConfigs,
      { id: Date.now(), paramName: '', paramType: 'input', inputValue: '', referenceNode: '' },
    ]);
  };

  // 删除输入配置行
  const handleRemoveInputConfig = (id: number) => {
    setInputConfigs(inputConfigs.filter((item) => item.id !== id));
  };

  // 更新输入配置行
  const handleUpdateInputConfig = (id: number, field: string, value: string) => {
    setInputConfigs(
      inputConfigs.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // 添加输出参数配置行
  const handleAddOutputParamConfig = () => {
    setOutputParamConfigs([
      ...outputParamConfigs,
      { id: Date.now(), variableName: '', variableType: 'String', description: '' },
    ]);
  };

  // 删除输出参数配置行
  const handleRemoveOutputParamConfig = (id: number) => {
    setOutputParamConfigs(outputParamConfigs.filter((item) => item.id !== id));
  };

  // 更新输出参数配置行
  const handleUpdateOutputParamConfig = (id: number, field: string, value: string) => {
    setOutputParamConfigs(
      outputParamConfigs.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  React.useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue({
        label: selectedNode.data?.label,
        model: selectedNode.data?.model || (selectedNode.type === 'tool' ? 'qwen3-tts-flash' : undefined),
        apiUrl: selectedNode.data?.apiUrl,
        apiKey: selectedNode.data?.apiKey,
        temperature: selectedNode.data?.temperature !== undefined ? selectedNode.data?.temperature : 0.7,
        prompt: selectedNode.data?.prompt,
        userPrompt: selectedNode.data?.userPrompt,
        inputVariable: selectedNode.data?.inputVariable,
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
      // 加载输入配置
      if (data.inputConfigs) {
        setInputConfigs(data.inputConfigs);
      }
      // 加载输出参数配置
      if (data.outputParamConfigs) {
        setOutputParamConfigs(data.outputParamConfigs);
      }
      // 加载工具节点输入参数配置
      if (data.toolInputConfig) {
        setToolInputConfig(data.toolInputConfig);
      }
    } else {
      form.resetFields();
      setOutputConfigs([]);
      setInputConfigs([]);
      setOutputParamConfigs([]);
      setContentTemplate('');
      setToolInputConfig({
        textType: 'input',
        textValue: '',
        textReferenceNode: '',
        voice: 'Cherry',
        languageType: 'Auto',
      });
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
        // 保存输入配置和输出参数配置（LLM 节点）
        if (selectedNode.type === 'llm') {
          updatedData.inputConfigs = inputConfigs;
          updatedData.outputParamConfigs = outputParamConfigs;
        }
        // 保存工具节点输入参数配置
        if (selectedNode.type === 'tool') {
          updatedData.toolInputConfig = toolInputConfig;
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
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 0',
            borderBottom: '1px solid #e2e8f0',
            marginBottom: 24,
          }}
        >
          <Title level={4} style={{ margin: 0, color: '#1e293b' }}>节点配置</Title>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 48, opacity: 0.3 }}>🔧</div>
          <Text style={{ fontSize: 14 }}>请点击节点进行配置</Text>
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
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        }}
      >
        <div>
          <Title level={5} style={{ margin: 0, color: '#1e293b' }}>节点配置</Title>
          <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
            {selectedNode.type} · {selectedNode.id}
          </Text>
        </div>
        <Button size="small" onClick={handleClose} style={{ borderRadius: 4 }}>关闭</Button>
      </div>

      {/* 配置内容 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <Form form={form} layout="vertical" size="large">
          {/* 节点 ID */}
          <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>节点 ID</Text>
            <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
              {selectedNode.id}
            </div>
          </div>

          {/* 节点类型 */}
          <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>节点类型</Text>
            <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: '#0369a1' }}>
              <Tag color="blue" style={{ fontSize: 12 }}>{selectedNode.type}</Tag>
            </div>
          </div>

          <Divider style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

          {/* 节点名称 */}
          <Form.Item
            label={<span style={{ fontWeight: 500, color: '#374151' }}>节点名称</span>}
            name="label"
            rules={[{ required: true, message: '请输入节点名称' }]}
          >
            <Input placeholder="请输入节点名称" style={{ borderRadius: 6 }} />
          </Form.Item>

          {/* 输入节点配置 */}
          {selectedNode.type === 'input' && (
            <>
              <Divider style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: 'block', marginBottom: 16, color: '#1e293b', fontSize: 14 }}>
                  输入变量配置
                </Text>

                {/* 变量名 */}
                <Form.Item
                  label={<span style={{ fontWeight: 500, color: '#374151' }}>变量名</span>}
                  name="variableName"
                  initialValue="user_input"
                  rules={[{ required: true, message: '请输入变量名' }]}
                >
                  <Input placeholder="例如：user_input" disabled style={{ borderRadius: 6, backgroundColor: '#f8fafc' }} />
                </Form.Item>

                {/* 变量类型 */}
                <Form.Item
                  label={<span style={{ fontWeight: 500, color: '#374151' }}>变量类型</span>}
                  name="variableType"
                  initialValue="String"
                  rules={[{ required: true, message: '请选择变量类型' }]}
                >
                  <Select disabled style={{ borderRadius: 6 }}>
                    <Select.Option value="String">String</Select.Option>
                    <Select.Option value="Number">Number</Select.Option>
                    <Select.Option value="Boolean">Boolean</Select.Option>
                    <Select.Option value="Object">Object</Select.Option>
                    <Select.Option value="Array">Array</Select.Option>
                  </Select>
                </Form.Item>

                {/* 描述 */}
                <Form.Item
                  label={<span style={{ fontWeight: 500, color: '#374151' }}>描述</span>}
                  name="description"
                  initialValue="用户本轮的输入内容"
                  rules={[{ required: true, message: '请输入描述' }]}
                >
                  <TextArea
                    rows={2}
                    placeholder="例如：用户本轮的输入内容"
                    style={{ borderRadius: 6 }}
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
              <Divider style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: 'block', marginBottom: 16, color: '#1e293b', fontSize: 14 }}>
                  基础配置
                </Text>

                {/* 接口地址 */}
                <Form.Item
                  label={<span style={{ fontWeight: 500, color: '#374151' }}>接口地址</span>}
                  name="apiUrl"
                  rules={[{ required: true, message: '请输入接口地址' }]}
                >
                  <Input placeholder="例如：https://api.deepseek.com/v1/chat/completions" style={{ borderRadius: 6 }} />
                </Form.Item>

                {/* API 密钥 */}
                <Form.Item
                  label={<span style={{ fontWeight: 500, color: '#374151' }}>API 密钥</span>}
                  name="apiKey"
                  rules={[{ required: true, message: '请输入 API 密钥' }]}
                >
                  <Input.Password placeholder="请输入 API 密钥" style={{ borderRadius: 6 }} />
                </Form.Item>

                {/* 模型选择 */}
                <Form.Item
                  label={<span style={{ fontWeight: 500, color: '#374151' }}>模型名称</span>}
                  name="model"
                  rules={[{ required: true, message: '请选择或输入模型名称' }]}
                >
                  <Select
                    showSearch
                    allowClear
                    placeholder="选择或输入模型名称"
                    style={{ borderRadius: 6 }}
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
                  label={<span style={{ fontWeight: 500, color: '#374151' }}>温度 (Temperature)</span>}
                  name="temperature"
                  initialValue={0.7}
                  rules={[{ required: true, message: '请设置温度值' }]}
                  extra={<span style={{ color: '#6b7280', fontSize: 12 }}>控制输出随机性，范围 0-2，值越大输出越多样</span>}
                >
                  <Select style={{ borderRadius: 6 }}>
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

              <Divider style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

              {/* 输入参数配置 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text strong style={{ color: '#1e293b', fontSize: 14 }}>输入参数配置</Text>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={handleAddInputConfig}
                    style={{ borderRadius: 4, background: '#3b82f6' }}
                  >
                    添加参数
                  </Button>
                </div>

                {inputConfigs.length === 0 && (
                  <div style={{
                    color: '#94a3b8',
                    fontSize: 13,
                    textAlign: 'center',
                    padding: '24px 0',
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px dashed #cbd5e1',
                  }}>
                    暂无输入参数，请点击"添加参数"按钮添加
                  </div>
                )}

                {inputConfigs.map((item, index) => (
                  <Space
                    key={item.id}
                    size="small"
                    style={{
                      marginBottom: 10,
                      padding: '10px 12px',
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* 序号 */}
                    <div style={{
                      width: 24,
                      height: 24,
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: 12,
                      paddingTop: 4,
                      fontWeight: 500,
                      backgroundColor: '#e2e8f0',
                      borderRadius: '50%',
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </div>

                    {/* 参数名输入框 */}
                    <Input
                      placeholder="参数名"
                      value={item.paramName}
                      onChange={(e) => handleUpdateInputConfig(item.id, 'paramName', e.target.value)}
                      style={{ width: 100, borderRadius: 6 }}
                      size="small"
                    />

                    {/* 参数类型 */}
                    <Select
                      value={item.paramType}
                      onChange={(value) => handleUpdateInputConfig(item.id, 'paramType', value)}
                      style={{ width: 90, borderRadius: 6 }}
                      size="small"
                    >
                      <Select.Option value="input">直接输入</Select.Option>
                      <Select.Option value="reference">引用节点</Select.Option>
                    </Select>

                    {/* 输入或引用 */}
                    {item.paramType === 'input' ? (
                      <Input
                        placeholder="请输入参数值"
                        value={item.inputValue}
                        onChange={(e) => handleUpdateInputConfig(item.id, 'inputValue', e.target.value)}
                        style={{ width: 200, flex: 1, borderRadius: 6 }}
                        size="small"
                      />
                    ) : (
                      <Select
                        placeholder="选择引用节点"
                        value={item.referenceNode || undefined}
                        onChange={(value) => handleUpdateInputConfig(item.id, 'referenceNode', value)}
                        style={{ width: 200, flex: 1, borderRadius: 6 }}
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
                      onClick={() => handleRemoveInputConfig(item.id)}
                      style={{ marginTop: 2 }}
                    />
                  </Space>
                ))}

                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12, color: '#6b7280' }}>
                  💡 提示：参数名将在用户提示词中使用 {'{{'}参数名{'}}'} 的方式引用
                </Text>
              </div>

              {/* 输出参数配置 */}
              <Divider style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text strong style={{ color: '#1e293b', fontSize: 14 }}>输出参数配置</Text>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={handleAddOutputParamConfig}
                    style={{ borderRadius: 4, background: '#3b82f6' }}
                  >
                    添加输出参数
                  </Button>
                </div>

                {outputParamConfigs.length === 0 && (
                  <div style={{
                    color: '#94a3b8',
                    fontSize: 13,
                    textAlign: 'center',
                    padding: '24px 0',
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px dashed #cbd5e1',
                  }}>
                    暂无输出参数，请点击"添加输出参数"按钮添加
                  </div>
                )}

                {outputParamConfigs.map((item, index) => (
                  <Space
                    key={item.id}
                    size="small"
                    style={{
                      marginBottom: 10,
                      padding: '10px 12px',
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      alignItems: 'flex-start',
                      width: '100%',
                    }}
                  >
                    {/* 序号 */}
                    <div style={{
                      width: 24,
                      height: 24,
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: 12,
                      paddingTop: 4,
                      fontWeight: 500,
                      backgroundColor: '#e2e8f0',
                      borderRadius: '50%',
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </div>

                    {/* 变量名 */}
                    <Form.Item style={{ flex: 1, marginBottom: 0 }}>
                      <Input
                        placeholder="变量名"
                        value={item.variableName}
                        onChange={(e) => handleUpdateOutputParamConfig(item.id, 'variableName', e.target.value)}
                        size="small"
                        style={{ borderRadius: 6 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Form.Item>

                    {/* 变量类型 */}
                    <Form.Item style={{ width: 110, marginBottom: 0 }}>
                      <Select
                        value={item.variableType}
                        onChange={(value) => handleUpdateOutputParamConfig(item.id, 'variableType', value)}
                        size="small"
                        style={{ width: '100%', borderRadius: 6 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select.Option value="String">String</Select.Option>
                        <Select.Option value="Number">Number</Select.Option>
                        <Select.Option value="Boolean">Boolean</Select.Option>
                        <Select.Option value="Object">Object</Select.Option>
                        <Select.Option value="Array">Array</Select.Option>
                      </Select>
                    </Form.Item>

                    {/* 描述 */}
                    <Form.Item style={{ flex: 2, marginBottom: 0 }}>
                      <Input
                        placeholder="描述（可选）"
                        value={item.description}
                        onChange={(e) => handleUpdateOutputParamConfig(item.id, 'description', e.target.value)}
                        size="small"
                        style={{ borderRadius: 6 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Form.Item>

                    {/* 删除按钮 */}
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveOutputParamConfig(item.id)}
                    />
                  </Space>
                ))}

                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12, color: '#6b7280' }}>
                  💡 提示：输出参数将作为 LLM 节点的回答结果，可供后续节点引用
                </Text>
              </div>

              <Divider style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: 'block', marginBottom: 16, color: '#1e293b', fontSize: 14 }}>
                  提示词配置
                </Text>

                {/* 系统提示词 */}
                <Form.Item
                  label={<span style={{ fontWeight: 500, color: '#374151' }}>系统提示词</span>}
                  name="prompt"
                  extra={<span style={{ color: '#6b7280', fontSize: 12 }}>设定 AI 的角色和行为规范</span>}
                >
                  <TextArea
                    rows={4}
                    placeholder="例如：你是一位专业的广播节目编辑..."
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>

                {/* 用户提示词 */}
                <Form.Item
                  label={<span style={{ fontWeight: 500, color: '#374151' }}>用户提示词模板</span>}
                  name="userPrompt"
                  extra={<span style={{ color: '#6b7280', fontSize: 12 }}>使用 {'{{'}参数名{'}}'} 引用上面定义的参数</span>}
                >
                  <TextArea
                    rows={6}
                    placeholder={`# 任务&#10;将原始内容改编为适合播客节目的逐字稿&#10;&#10;# 原始内容：{{input}}`}
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>

                {/* 已定义的参数列表 */}
                {inputConfigs.length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    padding: '14px 16px',
                    borderRadius: 8,
                    marginBottom: 16,
                    border: '1px solid #bfdbfe',
                  }}>
                    <Text strong style={{ display: 'block', marginBottom: 10, color: '#1e40af' }}>
                      💡 可用参数 (点击插入)
                    </Text>
                    <Space wrap>
                      {inputConfigs.map((item) => (
                        <Tag
                          key={item.id}
                          color="blue"
                          style={{
                            cursor: 'pointer',
                            fontSize: 12,
                            padding: '4px 10px',
                            borderRadius: 4,
                          }}
                          onClick={() => {
                            const textarea = document.querySelector('textarea[aria-label="用户提示词模板"]') as HTMLTextAreaElement;
                            if (textarea) {
                              const startPos = textarea.selectionStart;
                              const endPos = textarea.selectionEnd;
                              const value = textarea.value;
                              const insertText = `{{${item.paramName || '未命名'}}}`;
                              textarea.value = value.substring(0, startPos) + insertText + value.substring(endPos);
                              // 触发 onChange 事件
                              textarea.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                          }}
                        >
                          {`{{${item.paramName || '未命名'}}}`}
                        </Tag>
                      ))}
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 10, color: '#6b7280' }}>
                      点击参数标签可插入到上方提示词模板的光标位置
                    </Text>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 工具节点配置 */}
          {selectedNode.type === 'tool' && (
            <>
              <Divider style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: 'block', marginBottom: 16, color: '#1e293b', fontSize: 14 }}>
                  基础配置
                </Text>

                {/* 工具类型 */}
                <Form.Item
                  label={<span style={{ fontWeight: 500, color: '#374151' }}>工具类型</span>}
                  name="toolType"
                  rules={[{ required: true, message: '请选择工具类型' }]}
                >
                  <Select style={{ borderRadius: 6 }}>
                    <Select.Option value="audio-synthesis">
                      超拟人音频合成
                    </Select.Option>
                  </Select>
                </Form.Item>

                {/* API Key */}
                <Form.Item
                  label={<span style={{ fontWeight: 500, color: '#374151' }}>API Key</span>}
                  name="apiKey"
                  rules={[{ required: true, message: '请输入 API Key' }]}
                  extra={<span style={{ color: '#6b7280', fontSize: 12 }}>音频合成服务的 API 密钥</span>}
                >
                  <Input.Password placeholder="请输入 API Key" style={{ borderRadius: 6 }} />
                </Form.Item>

                {/* 模型名称 */}
                <Form.Item
                  label={<span style={{ fontWeight: 500, color: '#374151' }}>模型名称</span>}
                  name="model"
                  initialValue="qwen3-tts-flash"
                  rules={[{ required: true, message: '请输入模型名称' }]}
                  extra={<span style={{ color: '#6b7280', fontSize: 12 }}>默认使用 qwen3-tts-flash 模型</span>}
                >
                  <Input placeholder="qwen3-tts-flash" style={{ borderRadius: 6 }} />
                </Form.Item>
              </div>

              <Divider style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

              {/* 输入参数配置 */}
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: 'block', marginBottom: 16, color: '#1e293b', fontSize: 14 }}>
                  输入参数配置
                </Text>

                {/* text 参数 */}
                <div style={{
                  marginBottom: 16,
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <Tag color="blue" style={{ marginRight: 8 }}>text</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>待合成的文本内容</Text>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Select
                      value={toolInputConfig.textType}
                      onChange={(value) => setToolInputConfig({ ...toolInputConfig, textType: value })}
                      style={{ width: 100, borderRadius: 6 }}
                    >
                      <Select.Option value="input">直接输入</Select.Option>
                      <Select.Option value="reference">引用节点</Select.Option>
                    </Select>
                    {toolInputConfig.textType === 'input' ? (
                      <TextArea
                        value={toolInputConfig.textValue}
                        onChange={(e) => setToolInputConfig({ ...toolInputConfig, textValue: e.target.value })}
                        placeholder="请输入要合成的文本内容"
                        rows={3}
                        style={{ flex: 1, borderRadius: 6 }}
                      />
                    ) : (
                      <Select
                        value={toolInputConfig.textReferenceNode || undefined}
                        onChange={(value) => setToolInputConfig({ ...toolInputConfig, textReferenceNode: value })}
                        placeholder="选择引用节点"
                        style={{ flex: 1, borderRadius: 6 }}
                        allowClear
                      >
                        {getAvailableNodes().map((node) => (
                          <Select.Option key={node.id} value={node.id}>
                            {node.label} ({node.type})
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                  </div>
                </div>

                {/* voice 参数 */}
                <div style={{
                  marginBottom: 16,
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <Tag color="purple" style={{ marginRight: 8 }}>voice</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>音色选择</Text>
                  </div>
                  <Select
                    value={toolInputConfig.voice}
                    onChange={(value) => setToolInputConfig({ ...toolInputConfig, voice: value })}
                    style={{ width: '100%', borderRadius: 6 }}
                  >
                    <Select.Option value="Cherry">Cherry</Select.Option>
                    <Select.Option value="Serena">Serena</Select.Option>
                    <Select.Option value="Ethan">Ethan</Select.Option>
                  </Select>
                </div>

                {/* language_type 参数 */}
                <div style={{
                  marginBottom: 16,
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <Tag color="green" style={{ marginRight: 8 }}>language_type</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>语言类型</Text>
                  </div>
                  <Select
                    value={toolInputConfig.languageType}
                    onChange={(value) => setToolInputConfig({ ...toolInputConfig, languageType: value })}
                    style={{ width: '100%', borderRadius: 6 }}
                  >
                    <Select.Option value="Auto">Auto</Select.Option>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* 输出节点配置 */}
          {selectedNode.type === 'output' && (
            <>
              <Divider style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

              {/* 输出配置 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text strong style={{ color: '#1e293b', fontSize: 14 }}>输出配置</Text>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={handleAddOutputConfig}
                    style={{ borderRadius: 4, background: '#3b82f6' }}
                  >
                    添加
                  </Button>
                </div>

                {outputConfigs.length === 0 && (
                  <div style={{
                    color: '#94a3b8',
                    fontSize: 13,
                    textAlign: 'center',
                    padding: '24px 0',
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px dashed #cbd5e1',
                  }}>
                    暂无输出配置，请点击"添加"按钮添加
                  </div>
                )}

                {outputConfigs.map((item) => (
                  <Space
                    key={item.id}
                    size="small"
                    style={{
                      marginBottom: 10,
                      padding: '10px 12px',
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    {/* 参数名输入框 */}
                    <Input
                      placeholder="参数名"
                      value={item.paramName}
                      onChange={(e) => handleUpdateOutputConfig(item.id, 'paramName', e.target.value)}
                      style={{ width: 100, borderRadius: 6 }}
                      size="small"
                    />
                    {/* 参数类型 */}
                    <Select
                      value={item.paramType}
                      onChange={(value) => handleUpdateOutputConfig(item.id, 'paramType', value)}
                      style={{ width: 80, borderRadius: 6 }}
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
                        style={{ width: 180, borderRadius: 6 }}
                        size="small"
                      />
                    ) : (
                      <Select
                        placeholder="选择引用"
                        value={item.referenceNode || undefined}
                        onChange={(value) => handleUpdateOutputConfig(item.id, 'referenceNode', value)}
                        style={{ width: 180, borderRadius: 6 }}
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
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: 'block', marginBottom: 12, color: '#1e293b', fontSize: 14 }}>
                  回答内容配置
                </Text>
                <TextArea
                  rows={4}
                  value={contentTemplate}
                  onChange={(e) => setContentTemplate(e.target.value)}
                  placeholder="使用 {{ 参数名 }} 引用上面定义的参数"
                  style={{ borderRadius: 6 }}
                />
                <Text type="secondary" style={{ fontSize: 12, marginTop: 10, display: 'block', color: '#6b7280' }}>
                  💡 提示：使用 {'{{'} 参数名 {'}}'} 引用上面定义的参数，例如：{`{{output}}`}
                </Text>
              </div>

              {/* 已定义的参数列表 */}
              {outputConfigs.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <Text strong style={{ display: 'block', marginBottom: 12, color: '#1e293b', fontSize: 14 }}>
                    已定义的参数
                  </Text>
                  <Space wrap>
                    {outputConfigs.map((item) => (
                      <Tag
                        key={item.id}
                        color="blue"
                        style={{
                          cursor: 'pointer',
                          fontSize: 12,
                          padding: '4px 10px',
                          borderRadius: 4,
                        }}
                      >
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
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
        }}
      >
        <Button
          type="primary"
          block
          size="large"
          onClick={handleSave}
          style={{
            borderRadius: 8,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            height: 44,
            fontSize: 15,
          }}
        >
          保存配置
        </Button>
      </div>
    </div>
  );
};

export default NodeConfigPanel;
