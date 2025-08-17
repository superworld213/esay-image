import React, { useState, useEffect } from 'react';
import { 
  Form, 
  InputNumber, 
  Slider, 
  ColorPicker, 
  Select, 
  Input, 
  Button, 
  Divider,
  Space
} from 'antd';
import { Canvas as FabricCanvas, Object as FabricObject, Text as FabricText } from 'fabric';
import type { Color } from 'antd/es/color-picker';

interface PropertyPanelProps {
  selectedObject?: FabricObject | null;
  canvas?: FabricCanvas | null;
  availableFonts?: string[];
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ 
  selectedObject, 
  canvas,
  availableFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New']
}) => {
  const [objectType, setObjectType] = useState<string>('');

  // 监听选中对象变化
  useEffect(() => {
    if (!selectedObject) {
      setObjectType('');
      return;
    }

    const type = selectedObject.get('type');
    setObjectType(type);
  }, [selectedObject]);

  // 处理属性变化
  const handlePropertyChange = (field: string, value: any) => {
    if (!selectedObject || !canvas) return;

    try {
      switch (field) {
        case 'left':
        case 'top':
        case 'angle':
          selectedObject.set(field, value);
          break;
        
        case 'width':
          const currentWidth = selectedObject.width || 1;
          selectedObject.set('scaleX', value / currentWidth);
          break;
        
        case 'height':
          const currentHeight = selectedObject.height || 1;
          selectedObject.set('scaleY', value / currentHeight);
          break;
        
        case 'opacity':
          selectedObject.set('opacity', value / 100);
          break;
        
        case 'text':
          if (selectedObject instanceof FabricText) {
            selectedObject.set('text', value);
          }
          break;
        
        case 'fontSize':
        case 'fontFamily':
        case 'fontWeight':
        case 'fontStyle':
        case 'textAlign':
          if (selectedObject instanceof FabricText) {
            selectedObject.set(field, value);
          }
          break;
        
        case 'fill':
          if (selectedObject instanceof FabricText) {
            const color = typeof value === 'string' ? value : value.toHexString();
            selectedObject.set('fill', color);
          }
          break;
      }

      selectedObject.setCoords();
      canvas.renderAll();
    } catch (error) {
      console.error('更新属性失败:', error);
    }
  };

  // 重置对象
  const resetObject = () => {
    if (!selectedObject || !canvas) return;

    selectedObject.set({
      left: 50,
      top: 50,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1
    });

    selectedObject.setCoords();
    canvas.renderAll();
    updateFormValues();
  };

  // 复制对象
  const duplicateObject = () => {
    if (!selectedObject || !canvas) return;

    selectedObject.clone((cloned: FabricObject) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  };

  if (!selectedObject) {
    return (
      <div className="property-panel">
        <div className="panel-header">
          <h3>属性</h3>
        </div>
        <div className="empty-selection">
          <p>请选择一个对象来编辑属性</p>
        </div>
      </div>
    );
  }

  return (
    <PropertyPanelContent 
      selectedObject={selectedObject}
      canvas={canvas}
      objectType={objectType}
      availableFonts={availableFonts}
      handlePropertyChange={handlePropertyChange}
      resetObject={resetObject}
      duplicateObject={duplicateObject}
    />
  );
};

// 分离的内容组件，只在有选中对象时渲染
const PropertyPanelContent: React.FC<{
  selectedObject: FabricObject;
  canvas: FabricCanvas | null;
  objectType: string;
  availableFonts: string[];
  handlePropertyChange: (field: string, value: any) => void;
  resetObject: () => void;
  duplicateObject: () => void;
}> = ({ selectedObject, canvas, objectType, availableFonts, handlePropertyChange, resetObject, duplicateObject }) => {
  const [form] = Form.useForm();

  // 更新表单值
  const updateFormValues = () => {
    const values: any = {
      left: Math.round(selectedObject.left || 0),
      top: Math.round(selectedObject.top || 0),
      width: Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1)),
      height: Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1)),
      angle: Math.round(selectedObject.angle || 0),
      opacity: Math.round((selectedObject.opacity || 1) * 100),
    };

    // 文字特有属性
    if (objectType === 'text' && selectedObject instanceof FabricText) {
      values.text = selectedObject.text;
      values.fontSize = selectedObject.fontSize;
      values.fontFamily = selectedObject.fontFamily;
      values.fill = selectedObject.fill;
      values.fontWeight = selectedObject.fontWeight;
      values.fontStyle = selectedObject.fontStyle;
      values.textAlign = selectedObject.textAlign;
    }

    // 图片特有属性
    if (objectType === 'image') {
      values.filename = selectedObject.get('filename') || '';
    }

    form.setFieldsValue(values);
  };

  // 监听选中对象变化
  useEffect(() => {
    updateFormValues();
  }, [selectedObject, form]);

  return (
    <div className="property-panel">
      <div className="panel-header">
        <h3>属性</h3>
        <span className="object-type">
          {objectType === 'text' ? '文字' : objectType === 'image' ? '图片' : '对象'}
        </span>
      </div>

      <Form
        form={form}
        layout="vertical"
        size="small"
        onValuesChange={(changedValues) => {
          Object.keys(changedValues).forEach(key => {
            handlePropertyChange(key, changedValues[key]);
          });
        }}
      >
        {/* 基础属性 */}
        <Divider orientation="left">位置和大小</Divider>
        
        <Form.Item label="X坐标" name="left">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item label="Y坐标" name="top">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item label="宽度" name="width">
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item label="高度" name="height">
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item label="旋转角度" name="angle">
          <Slider min={-180} max={180} />
        </Form.Item>
        
        <Form.Item label="透明度" name="opacity">
          <Slider min={0} max={100} />
        </Form.Item>

        {/* 文字特有属性 */}
        {objectType === 'text' && (
          <>
            <Divider orientation="left">文字属性</Divider>
            
            <Form.Item label="文字内容" name="text">
              <Input.TextArea rows={2} />
            </Form.Item>
            
            <Form.Item label="字体大小" name="fontSize">
              <InputNumber min={8} max={200} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item label="字体" name="fontFamily">
              <Select>
                {availableFonts.map(font => (
                  <Select.Option key={font} value={font}>
                    {font}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item label="字体颜色" name="fill">
              <ColorPicker 
                showText 
                style={{ width: '100%' }}
                onChange={(color: Color) => {
                  handlePropertyChange('fill', color.toHexString());
                }}
              />
            </Form.Item>
            
            <Form.Item label="字体粗细" name="fontWeight">
              <Select>
                <Select.Option value="normal">正常</Select.Option>
                <Select.Option value="bold">粗体</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="字体样式" name="fontStyle">
              <Select>
                <Select.Option value="normal">正常</Select.Option>
                <Select.Option value="italic">斜体</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="文字对齐" name="textAlign">
              <Select>
                <Select.Option value="left">左对齐</Select.Option>
                <Select.Option value="center">居中</Select.Option>
                <Select.Option value="right">右对齐</Select.Option>
              </Select>
            </Form.Item>
          </>
        )}

        {/* 图片特有属性 */}
        {objectType === 'image' && (
          <>
            <Divider orientation="left">图片属性</Divider>
            
            <Form.Item label="文件名" name="filename">
              <Input disabled />
            </Form.Item>
          </>
        )}

        {/* 操作按钮 */}
        <Divider orientation="left">操作</Divider>
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            block 
            onClick={duplicateObject}
          >
            复制对象
          </Button>
          
          <Button 
            block 
            onClick={resetObject}
          >
            重置属性
          </Button>
          
          <Button 
            danger 
            block 
            onClick={() => {
              if (canvas && selectedObject) {
                canvas.remove(selectedObject);
                canvas.renderAll();
              }
            }}
          >
            删除对象
          </Button>
        </Space>
      </Form>
    </div>
  );
};

export default PropertyPanel;