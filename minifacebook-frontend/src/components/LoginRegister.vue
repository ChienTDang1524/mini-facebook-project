<script setup>
import { ref, inject } from 'vue'

const emit = defineEmits(['login-success'])
const api = inject('$api')

const isLogin = ref(true)
const form = ref({
  username: '',
  email: '',
  password: '',
  full_name: ''
})
const loading = ref(false)
const error = ref('')

const switchMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
  form.value = { username: '', email: '', password: '', full_name: '' }
}

const submitForm = async () => {
  if (loading.value) return

  loading.value = true
  error.value = ''

  try {
    let response
    if (isLogin.value) {
      response = await api.login({
        username: form.value.username,
        password: form.value.password
      })
    } else {
      // Validate đăng ký
      if (!form.value.full_name.trim()) {
        throw new Error('Vui lòng nhập họ và tên')
      }
      if (!form.value.email.trim()) {
        throw new Error('Vui lòng nhập email')
      }
      if (form.value.password.length < 6) {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự')
      }

      response = await api.register({
        username: form.value.username,
        email: form.value.email,
        password: form.value.password,
        full_name: form.value.full_name
      })
    }

    // Lưu token và user info
    localStorage.setItem('minifacebook_token', response.token)
    localStorage.setItem('minifacebook_user', JSON.stringify(response.user))
    
    emit('login-success', response.user)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-register-container">
    <div class="card shadow-lg">
      <div class="card-body p-5">
        <div class="text-center mb-4">
          <i class="bi bi-facebook display-4 text-primary mb-3"></i>
          <h2 class="h3 mb-2">{{ isLogin ? 'Đăng nhập' : 'Đăng ký' }}</h2>
          <p class="text-muted">
            {{ isLogin ? 'Đăng nhập vào MiniFacebook' : 'Tạo tài khoản mới' }}
          </p>
        </div>

        <div v-if="error" class="alert alert-danger alert-dismissible fade show">
          {{ error }}
          <button type="button" class="btn-close" @click="error = ''"></button>
        </div>

        <form @submit.prevent="submitForm">
          <div v-if="!isLogin" class="mb-3">
            <label class="form-label">Họ và tên *</label>
            <input 
              v-model="form.full_name"
              type="text" 
              class="form-control" 
              placeholder="Nhập họ và tên"
              required
              :disabled="loading"
            >
          </div>

          <div class="mb-3">
            <label class="form-label">{{ isLogin ? 'Username hoặc Email *' : 'Username *' }}</label>
            <input 
              v-model="form.username"
              type="text" 
              class="form-control" 
              :placeholder="isLogin ? 'Nhập username hoặc email' : 'Nhập username'"
              required
              :disabled="loading"
            >
          </div>

          <div v-if="!isLogin" class="mb-3">
            <label class="form-label">Email *</label>
            <input 
              v-model="form.email"
              type="email" 
              class="form-control" 
              placeholder="Nhập email"
              required
              :disabled="loading"
            >
          </div>

          <div class="mb-4">
            <label class="form-label">Mật khẩu *</label>
            <input 
              v-model="form.password"
              type="password" 
              class="form-control" 
              placeholder="Nhập mật khẩu"
              required
              minlength="6"
              :disabled="loading"
            >
            <div v-if="!isLogin" class="form-text">Mật khẩu phải có ít nhất 6 ký tự</div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary w-100 py-2 mb-3 d-flex align-items-center justify-content-center gap-2"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm" role="status"></span>
            {{ isLogin ? (loading ? 'Đang đăng nhập...' : 'Đăng nhập') : (loading ? 'Đang đăng ký...' : 'Đăng ký') }}
          </button>
        </form>

        <div class="text-center">
          <button 
            @click="switchMode" 
            class="btn btn-link text-decoration-none"
            :disabled="loading"
          >
            {{ isLogin ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-register-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem 0;
}

.card {
  border: none;
  border-radius: 12px;
}

.btn-primary {
  font-weight: 600;
  border-radius: 6px;
}

.form-control {
  border-radius: 6px;
  padding: 12px;
}

.form-control:focus {
  border-color: #1877f2;
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2);
}

.form-control:disabled {
  background-color: #e9ecef;
  opacity: 1;
}

.btn:disabled {
  cursor: not-allowed;
}
</style>