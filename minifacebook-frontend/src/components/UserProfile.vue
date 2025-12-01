<template>
  <div class="user-profile">
    <div class="card">
      <div class="card-header bg-primary text-white">
        <div class="d-flex justify-content-between align-items-center">
          <h4 class="mb-0">
            <i class="bi bi-person-gear me-2"></i>
            Chỉnh sửa thông tin cá nhân
          </h4>
          <button @click="goBack" class="btn btn-light btn-sm">
            <i class="bi bi-arrow-left me-1"></i>
            Quay lại
          </button>
        </div>
      </div>
      <div class="card-body">

        <div v-if="message" :class="['alert', messageType === 'success' ? 'alert-success' : 'alert-danger']">
          {{ message }}
        </div>

        <form @submit.prevent="updateProfile">
 
          <div class="mb-4 text-center">
            <div class="avatar-section">
              <div class="avatar-preview mb-3">
                <div v-if="!newAvatar && getAvatarUrl(currentUser)" class="avatar-image">
                  <img :src="getAvatarUrl(currentUser)" :alt="currentUser.full_name || currentUser.username" class="avatar-img">
                </div>
                <div v-else-if="newAvatar" class="avatar-image">
                  <img :src="avatarPreview" :alt="formData.full_name || formData.username" class="avatar-img">
                </div>
                <div v-else class="avatar-placeholder d-flex align-items-center justify-content-center text-white mx-auto">
                  <span class="avatar-initial">{{ getInitial(currentUser) }}</span>
                </div>
              </div>
              
              <div class="avatar-actions">
                <input 
                  type="file" 
                  ref="avatarInput"
                  accept="image/*" 
                  @change="handleAvatarChange" 
                  class="d-none"
                >
                <button 
                  type="button" 
                  @click="$refs.avatarInput.click()" 
                  class="btn btn-outline-primary btn-sm me-2"
                >
                  <i class="bi bi-camera me-1"></i>
                  Chọn ảnh
                </button>
                <button 
                  v-if="newAvatar" 
                  type="button" 
                  @click="removeAvatar" 
                  class="btn btn-outline-danger btn-sm"
                >
                  <i class="bi bi-trash me-1"></i>
                  Xóa
                </button>
              </div>
              <small class="text-muted d-block mt-1">Hỗ trợ: JPG, PNG, GIF (tối đa 2MB)</small>
            </div>
          </div>

          <div class="mb-3">
            <label for="full_name" class="form-label">Họ và tên</label>
            <input 
              type="text" 
              class="form-control" 
              id="full_name"
              v-model="formData.full_name"
              placeholder="Nhập họ và tên"
            >
          </div>

          <div class="mb-3">
            <label for="username" class="form-label">Tên đăng nhập</label>
            <input 
              type="text" 
              class="form-control" 
              id="username"
              v-model="formData.username"
              placeholder="Nhập tên đăng nhập"
              required
            >
            <div class="form-text text-danger" v-if="errors.username">
              {{ errors.username }}
            </div>
          </div>

          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input 
              type="email" 
              class="form-control" 
              id="email"
              v-model="formData.email"
              placeholder="Nhập email"
              required
            >
            <div class="form-text text-danger" v-if="errors.email">
              {{ errors.email }}
            </div>
          </div>

          <div class="mb-3">
            <div class="form-check">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="changePassword"
                v-model="changePassword"
              >
              <label class="form-check-label" for="changePassword">
                Thay đổi mật khẩu
              </label>
            </div>
          </div>

          <div v-if="changePassword" class="password-section">

            <div class="mb-3">
              <label for="current_password" class="form-label">Mật khẩu hiện tại</label>
              <input 
                type="password" 
                class="form-control" 
                id="current_password"
                v-model="formData.current_password"
                placeholder="Nhập mật khẩu hiện tại"
              >
              <div class="form-text text-danger" v-if="errors.current_password">
                {{ errors.current_password }}
              </div>
            </div>

            <div class="mb-3">
              <label for="new_password" class="form-label">Mật khẩu mới</label>
              <input 
                type="password" 
                class="form-control" 
                id="new_password"
                v-model="formData.new_password"
                placeholder="Nhập mật khẩu mới"
              >
              <div class="form-text text-danger" v-if="errors.new_password">
                {{ errors.new_password }}
              </div>
            </div>

            <div class="mb-3">
              <label for="confirm_password" class="form-label">Xác nhận mật khẩu mới</label>
              <input 
                type="password" 
                class="form-control" 
                id="confirm_password"
                v-model="formData.confirm_password"
                placeholder="Nhập lại mật khẩu mới"
              >
              <div class="form-text text-danger" v-if="errors.confirm_password">
                {{ errors.confirm_password }}
              </div>
            </div>
          </div>

          <div class="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="isLoading"
            >
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-check-circle me-1"></i>
              {{ isLoading ? 'Đang xử lý...' : 'Cập nhật' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted } from 'vue'

const currentUser = inject('currentUser')

const isLoading = ref(false)
const message = ref('')
const messageType = ref('')
const changePassword = ref(false)
const newAvatar = ref(null)
const avatarPreview = ref('')
const avatarInput = ref(null)

const emit = defineEmits(['back'])

const formData = reactive({
  full_name: '',
  username: '',
  email: '',
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const errors = reactive({
  username: '',
  email: '',
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const getAvatarUrl = (user) => {
  if (!user?.avatar) return ''
  
  if (user.avatar.startsWith('http')) {
    return user.avatar
  } else {
    return `http://localhost:3000${user.avatar}`
  }
}

const getInitial = (user) => {
  if (!user) return 'U'
  return (user.full_name?.charAt(0) || user.username?.charAt(0) || 'U').toUpperCase()
}

onMounted(() => {
  if (currentUser.value) {
    formData.full_name = currentUser.value.full_name || ''
    formData.username = currentUser.value.username || ''
    formData.email = currentUser.value.email || ''
  }
})

const handleAvatarChange = (event) => {
  const file = event.target.files[0]
  if (file) {

    if (file.size > 2 * 1024 * 1024) {
      showMessage('Kích thước ảnh không được vượt quá 2MB', 'error')
      return
    }
    if (!file.type.startsWith('image/')) {
      showMessage('Vui lòng chọn file ảnh hợp lệ', 'error')
      return
    }

    newAvatar.value = file
    avatarPreview.value = URL.createObjectURL(file)
  }
}

const removeAvatar = () => {
  newAvatar.value = null
  avatarPreview.value = ''
  if (avatarInput.value) {
    avatarInput.value.value = ''
  }
}

const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 5000)
}

const clearErrors = () => {
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

const validateForm = () => {
  clearErrors()
  let isValid = true

  if (!formData.username.trim()) {
    errors.username = 'Tên đăng nhập không được để trống'
    isValid = false
  }

  if (!formData.email.trim()) {
    errors.email = 'Email không được để trống'
    isValid = false
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Email không hợp lệ'
    isValid = false
  }

  if (changePassword.value) {
    if (!formData.current_password) {
      errors.current_password = 'Vui lòng nhập mật khẩu hiện tại'
      isValid = false
    }

    if (formData.new_password && formData.new_password.length < 6) {
      errors.new_password = 'Mật khẩu mới phải có ít nhất 6 ký tự'
      isValid = false
    }

    if (formData.new_password !== formData.confirm_password) {
      errors.confirm_password = 'Mật khẩu xác nhận không khớp'
      isValid = false
    }
  }

  return isValid
}

const updateProfile = async () => {
  if (!validateForm()) return

  isLoading.value = true

  try {
    const token = localStorage.getItem('minifacebook_token')

    const submitData = new FormData()
    submitData.append('full_name', formData.full_name)
    submitData.append('username', formData.username)
    submitData.append('email', formData.email)
    
    if (changePassword.value) {
      submitData.append('current_password', formData.current_password)
      if (formData.new_password) {
        submitData.append('new_password', formData.new_password)
      }
    }

    if (newAvatar.value) {
      submitData.append('avatar', newAvatar.value)
    }

    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: submitData
    })

    const data = await response.json()

    if (data.success) {
      showMessage('Cập nhật thông tin thành công!', 'success')
     
      if (data.user) {
        currentUser.value = { ...currentUser.value, ...data.user }
        localStorage.setItem('minifacebook_user', JSON.stringify(data.user))
      }

      if (changePassword.value) {
        formData.current_password = ''
        formData.new_password = ''
        formData.confirm_password = ''
        changePassword.value = false
      }

      removeAvatar()
    } else {
      showMessage(data.error || 'Có lỗi xảy ra', 'error')
      
      if (data.errors) {
        Object.keys(data.errors).forEach(key => {
          if (errors[key] !== undefined) {
            errors[key] = data.errors[key]
          }
        })
      }
    }
  } catch (error) {
    console.error('Lỗi cập nhật profile:', error)
    showMessage('Lỗi kết nối đến server', 'error')
  } finally {
    isLoading.value = false
  }
}

const goBack = () => {
  emit('back')
}
</script>

<style scoped>
.user-profile {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 0;
}

.avatar-section {
  padding: 20px;
  border: 2px dashed #dee2e6;
  border-radius: 10px;
  background-color: #f8f9fa;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  margin: 0 auto;
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
  border: 3px solid #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  font-weight: bold;
  border: 3px solid #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.avatar-initial {
  font-size: 36px;
  font-weight: bold;
}

.avatar-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.password-section {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #0d6efd;
}

.alert {
  margin-bottom: 20px;
}

.form-label {
  font-weight: 600;
  color: #495057;
}

.card {
  border: none;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  border-radius: 15px;
}

.card-header {
  border-radius: 15px 15px 0 0 !important;
  padding: 1.5rem;
}

.btn-primary {
  background-color: #1877f2;
  border-color: #1877f2;
}

.btn-primary:hover {
  background-color: #166fe5;
  border-color: #166fe5;
}
</style>