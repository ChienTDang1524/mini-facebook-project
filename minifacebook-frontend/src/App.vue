<script setup>
import { ref, onMounted, provide } from 'vue'
import LoginRegister from './components/LoginRegister.vue'
import PostList from './components/PostList.vue'
import UserProfile from './components/UserProfile.vue'

const currentUser = ref(null)
const isLoading = ref(true)
const currentView = ref('posts') // 'posts' hoặc 'profile'

// Provide currentUser to all components
provide('currentUser', currentUser)

// Kiểm tra đăng nhập khi app khởi động
onMounted(async () => {
  const token = localStorage.getItem('minifacebook_token')
  const userData = localStorage.getItem('minifacebook_user')
  
  if (token && userData) {
    try {
      currentUser.value = JSON.parse(userData)
    } catch (error) {
      console.error('Lỗi parse user data:', error)
      logout()
    }
  }
  isLoading.value = false
})

const handleLoginSuccess = (user) => {
  currentUser.value = user
  console.log('✅ Đăng nhập thành công:', user.username)
}

const logout = () => {
  localStorage.removeItem('minifacebook_token')
  localStorage.removeItem('minifacebook_user')
  currentUser.value = null
  currentView.value = 'posts'
  console.log('🚪 Đã đăng xuất')
}

const showProfile = () => {
  currentView.value = 'profile'
}

const showPosts = () => {
  currentView.value = 'posts'
}

// Lấy URL avatar đầy đủ
const getAvatarUrl = (user) => {
  if (!user?.avatar) return ''
  
  if (user.avatar.startsWith('http')) {
    return user.avatar
  } else {
    return `http://localhost:3000${user.avatar}`
  }
}

// Hiển thị chữ cái đầu nếu không có avatar
const getInitial = (user) => {
  if (!user) return 'U'
  return (user.full_name?.charAt(0) || user.username?.charAt(0) || 'U').toUpperCase()
}

// Xử lý lỗi ảnh
const handleImageError = (event, user) => {
  console.log('❌ Lỗi tải ảnh avatar:', event.target.src)
  event.target.style.display = 'none'
  const parent = event.target.parentElement
  if (parent) {
    const placeholder = parent.querySelector('.avatar-placeholder')
    if (placeholder) {
      placeholder.style.display = 'flex'
    }
  }
}
</script>

<template>
  <div class="minifacebook-app">
    <!-- Loading -->
    <div v-if="isLoading" class="loading-screen">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Đang tải...</p>
    </div>

    <!-- Header khi đã đăng nhập -->
    <header v-else-if="currentUser" class="bg-primary text-white py-3 mb-4">
      <div class="container">
        <div class="row align-items-center">
          <div class="col">
            <h1 class="h3 mb-0">
              <i class="bi bi-facebook me-2"></i>
              MiniFacebook
            </h1>
          </div>
          <div class="col-auto">
            <div class="d-flex align-items-center gap-3">
              <div class="d-flex align-items-center">
                <!-- Avatar trong header -->
                <div class="user-avatar me-2">
                  <div v-if="getAvatarUrl(currentUser)" class="avatar-image">
                    <img 
                      :src="getAvatarUrl(currentUser)" 
                      :alt="currentUser.full_name || currentUser.username"
                      class="avatar-img"
                      @error="(e) => handleImageError(e, currentUser)"
                    >
                  </div>
                  <div v-else class="avatar-placeholder d-flex align-items-center justify-content-center text-white">
                    <span class="avatar-initial">{{ getInitial(currentUser) }}</span>
                  </div>
                </div>
                <span class="user-name">{{ currentUser.full_name || currentUser.username }}</span>
              </div>
              
              <!-- Nút chỉnh sửa profile -->
              <button v-if="currentView === 'posts'" @click="showProfile" class="btn btn-outline-light btn-sm">
                <i class="bi bi-person-gear me-1"></i>
                Hồ sơ
              </button>
              
              <button @click="logout" class="btn btn-outline-light btn-sm">
                <i class="bi bi-box-arrow-right me-1"></i>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="container">
      <!-- Màn hình đăng nhập/đăng ký -->
      <div v-if="!currentUser && !isLoading" class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <LoginRegister @login-success="handleLoginSuccess" />
        </div>
      </div>

      <!-- Màn hình chính khi đã đăng nhập -->
      <PostList v-else-if="currentUser && currentView === 'posts'" />
      
      <!-- Màn hình chỉnh sửa profile -->
      <UserProfile 
        v-else-if="currentUser && currentView === 'profile'" 
        @back="showPosts" 
      />
    </main>
  </div>
</template>

<style scoped>
.minifacebook-app {
  min-height: 100vh;
  background-color: #f0f2f5;
}

header {
  box-shadow: 0 2px 4px rgba(0,0,0,.1);
}

.loading-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

/* CSS cho avatar trong header */
.user-avatar {
  width: 32px;
  height: 32px;
  position: relative;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  font-weight: 600;
}

.avatar-initial {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.user-name {
  font-weight: 500;
}

/* Responsive cho mobile */
@media (max-width: 768px) {
  .user-name {
    display: none;
  }
  
  .d-flex.align-items-center.gap-3 {
    gap: 1rem !important;
  }
}
</style>