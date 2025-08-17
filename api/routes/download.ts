import express, { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const processedDir = path.join(__dirname, '../../processed');

// 单张图片下载接口
router.get('/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(processedDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件未找到'
      });
    }
    
    // 设置响应头
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    
    // 发送文件
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('文件下载错误:', error);
    res.status(500).json({
      success: false,
      message: '文件下载失败'
    });
  }
});

// 批量下载接口（返回ZIP文件）
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { fileNames } = req.body;
    
    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要下载的文件列表'
      });
    }
    
    // 检查所有文件是否存在
    const existingFiles = fileNames.filter(filename => {
      const filePath = path.join(processedDir, filename);
      return fs.existsSync(filePath);
    });
    
    if (existingFiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: '没有找到可下载的文件'
      });
    }
    
    // 设置响应头为ZIP文件
    const zipFileName = `processed_images_${Date.now()}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
    
    // 创建ZIP压缩流
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最高压缩级别
    });
    
    // 处理错误
    archive.on('error', (err) => {
      console.error('ZIP压缩错误:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'ZIP压缩失败'
        });
      }
    });
    
    // 将压缩流管道到响应
    archive.pipe(res);
    
    // 添加文件到ZIP
    existingFiles.forEach(filename => {
      const filePath = path.join(processedDir, filename);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: filename });
      }
    });
    
    // 完成压缩
    await archive.finalize();
    
  } catch (error) {
    console.error('批量下载错误:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '批量下载失败'
      });
    }
  }
});

// 获取处理后的图片列表
router.get('/', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(processedDir)) {
      return res.json({
        success: true,
        files: []
      });
    }
    
    const files = fs.readdirSync(processedDir)
      .filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'))
      .map(filename => {
        const filePath = path.join(processedDir, filename);
        const stats = fs.statSync(filePath);
        
        return {
          filename,
          downloadUrl: `/api/download/${filename}`,
          size: stats.size,
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    res.json({
      success: true,
      files
    });
    
  } catch (error) {
    console.error('获取文件列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取文件列表失败'
    });
  }
});

export default router;