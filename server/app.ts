import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// 导入路由
import uploadRoutes from './routes/upload.js';
import fontRoutes from './routes/fonts.js';
import exportRoutes from './routes/export.js';

// 导入中间件
import errorHandler from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API路由
app.use('/api/upload', uploadRoutes);
app.use('/api/fonts', fontRoutes);
app.use('/api/export', exportRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Image processing server is running' });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;