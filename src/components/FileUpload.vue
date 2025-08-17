<template>
  <div class="file-upload-container">
    <div class="upload-section">
      <h3 class="section-title">背景图片上传</h3>
      <div 
        class="upload-area"
        :class="{ 'drag-over': isDragOverBg }"
        @dragover.prevent="isDragOverBg = true"
        @dragleave.prevent="isDragOverBg = false"
        @drop.prevent="handleBackgroundDrop"
        @click="triggerBackgroundUpload"
      >
        <div v-if="!backgroundFile" class="upload-placeholder">
          <Upload class="upload-icon" />
          <p>点击或拖拽上传背景图片</p>
          <p class="upload-hint">支持 JPG, PNG 格式，最大 10MB</p>
        </div>
        <div v-else class="file-preview">
          <img :src="backgroundPreview" alt="背景图片预览" class="preview-image" />
          <div class="file-info">
            <p class="file-name">{{ backgroundFile.name }}</p>
            <button @click.stop="removeBackgroundFile" class="remove-btn">
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <input 
        ref="backgroundInput"
        type="file" 
        accept="image/*" 
        @change="handleBackgroundChange"
        class="hidden-input"
      />
    </div>

    <div class="upload-section">
      <h3 class="section-title">二维码图片上传</h3>
      <div 
        class="upload-area"
        :class="{ 'drag-over': isDragOverQr }"
        @dragover.prevent="isDragOverQr = true"
        @dragleave.prevent="isDragOverQr = false"
        @drop.prevent="handleQrCodeDrop"
        @click="triggerQrCodeUpload"
      >
        <div v-if="qrCodeFiles.length === 0" class="upload-placeholder">
          <Upload class="upload-icon" />
          <p>点击或拖拽上传二维码图片</p>
          <p class="upload-hint">支持多选，JPG, PNG 格式，最大 10MB</p>
        </div>
        <div v-else class="files-grid">
          <div v-for="(file, index) in qrCodeFiles" :key="index" class="file-item">
            <img :src="qrCodePreviews[index]" alt="二维码预览" class="preview-thumbnail" />
            <div class="file-info">
              <p class="file-name">{{ file.name }}</p>
              <button @click.stop="removeQrCodeFile(index)" class="remove-btn">
                <X class="w-3 h-3" />
              </button>
            </div>
          </div>
          <div class="add-more" @click.stop="triggerQrCodeUpload">
            <Plus class="w-6 h-6" />
            <p>添加更多</p>
          </div>
        </div>
      </div>
      <input 
        ref="qrCodeInput"
        type="file" 
        accept="image/*" 
        multiple
        @change="handleQrCodeChange"
        class="hidden-input"
      />
    </div>

    <div class="upload-actions">
      <button 
        @click="uploadFiles"
        :disabled="!canUpload || isUploading"
        class="upload-btn"
      >
        <Loader2 v-if="isUploading" class="w-4 h-4 animate-spin" />
        <Upload v-else class="w-4 h-4" />
        {{ isUploading ? '上传中...' : '开始上传' }}
      </button>
      <button 
        @click="clearAll"
        :disabled="isUploading"
        class="clear-btn"
      >
        <Trash2 class="w-4 h-4" />
        清空所有
      </button>
    </div>

    <div v-if="uploadProgress" class="progress-section">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
      </div>
      <p class="progress-text">{{ uploadStatus }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { Upload, X, Plus, Loader2, Trash2 } from 'lucide-vue-next'

interface UploadResult {
  success: boolean
  fileIds: string[]
  message: string
  data: {
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
}

const emit = defineEmits<{
  uploadComplete: [result: UploadResult]
  uploadError: [error: string]
}>()

const backgroundInput = ref<HTMLInputElement>()
const qrCodeInput = ref<HTMLInputElement>()
const backgroundFile = ref<File | null>(null)
const qrCodeFiles = ref<File[]>([])
const backgroundPreview = ref<string>('')
const qrCodePreviews = ref<string[]>([])
const isDragOverBg = ref(false)
const isDragOverQr = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')

const canUpload = computed(() => {
  return backgroundFile.value && qrCodeFiles.value.length > 0
})

const createPreview = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.readAsDataURL(file)
  })
}

const triggerBackgroundUpload = () => {
  backgroundInput.value?.click()
}

const triggerQrCodeUpload = () => {
  qrCodeInput.value?.click()
}

const handleBackgroundChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    backgroundFile.value = file
    backgroundPreview.value = await createPreview(file)
  }
}

const handleQrCodeChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  await addQrCodeFiles(files)
}

const handleBackgroundDrop = async (event: DragEvent) => {
  isDragOverBg.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length > 0) {
    backgroundFile.value = files[0]
    backgroundPreview.value = await createPreview(files[0])
  }
}

const handleQrCodeDrop = async (event: DragEvent) => {
  isDragOverQr.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  await addQrCodeFiles(files)
}

const addQrCodeFiles = async (files: File[]) => {
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      qrCodeFiles.value.push(file)
      qrCodePreviews.value.push(await createPreview(file))
    }
  }
}

const removeBackgroundFile = () => {
  backgroundFile.value = null
  backgroundPreview.value = ''
  if (backgroundInput.value) {
    backgroundInput.value.value = ''
  }
}

const removeQrCodeFile = (index: number) => {
  qrCodeFiles.value.splice(index, 1)
  qrCodePreviews.value.splice(index, 1)
}

const clearAll = () => {
  removeBackgroundFile()
  qrCodeFiles.value = []
  qrCodePreviews.value = []
  if (qrCodeInput.value) {
    qrCodeInput.value.value = ''
  }
}

const uploadFiles = async () => {
  if (!canUpload.value) return
  
  isUploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = '准备上传...'
  
  try {
    const formData = new FormData()
    formData.append('background', backgroundFile.value!)
    
    qrCodeFiles.value.forEach(file => {
      formData.append('qrCodes', file)
    })
    
    uploadStatus.value = '上传中...'
    uploadProgress.value = 50
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    uploadProgress.value = 100
    
    if (!response.ok) {
      throw new Error(`上传失败: ${response.statusText}`)
    }
    
    const result: UploadResult = await response.json()
    
    if (result.success) {
      uploadStatus.value = '上传成功！'
      emit('uploadComplete', result)
    } else {
      throw new Error(result.message || '上传失败')
    }
    
  } catch (error) {
    console.error('上传错误:', error)
    uploadStatus.value = '上传失败'
    emit('uploadError', error instanceof Error ? error.message : '上传失败')
  } finally {
    isUploading.value = false
    setTimeout(() => {
      uploadProgress.value = 0
      uploadStatus.value = ''
    }, 2000)
  }
}

// 清理预览URL
onUnmounted(() => {
  if (backgroundPreview.value) {
    URL.revokeObjectURL(backgroundPreview.value)
  }
  qrCodePreviews.value.forEach(url => {
    URL.revokeObjectURL(url)
  })
})
</script>

<style scoped>
.file-upload-container {
  @apply space-y-6;
}

.upload-section {
  @apply space-y-3;
}

.section-title {
  @apply text-lg font-semibold text-gray-800;
}

.upload-area {
  @apply border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer transition-colors;
  @apply hover:border-blue-400 hover:bg-blue-50;
}

.upload-area.drag-over {
  @apply border-blue-500 bg-blue-100;
}

.upload-placeholder {
  @apply text-center space-y-2;
}

.upload-icon {
  @apply w-12 h-12 mx-auto text-gray-400;
}

.upload-hint {
  @apply text-sm text-gray-500;
}

.file-preview {
  @apply flex items-center space-x-4;
}

.preview-image {
  @apply w-20 h-20 object-cover rounded-lg;
}

.files-grid {
  @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4;
}

.file-item {
  @apply relative;
}

.file-item:hover .file-info {
  @apply opacity-100;
}

.preview-thumbnail {
  @apply w-full h-20 object-cover rounded-lg;
}

.file-info {
  @apply flex items-center justify-between mt-2;
}

.file-name {
  @apply text-sm text-gray-600 truncate flex-1;
}

.remove-btn {
  @apply p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded;
}

.add-more {
  @apply flex flex-col items-center justify-center h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer;
  @apply hover:border-blue-400 hover:bg-blue-50 transition-colors;
}

.hidden-input {
  @apply hidden;
}

.upload-actions {
  @apply flex space-x-4;
}

.upload-btn {
  @apply flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg;
  @apply hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors;
}

.clear-btn {
  @apply flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg;
  @apply hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors;
}

.progress-section {
  @apply space-y-2;
}

.progress-bar {
  @apply w-full bg-gray-200 rounded-full h-2;
}

.progress-fill {
  @apply bg-blue-600 h-2 rounded-full transition-all duration-300;
}

.progress-text {
  @apply text-sm text-gray-600 text-center;
}
</style>