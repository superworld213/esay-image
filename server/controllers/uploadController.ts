import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

interface UploadedImage {
  id: string;
  url: string;
  filename: string;
  width: number;
  height: number;
  mimetype: string;
  uploadTime: string;
}

export const uploadController = {
  // 上传多张图片
  uploadImages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的图片文件'
        });
      }

      const uploadedImages: UploadedImage[] = [];

      // 处理每个上传的图片
      for (const file of files) {
        try {
          // 获取图片信息
          const metadata = await sharp(file.path).metadata();
          
          const imageInfo: UploadedImage = {
            id: path.basename(file.filename, path.extname(file.filename)),
            url: `/uploads/images/${file.filename}`,
            filename: file.originalname,
            width: metadata.width || 0,
            height: metadata.height || 0,
            mimetype: file.mimetype,
            uploadTime: new Date().toISOString()
          };

          uploadedImages.push(imageInfo);
        } catch (error) {
          console.error(`处理图片 ${file.originalname} 时出错:`, error);
          // 删除有问题的文件
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('删除文件失败:', unlinkError);
          }
        }
      }

      if (uploadedImages.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有成功处理的图片文件'
        });
      }

      res.json({
        success: true,
        data: uploadedImages,
        message: `成功上传 ${uploadedImages.length} 张图片`
      });

    } catch (error) {
      console.error('上传图片错误:', error);
      next(error);
    }
  }
};