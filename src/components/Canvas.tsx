import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, Image as FabricImage, Text as FabricText, Object as FabricObject } from 'fabric';
import { message } from 'antd';

interface CanvasProps {
  onSelectionChange?: (selectedObject: FabricObject | null) => void;
  onCanvasChange?: (canvas: FabricCanvas) => void;
}

const Canvas = forwardRef<any, CanvasProps>(({ onSelectionChange, onCanvasChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);



  useEffect(() => {
    if (canvasRef.current && !canvas) {
      // 初始化Fabric.js画布
      const fabricCanvas = new FabricCanvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
      });

      // 设置画布边框样式
      fabricCanvas.selectionColor = 'rgba(24, 144, 255, 0.1)';
      fabricCanvas.selectionBorderColor = '#1890ff';
      fabricCanvas.selectionLineWidth = 2;

      // 监听选择变化事件
      fabricCanvas.on('selection:created', (e) => {
        if (onSelectionChange && e.selected && e.selected[0]) {
          onSelectionChange(e.selected[0]);
        }
      });

      fabricCanvas.on('selection:updated', (e) => {
        if (onSelectionChange && e.selected && e.selected[0]) {
          onSelectionChange(e.selected[0]);
        }
      });

      fabricCanvas.on('selection:cleared', () => {
        if (onSelectionChange) {
          onSelectionChange(null);
        }
      });

      // 监听对象修改事件
      fabricCanvas.on('object:modified', () => {
        fabricCanvas.renderAll();
      });

      // 监听对象移动事件
      fabricCanvas.on('object:moving', (e) => {
        const obj = e.target;
        if (obj) {
          // 限制对象在画布范围内移动
          const canvasWidth = fabricCanvas.width || 800;
          const canvasHeight = fabricCanvas.height || 600;
          
          if (obj.left! < 0) obj.set('left', 0);
          if (obj.top! < 0) obj.set('top', 0);
          if (obj.left! + (obj.width! * obj.scaleX!) > canvasWidth) {
            obj.set('left', canvasWidth - (obj.width! * obj.scaleX!));
          }
          if (obj.top! + (obj.height! * obj.scaleY!) > canvasHeight) {
            obj.set('top', canvasHeight - (obj.height! * obj.scaleY!));
          }
        }
      });

      setCanvas(fabricCanvas);
      
      if (onCanvasChange) {
        onCanvasChange(fabricCanvas);
      }

      // 组件卸载时清理画布
      return () => {
        fabricCanvas.dispose();
      };
    }
  }, []); // 只在组件挂载时初始化一次

  // 添加图片到画布
  const addImageToCanvas = (imageUrl: string, filename: string) => {
    if (!canvas) return;

    FabricImage.fromURL(imageUrl, (img) => {
      // 设置图片属性
      img.set({
        left: 50,
        top: 50,
        scaleX: 0.5,
        scaleY: 0.5,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        cornerColor: '#1890ff',
        cornerStyle: 'circle',
        borderColor: '#1890ff',
        transparentCorners: false,
      });

      // 添加自定义属性
      img.set('filename', filename);
      img.set('type', 'image');

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      
      message.success(`图片 ${filename} 添加成功`);
    }, {
      crossOrigin: 'anonymous'
    });
  };

  // 添加文字到画布
  const addTextToCanvas = (text: string, options?: any) => {
    if (!canvas) return;

    const textObj = new FabricText(text, {
      left: 100,
      top: 100,
      fontSize: 24,
      fill: '#000000',
      fontFamily: 'Arial',
      selectable: true,
      hasControls: true,
      hasBorders: true,
      cornerColor: '#1890ff',
      cornerStyle: 'circle',
      borderColor: '#1890ff',
      transparentCorners: false,
      ...options
    });

    // 添加自定义属性
    textObj.set('type', 'text');

    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();
    
    message.success('文字添加成功');
  };

  // 删除选中对象
  const deleteSelectedObject = () => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
      message.success('对象删除成功');
    }
  };

  // 清空画布
  const clearCanvas = () => {
    if (!canvas) return;
    
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    message.success('画布已清空');
  };

  // 导出画布为图片
  const exportCanvas = (format: string = 'png', quality: number = 1) => {
    if (!canvas) return null;
    
    return canvas.toDataURL({
      format,
      quality,
      multiplier: 1
    });
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    addImageToCanvas,
    addTextToCanvas,
    deleteSelectedObject,
    clearCanvas,
    exportCanvas,
    getCanvas: () => canvas
  }));

  return (
    <div className="canvas-container">
      <canvas ref={canvasRef} />
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;