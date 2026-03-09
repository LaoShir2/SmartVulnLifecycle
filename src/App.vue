<template>
  <div class="app-layout">
    <aside class="sidebar">
      <section class="brand">
        <div class="brand-logo" />
        <div>
          <h1 class="brand-title">VulnOps for Smart Contracts</h1>
          <p class="brand-sub">检测 · 验证 · 修复（前端原型）</p>
        </div>
      </section>

      <nav class="nav">
        <!-- 侧边导航按钮：基于当前路由高亮，点击后切换页面 -->
        <button
          v-for="item in navItems"
          :key="item.key"
          class="nav-btn"
          :class="{ active: route.path === item.route }"
          @click="router.push(item.route)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <section class="side-card">
        <div class="side-key">当前高危未闭环</div>
        <div class="side-value">7</div>
        <p class="card-sub">建议优先处理“可复现 + HIGH + 外部调用路径”漏洞。</p>
      </section>

      <section class="side-card">
        <div class="side-key">今日自动化产出</div>
        <div class="row" style="margin-top: 10px;">
          <span class="chip"><i class="dot good" /> 扫描 Run: 12</span>
          <span class="chip"><i class="dot warn" /> PoC: 6</span>
          <span class="chip"><i class="dot good" /> 候选补丁: 9</span>
        </div>
      </section>
    </aside>

    <main class="main">
      <header class="topbar">
        <div>
          <p class="crumb">{{ pageCrumb }}</p>
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>

        <div class="search-wrap">
          <label class="search-box">
            <span>⌕</span>
            <input v-model="searchText" placeholder="搜索：合约 / 漏洞类型 / 工单 ID" />
          </label>
          <span class="pill">Fork@block: 19,233,001</span>
        </div>
      </header>

      <!-- 页面路由出口：三个页面都渲染在这里 -->
      <section class="page-body">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter, RouterView } from 'vue-router';
import { navItems } from './data/mockData';

const route = useRoute();
const router = useRouter();

// 搜索框目前先保留前端输入，后续你可以直接接后端接口。
const searchText = ref('');

// 顶栏标题和面包屑跟随路由 meta，避免每个页面重复写文案。
const pageTitle = computed(() => route.meta.title ?? '智能合约漏洞管理');
const pageCrumb = computed(() => route.meta.crumb ?? '/');
</script>
