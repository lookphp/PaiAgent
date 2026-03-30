import React from 'react';
import { Drawer, Form, Input, Select, Space, Button, Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useWorkflowStore } from '../../stores/workflowStore';

const { TextArea } = Input;
const { Text } = Typography;

interface NodeConfigDrawerProps {}

const NodeConfigDrawer: React.FC<NodeConfigDrawerProps> = () => {
  const {
    configDrawerOpen,
    selectedNode,
    setConfigDrawerOpen,
    updateNode,
  } = useWorkflowStore();

  const [form] = Form.useForm();

  React.useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue({
        label: selectedNode.data?.label,
        model: selectedNode.data?.model,
        prompt: selectedNode.data?.prompt,
        toolType: selectedNode.data?.toolType,
      });
    }
  }, [selectedNode, form]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (selectedNode) {
        updateNode(selectedNode.id, values);
        setConfigDrawerOpen(false);
      }
    });
  };

  const handleClose = () => {
    setConfigDrawerOpen(false);
  };

  return (
    <Drawer
      title={
        <span>
          <SettingOutlined /> 节点配置
        </span>
      }
      placement="right"
      width={360}
      open={configDrawerOpen}
      onClose={handleClose}
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={handleClose}>取消</Button>
          <Button type="primary" onClick={handleSave}>
            保存配置
          </Button>
        </Space>
      }
    >
      {selectedNode ? (
        <Form form={form} layout="vertical">
          <Form.Item
            label="节点名称"
            name="label"
            rules={[{ required: true, message: '请输入节点名称' }]}
          >
            <Input placeholder="请输入节点名称" />
          </Form.Item>

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

          {selectedNode.type === 'output' && (
            <Form.Item label="输出格式" name="outputFormat">
              <Select>
                <Select.Option value="text">纯文本</Select.Option>
                <Select.Option value="audio">音频</Select.Option>
                <Select.Option value="both">文本 + 音频</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      ) : (
        <Text type="secondary">
          请点击节点进行配置
        </Text>
      )}
    </Drawer>
  );
};

export default NodeConfigDrawer;
