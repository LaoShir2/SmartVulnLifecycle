<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="logo"></div>
      <div>
        <h1>VulnOps for Smart Contracts</h1>
        <p>检测 · 验证 · 修复（闭环 Demo）</p>
      </div>
    </div>

    <nav class="nav">
      <button 
        :class="{ active: $route.name === 'Dashboard' }"
        @click="$router.push('/dashboard')"
      >
        <span class="icon">⌂</span>总览 Dashboard
      </button>
      <button 
        :class="{ active: $route.name === 'ScanCenter' }"
        @click="$router.push('/scan')"
      >
        <span class="icon">⚙</span>检测 Scan Center
      </button>
      <button 
        :class="{ active: $route.name === 'VulnOps' }"
        @click="$router.push('/ops')"
      >
        <span class="icon">✦</span>漏洞工单 Vulnerability Ops
      </button>
      <button>
        <span class="icon">▣</span>验证 Verification Lab
      </button>
      <button>
        <span class="icon">⧉</span>修复 Patch Studio
      </button>
    </nav>

    <div class="sidecard">
      <div class="k">当前队列（高危未闭环）</div>
      <div class="v">7</div>
      <div class="hint">建议优先处理：已可复现但未修复 / 已确认可利用的工单。</div>
    </div>

    <div class="sidecard">
      <div class="k">今日自动化产出</div>
      <div class="row" style="margin-top:10px">
        <span class="chip"><span class="dot good"></span>扫描 Run：12</span>
        <span class="chip"><span class="dot warn"></span>PoC：4</span>
        <span class="chip"><span class="dot good"></span>补丁候选：9</span>
      </div>
      <div class="hint" style="margin-top:10px">本页面为纯 Vue 组件化实现，可作为前端原型起点。</div>
    </div>
  </aside>
</template>

<script setup>
// 无需额外逻辑，仅路由跳转
</script>