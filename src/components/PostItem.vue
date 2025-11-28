[file name]: PostItem.vue
[file content begin]
<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['post-deleted', 'post-updated'])

const isEditing = ref(false)
const editedContent = ref(props.post.content)
const showComments = ref(false)
const newComment = ref('')
const isLiked = ref(false)
const editingMedia = ref(false) // Trạng thái chỉnh sửa media

const formatTime = (timestamp) => {
  const now = new Date()
  const postDate = new Date(timestamp)
  const diffInSeconds = Math.floor((now - postDate) / 1000)
  
  if (diffInSeconds < 60) return 'Vừa xong'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày`
  return postDate.toLocaleDateString('vi-VN')
}

// SỬA: Xóa bài viết
const deletePost = () => {
  if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
    emit('post-deleted', props.post.id)
  }
  hideDropdown()
}

const startEditing = () => {
  editedContent.value = props.post.content
  isEditing.value = true
  hideDropdown()
}

// SỬA: Bắt đầu chỉnh sửa media
const startEditingMedia = () => {
  editingMedia.value = true
  hideDropdown()
}

const saveEdit = () => {
  if (editedContent.value.trim()) {
    const updatedPost = {
      ...props.post,
      content: editedContent.value.trim()
    }
    emit('post-updated', updatedPost)
    isEditing.value = false
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editedContent.value = props.post.content
}

// SỬA: Lưu chỉnh sửa media
const saveMediaEdit = () => {
  const updatedPost = {
    ...props.post,
    images: [...props.post.images],
    videos: [...props.post.videos]
  }
  emit('post-updated', updatedPost)
  editingMedia.value = false
}

const cancelMediaEdit = () => {
  editingMedia.value = false
}

// SỬA: Xóa ảnh khỏi bài viết
const removeImage = (index) => {
  if (confirm('Bạn có chắc muốn xóa ảnh này?')) {
    const updatedPost = {
      ...props.post,
      images: props.post.images.filter((_, i) => i !== index)
    }
    emit('post-updated', updatedPost)
  }
}

// SỬA: Xóa video khỏi bài viết
const removeVideo = (index) => {
  if (confirm('Bạn có chắc muốn xóa video này?')) {
    const updatedPost = {
      ...props.post,
      videos: props.post.videos.filter((_, i) => i !== index)
    }
    emit('post-updated', updatedPost)
  }
}

const likePost = () => {
  const likeChange = isLiked.value ? -1 : 1
  isLiked.value = !isLiked.value
  
  const updatedPost = {
    ...props.post,
    likes: Math.max(0, props.post.likes + likeChange)
  }
  emit('post-updated', updatedPost)
}

const addComment = () => {
  if (newComment.value.trim()) {
    const updatedPost = {
      ...props.post,
      comments: [
        ...props.post.comments,
        {
          id: Date.now(),
          user: 'Bạn',
          content: newComment.value.trim(),
          createdAt: new Date().toISOString()
        }
      ]
    }
    emit('post-updated', updatedPost)
    newComment.value = ''
  }
}

const deleteComment = (commentId) => {
  if (confirm('Bạn có chắc muốn xóa bình luận này?')) {
    const updatedPost = {
      ...props.post,
      comments: props.post.comments.filter(comment => comment.id !== commentId)
    }
    emit('post-updated', updatedPost)
  }
}

const handleCommentKeypress = (event) => {
  if (event.key === 'Enter') {
    addComment()
  }
}

// Dropdown functions
const showDropdown = ref(false)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const hideDropdown = () => {
  showDropdown.value = false
}

const handleClickOutside = (event) => {
  if (!event.target.closest('.dropdown-container')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

// Method để tính toán class cho ảnh
const getImageColumnClass = (mediaCount) => {
  if (mediaCount === 1) return 'col-12'
  if (mediaCount === 2) return 'col-6'
  if (mediaCount === 3) return 'col-4'
  if (mediaCount === 4) return 'col-6'
  return 'col-4'
}
</script>

<template>
  <div class="post-item card shadow-sm mb-4">
    <div class="card-body p-0">
      <!-- Header bài viết -->
      <div class="post-header px-3 pt-3">
        <div class="d-flex justify-content-between align-items-start">
          <div class="d-flex align-items-center">
            <div class="user-avatar bg-primary rounded-circle d-flex align-items-center justify-content-center text-white me-3"
                 style="width: 40px; height: 40px;">
              <i class="bi bi-person-fill"></i>
            </div>
            <div>
              <h6 class="mb-0 fw-bold">Người dùng</h6>
              <small class="text-muted">{{ formatTime(post.createdAt) }}</small>
            </div>
          </div>
          
          <!-- Dropdown custom -->
          <div class="dropdown-container position-relative">
            <button class="btn btn-sm btn-outline-secondary border-0 rounded-circle" 
                    type="button" 
                    style="width: 32px; height: 32px;"
                    @click="toggleDropdown">
              <i class="bi bi-three-dots"></i>
            </button>
            
            <!-- Dropdown menu -->
            <div v-if="showDropdown" class="dropdown-menu-custom show">
              <a class="dropdown-item-custom" href="#" @click.prevent="startEditing">
                <i class="bi bi-pencil me-2"></i>Chỉnh sửa nội dung
              </a>
              <a class="dropdown-item-custom" href="#" @click.prevent="startEditingMedia" v-if="post.images.length > 0 || post.videos.length > 0">
                <i class="bi bi-images me-2"></i>Chỉnh sửa ảnh/video
              </a>
              <div class="dropdown-divider-custom"></div>
              <a class="dropdown-item-custom text-danger" href="#" @click.prevent="deletePost">
                <i class="bi bi-trash me-2"></i>Xóa bài viết
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Nội dung bài viết -->
      <div class="post-content px-3 pt-3">
        <div v-if="isEditing" class="editing-area">
          <textarea v-model="editedContent" class="form-control mb-2" rows="3"></textarea>
          <div class="d-flex gap-2">
            <button @click="saveEdit" class="btn btn-sm btn-primary">Lưu</button>
            <button @click="cancelEdit" class="btn btn-sm btn-outline-secondary">Hủy</button>
          </div>
        </div>
        <p v-else class="mb-0 post-text">{{ post.content }}</p>
      </div>

      <!-- Hiển thị ảnh - ĐÃ SỬA: Hiển thị size gốc -->
      <div v-if="post.images && post.images.length > 0" class="post-images mt-2">
        <div class="row g-2 mx-0">
          <div v-for="(image, index) in post.images" :key="index" 
               :class="getImageColumnClass(post.images.length)"
               class="image-container position-relative">
            <img :src="image" :alt="`Post image ${index + 1}`" class="post-image-full">
            
            <!-- Nút xóa ảnh khi đang chỉnh sửa -->
            <button v-if="editingMedia" 
                    @click="removeImage(index)" 
                    class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                    style="width: 24px; height: 24px; padding: 0; font-size: 12px; z-index: 10;"
                    type="button"
                    title="Xóa ảnh">
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Hiển thị video -->
      <div v-if="post.videos && post.videos.length > 0" class="post-videos mt-2">
        <div class="row g-2 mx-0">
          <div v-for="(video, index) in post.videos" :key="index" 
               class="col-12 video-container position-relative">
            <video :src="video" class="post-video-full" controls>
              Trình duyệt của bạn không hỗ trợ video.
            </video>
            
            <!-- Nút xóa video khi đang chỉnh sửa -->
            <button v-if="editingMedia" 
                    @click="removeVideo(index)" 
                    class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                    style="width: 24px; height: 24px; padding: 0; font-size: 12px; z-index: 10;"
                    type="button"
                    title="Xóa video">
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Nút lưu/hủy khi chỉnh sửa media -->
      <div v-if="editingMedia" class="px-3 pt-2">
        <div class="d-flex gap-2">
          <button @click="saveMediaEdit" class="btn btn-sm btn-primary">Lưu thay đổi</button>
          <button @click="cancelMediaEdit" class="btn btn-sm btn-outline-secondary">Hủy</button>
        </div>
      </div>

      <!-- Thống kê -->
      <div class="post-stats px-3 pt-2">
        <div class="d-flex justify-content-between text-muted">
          <small v-if="post.likes > 0" class="d-flex align-items-center">
            <span class="like-count-badge bg-primary rounded-circle me-1 d-flex align-items-center justify-content-center"
                  style="width: 18px; height: 18px;">
              <i class="bi bi-hand-thumbs-up-fill text-white" style="font-size: 10px;"></i>
            </span>
            {{ post.likes }}
          </small>
          <small v-if="post.comments.length > 0">
            {{ post.comments.length }} bình luận
          </small>
        </div>
      </div>

      <!-- Actions -->
      <div class="post-actions px-3 py-2">
        <div class="row text-center">
          <div class="col">
            <button @click="likePost" 
                    class="btn btn-sm w-100 action-btn"
                    :class="isLiked ? 'text-primary' : 'text-muted'">
              <i class="bi bi-hand-thumbs-up-fill me-1" v-if="isLiked"></i>
              <i class="bi bi-hand-thumbs-up me-1" v-else></i>
              Thích
            </button>
          </div>
          <div class="col">
            <button @click="showComments = !showComments" 
                    class="btn btn-sm w-100 action-btn text-muted">
              <i class="bi bi-chat me-1"></i>
              Bình luận
            </button>
          </div>
        </div>
      </div>

      <!-- Bình luận -->
      <div v-if="showComments" class="comments-section border-top">
        <!-- Form bình luận -->
        <div class="comment-form p-3">
          <div class="d-flex align-items-center gap-2">
            <div class="user-avatar-sm bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white"
                 style="width: 32px; height: 32px;">
              <small>B</small>
            </div>
            <div class="flex-grow-1">
              <input 
                v-model="newComment"
                type="text" 
                class="form-control comment-input" 
                placeholder="Viết bình luận..."
                @keypress="handleCommentKeypress"
              >
            </div>
            <button @click="addComment" 
                    class="btn btn-primary btn-sm"
                    :disabled="!newComment.trim()"
                    style="border-radius: 18px;">
              <i class="bi bi-send"></i>
            </button>
          </div>
        </div>

        <!-- Danh sách bình luận -->
        <div v-if="post.comments.length > 0" class="comments-list px-3 pb-3">
          <div v-for="comment in post.comments" :key="comment.id" class="comment-item mb-2">
            <div class="d-flex gap-2">
              <div class="user-avatar-sm bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                   style="width: 32px; height: 32px;">
                <small>{{ comment.user.charAt(0) }}</small>
              </div>
              <div class="flex-grow-1">
                <div class="comment-content bg-light rounded p-2">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <strong class="comment-user">{{ comment.user }}</strong>
                      <p class="mb-1 comment-text">{{ comment.content }}</p>
                    </div>
                    <button @click="deleteComment(comment.id)" 
                            class="btn btn-sm btn-outline-danger border-0"
                            style="padding: 2px 6px;"
                            title="Xóa bình luận">
                      <i class="bi bi-trash" style="font-size: 12px;"></i>
                    </button>
                  </div>
                  <small class="text-muted">{{ formatTime(comment.createdAt) }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-item {
  border: none;
  border-radius: 8px;
  background: #fff;
}

.post-header {
  padding-bottom: 12px;
}

.post-content {
  padding-bottom: 12px;
}

.post-text {
  font-size: 15px;
  line-height: 1.4;
}

/* CSS FIXED cho ảnh - HIỂN THỊ SIZE GỐC KHÔNG VỠ */
.post-images {
  width: 100%;
}

.image-container {
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow: visible;
  background-color: transparent;
}

.post-image-full {
  max-width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  cursor: pointer;
  transition: transform 0.2s ease;
  border-radius: 8px;
}

.post-image-full:hover {
  transform: scale(1.01);
}

/* CSS cho video */
.post-videos {
  width: 100%;
}

.video-container {
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow: visible;
  background-color: #000;
}

.post-video-full {
  max-width: 100%;
  height: auto;
  max-height: 500px;
  display: block;
  object-fit: contain;
  border-radius: 8px;
}

/* FIXED: Xóa tất cả height cố định và cho phép ảnh hiển thị tự nhiên */
.post-images .col-12,
.post-images .col-6,
.post-images .col-4 {
  height: auto;
  min-height: auto;
}

.post-images .col-12 .post-image-full,
.post-images .col-6 .post-image-full,
.post-images .col-4 .post-image-full {
  height: auto;
}

.post-image-full, .post-video-full {
  max-width: 100%;
}

/* Grid layout */
.post-images .row, .post-videos .row {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
}

.post-images .row > div, .post-videos .row > div {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* Border giữa các ảnh - ĐÃ SỬA: Xóa border để ảnh hiển thị tự nhiên */
.post-images .row.g-2 > div {
  border: none !important;
}

.post-stats {
  border-bottom: 1px solid #f0f2f5;
  padding-bottom: 8px;
}

.like-count-badge {
  font-size: 10px;
}

.post-actions {
  border-bottom: 1px solid #f0f2f5;
}

.action-btn {
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
  cursor: pointer;
}

.action-btn:hover {
  background-color: #f2f2f2;
}

.comment-input {
  border-radius: 20px;
  border: 1px solid #e4e6eb;
  padding: 8px 12px;
  font-size: 14px;
}

.comment-input:focus {
  border-color: #1877f2;
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2);
}

.comment-content {
  background: #f0f2f5 !important;
  border: none;
  max-width: 100%;
}

.comment-user {
  font-size: 13px;
  color: #050505;
}

.comment-text {
  font-size: 14px;
  color: #050505;
  margin-bottom: 4px;
}

.user-avatar, .user-avatar-sm {
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-avatar-sm {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

/* Custom dropdown styles */
.dropdown-container {
  display: inline-block;
}

.dropdown-menu-custom {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  min-width: 200px;
  padding: 8px 0;
  margin: 2px 0 0;
  font-size: 14px;
  text-align: left;
  list-style: none;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.dropdown-menu-custom.show {
  display: block;
}

.dropdown-item-custom {
  display: block;
  width: 100%;
  padding: 8px 16px;
  clear: both;
  font-weight: 400;
  color: #212529;
  text-align: inherit;
  text-decoration: none;
  white-space: nowrap;
  background-color: transparent;
  border: 0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item-custom:hover {
  background-color: #f8f9fa;
  text-decoration: none;
}

.dropdown-divider-custom {
  height: 0;
  margin: 8px 0;
  overflow: hidden;
  border-top: 1px solid #e9ecef;
}

.btn-outline-secondary:hover {
  background-color: #f2f2f2;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  color: white;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
