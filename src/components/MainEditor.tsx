import React, { forwardRef, useImperativeHandle } from 'react';
import { Layout } from 'antd';
import { Canvas as FabricCanvas, Object as FabricObject } from 'fabric';
import Toolbar from './Toolbar';
import Canvas from './Canvas';
import LayerPanel from './LayerPanel';
import PropertyPanel from './PropertyPanel';
import './MainEditor.css';

const { Sider, Content } = Layout;

interface MainEditorProps {
  canvas?: FabricCanvas | null;
  selectedObject?: FabricObject | null;
  availableFonts?: string[];
  onImageUpload?: (files: File[]) => void;
  onFontUpload?: (file: File) => void;
  onAddText?: () => void;
  onExport?: () => void;
  onCanvasChange?: (canvas: fabric.Canvas) => void;
  onSelectionChange?: (object: fabric.Object | null) => void;
}

const MainEditor = forwardRef<any, MainEditorProps>(({ 
  canvas,
  selectedObject,
  availableFonts,
  onImageUpload,
  onFontUpload,
  onAddText,
  onExport,
  onCanvasChange,
  onSelectionChange
}, ref) => {
  const canvasRef = React.useRef<any>(null);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    addImageToCanvas: (imageUrl: string, filename: string) => {
      if (canvasRef.current) {
        canvasRef.current.addImageToCanvas(imageUrl, filename);
      }
    },
    addTextToCanvas: (text: string, options?: any) => {
      if (canvasRef.current) {
        canvasRef.current.addTextToCanvas(text, options);
      }
    },
    exportCanvas: (format?: string, quality?: number) => {
      if (canvasRef.current) {
        return canvasRef.current.exportCanvas(format, quality);
      }
      return null;
    },
    getCanvas: () => {
      if (canvasRef.current) {
        return canvasRef.current.getCanvas();
      }
      return null;
    }
  }));
  return (
    <Layout className="main-editor">
      {/* 左侧工具栏 */}
      <Sider width={80} className="toolbar-sider">
        <Toolbar 
          onImageUpload={onImageUpload}
          onAddText={onAddText}
          onExport={onExport}
          onFontUpload={onFontUpload}
        />
      </Sider>
      
      {/* 中央画布区域 */}
      <Content className="canvas-content">
        <Canvas 
          ref={canvasRef}
          onSelectionChange={onSelectionChange}
          onCanvasChange={onCanvasChange}
        />
      </Content>
      
      {/* 右侧面板 */}
      <Sider width={300} className="right-panel" theme="light">
        <div className="panel-container">
          {/* 图层面板 */}
          <div className="layer-panel-section">
            <LayerPanel 
              canvas={canvas}
              selectedObject={selectedObject}
            />
          </div>
          
          {/* 属性面板 */}
          <div className="property-panel-section">
            <PropertyPanel 
              selectedObject={selectedObject}
              canvas={canvas}
              availableFonts={availableFonts}
            />
          </div>
        </div>
      </Sider>
    </Layout>
  );
});

MainEditor.displayName = 'MainEditor';

export default MainEditor;