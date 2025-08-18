import express, { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let chineseName = '一住1F1床'


const router = express.Router();

// 确保处理后图片目录存在
const processedDir = path.join(__dirname, '../../processed');
if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}

// 中文到英文翻译函数
const translateToEnglish = (chineseText: string): string => {
  // 移除文件扩展名
  let text = chineseText.replace(/\.(jpg|jpeg|png)$/i, '')

  // 先对中文文本进行数字补零处理
  // 处理楼层信息 (如 1F -> 01F, 2F -> 02F)
  text = text.replace(/(\d+)F/g, (match, floor) => {
    const floorNum = floor.padStart(2, '0')
    return `${floorNum}F`
  })

  // 处理床位号 (如 1床 -> 01床, 9床 -> 09床)
  text = text.replace(/(\d+)床/g, (match, bedNum) => {
    const formattedBedNum = bedNum.padStart(2, '0')
    return `${formattedBedNum}床`
  })

  chineseName = text

  // 翻译规则
  const translations: Record<string, string> = {
    '一住': 'ONE INPATIENT UNITS',
    '二住': 'TWO INPATIENT UNITS',
    '三住': 'THREE INPATIENT UNITS',
    '四住': 'FOUR INPATIENT UNITS',
    '五住': 'FIVE INPATIENT UNITS',
    '六住': 'SIX INPATIENT UNITS',
    '七住': 'SEVEN INPATIENT UNITS',
    '八住': 'EIGHT INPATIENT UNITS',
    '九住': 'NINE INPATIENT UNITS',
    '十住': 'TEN INPATIENT UNITS',
    '治未病': 'TREAT THE DISEASE',
    '床': 'BED',
    'F': 'F'
  }

  let result = text

  // 替换中文部分
  Object.entries(translations).forEach(([chinese, english]) => {
    result = result.replace(new RegExp(chinese, 'g'), english)
  })

  // 处理床位号格式，确保数字补零
  result = result.replace(/(\d+)BED/g, (match, bedNum) => {
    const formattedBedNum = bedNum.padStart(2, '0')
    return `${formattedBedNum} BED`
  })

  // 添加连接符
  result = result.replace(/(\w+ INPATIENT UNITS)(\d+)F(\d+) BED/, '$1- $2F - $3 BED')

  return result
}

interface TextConfig {
  fontFamily: string;
  fontSize: number;
  color: string;
  strokeWidth: number;
  fontWeight: string;
  // 英文文字配置
  englishFontSize: number;
  englishColor: string;
  englishStrokeWidth: number;
  englishFontWeight: string;
  // 文字位置配置
  chineseTopOffset: number;
  englishTopOffset: number;
  // 字符间距配置
  chineseLetterSpacing: number;
  englishLetterSpacing: number;
}

interface ProcessRequest {
  backgroundId: string;
  qrCodeIds: string[];
  textConfig: TextConfig;
}

// 图片处理接口
router.post('/', async (req: Request, res: Response) => {
  try {
    const { backgroundId, qrCodeIds, textConfig }: ProcessRequest = req.body;

    if (!backgroundId || !qrCodeIds || qrCodeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的参数'
      });
    }

    // 查找背景图片文件
    const backgroundsDir = path.join(__dirname, '../../uploads/backgrounds');
    const backgroundFiles = fs.readdirSync(backgroundsDir);
    const backgroundFile = backgroundFiles.find(file =>
      file.includes(backgroundId.replace('bg_', ''))
    );

    if (!backgroundFile) {
      return res.status(404).json({
        success: false,
        message: '背景图片未找到'
      });
    }

    const backgroundPath = path.join(backgroundsDir, backgroundFile);

    // 查找二维码图片文件
    const qrcodesDir = path.join(__dirname, '../../uploads/qrcodes');
    const qrCodeFiles = fs.readdirSync(qrcodesDir);

    const results = [];
    const jobId = `job_${Date.now()}`;

    for (const qrCodeId of qrCodeIds) {
      try {
        const qrCodeFile = qrCodeFiles.find(file =>
          file.includes(qrCodeId.replace('qr_', ''))
        );

        if (!qrCodeFile) {
          console.warn(`二维码文件未找到: ${qrCodeId}`);
          continue;
        }

        const qrCodePath = path.join(qrcodesDir, qrCodeFile);

        // 提取二维码名称（去掉时间戳前缀和文件扩展名）
        const originalName = qrCodeFile.replace(/^\d+_/, '').replace(/\.[^.]+$/, '');

        // 获取英文翻译
        const englishName = translateToEnglish(originalName);

        // 使用Sharp进行图片合成
        const backgroundBuffer = await sharp(backgroundPath).toBuffer();
        const backgroundMeta = await sharp(backgroundPath).metadata();

        // 处理二维码：调整大小
        const qrCodeBuffer = await sharp(qrCodePath)
          .resize({
            width: 700,
            height: 700,
            fit: 'contain'
          })
          .toBuffer();

        const qrCodeMeta = await sharp(qrCodeBuffer).metadata();

        // 计算二维码位置（居中，向上移动）
        const qrX = Math.floor(((backgroundMeta.width || 800) - (qrCodeMeta.width || 400)) / 2);
        const qrY = Math.floor(((backgroundMeta.height || 600) - (qrCodeMeta.height || 300)) / 2) - 32;

        // 创建双语文字SVG
        const fontPath = path.join(__dirname, '../../assets/font.otf');
        const fontBuffer = fs.readFileSync(fontPath);
        const fontBase64 = fontBuffer.toString('base64');

        const textSvg = `
          <svg width="${backgroundMeta.width}" height="${backgroundMeta.height}">
            <defs>
              <style>
                @font-face {
                  font-family: 'CustomFont';
                  src: url(data:font/otf;base64,${fontBase64}) format('opentype');
                }
                .chinese-text {
                  font-family: 'CustomFont', Arial, sans-serif;
                  font-size: ${textConfig.fontSize || 48}px;
                  font-weight: ${textConfig.fontWeight || 'bold'};
                  text-anchor: middle;
                  dominant-baseline: middle;
                  fill: ${textConfig.color || '#000000'};
                  letter-spacing: ${textConfig.chineseLetterSpacing || 0}px;
                }
                .english-text {
                  font-family: 'CustomFont', Arial, sans-serif;
                  font-size: ${textConfig.englishFontSize || 36}px;
                  font-weight: ${textConfig.englishFontWeight || 'bold'};
                  text-anchor: middle;
                  dominant-baseline: middle;
                  fill: ${textConfig.englishColor || '#000000'};
                  letter-spacing: ${textConfig.englishLetterSpacing || 0}px;
                }
              </style>
            </defs>
            <!-- 中文文字 -->
            <text x="${(backgroundMeta.width || 800) / 2}" y="${(textConfig.chineseTopOffset || 150)}" class="chinese-text">${chineseName}</text>
            <!-- 英文文字 -->
            <text x="${(backgroundMeta.width || 800) / 2}" y="${(textConfig.englishTopOffset || 220)}" class="english-text">${englishName}</text>
          </svg>
        `;

        // 合成图片
        const outputFileName = `${jobId}_${chineseName}_processed.jpg`;
        const outputPath = path.join(processedDir, outputFileName);

        await sharp(backgroundBuffer)
          .composite([
            {
              input: qrCodeBuffer,
              left: qrX,
              top: qrY
            },
            {
              input: Buffer.from(textSvg),
              left: 0,
              top: 0
            }
          ])
          .jpeg({ quality: 90 })
          .toFile(outputPath);

        results.push({
          id: `processed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          originalQrName: originalName,
          englishName: englishName,
          processedImagePath: outputPath,
          downloadUrl: `/api/download/${outputFileName}`,
          filename: outputFileName
        });

      } catch (error) {
        console.error(`处理二维码 ${qrCodeId} 时出错:`, error);
      }
    }

    res.json({
      success: true,
      results,
      processedCount: results.length,
      message: `成功处理 ${results.length} 张图片`
    });

  } catch (error) {
    console.error('图片处理错误:', error);
    res.status(500).json({
      success: false,
      message: '图片处理失败'
    });
  }
});

export default router;