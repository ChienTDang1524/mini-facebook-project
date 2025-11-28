
<script setup>
import { ref, onMounted } from 'vue'
import PostItem from './PostItem.vue'
import CreatePost from './CreatePost.vue'

const posts = ref([])
const currentPosts = ref(new Map()) // Lưu bài viết tạm thời (có video)

onMounted(() => {
  loadPosts()
})

const loadPosts = () => {
  try {
    const saved = localStorage.getItem('minifacebook-posts')
    if (saved) {
      const data = JSON.parse(saved)
      
      // Chỉ lấy bài viết từ localStorage (không có video)
      posts.value = data.slice(0, 10)
      
      // Khôi phục video từ currentPosts nếu có
      posts.value.forEach(post => {
        if (currentPosts.value.has(post.id)) {
          const currentPost = currentPosts.value.get(post.id)
          post.videos = currentPost.videos
        }
      })
    }
  } catch (error) {
    console.log('Lỗi load posts:', error)
  }
}

const handlePostCreated = (newPost) => {
  console.log('Bài mới:', newPost)
  
  // LUÔN giới hạn
  if (posts.value.length >= 10) {
    posts.value = posts.value.slice(0, 5)
  }
  
  posts.value.unshift(newPost)
  
  // Lưu bài viết có video vào bộ nhớ tạm
  if (newPost.videos && newPost.videos.length > 0) {
    currentPosts.value.set(newPost.id, { ...newPost })
  }
  
  savePosts()
}

const handlePostDeleted = (postId) => {
  posts.value = posts.value.filter(post => post.id !== postId)
  currentPosts.value.delete(postId)
  savePosts()
}

const handlePostUpdated = (updatedPost) => {
  const index = posts.value.findIndex(post => post.id === updatedPost.id)
  if (index !== -1) {
    posts.value[index] = updatedPost
    
    // Cập nhật bộ nhớ tạm nếu có video
    if (updatedPost.videos && updatedPost.videos.length > 0) {
      currentPosts.value.set(updatedPost.id, { ...updatedPost })
    } else {
      currentPosts.value.delete(updatedPost.id)
    }
    
    savePosts()
  }
}

const savePosts = () => {
  try {
    // CHỈ lưu bài viết KHÔNG có video vào localStorage
    const postsToSave = posts.value.map(post => ({
      ...post,
      videos: [] // QUAN TRỌNG: Không lưu video
    }))
    
    localStorage.setItem('minifacebook-posts', JSON.stringify(postsToSave))
    console.log('✅ Đã lưu', posts.value.length, 'bài viết (không video)')
    
  } catch (error) {
    console.log('❌ Lỗi lưu:', error)
    
    // GIẢI PHÁP DỰ PHÒNG: Chỉ lưu nội dung text
    if (error.name === 'QuotaExceededError') {
      const textOnlyPosts = posts.value.map(post => ({
        id: post.id,
        content: post.content,
        images: [],
        videos: [],
        createdAt: post.createdAt,
        likes: post.likes,
        comments: post.comments
      }))
      
      localStorage.setItem('minifacebook-posts', JSON.stringify(textOnlyPosts))
      console.log('📝 Đã lưu bài viết text-only')
    }
  }
}
</script>

<template>
  <div class="post-list">
    <div class="row">
      <div class="col-lg-4 mb-4">
        <CreatePost @post-created="handlePostCreated" />
      </div>
      
      <div class="col-lg-8">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4 class="mb-0">Bài viết gần đây</h4>
          <div class="text-end">
            <small class="text-muted d-block">{{ posts.length }} bài viết</small>
            <small class="text-info" v-if="currentPosts.size > 0">
              {{ currentPosts.size }} bài có video
            </small>
          </div>
        </div>

        <!-- Thông báo video tạm thời -->
        <div v-if="currentPosts.size > 0" class="alert alert-info alert-dismissible fade show">
          <i class="bi bi-info-circle me-2"></i>
          <strong>Video chỉ hiển thị tạm thời</strong> - sẽ mất khi reload trang
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>

        <div v-if="posts.length > 0">
          <PostItem 
            v-for="post in posts" 
            :key="post.id"
            :post="post"
            @post-deleted="handlePostDeleted"
            @post-updated="handlePostUpdated"
          />
        </div>
        
        <div v-else class="text-center py-5">
          <div class="card">
            <div class="card-body">
              <i class="bi bi-newspaper display-1 text-muted mb-3"></i>
              <p class="text-muted mb-3">Chưa có bài viết nào</p>
              <p class="text-muted small">Hãy tạo bài viết đầu tiên của bạn!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
[file content end]