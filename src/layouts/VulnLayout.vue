<template>
  <section class="vuln-layout">
    <!-- 顶部：项目名称（公共） -->
    <div class="top-project-name">VulnOps for Smart Contracts</div>

    <div class="layout-container">
      <!-- 左栏：漏洞工单（公共） -->
      <aside class="ticket-sidebar">
        <div v-for="item in tickets" :key="item.id" class="ticket-card"
             :class="{ active: activeTicketId === item.id }" @click="activeTicketId = item.id">
          <h4>{{ item.id }}</h4>
          <p>{{ item.title }}</p>
          <span class="severity" :class="item.severity">{{ item.severity }}</span>
        </div>
      </aside>

      <!-- 中间栏：功能概览（公共） -->
      <nav class="func-nav">
        <router-link to="/vuln/scan" class="nav-item" :class="{ active: $route.name === 'scan' }">
          检测
        </router-link>
        <router-link to="/vuln/verify" class="nav-item" :class="{ active: $route.name === 'verify' }">
          验证
        </router-link>
        <router-link to="/vuln/patch" class="nav-item" :class="{ active: $route.name === 'patch' }">
          修复
        </router-link>
      </nav>

      <!-- 右侧：动态加载对应页面（路由出口） -->
      <main class="content-wrapper">
        <router-view /> <!-- 这里会自动加载Scan/Verify/Patch组件 -->
      </main>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { tickets } from '../data/mockData';

// 漏洞工单选中状态（可全局共享，这里简化为本地）
const activeTicketId = ref(tickets[0].id);
</script>

<style scoped>
/* 公共布局样式 */
.vuln-layout {
  width: 100%;
  min-height: 100vh;
  background: #0d1117;
  color: #e6edf3;
}
/* 顶部项目名 */
.top-project-name {
  padding: 16px;
  background: #111827;
  font-size: 20px;
  font-weight: bold;
  border-bottom: 1px solid #1e293b;
  text-align: center;
}
/* 布局容器 */
.layout-container {
  display: grid;
  grid-template-columns: 280px 200px 1fr;
  gap: 16px;
  padding: 16px;
  height: calc(100vh - 60px);
}
/* 左栏工单 */
.ticket-sidebar {
  display: grid;
  gap: 8px;
  overflow-y: auto;
}
.ticket-card {
  padding: 12px;
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 8px;
  cursor: pointer;
}
.ticket-card.active {
  border-color: #7dd3fc;
  background: rgba(125,211,252,0.1);
}
/* 中间功能概览 */
.func-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.nav-item {
  padding: 12px;
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  color: #94a3b8;
  text-decoration: none;
}
.nav-item.active {
  border-color: #7dd3fc;
  color: #e6edf3;
}
/* 右侧内容出口 */
.content-wrapper {
  background: #111827;
  border-radius: 12px;
  padding: 16px;
  overflow-y: auto;
}
</style>