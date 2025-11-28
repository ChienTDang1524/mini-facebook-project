<script setup>
import { ref, inject } from 'vue'

const api = inject('$api')
const currentUser = inject('currentUser')

const emit = defineEmits(['post-created'])

const newPost = ref({
  content: ''
})

const imagePreviews = ref([])
const videoPreviews = ref([])
const isLoading = ref(false)
const error = ref('')

const handleImageUpload = (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    const remainingSlots = 10 - imagePreviews.value.length
    const filesToProcess = files.slice(0, remainingSlots)
    
    filesToProcess.forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chỉ chọn file ảnh!')
        return
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert('File ảnh quá lớn! Tối đa 10MB.')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        imagePreviews.value.push({
          id: Date.now() + Math.random(),
          url: e.target.result,
          file: file
        })
      }
      reader.readAsDataURL(file)
    })
    
    // Reset input
    event.target.value = ''
  }
}

const handleVideoUpload = (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    const remainingSlots = 3 - videoPreviews.value.length
    const filesToProcess = files.slice(0, remainingSlots)
    
    filesToProcess.forEach(file => {
      if (!file.type.startsWith('video/')) {
        alert('Vui lòng chỉ chọn file video!')
        return
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB
        alert('File video quá lớn! Tối đa 50MB.')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        videoPreviews.value.push({
          id: Date.now() + Math.random(),
          url: e.target.result,
          file: file
        })
      }
      reader.readAsDataURL(file)
    })
    
    // Reset input
    event.target.value = ''
  }
}

const removeImage = (index) => {
  imagePreviews.value.splice(index, 1)
}

const removeVideo = (index) => {
  videoPreviews.value.splice(index, 1)
}

const createPost = async () => {
  if (!newPost.value.content.trim() && imagePreviews.value.length === 0 && videoPreviews.value.length === 0) {
    error.value = 'Vui lòng nhập nội dung hoặc thêm ảnh/video!'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    // Tạo FormData để gửi file
    const formData = new FormData()
    formData.append('content', newPost.value.content.trim())

    // Thêm ảnh vào FormData
    imagePreviews.value.forEach((preview, index) => {
      formData.append('media', preview.file)
    })

    // Thêm video vào FormData
    videoPreviews.value.forEach((preview, index) => {
      formData.append('media', preview.file)
    })

    console.log('📤 Đang đăng bài...', {
      content: newPost.value.content,
      images: imagePreviews.value.length,
      videos: videoPreviews.value.length
    })

    const response = await api.createPost(formData)

    if (response.success) {
      console.log('✅ Đăng bài thành công:', response.post)
      emit('post-created', response.post)
      resetForm()
    } else {
      throw new Error(response.error || 'Lỗi khi đăng bài')
    }

  } catch (err) {
    console.error('❌ Lỗi đăng bài:', err)
    error.value = err.message || 'Lỗi khi đăng bài. Vui lòng thử lại!'
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  newPost.value.content = ''
  imagePreviews.value = []
  videoPreviews.value = []
  error.value = ''
  
  // Reset file inputs
  const imageInput = document.getElementById('imageUpload')
  const videoInput = document.getElementById('videoUpload')
  if (imageInput) imageInput.value = ''
  if (videoInput) videoInput.value = ''
}
</script>

<template>
  <div class="create-post-card card shadow-sm mb-4">
    <div class="card-body">
      <div class="d-flex align-items-center mb-3">
        <div class="user-avatar bg-primary rounded-circle d-flex align-items-center justify-content-center text-white me-3"
             style="width: 40px; height: 40px;">
          <span>{{ currentUser.full_name?.charAt(0) || currentUser.username?.charAt(0) }}</span>
        </div>
        <div>
          <h6 class="mb-0 fw-bold">{{ currentUser.full_name || currentUser.username }}</h6>
          <small class="text-muted">Đang cảm thấy thế nào?</small>
        </div>
      </div>
      
      <!-- Error message -->
      <div v-if="error" class="alert alert-danger alert-dismissible fade show mb-3">
        {{ error }}
        <button type="button" class="btn-close" @click="error = ''"></button>
      </div>
      
      <div class="mb-3">
        <textarea 
          v-model="newPost.content"
          class="form-control post-textarea" 
          rows="3" 
          placeholder="Bạn đang nghĩ gì?"
          maxlength="500"
          :disabled="isLoading"
        ></textarea>
        <div class="d-flex justify-content-between align-items-center mt-1">
          <small class="text-muted">{{ newPost.content.length }}/500</small>
        </div>
      </div>

      <!-- Hiển thị nhiều ảnh preview -->
      <div v-if="imagePreviews.length > 0" class="mb-3">
        <h6 class="small text-muted mb-2">Ảnh đã chọn ({{ imagePreviews.length }}/10):</h6>
        <div class="row g-2">
          <div v-for="(preview, index) in imagePreviews" :key="preview.id" class="col-4">
            <div class="position-relative image-preview-container">
              <img :src="preview.url" alt="Preview" class="post-image-preview">
              <button 
                @click="removeImage(index)" 
                class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                style="width: 24px; height: 24px; padding: 0; font-size: 12px;"
                type="button"
                title="Xóa ảnh"
                :disabled="isLoading"
              >
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Hiển thị video preview -->
      <div v-if="videoPreviews.length > 0" class="mb-3">
        <h6 class="small text-muted mb-2">Video đã chọn ({{ videoPreviews.length }}/3):</h6>
        <div class="row g-2">
          <div v-for="(preview, index) in videoPreviews" :key="preview.id" class="col-12">
            <div class="position-relative">
              <video :src="preview.url" class="post-video-preview" controls>
                Trình duyệt của bạn không hỗ trợ video.
              </video>
              <button 
                @click="removeVideo(index)" 
                class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                style="width: 24px; height: 24px; padding: 0; font-size: 12px;"
                type="button"
                title="Xóa video"
                :disabled="isLoading"
              >
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="border rounded p-2 mb-3">
        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted small">Thêm vào bài viết</span>
          <div class="d-flex gap-2">
            <!-- Nút chọn ảnh -->
            <label for="imageUpload" class="btn btn-sm btn-outline-primary border-0 text-primary" 
                   :class="{ 'disabled': isLoading }"
                   style="cursor: pointer;" 
                   title="Thêm ảnh">
              <i class="bi bi-image-fill"></i>
            </label>
            <input 
              id="imageUpload"
              type="file" 
              accept="image/*" 
              multiple
              @change="handleImageUpload" 
              class="d-none"
              :disabled="isLoading"
            >
            
            <!-- Nút chọn video -->
            <label for="videoUpload" class="btn btn-sm btn-outline-success border-0 text-success"
                   :class="{ 'disabled': isLoading }"
                   style="cursor: pointer;" 
                   title="Thêm video">
              <i class="bi bi-camera-video-fill"></i>
            </label>
            <input 
              id="videoUpload"
              type="file" 
              accept="video/*" 
              multiple
              @change="handleVideoUpload" 
              class="d-none"
              :disabled="isLoading"
            >
          </div>
        </div>
      </div>

      <button 
        @click="createPost" 
        :disabled="isLoading || (!newPost.content.trim() && imagePreviews.length === 0 && videoPreviews.length === 0)"
        class="btn btn-primary w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
        style="border-radius: 6px;"
        type="button"
      >
        <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status"></span>
        {{ isLoading ? 'Đang đăng...' : 'Đăng' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.create-post-card {
  border: none;
  border-radius: 8px;
  background: #fff;
  position: sticky;
  top: 20px;
}

.post-textarea {
  border: none;
  font-size: 15px;
  resize: none;
  padding: 12px;
  background: #f0f2f5;
  border-radius: 20px;
}

.post-textarea:focus {
  background: #fff;
  border: 1px solid #1877f2;
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2);
}

.post-textarea:disabled {
  background-color: #e9ecef;
  opacity: 1;
}

.image-preview-container {
  height: 100px;
  overflow: hidden;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.post-image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 1px solid #e4e6eb;
}

.post-video-preview {
  height: 150px;
  width: 100%;
  object-fit: contain;
  border: 1px solid #e4e6eb;
  background-color: #f8f9fa;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-weight: bold;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

label.disabled {
  cursor: not-allowed !important;
  opacity: 0.6;
}
</style>