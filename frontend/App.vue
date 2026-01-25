<template>
  <div class="app">
    <Sidebar />
    <main class="main">
      <Topbar 
        :crumb="crumb"
        :pageTitle="pageTitle"
      />
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import Topbar from './components/Topbar.vue'

const route = useRoute()
const crumb = ref('/ 总览')
const pageTitle = ref('智能合约漏洞全生命周期管理（Demo）')

// 根据路由动态更新顶部栏标题
watch(
  () => route.name,
  (name) => {
    switch (name) {
      case 'Dashboard':
        crumb.value = '/ 总览'
        pageTitle.value = '智能合约漏洞全生命周期管理（Demo）'
        break
      case 'ScanCenter':
        crumb.value = '/ 检测中心'
        pageTitle.value = '检测 Scan Center - 智能合约漏洞管理'
        break
      case 'VulnOps':
        crumb.value = '/ 漏洞工单'
        pageTitle.value = '漏洞工单 Vulnerability Ops - 智能合约漏洞管理'
        break
      default:
        crumb.value = '/ 总览'
        pageTitle.value = '智能合约漏洞全生命周期管理（Demo）'
    }
  },
  { immediate: true }
)
</script>

<style>
@import './assets/styles.css';
</style>