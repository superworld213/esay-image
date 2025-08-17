<template>
  <div class="result-grid-container">
    <div class="grid-header">
      <h3 class="section-title">处理结果</h3>
      <div v-if="results.length > 0" class="grid-actions">
        <button @click="downloadAll" class="download-all-btn">
          <Download class="w-4 h-4" />
          批量下载 ({{ results.length }})
        </button>
        <button @click="clearResults" class="clear-btn">
          <Trash2 class="w-4 h-4" />
          清空结果
        </button>
      </div>
    </div>

    <div v-if="results.length === 0" class="empty-state">
      <ImageIcon class="empty-icon" />
      <p class="empty-text">暂无处理结果</p>
      <p class="empty-hint">上传图片并处理后，结果将在这里显示</p>
    </div>

    <div v-else class="results-grid">
      <div 
        v-for="result in results" 
        :key="result.id" 
        class="result-item"
      >
        <div class="image-container">
          <img 
            :src="result.downloadUrl" 
            :alt="result.originalQrName"
            class="result-image"
            @load="onImageLoad"
            @error="onImageError"
          />
          <div class="image-overlay">
            <button 
              @click="previewImage(result)"
              class="overlay-btn preview-btn"
              title="预览"
            >
              <Eye class="w-4 h-4" />
            </button>
            <button 
              @click="downloadImage(result)"
              class="overlay-btn download-btn"
              title="下载"
            >
              <Download class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div class="result-info">
          <h4 class="result-title">{{ result.originalQrName }}</h4>
          <p class="result-filename">{{ result.filename }}</p>
        </div>
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <div v-if="previewModal.show" class="modal-overlay" @click="closePreview">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ previewModal.result?.originalQrName }}</h3>
          <button @click="closePreview" class="modal-close">
            <X class="w-6 h-6" />
          </button>
        </div>
        <div class="modal-body">
          <img 
            :src="previewModal.result?.downloadUrl" 
            :alt="previewModal.result?.originalQrName"
            class="preview-image"
          />
        </div>
        <div class="modal-footer">
          <button 
            @click="downloadImage(previewModal.result!)"
            class="modal-download-btn"
          >
            <Download class="w-4 h-4" />
            下载图片
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Download, Trash2, Eye, X, ImageIcon } from 'lucide-vue-next'

interface ProcessedResult {
  id: string
  originalQrName: string
  processedImagePath: string
  downloadUrl: string
  filename: string
}

const props = defineProps<{
  results: ProcessedResult[]
}>()

const emit = defineEmits<{
  clearResults: []
}>()

const previewModal = reactive<{
  show: boolean
  result: ProcessedResult | null
}>({
  show: false,
  result: null
})

const loadedImages = ref(new Set<string>())
const errorImages = ref(new Set<string>())

const onImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  loadedImages.value.add(img.src)
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  errorImages.value.add(img.src)
  console.error('图片加载失败:', img.src)
}

const previewImage = (result: ProcessedResult) => {
  previewModal.show = true
  previewModal.result = result
}

const closePreview = () => {
  previewModal.show = false
  previewModal.result = null
}

const downloadImage = async (result: ProcessedResult) => {
  try {
    const response = await fetch(result.downloadUrl)
    if (!response.ok) {
      throw new Error('下载失败')
    }
    
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = result.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('下载失败:', error)
    alert('下载失败，请重试')
  }
}

const downloadAll = async () => {
  if (props.results.length === 0) return
  
  try {
    const fileNames = props.results.map(result => result.filename)
    
    const response = await fetch('/api/download/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileNames })
    })
    
    if (!response.ok) {
      throw new Error('批量下载失败')
    }
    
    // 后端现在直接返回ZIP文件流，而不是JSON
    const blob = await response.blob()
    
    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `processed_images_${Date.now()}.zip`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('批量下载失败:', error)
    alert('批量下载失败，请重试')
  }
}

const clearResults = () => {
  if (confirm('确定要清空所有结果吗？')) {
    emit('clearResults')
  }
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && previewModal.show) {
    closePreview()
  }
}

// 添加键盘事件监听
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
}
</script>

<style scoped>
.result-grid-container {
  @apply space-y-6;
}

.grid-header {
  @apply flex items-center justify-between;
}

.section-title {
  @apply text-lg font-semibold text-gray-800;
}

.grid-actions {
  @apply flex space-x-3;
}

.download-all-btn {
  @apply flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg;
  @apply hover:bg-green-700 transition-colors;
}

.clear-btn {
  @apply flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg;
  @apply hover:bg-red-700 transition-colors;
}

.empty-state {
  @apply text-center py-12 space-y-4;
}

.empty-icon {
  @apply w-16 h-16 mx-auto text-gray-400;
}

.empty-text {
  @apply text-lg font-medium text-gray-600;
}

.empty-hint {
  @apply text-sm text-gray-500;
}

.results-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6;
}

.result-item {
  @apply bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow;
}

.image-container {
  @apply relative;
}

.image-container:hover .image-overlay {
  @apply opacity-100;
}

.result-image {
  @apply w-full h-48 object-cover;
}

.image-overlay {
  @apply absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center space-x-3;
  @apply opacity-0 transition-opacity;
}

.overlay-btn {
  @apply p-2 rounded-full transition-colors;
}

.preview-btn {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.download-btn {
  @apply bg-green-600 text-white hover:bg-green-700;
}

.result-info {
  @apply p-4 space-y-2;
}

.result-title {
  @apply font-semibold text-gray-800 truncate;
}

.result-filename {
  @apply text-sm text-gray-500 truncate;
}

/* 模态框样式 */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden;
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b;
}

.modal-title {
  @apply text-lg font-semibold text-gray-800;
}

.modal-close {
  @apply p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded;
}

.modal-body {
  @apply p-4 max-h-[70vh] overflow-auto;
}

.preview-image {
  @apply max-w-full max-h-full object-contain mx-auto;
}

.modal-footer {
  @apply p-4 border-t bg-gray-50 flex justify-center;
}

.modal-download-btn {
  @apply flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg;
  @apply hover:bg-green-700 transition-colors;
}
</style>