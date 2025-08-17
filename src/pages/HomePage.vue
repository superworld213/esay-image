<template>
  <div class="home-page">
    <div class="page-header">
      <h1 class="page-title">二维码图片处理工具</h1>
      <p class="page-description">批量处理二维码图片，添加文字标签，生成专业的合成图片</p>
    </div>

    <div class="main-content">
      <!-- 文件上传区域 -->
      <div class="section">
        <FileUpload 
          @upload-complete="handleUploadComplete"
          @upload-error="handleUploadError"
        />
      </div>

      <!-- 图片处理区域 -->
      <div v-if="uploadData" class="section">
        <ImageProcessor 
          :upload-data="uploadData"
          @process-complete="handleProcessComplete"
          @process-error="handleProcessError"
        />
      </div>

      <!-- 结果展示区域 -->
      <div v-if="processResults.length > 0" class="section">
        <ResultGrid 
          :results="processResults"
          @clear-results="handleClearResults"
        />
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-toast">
      <div class="error-content">
        <AlertCircle class="w-5 h-5 text-red-500" />
        <span>{{ errorMessage }}</span>
        <button @click="clearError" class="error-close">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 成功提示 -->
    <div v-if="successMessage" class="success-toast">
      <div class="success-content">
        <CheckCircle class="w-5 h-5 text-green-500" />
        <span>{{ successMessage }}</span>
        <button @click="clearSuccess" class="success-close">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AlertCircle, CheckCircle, X } from 'lucide-vue-next'
import FileUpload from '../components/FileUpload.vue'
import ImageProcessor from '../components/ImageProcessor.vue'
import ResultGrid from '../components/ResultGrid.vue'

interface UploadData {
  background: {
    id: string
    filename: string
    originalName: string
    path: string
  }
  qrCodes: Array<{
    id: string
    filename: string
    originalName: string
    path: string
  }>
}

interface ProcessedResult {
  id: string
  originalQrName: string
  processedImagePath: string
  downloadUrl: string
  filename: string
}

const uploadData = ref<UploadData | null>(null)
const processResults = ref<ProcessedResult[]>([])
const errorMessage = ref('')
const successMessage = ref('')

// 处理文件上传完成
const handleUploadComplete = (result: any) => {
  uploadData.value = result.data
  successMessage.value = result.message
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

// 处理文件上传错误
const handleUploadError = (error: string) => {
  errorMessage.value = error
  setTimeout(() => {
    errorMessage.value = ''
  }, 5000)
}

// 处理图片处理完成
const handleProcessComplete = (result: any) => {
  processResults.value = result.results
  successMessage.value = result.message
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

// 处理图片处理错误
const handleProcessError = (error: string) => {
  errorMessage.value = error
  setTimeout(() => {
    errorMessage.value = ''
  }, 5000)
}

// 清空结果
const handleClearResults = () => {
  processResults.value = []
  uploadData.value = null
}

// 清空错误信息
const clearError = () => {
  errorMessage.value = ''
}

// 清空成功信息
const clearSuccess = () => {
  successMessage.value = ''
}

// 页面加载时检查是否有历史结果
onMounted(async () => {
  try {
    const response = await fetch('/api/download')
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.files.length > 0) {
        // 转换格式以匹配组件期望的数据结构
        processResults.value = result.files.map((file: any) => ({
          id: `existing_${Date.now()}_${Math.random()}`,
          originalQrName: file.filename.replace(/_processed\.jpg$/, '').replace(/^job_\d+_/, ''),
          processedImagePath: '',
          downloadUrl: file.downloadUrl,
          filename: file.filename
        }))
      }
    }
  } catch (error) {
    console.error('加载历史结果失败:', error)
  }
})
</script>

<style scoped>
.home-page {
  @apply min-h-screen bg-gray-50;
}

.page-header {
  @apply bg-white shadow-sm border-b;
  @apply px-6 py-8 text-center;
}

.page-title {
  @apply text-3xl font-bold text-gray-900 mb-2;
}

.page-description {
  @apply text-lg text-gray-600 max-w-2xl mx-auto;
}

.main-content {
  @apply max-w-6xl mx-auto px-6 py-8 space-y-8;
}

.section {
  @apply bg-white rounded-lg shadow-sm border p-6;
}

/* Toast 样式 */
.error-toast,
.success-toast {
  @apply fixed bottom-4 right-4 z-50 max-w-md;
}

.error-content,
.success-content {
  @apply flex items-center space-x-3 p-4 rounded-lg shadow-lg;
}

.error-content {
  @apply bg-red-50 border border-red-200;
}

.success-content {
  @apply bg-green-50 border border-green-200;
}

.error-close,
.success-close {
  @apply ml-auto p-1 hover:bg-gray-100 rounded;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    @apply px-4 py-6;
  }
  
  .page-title {
    @apply text-2xl;
  }
  
  .page-description {
    @apply text-base;
  }
  
  .main-content {
    @apply px-4 py-6 space-y-6;
  }
  
  .section {
    @apply p-4;
  }
}
</style>
