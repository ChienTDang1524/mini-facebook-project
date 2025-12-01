<script setup>
import { ref, onMounted, inject } from 'vue'
import CreatePost from './CreatePost.vue'
import PostItem from './PostItem.vue'

const api = inject('$api')
const currentUser = inject('currentUser')

const posts = ref([])
const isLoading = ref(false)
const error = ref('')

// Load posts từ API
const loadPosts = async () => {
  isLoading.value = true
  error.value = ''
  
  try {
    console.log('📖 Đang tải danh sách bài viết...')
    const response = await api.getPosts()
    
    if (response.success) {
      posts.value = response.posts
      console.log(`Đã tải ${posts.value.length} bài viết`)
    } else {
      throw new Error(response.error || 'Lỗi khi tải bài viết')
    }
  } catch (err) {
    console.error('Lỗi tải bài viết:', err)
    error.value = err.message || 'Lỗi khi tải bài viết'
  } finally {
    isLoading.value = false
  }
}

// Xử lý khi có bài viết mới
const handlePostCreated = (newPost) => {
  console.log('➕ Bài viết mới được tạo:', newPost)
  posts.value.unshift(newPost)
}

// Xử lý khi bài viết bị xóa
const handlePostDeleted = (postId) => {
  console.log('🗑 Bài viết bị xóa:', postId)
  posts.value = posts.value.filter(post => post.id !== postId)
}

// Xử lý khi bài viết được cập nhật
const handlePostUpdated = (updatedPost) => {
  console.log('✏️ Bài viết được cập nhật:', updatedPost.id)
  const index = posts.value.findIndex(post => post.id === updatedPost.id)
  if (index !== -1) {
    posts.value[index] = updatedPost
  }
}

// Load posts khi component mounted
onMounted(() => {
  if (currentUser) {
    loadPosts()
  }
})
</script>

<template>
  <div class="post-list">
    <div class="row">
      <!-- Sidebar trái - Form tạo bài viết -->
      <div class="col-lg-4 mb-4">
        <CreatePost @post-created="handlePostCreated" />
      </div>
      
      <!-- Main content - Danh sách bài viết -->
      <div class="col-lg-8">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4 class="mb-0">Bài viết gần đây</h4>
          <div class="text-end">
            <small class="text-muted d-block">{{ posts.length }} bài viết</small>
            <button 
              @click="loadPosts" 
              class="btn btn-sm btn-outline-primary mt-1"
              :disabled="isLoading"
            >
              <i class="bi bi-arrow-clockwise" :class="{ 'spinner-border spinner-border-sm': isLoading }"></i>
              Làm mới
            </button>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="error" class="alert alert-danger alert-dismissible fade show mb-4">
          <i class="bi bi-exclamation-triangle me-2"></i>
          {{ error }}
          <button type="button" class="btn-close" @click="error = ''"></button>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 text-muted">Đang tải bài viết...</p>
        </div>

        <!-- Danh sách bài viết -->
        <div v-else-if="posts.length > 0">
          <PostItem 
            v-for="post in posts" 
            :key="post.id"
            :post="post"
            @post-deleted="handlePostDeleted"
            @post-updated="handlePostUpdated"
          />
        </div>
        
        <!-- Empty state -->
        <div v-else class="text-center py-5">
          <div class="card">
            <div class="card-body py-5">
              <i class="bi bi-newspaper display-1 text-muted mb-3"></i>
              <h5 class="text-muted mb-3">Chưa có bài viết nào</h5>
              <p class="text-muted mb-4">Hãy tạo bài viết đầu tiên của bạn!</p>
              <button @click="loadPosts" class="btn btn-primary">
                <i class="bi bi-arrow-clockwise me-2"></i>
                Tải lại
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-list {
  min-height: 400px;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>