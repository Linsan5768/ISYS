<template>
  <div>
    <h2>后端 API 测试</h2>
    <button @click="fetchData">获取后端数据</button>
    <p v-if="data">后端返回的数据: {{ data }}</p>
    <p v-if="error" style="color: red;">错误: {{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'

const { proxy } = getCurrentInstance()
const apiResponse = ref('No data yet')
const isLoading = ref(false)

const testBackendConnection = async () => {
  isLoading.value = true
  try {
    // 修改前:
    // const response = await fetch('https://fanum-backend.onrender.com/api/test')
    // const data = await response.json()
    
    // 修改后:
    const response = await proxy.$axios.get('/api/test')
    const data = response.data
    
    apiResponse.value = JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('Backend connection error:', error)
    apiResponse.value = `Error: ${error.message}`
  } finally {
    isLoading.value = false
  }
}

onMounted(testBackendConnection)
</script>

<style scoped>
button {
  padding: 10px;
  background: blue;
  color: white;
  border: none;
  cursor: pointer;
}
</style>
