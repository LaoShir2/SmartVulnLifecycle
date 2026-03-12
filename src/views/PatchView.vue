<template>
  <section class="uniform-page">
    <!-- 顶部项目名 -->
    <div class="top-project-name">VulnOps for Smart Contracts</div>
    <div class="page-layout">
      <!-- 左栏：漏洞工单 -->
      <aside class="ticket-sidebar">
        <div v-for="item in tickets" :key="item.id" class="ticket-card"
          :class="{ active: activeTicketId === item.id }" @click="activeTicketId = item.id">
          <h4>{{ item.id }}</h4>
          <p>{{ item.title }}</p>
          <span class="severity" :class="item.severity">{{ item.severity }}</span>
        </div>
      </aside>

      <!-- 中间栏：修复功能概览 -->
      <nav class="func-nav">
        <button class="nav-btn" :class="{ active: activeFunc === 'code' }" @click="activeFunc = 'code'">
          漏洞代码
        </button>
        <button class="nav-btn" :class="{ active: activeFunc === 'patch' }" @click="activeFunc = 'patch'">
          补丁方案
        </button>
        <button class="nav-btn" :class="{ active: activeFunc === 'verify' }" @click="activeFunc = 'verify'">
          回归验证
        </button>
      </nav>

      <!-- 右侧：修复详情 -->
      <main class="func-detail">
        <!-- 1. 漏洞代码 -->
        <div v-if="activeFunc === 'code'">
          <h3>待修复漏洞代码</h3>
          <pre class="code-box mono">{{ activeTicket.codeSnippet }}</pre>
          <div class="info-card">
            <p>修复约束：{{ activeTicket.constraints.join('；') }}</p>
          </div>
        </div>

        <!-- 2. 补丁方案 -->
        <div v-if="activeFunc === 'patch'">
          <h3>自动生成补丁</h3>
          <div class="row">
            <button v-for="item in activeTicket.patchCandidates" :key="item.key"
              class="btn" :class="{ primary: selectedPatch === item.key, ghost: selectedPatch !== item.key }"
              @click="selectedPatch = item.key">
              方案{{ item.key }}
            </button>
          </div>
          <pre class="code-box mono">{{ currentPatch.diff }}</pre>
          <p>Gas增量：{{ currentPatch.impact.gas }}</p>
        </div>

        <!-- 3. 回归验证 -->
        <div v-if="activeFunc === 'verify'">
          <h3>PoC回归验证</h3>
          <table class="table">
            <tr><th>检查项</th><th>结果</th></tr>
            <tr v-for="item in patchVerifyItems" :key="item.key">
              <td>{{ item.name }}</td><td>{{ item.status }}</td>
            </tr>
          </table>
          <pre class="code-box mono">{{ afterFixLogs }}</pre>
        </div>
      </main>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { tickets, patchVerifyItems, afterFixLogs } from '../data/mockData';

// 工单
const activeTicketId = ref(tickets[0].id);
const activeTicket = computed(() => tickets.find(i => i.id === activeTicketId.value) || tickets[0]);
// 功能切换
const activeFunc = ref('code');
// 补丁选择
const selectedPatch = ref('A');
const currentPatch = computed(() => {
  return activeTicket.value.patchCandidates.find(i => i.key === selectedPatch.value) || activeTicket.value.patchCandidates[0];
});
</script>

<style scoped>
/* 统一布局样式（三页面完全通用） */
.uniform-page { width: 100%; min-height: 100vh; background: #0d1117; color: #e6edf3; }
.top-project-name {
  padding: 16px; background: #111827; font-size: 20px; font-weight: bold;
  border-bottom: 1px solid #1e293b; text-align: center;
}
.page-layout {
  display: grid; grid-template-columns: 280px 200px 1fr; gap: 16px; padding: 16px;
}
/* 左栏工单 */
.ticket-sidebar { display: grid; gap: 8px; }
.ticket-card {
  padding: 12px; background: #111827; border: 1px solid #1e293b; border-radius: 8px;
  cursor: pointer;
}
.ticket-card.active { border-color: #7dd3fc; background: rgba(125,211,252,0.1); }
/* 中间功能导航 */
.func-nav { display: flex; flex-direction: column; gap: 8px; }
.nav-btn {
  padding: 12px; background: #111827; border: 1px solid #1e293b; border-radius: 8px;
  text-align: left; cursor: pointer; color: #94a3b8;
}
.nav-btn.active { border-color: #7dd3fc; color: #e6edf3; }
/* 右侧详情 */
.func-detail { background: #111827; border-radius: 12px; padding: 16px; }
.row { display: flex; gap: 8px; margin: 12px 0; }
.btn { padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.btn.primary { background: #7dd3fc; color: #000; border: none; }
.btn.ghost { background: transparent; border: 1px solid #1e293b; }
.table { width: 100%; margin: 12px 0; border-collapse: collapse; }
.table th, .table td { padding: 8px; border: 1px solid #1e293b; }
</style>