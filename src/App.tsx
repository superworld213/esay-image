import React, { useState, useRef } from 'react';
import { ConfigProvider, message } from 'antd';
import { Canvas as FabricCanvas, Object as FabricObject } from 'fabric';
import MainEditor from './components/MainEditor';
import './App.css';

// API基础URL
const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [availableFonts, setAvailableFonts] = useState<string[]>(['Arial', 'Helvetica', 'Times New Roman', 'Courier New']);
  const canvasRef = useRef<any>(null);

  // 图片上传处理
  const handleImageUpload = async (files: File[]) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        // 添加图片到画布
        result.data.forEach((imageInfo: any) => {
          if (canvasRef.current) {
            canvasRef.current.addImageToCanvas(
              `http://localhost:3001${imageInfo.url}`,
              imageInfo.filename
            );
          }
        });
        message.success(`成功上传 ${result.data.length} 张图片`);
      } else {
        message.error(result.message || '上传失败');
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      message.error('上传图片失败');
    }
  };

  // 字体上传处理
  const handleFontUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('font', file);

      const response = await fetch(`${API_BASE_URL}/fonts/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        // 更新可用字体列表
        setAvailableFonts(prev => [...prev, result.data.name]);
        message.success(`字体 ${result.data.name} 上传成功`);
      } else {
        message.error(result.message || '字体上传失败');
      }
    } catch (error) {
      console.error('上传字体失败:', error);
      message.error('上传字体失败');
    }
  };

  // 添加文字
  const handleAddText = () => {
    if (canvasRef.current) {
      canvasRef.current.addTextToCanvas('双击编辑文字');
    }
  };

  // 导出功能
  const handleExport = async () => {
    if (!canvas) {
      message.error('画布未初始化');
      return;
    }

    try {
      const canvasData = JSON.stringify(canvas.toJSON());
      
      const response = await fetch(`${API_BASE_URL}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          canvasData,
          quality: 0.8,
          format: 'png',
          batch: false
        }),
      });

      const result = await response.json();
      
      if (result.success && result.data.url) {
        // 创建下载链接
        const link = document.createElement('a');
        link.href = `http://localhost:3001${result.data.url}`;
        link.download = 'exported-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success('导出成功');
      } else {
        message.error(result.message || '导出失败');
      }
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  // 画布变化处理
  const handleCanvasChange = (newCanvas: FabricCanvas) => {
    setCanvas(newCanvas);
  };

  // 选择变化处理
  const handleSelectionChange = (object: FabricObject | null) => {
    setSelectedObject(object);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <div className="App">
        <MainEditor
          ref={canvasRef}
          canvas={canvas}
          selectedObject={selectedObject}
          availableFonts={availableFonts}
          onImageUpload={handleImageUpload}
          onFontUpload={handleFontUpload}
          onAddText={handleAddText}
          onExport={handleExport}
          onCanvasChange={handleCanvasChange}
          onSelectionChange={handleSelectionChange}
        />
      </div>
    </ConfigProvider>
  );
}

export default App;
