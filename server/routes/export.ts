import express from 'express';
import { exportController } from '../controllers/exportController.js';

const router = express.Router();

// 导出画布为图片
router.post('/', exportController.exportCanvas);

// 批量导出并压缩
router.post('/batch', exportController.batchExport);

export default router;