import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

interface FontInfo {
  id: string;
  name: string;
  filename: string;
  url: string;
  uploadTime: string;
}

// 字体信息存储文件路径
const FONTS_DATA_FILE = path.join(__dirname, '../data/fonts.json');

// 确保数据目录存在
const ensureDataDir = async () => {
  const dataDir = path.dirname(FONTS_DATA_FILE);
  if (!existsSync(dataDir)) {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// 读取字体数据
const readFontsData = async (): Promise<FontInfo[]> => {
  try {
    await ensureDataDir();
    if (existsSync(FONTS_DATA_FILE)) {
      const data = await fs.readFile(FONTS_DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('读取字体数据失败:', error);
    return [];
  }
};

// 保存字体数据
const saveFontsData = async (fonts: FontInfo[]) => {
  try {
    await ensureDataDir();
    await fs.writeFile(FONTS_DATA_FILE, JSON.stringify(fonts, null, 2));
  } catch (error) {
    console.error('保存字体数据失败:', error);
    throw error;
  }
};

export const fontController = {
  // 上传字体文件
  uploadFont: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的字体文件'
        });
      }

      // 提取字体名称（去掉扩展名）
      const fontName = path.basename(file.originalname, path.extname(file.originalname));
      const fontId = path.basename(file.filename, path.extname(file.filename));

      const fontInfo: FontInfo = {
        id: fontId,
        name: fontName,
        filename: file.originalname,
        url: `/uploads/fonts/${file.filename}`,
        uploadTime: new Date().toISOString()
      };

      // 读取现有字体数据
      const fonts = await readFontsData();
      
      // 检查是否已存在同名字体
      const existingFont = fonts.find(f => f.name === fontName);
      if (existingFont) {
        // 删除上传的文件
        await fs.unlink(file.path);
        return res.status(400).json({
          success: false,
          message: `字体 "${fontName}" 已存在`
        });
      }

      // 添加新字体
      fonts.push(fontInfo);
      await saveFontsData(fonts);

      res.json({
        success: true,
        data: fontInfo,
        message: `字体 "${fontName}" 上传成功`
      });

    } catch (error) {
      console.error('上传字体错误:', error);
      next(error);
    }
  },

  // 获取已安装字体列表
  getFonts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fonts = await readFontsData();
      
      res.json({
        success: true,
        data: fonts
      });

    } catch (error) {
      console.error('获取字体列表错误:', error);
      next(error);
    }
  },

  // 删除字体
  deleteFont: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fontId } = req.params;
      
      const fonts = await readFontsData();
      const fontIndex = fonts.findIndex(f => f.id === fontId);
      
      if (fontIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '字体不存在'
        });
      }

      const font = fonts[fontIndex];
      
      // 删除字体文件
      const fontPath = path.join(__dirname, '../uploads/fonts', path.basename(font.url));
      if (existsSync(fontPath)) {
        await fs.unlink(fontPath);
      }

      // 从数据中移除
      fonts.splice(fontIndex, 1);
      await saveFontsData(fonts);

      res.json({
        success: true,
        message: `字体 "${font.name}" 删除成功`
      });

    } catch (error) {
      console.error('删除字体错误:', error);
      next(error);
    }
  }
};