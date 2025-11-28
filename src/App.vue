<script setup>
import PostList from './components/PostList.vue'
</script>

<template>
  <div class="minifacebook-app">
    <!-- Header -->
    <header class="bg-primary text-white py-3 mb-4">
      <div class="container">
        <div class="row align-items-center">
          <div class="col">
            <h1 class="h3 mb-0">
              <i class="bi bi-facebook me-2"></i>
              MiniFacebook
            </h1>
          </div>
          <div class="col-auto">
            <small>Kết nối và chia sẻ</small>
          </div>
        </div>
      </div>
    </header>

    <main class="container">
      <PostList />
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
</style>