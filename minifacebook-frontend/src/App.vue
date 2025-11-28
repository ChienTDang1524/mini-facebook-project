<script setup>
import { ref, onMounted, provide } from 'vue'
import LoginRegister from './components/LoginRegister.vue'
import PostList from './components/PostList.vue'

const currentUser = ref(null)
const isLoading = ref(true)

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
  console.log('🚪 Đã đăng xuất')
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
                <div class="user-avatar bg-white text-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                     style="width: 32px; height: 32px; font-size: 14px;">
                  <span>{{ currentUser.full_name?.charAt(0) || currentUser.username?.charAt(0) }}</span>
                </div>
                <span>{{ currentUser.full_name || currentUser.username }}</span>
              </div>
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
      <PostList v-else-if="currentUser" />
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

.user-avatar {
  font-weight: bold;
}
</style>