import React, { useState, useEffect } from 'react';
import { List, Button, Switch, Tooltip, Popconfirm } from 'antd';
import { 
  EyeOutlined, 
  EyeInvisibleOutlined, 
  DeleteOutlined,
  DragOutlined
} from '@ant-design/icons';
import { Canvas as FabricCanvas, Object as FabricObject, Image as FabricImage } from 'fabric';

interface LayerItem {
  id: string;
  name: string;
  type: 'image' | 'text';
  visible: boolean;
  thumbnail?: string;
  object: FabricObject;
}

interface LayerPanelProps {
  canvas?: FabricCanvas | null;
  selectedObject?: FabricObject | null;
  onLayerSelect?: (layer: LayerItem) => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({ 
  canvas, 
  selectedObject, 
  onLayerSelect 
}) => {
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // 更新图层列表
  const updateLayers = () => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    const newLayers: LayerItem[] = objects.map((obj, index) => {
      const id = obj.get('id') || `layer_${index}`;
      const type = obj.get('type') === 'text' ? 'text' : 'image';
      const name = obj.get('filename') || obj.get('text') || `${type === 'text' ? '文字' : '图片'} ${index + 1}`;
      
      let thumbnail = '';
      if (type === 'image') {
        // 生成图片缩略图
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 40;
        tempCanvas.height = 40;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx && obj instanceof FabricImage) {
          const img = obj.getElement();
          if (img) {
            tempCtx.drawImage(img, 0, 0, 40, 40);
            thumbnail = tempCanvas.toDataURL();
          }
        }
      }

      return {
        id,
        name,
        type,
        visible: obj.visible !== false,
        thumbnail,
        object: obj
      };
    }).reverse(); // 反转数组，使最上层的对象显示在列表顶部

    setLayers(newLayers);
  };

  // 监听画布变化
  useEffect(() => {
    if (!canvas) return;

    const handleObjectAdded = () => updateLayers();
    const handleObjectRemoved = () => updateLayers();
    const handleObjectModified = () => updateLayers();

    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', handleObjectRemoved);
    canvas.on('object:modified', handleObjectModified);

    // 初始化图层列表
    updateLayers();

    return () => {
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:removed', handleObjectRemoved);
      canvas.off('object:modified', handleObjectModified);
    };
  }, [canvas]);

  // 监听选中对象变化
  useEffect(() => {
    if (selectedObject) {
      const id = selectedObject.get('id') || '';
      setSelectedLayerId(id);
    } else {
      setSelectedLayerId(null);
    }
  }, [selectedObject]);

  // 选择图层
  const handleLayerSelect = (layer: LayerItem) => {
    if (!canvas) return;

    canvas.setActiveObject(layer.object);
    canvas.renderAll();
    setSelectedLayerId(layer.id);
    
    if (onLayerSelect) {
      onLayerSelect(layer);
    }
  };

  // 切换图层可见性
  const toggleLayerVisibility = (layer: LayerItem) => {
    if (!canvas) return;

    const newVisible = !layer.visible;
    layer.object.set('visible', newVisible);
    canvas.renderAll();
    updateLayers();
  };

  // 删除图层
  const deleteLayer = (layer: LayerItem) => {
    if (!canvas) return;

    canvas.remove(layer.object);
    canvas.renderAll();
    updateLayers();
  };

  // 移动图层顺序
  const moveLayer = (fromIndex: number, toIndex: number) => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    const actualFromIndex = objects.length - 1 - fromIndex;
    const actualToIndex = objects.length - 1 - toIndex;
    
    const obj = objects[actualFromIndex];
    canvas.remove(obj);
    canvas.insertAt(obj, actualToIndex);
    canvas.renderAll();
    updateLayers();
  };

  // 图层向上移动
  const moveLayerUp = (index: number) => {
    if (index > 0) {
      moveLayer(index, index - 1);
    }
  };

  // 图层向下移动
  const moveLayerDown = (index: number) => {
    if (index < layers.length - 1) {
      moveLayer(index, index + 1);
    }
  };

  return (
    <div className="layer-panel">
      <div className="panel-header">
        <h3>图层</h3>
        <Button 
          size="small" 
          onClick={() => canvas?.clear()}
          danger
        >
          清空
        </Button>
      </div>
      
      <List
        size="small"
        dataSource={layers}
        renderItem={(layer, index) => (
          <List.Item
            key={layer.id}
            className={`layer-item ${selectedLayerId === layer.id ? 'selected' : ''}`}
            onClick={() => handleLayerSelect(layer)}
          >
            <div className="layer-content">
              {/* 拖拽手柄 */}
              <div className="layer-drag-handle">
                <DragOutlined />
              </div>
              
              {/* 缩略图 */}
              {layer.thumbnail ? (
                <img 
                  src={layer.thumbnail} 
                  alt={layer.name}
                  className="layer-thumbnail"
                />
              ) : (
                <div className="layer-thumbnail layer-thumbnail-text">
                  {layer.type === 'text' ? 'T' : 'IMG'}
                </div>
              )}
              
              {/* 图层信息 */}
              <div className="layer-info">
                <div className="layer-name" title={layer.name}>
                  {layer.name.length > 15 ? `${layer.name.substring(0, 15)}...` : layer.name}
                </div>
                <div className="layer-type">
                  {layer.type === 'text' ? '文字图层' : '图片图层'}
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="layer-actions">
                {/* 可见性切换 */}
                <Tooltip title={layer.visible ? '隐藏' : '显示'}>
                  <Button
                    type="text"
                    size="small"
                    icon={layer.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(layer);
                    }}
                  />
                </Tooltip>
                
                {/* 删除按钮 */}
                <Popconfirm
                  title="确定删除这个图层吗？"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    deleteLayer(layer);
                  }}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </div>
            </div>
            
            {/* 图层顺序调整按钮 */}
            <div className="layer-order-controls">
              <Button
                type="text"
                size="small"
                disabled={index === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayerUp(index);
                }}
              >
                ↑
              </Button>
              <Button
                type="text"
                size="small"
                disabled={index === layers.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayerDown(index);
                }}
              >
                ↓
              </Button>
            </div>
          </List.Item>
        )}
      />
      
      {layers.length === 0 && (
        <div className="empty-layers">
          <p>暂无图层</p>
          <p>请上传图片或添加文字</p>
        </div>
      )}
    </div>
  );
};

export default LayerPanel;