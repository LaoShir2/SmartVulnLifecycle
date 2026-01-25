<template>
  <header class="topbar">
    <div class="top-left">
      <div>
        <div class="crumb">{{ crumb }}</div>
        <div class="title">{{ pageTitle }}</div>
      </div>
    </div>

    <div style="display:flex; align-items:center; gap:10px">
      <div class="search">
        <span style="opacity:.8">⌕</span>
        <input placeholder="搜索：合约 / 漏洞类型 / 工单ID / 函数名（Demo）" />
        <span class="pill">Fork@block: 19,233,001</span>
      </div>
      <span class="pill">Asia/Taipei · 2025-12-23</span>
    </div>
  </header>
</template>

<script setup>
defineProps({
  crumb: {
    type: String,
    default: '/ 总览'
  },
  pageTitle: {
    type: String,
    default: '智能合约漏洞全生命周期管理（Demo）'
  }
})
</script>