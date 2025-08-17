import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

interface ExportRequest {
  canvasData: string;
  quality?: number;
  format?: 'png' | 'jpeg';
  batch?: boolean;
  width?: number;
  height?: number;
}

export const exportController = {
  // 单张导出
  exportCanvas: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { canvasData, quality = 0.8, format = 'png', width = 800, height = 600 } = req.body as ExportRequest;
      
      if (!canvasData) {
        return res.status(400).json({
          success: false,
          message: '缺少画布数据'
        });
      }

      // 这里应该使用画布渲染库来生成图片
      // 由于Fabric.js主要在前端运行，这里我们创建一个占位符实现
      // 实际项目中可能需要使用node-canvas或其他服务端渲染方案
      
      const outputDir = path.join(__dirname, '../uploads/exports');
      await fs.mkdir(outputDir, { recursive: true });
      
      const filename = `export_${uuidv4()}.${format}`;
      const outputPath = path.join(outputDir, filename);
      
      // 创建一个简单的占位符图片
      const buffer = await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .png({ quality: Math.round(quality * 100) })
      .toBuffer();
      
      await fs.writeFile(outputPath, buffer);
      
      res.json({
        success: true,
        data: {
          url: `/uploads/exports/${filename}`
        },
        message: '导出成功'
      });

    } catch (error) {
      console.error('导出错误:', error);
      next(error);
    }
  },

  // 批量导出并压缩
  batchExport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { canvasData, quality = 0.8, format = 'png' } = req.body as ExportRequest;
      
      if (!canvasData) {
        return res.status(400).json({
          success: false,
          message: '缺少画布数据'
        });
      }

      // 解析画布数据获取图层信息
      let layers: any[] = [];
      try {
        const canvas = JSON.parse(canvasData);
        layers = canvas.layers || [];
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: '画布数据格式错误'
        });
      }

      if (layers.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有可导出的图层'
        });
      }

      const zip = new JSZip();
      const outputDir = path.join(__dirname, '../uploads/exports');
      await fs.mkdir(outputDir, { recursive: true });

      // 为每个图层生成图片并添加到压缩包
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const filename = `layer_${i + 1}_${layer.id || uuidv4()}.${format}`;
        
        // 创建图层图片（占位符实现）
        const buffer = await sharp({
          create: {
            width: 800,
            height: 600,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        })
        .png({ quality: Math.round(quality * 100) })
        .toBuffer();
        
        zip.file(filename, buffer);
      }

      // 生成压缩包
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      const zipFilename = `batch_export_${uuidv4()}.zip`;
      const zipPath = path.join(outputDir, zipFilename);
      
      await fs.writeFile(zipPath, zipBuffer);
      
      res.json({
        success: true,
        data: {
          zipUrl: `/uploads/exports/${zipFilename}`,
          layerCount: layers.length
        },
        message: `成功导出 ${layers.length} 个图层到压缩包`
      });

    } catch (error) {
      console.error('批量导出错误:', error);
      next(error);
    }
  }
};