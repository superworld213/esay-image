import React from 'react';
import { Button, Upload, Tooltip } from 'antd';
import { 
  UploadOutlined, 
  FontSizeOutlined, 
  ExportOutlined,
  FileImageOutlined,
  SettingOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

interface ToolbarProps {
  onImageUpload?: (files: File[]) => void;
  onAddText?: () => void;
  onExport?: () => void;
  onFontUpload?: (file: File) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onImageUpload,
  onAddText,
  onExport,
  onFontUpload
}) => {
  // 图片上传配置
  const imageUploadProps: UploadProps = {
    multiple: true,
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: (file, fileList) => {
      if (onImageUpload) {
        onImageUpload(fileList);
      }
      return false; // 阻止自动上传
    },
  };

  // 字体文件上传配置
  const fontUploadProps: UploadProps = {
    accept: '.woff,.woff2,.ttf,.otf',
    showUploadList: false,
    beforeUpload: (file) => {
      if (onFontUpload) {
        onFontUpload(file);
      }
      return false; // 阻止自动上传
    },
  };

  return (
    <div className="toolbar">
      {/* 图片上传按钮 */}
      <Tooltip title="上传图片" placement="right">
        <Upload {...imageUploadProps}>
          <div className="toolbar-button">
            <UploadOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
          </div>
        </Upload>
      </Tooltip>

      {/* 添加文字按钮 */}
      <Tooltip title="添加文字" placement="right">
        <div className="toolbar-button" onClick={onAddText}>
          <FontSizeOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
        </div>
      </Tooltip>

      {/* 字体上传按钮 */}
      <Tooltip title="上传字体" placement="right">
        <Upload {...fontUploadProps}>
          <div className="toolbar-button">
            <FileImageOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
          </div>
        </Upload>
      </Tooltip>

      {/* 导出按钮 */}
      <Tooltip title="导出图片" placement="right">
        <div className="toolbar-button" onClick={onExport}>
          <ExportOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
        </div>
      </Tooltip>

      {/* 设置按钮 */}
      <Tooltip title="设置" placement="right">
        <div className="toolbar-button">
          <SettingOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
        </div>
      </Tooltip>
    </div>
  );
};

export default Toolbar;