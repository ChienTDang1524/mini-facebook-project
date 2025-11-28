import { createApp } from 'vue'
import App from './App.vue'

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

// Import Bootstrap JavaScript
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Tạo app
const app = createApp(App)

// Global API service
const api = {
  baseURL: 'http://localhost:3000/api',
  
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('minifacebook_token')
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    try {
      console.log(`🔄 API Call: ${endpoint}`, options)
      const response = await fetch(`${this.baseURL}${endpoint}`, config)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi server')
      }
      
      return data
    } catch (error) {
      console.error(' API Error:', error)
      throw error
    }
  },

  // SỬA LẠI PHƯƠNG THỨC updatePost
  async updatePost(postId, content) {
    try {
      console.log('🔄 API Call: updatePost', { postId, content });
      
      const response = await fetch(`${this.baseURL}/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('minifacebook_token')}`
        },
        body: JSON.stringify({ content })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi cập nhật bài viết');
      }
      
      console.log('✅ API Response: updatePost', data);
      return data;
    } catch (error) {
      console.error('❌ Lỗi updatePost:', error);
      throw error;
    }
  },

  // Auth methods
  async register(userData) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  },

  async login(credentials) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
  },

  async getCurrentUser() {
    return this.request('/me')
  },

  // Post methods
  async getPosts() {
    return this.request('/posts')
  },

  async createPost(formData) {
    // Xóa Content-Type để browser tự set (quan trọng cho FormData)
    return fetch(`${this.baseURL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('minifacebook_token')}`
      },
      body: formData
    }).then(response => response.json())
  },

  async deletePost(postId) {
    return this.request(`/posts/${postId}`, {
      method: 'DELETE'
    })
  },

  async likePost(postId) {
    return this.request(`/posts/${postId}/like`, {
      method: 'POST'
    })
  },

  // Comment methods
  async addComment(postId, content) {
    return this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    })
  },

  async deleteComment(commentId) {
    return this.request(`/comments/${commentId}`, {
      method: 'DELETE'
    })
  }
}

// Provide API service to all components
app.provide('$api', api)

app.mount('#app')

console.log(' MiniFacebook app started successfully!')