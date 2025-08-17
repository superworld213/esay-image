<template>
  <div class="image-processor-container">
    <div class="processor-header">
      <h3 class="section-title">图片处理</h3>
      <div class="text-config">
        <div class="config-group">
          <label class="config-label">字体大小</label>
          <input 
            v-model.number="textConfig.fontSize" 
            type="number" 
            min="20" 
            max="100" 
            class="config-input"
          />
        </div>
        <div class="config-group">
          <label class="config-label">文字颜色</label>
          <input 
            v-model="textConfig.color" 
            type="color" 
            class="config-color"
          />
        </div>
        <div class="config-group">
          <label class="config-label">描边宽度</label>
          <input 
            v-model.number="textConfig.strokeWidth" 
            type="number" 
            min="0" 
            max="10" 
            class="config-input"
          />
        </div>
      </div>
      
      <!-- 英文文字配置 -->
      <div class="text-config">
        <h4 class="config-section-title">英文文字配置</h4>
        <div class="config-group">
          <label class="config-label">英文字体大小</label>
          <input 
            v-model.number="textConfig.englishFontSize" 
            type="number" 
            min="16" 
            max="80" 
            class="config-input"
          />
        </div>
        <div class="config-group">
          <label class="config-label">英文文字颜色</label>
          <input 
            v-model="textConfig.englishColor" 
            type="color" 
            class="config-color"
          />
        </div>
        <div class="config-group">
          <label class="config-label">英文描边宽度</label>
          <input 
            v-model.number="textConfig.englishStrokeWidth" 
            type="number" 
            min="0" 
            max="8" 
            class="config-input"
          />
        </div>
      </div>
      
      <!-- 中文文字配置 -->
      <div class="text-config">
        <h4 class="config-section-title">中文文字配置</h4>
        <div class="config-group">
          <label class="config-label">字体粗细</label>
          <select v-model="textConfig.fontWeight" class="config-select">
            <option value="normal">正常</option>
            <option value="bold">粗体</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="300">300</option>
            <option value="400">400</option>
            <option value="500">500</option>
            <option value="600">600</option>
            <option value="700">700</option>
            <option value="800">800</option>
            <option value="900">900</option>
          </select>
        </div>
        <div class="config-group">
          <label class="config-label">中文离顶部距离</label>
          <input 
            v-model.number="textConfig.chineseTopOffset" 
            type="number" 
            min="50" 
            max="400" 
            class="config-input"
          />
        </div>
        <div class="config-group">
          <label class="config-label">中文字符间距</label>
          <input 
            v-model.number="textConfig.chineseLetterSpacing" 
            type="number" 
            min="-5" 
            max="20" 
            class="config-input"
          />
        </div>
      </div>
      
      <!-- 英文文字位置配置 -->
      <div class="text-config">
        <h4 class="config-section-title">英文文字位置配置</h4>
        <div class="config-group">
          <label class="config-label">英文字体粗细</label>
          <select v-model="textConfig.englishFontWeight" class="config-select">
            <option value="normal">正常</option>
            <option value="bold">粗体</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="300">300</option>
            <option value="400">400</option>
            <option value="500">500</option>
            <option value="600">600</option>
            <option value="700">700</option>
            <option value="800">800</option>
            <option value="900">900</option>
          </select>
        </div>
        <div class="config-group">
          <label class="config-label">英文离顶部距离</label>
          <input 
            v-model.number="textConfig.englishTopOffset" 
            type="number" 
            min="50" 
            max="400" 
            class="config-input"
          />
        </div>
        <div class="config-group">
          <label class="config-label">英文字符间距</label>
          <input 
            v-model.number="textConfig.englishLetterSpacing" 
            type="number" 
            min="-5" 
            max="20" 
            class="config-input"
          />
        </div>
      </div>
    </div>

    <div class="processor-actions">
      <button 
        @click="processImages"
        :disabled="!canProcess || isProcessing"
        class="process-btn"
      >
        <Loader2 v-if="isProcessing" class="w-4 h-4 animate-spin" />
        <Zap v-else class="w-4 h-4" />
        {{ isProcessing ? '处理中...' : '开始处理' }}
      </button>
    </div>

    <div v-if="processingProgress" class="progress-section">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: processingProgress + '%' }"></div>
      </div>
      <p class="progress-text">{{ processingStatus }}</p>
    </div>

    <!-- Canvas用于预览和处理 -->
    <canvas ref="canvas" class="hidden-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Loader2, Zap } from 'lucide-vue-next'

interface TextConfig {
  fontFamily: string
  fontSize: number
  color: string
  strokeWidth: number
  fontWeight: string
  // 英文文字配置
  englishFontSize: number
  englishColor: string
  englishStrokeWidth: number
  englishFontWeight: string
  // 文字位置配置
  chineseTopOffset: number
  englishTopOffset: number
  // 字符间距配置
  chineseLetterSpacing: number
  englishLetterSpacing: number
}

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

interface ProcessResult {
  success: boolean
  results: Array<{
    id: string
    originalQrName: string
    processedImagePath: string
    downloadUrl: string
    filename: string
  }>
  processedCount: number
  message: string
}

const props = defineProps<{
  uploadData: UploadData | null
}>()

const emit = defineEmits<{
  processComplete: [result: ProcessResult]
  processError: [error: string]
}>()

const canvas = ref<HTMLCanvasElement>()
const isProcessing = ref(false)
const processingProgress = ref(0)
const processingStatus = ref('')

const textConfig = ref<TextConfig>({
  fontFamily: 'CustomFont',
  fontSize: 48,
  color: '#1bb8ce',
  strokeWidth: 0,
  // 英文文字配置
  englishFontSize: 36,
  englishColor: '#1bb8ce',
  englishStrokeWidth: 0,
  // 字体粗细
  fontWeight: 'bold',
  englishFontWeight: 'bold',
  // 位置配置
  chineseTopOffset: 150,
  englishTopOffset: 220,
  // 字符间距
  chineseLetterSpacing: 0,
  englishLetterSpacing: 0
})

const canProcess = computed(() => {
  return props.uploadData && props.uploadData.background && props.uploadData.qrCodes.length > 0
})

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
  
  let result = text
  
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
    '床': 'BED',
    'F': 'F'
  }
  
  // 替换中文部分
  Object.entries(translations).forEach(([chinese, english]) => {
    result = result.replace(new RegExp(chinese, 'g'), english)
  })
  
  // 处理床位号格式
  result = result.replace(/(\d+)BED/g, (match, bedNum) => {
    const formattedBedNum = bedNum.padStart(2, '0')
    return `${formattedBedNum} BED`
  })
  
  // 添加连接符
  result = result.replace(/(\w+ INPATIENT UNITS)(\d+)F(\d+) BED/, '$1- $2F - $3 BED')
  
  return result
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// 手动实现字符间距的文字绘制函数
const drawTextWithSpacing = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, letterSpacing: number, hasStroke: boolean) => {
  const chars = text.split('')
  let currentX = x
  
  // 计算总宽度以实现居中对齐
  let totalWidth = 0
  for (let i = 0; i < chars.length; i++) {
    const charWidth = ctx.measureText(chars[i]).width
    totalWidth += charWidth
    if (i < chars.length - 1) {
      totalWidth += letterSpacing
    }
  }
  
  // 从中心位置开始绘制
  currentX = x - totalWidth / 2
  
  // 逐个字符绘制
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    const charWidth = ctx.measureText(char).width
    
    ctx.fillText(char, currentX + charWidth / 2, y)
    
    currentX += charWidth + letterSpacing
  }
}

const loadFont = (): Promise<void> => {
  return new Promise((resolve) => {
    const font = new FontFace('CustomFont', 'url(/assets/font.otf)')
    font.load().then(() => {
      document.fonts.add(font)
      resolve()
    }).catch(() => {
      // 如果字体加载失败，使用默认字体
      console.warn('自定义字体加载失败，使用默认字体')
      resolve()
    })
  })
}

const processImages = async () => {
  if (!canProcess.value || !props.uploadData) return
  
  isProcessing.value = true
  processingProgress.value = 0
  processingStatus.value = '准备处理...'
  
  try {
    // 加载字体
    await loadFont()
    processingStatus.value = '字体加载完成'
    processingProgress.value = 10
    
    const requestData = {
      backgroundId: props.uploadData.background.id,
      qrCodeIds: props.uploadData.qrCodes.map(qr => qr.id),
      textConfig: textConfig.value
    }
    
    processingStatus.value = '发送处理请求...'
    processingProgress.value = 30
    
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
    
    processingProgress.value = 80
    
    if (!response.ok) {
      throw new Error(`处理失败: ${response.statusText}`)
    }
    
    const result: ProcessResult = await response.json()
    
    processingProgress.value = 100
    
    if (result.success) {
      processingStatus.value = `处理完成！共处理 ${result.processedCount} 张图片`
      emit('processComplete', result)
    } else {
      throw new Error(result.message || '处理失败')
    }
    
  } catch (error) {
    console.error('处理错误:', error)
    processingStatus.value = '处理失败'
    emit('processError', error instanceof Error ? error.message : '处理失败')
  } finally {
    isProcessing.value = false
    setTimeout(() => {
      processingProgress.value = 0
      processingStatus.value = ''
    }, 3000)
  }
}

// 客户端预览功能（可选）
const previewComposition = async (backgroundSrc: string, qrSrc: string, text: string) => {
  if (!canvas.value) return
  
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return
  
  try {
    // 加载图片
    const [bgImg, qrImg] = await Promise.all([
      loadImage(backgroundSrc),
      loadImage(qrSrc)
    ])
    
    // 设置画布尺寸
    canvas.value.width = bgImg.width
    canvas.value.height = bgImg.height
    
    // 绘制背景
    ctx.drawImage(bgImg, 0, 0)
    
    // 计算二维码位置（居中，向上移动）
    const qrSize = Math.min(bgImg.width * 0.5, bgImg.height * 0.5)
    const qrX = (bgImg.width - qrSize) / 2
    const qrY = (bgImg.height - qrSize) / 2 - 50
    
    // 绘制二维码
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
    
    // 获取英文翻译
    const englishText = translateToEnglish(text)
    
    // 设置文字对齐
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // 绘制中文文字
    ctx.font = `${textConfig.value.fontWeight} ${textConfig.value.fontSize}px ${textConfig.value.fontFamily}, Arial, sans-serif`
    ctx.fillStyle = textConfig.value.color
    
    const chineseTextY = qrY - textConfig.value.chineseTopOffset
    
    // 手动实现字符间距
    if (textConfig.value.chineseLetterSpacing && textConfig.value.chineseLetterSpacing !== 0) {
      drawTextWithSpacing(ctx, text, bgImg.width / 2, chineseTextY, textConfig.value.chineseLetterSpacing, false)
    } else {
      ctx.fillText(text, bgImg.width / 2, chineseTextY)
    }
    
    // 绘制英文文字
    ctx.font = `${textConfig.value.englishFontWeight} ${textConfig.value.englishFontSize}px Arial, sans-serif`
    ctx.fillStyle = textConfig.value.englishColor
    
    const englishTextY = qrY - textConfig.value.englishTopOffset
    
    // 手动实现字符间距
    if (textConfig.value.englishLetterSpacing && textConfig.value.englishLetterSpacing !== 0) {
      drawTextWithSpacing(ctx, englishText, bgImg.width / 2, englishTextY, textConfig.value.englishLetterSpacing, false)
    } else {
      ctx.fillText(englishText, bgImg.width / 2, englishTextY)
    }
    
    return canvas.value.toDataURL('image/jpeg', 0.9)
    
  } catch (error) {
    console.error('预览生成失败:', error)
    return null
  }
}

defineExpose({
  previewComposition
})
</script>

<style scoped>
.image-processor-container {
  @apply space-y-6;
}

.processor-header {
  @apply space-y-4;
}

.section-title {
  @apply text-lg font-semibold text-gray-800;
}

.text-config {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg;
}

.config-group {
  @apply space-y-2;
}

.config-label {
  @apply block text-sm font-medium text-gray-700;
}

.config-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.config-color {
  @apply w-full h-10 border border-gray-300 rounded-md cursor-pointer;
}

.config-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white;
}

.processor-actions {
  @apply flex justify-center;
}

.process-btn {
  @apply flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-lg;
  @apply hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors;
}

.progress-section {
  @apply space-y-2;
}

.progress-bar {
  @apply w-full bg-gray-200 rounded-full h-3;
}

.progress-fill {
  @apply bg-green-600 h-3 rounded-full transition-all duration-300;
}

.progress-text {
  @apply text-sm text-gray-600 text-center;
}

.hidden-canvas {
  @apply hidden;
}

.config-section-title {
  @apply text-base font-medium text-gray-800 mb-3 col-span-full;
}
</style>