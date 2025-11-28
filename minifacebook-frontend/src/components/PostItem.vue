<script setup>
import { ref, onMounted, inject } from 'vue'

const api = inject('$api')
const currentUser = inject('currentUser')

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
const isLiked = ref(props.post.is_liked || false)
const isLoading = ref(false)
const showDropdown = ref(false)

// Format thời gian
const formatTime = (timestamp) => {
    const now = new Date()
    const postDate = new Date(timestamp)
    const diffInSeconds = Math.floor((now - postDate) / 1000)

    if (diffInSeconds < 60) return 'Vừa xong'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`
    return postDate.toLocaleDateString('vi-VN')
}

// Xóa bài viết
const deletePost = async () => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return

    isLoading.value = true
    try {
        const response = await api.deletePost(props.post.id)
        if (response.success) {
            emit('post-deleted', props.post.id)
        }
    } catch (error) {
        console.error('❌ Lỗi xóa bài viết:', error)
        alert('Lỗi khi xóa bài viết: ' + error.message)
    } finally {
        isLoading.value = false
        hideDropdown()
    }
}

// Bắt đầu chỉnh sửa
const startEditing = () => {
    editedContent.value = props.post.content
    isEditing.value = true
    hideDropdown()
}

// Lưu chỉnh sửa - ĐÃ SỬA LỖI TOKEN
const saveEdit = async () => {
    if (!editedContent.value.trim()) return

    isLoading.value = true
    try {
        // Sử dụng api instance thay vì fetch trực tiếp
        const response = await api.updatePost(props.post.id, editedContent.value.trim())
        
        if (response.success) {
            emit('post-updated', response.post)
            isEditing.value = false
        } else {
            throw new Error(response.error || 'Lỗi khi cập nhật bài viết')
        }
    } catch (error) {
        console.error('❌ Lỗi cập nhật bài viết:', error)
        alert('Lỗi khi cập nhật bài viết: ' + error.message)
    } finally {
        isLoading.value = false
    }
}

// Hủy chỉnh sửa
const cancelEdit = () => {
    isEditing.value = false
    editedContent.value = props.post.content
}
// Like/unlike bài viết
const likePost = async () => {
    if (isLoading.value) return

    isLoading.value = true
    try {
        const response = await api.likePost(props.post.id)
        if (response.success) {
            isLiked.value = response.liked

            // Cập nhật likes count
            const updatedPost = {
                ...props.post,
                likes_count: response.liked ? props.post.likes_count + 1 : Math.max(0, props.post.likes_count - 1),
                is_liked: response.liked
            }
            emit('post-updated', updatedPost)
        }
    } catch (error) {
        console.error('❌ Lỗi like bài viết:', error)
    } finally {
        isLoading.value = false
    }
}

// Thêm bình luận
const addComment = async () => {
    if (!newComment.value.trim() || isLoading.value) return

    isLoading.value = true
    try {
        const response = await api.addComment(props.post.id, newComment.value)
        if (response.success) {
            // Thêm comment mới vào danh sách
            const updatedPost = {
                ...props.post,
                comments: [...props.post.comments, response.comment],
                comments_count: props.post.comments_count + 1
            }
            emit('post-updated', updatedPost)
            newComment.value = ''
        }
    } catch (error) {
        console.error('❌ Lỗi thêm bình luận:', error)
        alert('Lỗi khi thêm bình luận: ' + error.message)
    } finally {
        isLoading.value = false
    }
}

// Xóa bình luận
const deleteComment = async (commentId) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return

    try {
        const response = await api.deleteComment(commentId)
        if (response.success) {
            // Xóa comment khỏi danh sách
            const updatedPost = {
                ...props.post,
                comments: props.post.comments.filter(comment => comment.id !== commentId),
                comments_count: Math.max(0, props.post.comments_count - 1)
            }
            emit('post-updated', updatedPost)
        }
    } catch (error) {
        console.error('❌ Lỗi xóa bình luận:', error)
        alert('Lỗi khi xóa bình luận: ' + error.message)
    }
}

// Xử lý phím Enter khi comment
const handleCommentKeypress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        addComment()
    }
}

// Dropdown functions
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

// Method để tính toán class cho ảnh - Giống Facebook
const getImageColumnClass = (mediaCount) => {
    if (mediaCount === 1) return 'col-12'
    if (mediaCount === 2) return 'col-6'
    if (mediaCount === 3) return 'col-4'
    if (mediaCount === 4) return 'col-6' // 2x2 grid
    return 'col-4' // 3+ ảnh hiển thị grid
}

// Method mở ảnh lớn
const openImageModal = (imageUrl) => {
    // Đảm bảo URL đầy đủ nếu cần
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `http://localhost:3000${imageUrl}`
    window.open(fullUrl, '_blank')
}

// Method để lấy URL đầy đủ cho media
const getFullMediaUrl = (url) => {
    if (!url) return ''
    // Nếu URL đã có http thì giữ nguyên, nếu không thì thêm base URL
    return url.startsWith('http') ? url : `http://localhost:3000${url}`
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})
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
                            <span>{{ post.full_name?.charAt(0) || post.username?.charAt(0) }}</span>
                        </div>
                        <div>
                            <h6 class="mb-0 fw-bold">{{ post.full_name || post.username }}</h6>
                            <small class="text-muted">{{ formatTime(post.created_at) }}</small>
                        </div>
                    </div>

                    <!-- Dropdown menu (chỉ hiển thị cho chủ bài viết) -->
                    <div v-if="post.user_id === currentUser.id" class="dropdown-container position-relative">
                        <button class="btn btn-sm btn-outline-secondary border-0 rounded-circle" type="button"
                            style="width: 32px; height: 32px;" @click="toggleDropdown" :disabled="isLoading">
                            <i class="bi bi-three-dots"></i>
                        </button>

                        <!-- Dropdown menu -->
                        <div v-if="showDropdown" class="dropdown-menu-custom show">
                            <a class="dropdown-item-custom" href="#" @click.prevent="startEditing">
                                <i class="bi bi-pencil me-2"></i>Chỉnh sửa bài viết
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
                    <textarea v-model="editedContent" class="form-control mb-2" rows="3"
                        :disabled="isLoading"></textarea>
                    <div class="d-flex gap-2">
                        <button @click="saveEdit" class="btn btn-sm btn-primary" :disabled="isLoading">
                            <span v-if="isLoading" class="spinner-border spinner-border-sm me-1"></span>
                            Lưu
                        </button>
                        <button @click="cancelEdit" class="btn btn-sm btn-outline-secondary"
                            :disabled="isLoading">Hủy</button>
                    </div>
                </div>
                <p v-else class="mb-0 post-text">{{ post.content }}</p>
            </div>

            <!-- Hiển thị ảnh - Layout giống Facebook -->
            <div v-if="post.images && post.images.length > 0" class="post-images mt-2">
                <div class="row g-1 mx-0">
                    <div v-for="(image, index) in post.images" :key="index"
                        :class="getImageColumnClass(post.images.length)" class="image-container">
                        <img :src="getFullMediaUrl(image)" :alt="`Post image ${index + 1}`" class="post-image-full"
                            @click="openImageModal(getFullMediaUrl(image))">
                    </div>
                </div>
            </div>

            <!-- Hiển thị video - Giống Facebook -->
            <div v-if="post.videos && post.videos.length > 0" class="post-videos mt-2">
                <div class="row g-1 mx-0">
                    <div v-for="(video, index) in post.videos" :key="index" class="col-12 video-container">
                        <video :src="getFullMediaUrl(video)" class="post-video-full" controls preload="metadata" playsinline
                            webkit-playsinline type="video/mp4">
                            Trình duyệt của bạn không hỗ trợ video.
                        </video>
                    </div>
                </div>
            </div>

            <!-- Thống kê -->
            <div class="post-stats px-3 pt-2">
                <div class="d-flex justify-content-between text-muted">
                    <small v-if="post.likes_count > 0" class="d-flex align-items-center">
                        <span
                            class="like-count-badge bg-primary rounded-circle me-1 d-flex align-items-center justify-content-center"
                            style="width: 18px; height: 18px;">
                            <i class="bi bi-hand-thumbs-up-fill text-white" style="font-size: 10px;"></i>
                        </span>
                        {{ post.likes_count }}
                    </small>
                    <small v-if="post.comments_count > 0">
                        {{ post.comments_count }} bình luận
                    </small>
                </div>
            </div>

            <!-- Actions -->
            <div class="post-actions px-3 py-2">
                <div class="row text-center">
                    <div class="col">
                        <button @click="likePost" class="btn btn-sm w-100 action-btn"
                            :class="isLiked ? 'text-primary' : 'text-muted'" :disabled="isLoading">
                            <i class="bi bi-hand-thumbs-up-fill me-1" v-if="isLiked"></i>
                            <i class="bi bi-hand-thumbs-up me-1" v-else></i>
                            Thích
                        </button>
                    </div>
                    <div class="col">
                        <button @click="showComments = !showComments" class="btn btn-sm w-100 action-btn text-muted"
                            :disabled="isLoading">
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
                            <small>{{ currentUser.full_name?.charAt(0) || currentUser.username?.charAt(0) }}</small>
                        </div>
                        <div class="flex-grow-1">
                            <input v-model="newComment" type="text" class="form-control comment-input"
                                placeholder="Viết bình luận..." @keypress="handleCommentKeypress" :disabled="isLoading">
                        </div>
                        <button @click="addComment" class="btn btn-primary btn-sm"
                            :disabled="!newComment.trim() || isLoading" style="border-radius: 18px;">
                            <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
                            <i v-else class="bi bi-send"></i>
                        </button>
                    </div>
                </div>

                <!-- Danh sách bình luận -->
                <div v-if="post.comments && post.comments.length > 0" class="comments-list px-3 pb-3">
                    <div v-for="comment in post.comments" :key="comment.id" class="comment-item mb-2">
                        <div class="d-flex gap-2">
                            <div class="user-avatar-sm bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                                style="width: 32px; height: 32px;">
                                <small>{{ comment.full_name?.charAt(0) || comment.username?.charAt(0) }}</small>
                            </div>
                            <div class="flex-grow-1">
                                <div class="comment-content bg-light rounded p-2">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div>
                                            <strong class="comment-user">{{ comment.full_name || comment.username
                                                }}</strong>
                                            <p class="mb-1 comment-text">{{ comment.content }}</p>
                                        </div>
                                        <button v-if="comment.user_id === currentUser.id"
                                            @click="deleteComment(comment.id)"
                                            class="btn btn-sm btn-outline-danger border-0" style="padding: 2px 6px;"
                                            title="Xóa bình luận">
                                            <i class="bi bi-trash" style="font-size: 12px;"></i>
                                        </button>
                                    </div>
                                    <small class="text-muted">{{ formatTime(comment.created_at) }}</small>
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
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    margin-bottom: 16px;
}

.post-header {
    padding: 12px 16px 8px;
}

.post-content {
    padding: 0 16px 12px;
    font-size: 15px;
    line-height: 1.4;
    color: #050505;
}

.post-text {
    font-size: 15px;
    line-height: 1.4;
}

/* CSS cho ảnh - Layout giống Facebook */
.post-images {
    width: 100%;
    margin: 8px 0;
}

.image-container {
    padding: 1px;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background-color: #f0f2f5;
    border: 1px solid #f0f2f5;
}

.post-image-full {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    cursor: pointer;
    transition: opacity 0.3s;
}

.post-image-full:hover {
    opacity: 0.95;
}

/* Layout cho số lượng ảnh khác nhau */
/* 1 ảnh - chiếm toàn bộ chiều rộng */
.image-container.col-12 {
    aspect-ratio: 1.25;
    border-radius: 8px;
}

/* 2 ảnh - 2 cột bằng nhau */
.image-container.col-6 {
    aspect-ratio: 1;
}

.image-container.col-6:first-child {
    border-radius: 8px 0 0 8px;
}

.image-container.col-6:last-child {
    border-radius: 0 8px 8px 0;
}

/* 3 ảnh trở lên - hình vuông */
.image-container.col-4 {
    aspect-ratio: 1;
}

/* 3 ảnh - góc bo tròn */
.image-container.col-4:first-child {
    border-radius: 8px 0 0 0;
}

.image-container.col-4:nth-child(2) {
    border-radius: 0 8px 0 0;
}

.image-container.col-4:last-child {
    border-radius: 0 0 8px 0;
}

/* 4 ảnh - grid 2x2 */
.image-container.col-6:nth-child(1) {
    border-radius: 8px 0 0 0;
}

.image-container.col-6:nth-child(2) {
    border-radius: 0 8px 0 0;
}

.image-container.col-6:nth-child(3) {
    border-radius: 0 0 0 8px;
}

.image-container.col-6:nth-child(4) {
    border-radius: 0 0 8px 0;
}

/* CSS cho video - Giống Facebook */
.post-videos {
    width: 100%;
    margin: 8px 0;
}

.video-container {
    padding: 0;
    background-color: #000;
    border-radius: 8px;
    overflow: hidden;
}

.post-video-full {
    width: 100%;
    max-height: 500px;
    display: block;
    object-fit: contain;
    background-color: #000;
    cursor: pointer;
    border-radius: 8px;
}

/* Stats and actions */
.post-stats {
    padding: 8px 16px;
    border-bottom: 1px solid #e4e6eb;
    color: #65676b;
    font-size: 14px;
}

.post-actions {
    padding: 4px 16px;
    border-bottom: 1px solid #e4e6eb;
}

.action-btn {
    border: none;
    background: none;
    font-size: 14px;
    font-weight: 600;
    padding: 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
    color: #65676b;
}

.action-btn:hover:not(:disabled) {
    background-color: #f2f2f2;
}

.action-btn.text-primary {
    color: #1877f2;
}

.action-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
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

.comment-input:disabled {
    background-color: #e9ecef;
    opacity: 1;
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
    line-height: 1.4;
}

.user-avatar,
.user-avatar-sm {
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

.btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

/* Responsive cho mobile */
@media (max-width: 768px) {
    .post-image-full {
        max-height: 300px;
    }

    .post-video-full {
        max-height: 400px;
    }

    .post-header,
    .post-content,
    .post-stats,
    .post-actions {
        padding-left: 12px;
        padding-right: 12px;
    }
}
</style>