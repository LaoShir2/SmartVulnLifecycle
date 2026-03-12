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

      <!-- 中间栏：验证功能概览 -->
      <nav class="func-nav">
        <button class="nav-btn" :class="{ active: activeFunc === 'info' }" @click="activeFunc = 'info'">
          漏洞信息
        </button>
        <button class="nav-btn" :class="{ active: activeFunc === 'poc' }" @click="activeFunc = 'poc'">
          PoC代码生成
        </button>
        <button class="nav-btn" :class="{ active: activeFunc === 'log' }" @click="activeFunc = 'log'">
          运行日志
        </button>
      </nav>

      <!-- 右侧：验证详情 -->
      <main class="func-detail">
        <!-- 1. 漏洞信息 -->
        <div v-if="activeFunc === 'info'">
          <h3>漏洞详情</h3>
          <div class="info-card">
            <p>漏洞类型：{{ activeTicket.type }}</p>
            <p>风险等级：{{ activeTicket.severity }}</p>
            <p>合约地址：{{ activeTicket.contract }}</p>
            <p>置信度：{{ activeTicket.confidence }}</p>
            <p>漏洞描述：{{ activeTicket.oneLine }}</p>
          </div>
          <pre class="code-box mono">{{ activeTicket.codeSnippet }}</pre>
        </div>

        <!-- 2. PoC代码生成 -->
        <div v-if="activeFunc === 'poc'">
          <h3>可执行PoC代码（Foundry）</h3>
          <pre class="code-box mono">{{ defaultPocCode }}</pre>
          <div class="row">
            <button class="btn primary">运行PoC</button>
            <button class="btn ghost">复制代码</button>
          </div>
        </div>

        <!-- 3. 运行日志 -->
        <div v-if="activeFunc === 'log'">
          <h3>PoC运行日志</h3>
          <pre class="code-box mono">{{ beforeFixLogs }}</pre>
        </div>
      </main>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { tickets, defaultPocCode, beforeFixLogs } from '../data/mockData';

// 工单状态
const activeTicketId = ref(tickets[0].id);
const activeTicket = computed(() => tickets.find(i => i.id === activeTicketId.value) || tickets[0]);
// 功能切换
const activeFunc = ref('info');
</script>

<style scoped>
/* 统一布局样式（和检测/修复完全一致） */
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
.info-card { margin-bottom: 12px; line-height: 1.6; }
.row { display: flex; gap: 8px; margin-top: 12px; }
.btn { padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.btn.primary { background: #7dd3fc; color: #000; border: none; }
.btn.ghost { background: transparent; border: 1px solid #1e293b; }
</style>