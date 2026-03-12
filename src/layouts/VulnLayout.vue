<template>
  <section class="vuln-layout">
    <div class="top-project-name">VulnOps for Smart Contracts</div>
    <div class="layout-container" :style="gridColumnsStyle">

      <!-- 左侧：漏洞工单（统一样式+持久化） -->
      <aside class="ticket-sidebar" :class="{ collapsed: isCollapsed }">
        <div class="sidebar-header">
          <h3 class="sidebar-title">漏洞工单</h3>
          <button class="collapse-btn" @click="toggleCollapse">
            {{ isCollapsed ? '▶' : '◀' }}
          </button>
        </div>

        <div class="ticket-list">
          <div
            v-for="item in tickets"
            :key="item.id"
            class="ticket-card"
            :class="{ active: activeTicketId === item.id }"
            @click="activeTicketId = item.id"
          >
            <div v-if="isCollapsed" class="ticket-collapsed">
              {{ item.id }}
            </div>
            <div v-else class="ticket-expanded">
              <h4 class="ticket-id">{{ item.id }}</h4>
              <p class="ticket-desc">{{ item.title }}</p>
              <span class="severity-badge" :class="item.severity.toLowerCase()">
                {{ item.severity.toUpperCase() }}
              </span>
              <span class="status-badge">
                {{ getStatusIcon(item.stage) }}
                {{ getStatusText(item.stage) }}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中间：功能概览（统一样式+动态内容+收起变窄） -->
      <nav class="func-nav" :class="{ collapsed: isFuncCollapsed }">
        <div class="func-header">
          <h3 class="func-title">概览</h3>
          <button class="func-collapse-btn" @click="toggleFuncCollapse">
            {{ isFuncCollapsed ? '▶' : '◀' }}
          </button>
        </div>

        <div class="func-cards">

          <!-- 检测卡片（动态显示当前漏洞的检测信息） -->
          <router-link
            to="/vuln/scan"
            class="func-card"
            :class="{ active: $route.name === 'scan' }"
          >
            <div v-if="isFuncCollapsed" class="func-card-collapsed">检测</div>
            <div v-else class="func-card-expanded">
              <h4>检测信息概览</h4>
              <p>漏洞名：{{ activeTicket?.title || '无' }}</p>
              <p>漏洞函数：{{ activeTicket?.function || '无' }}</p>
            </div>
          </router-link>

          <!-- 验证卡片（动态显示是否触发 + 损失评估） -->
          <router-link
            to="/vuln/verify"
            class="func-card"
            :class="{ active: $route.name === 'verify' }"
          >
            <div v-if="isFuncCollapsed" class="func-card-collapsed">验证</div>
            <div v-else class="func-card-expanded">
              <h4>验证概览</h4>
              <p>是否触发：{{ activeTicket?.triggered ? '已触发' : '未触发' }}</p>
              <p>损失评估：{{ activeTicket?.loss || '未评估' }}</p>
            </div>
          </router-link>

          <!-- 修复卡片（动态显示补丁生成 + 多维度评估） -->
          <router-link
            to="/vuln/patch"
            class="func-card"
            :class="{ active: $route.name === 'patch' }"
          >
            <div v-if="isFuncCollapsed" class="func-card-collapsed">修复</div>
            <div v-else class="func-card-expanded">
              <h4>修复概览</h4>
              <p>补丁生成：{{ activeTicket?.patchGenerated ? '已生成' : '未生成' }}</p>
              <p>多维度评估：{{ activeTicket?.multiDim || '无' }}</p>
            </div>
          </router-link>

        </div>
      </nav>

      <!-- 右侧内容 -->
      <main class="content-wrapper">
        <router-view />
      </main>

    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { tickets } from '../data/mockData';

// 选中的漏洞工单
const activeTicketId = ref(tickets[0].id);
const activeTicket = computed(() => tickets.find(t => t.id === activeTicketId.value) || tickets[0]);

// 展开/收起状态（持久化）
const isCollapsed = ref(false);
const isFuncCollapsed = ref(false);

// 动态网格列宽（两栏都变窄 → 80px）
const gridColumnsStyle = computed(() => {
  const ticketCol = isCollapsed.value ? '80px' : '240px';
  const funcCol = isFuncCollapsed.value ? '80px' : '240px';
  return {
    gridTemplateColumns: `${ticketCol} ${funcCol} 1fr`
  };
});

// 初始化读取 localStorage
onMounted(() => {
  try {
    isCollapsed.value = localStorage.getItem('ticketSidebarCollapsed') === 'true';
    isFuncCollapsed.value = localStorage.getItem('funcNavCollapsed') === 'true';
  } catch (e) {
    console.error(e);
  }
});

// 监听状态变化并持久化
watch(isCollapsed, v => localStorage.setItem('ticketSidebarCollapsed', v.toString()));
watch(isFuncCollapsed, v => localStorage.setItem('funcNavCollapsed', v.toString()));

const toggleCollapse = () => isCollapsed.value = !isCollapsed.value;
const toggleFuncCollapse = () => isFuncCollapsed.value = !isFuncCollapsed.value;

// 状态图标
const getStatusIcon = (stage) => {
  const done = ['已修复', '已验证', '已闭环'];
  return done.some(s => stage?.includes(s)) ? '✅' : '⏳';
};
const getStatusText = (stage) => stage || '待检测';
</script>

<style scoped>
.vuln-layout {
  width: 100%;
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
}

.top-project-name {
  padding: 16px;
  background: #1e293b;
  font-size: 20px;
  font-weight: bold;
  border-bottom: 1px solid #334155;
  text-align: center;
}

.layout-container {
  display: grid;
  gap: 16px;
  padding: 16px;
  height: calc(100vh - 60px);
  transition: 0.3s;
}

/* ========== 两栏完全统一样式 ========== */
.ticket-sidebar, .func-nav {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  transition: 0.3s;
}

.ticket-sidebar.collapsed, .func-nav.collapsed {
  align-items: center;
  padding: 12px 4px;
}

/* 统一标题栏 */
.sidebar-header, .func-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #334155;
  border: 1px solid #475569;
  border-radius: 8px;
}

.sidebar-title, .func-title {
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  flex: 1;
  margin: 0;
}

.ticket-sidebar.collapsed .sidebar-title,
.func-nav.collapsed .func-title {
  font-size: 12px;
}

/* 统一按钮 */
.collapse-btn, .func-collapse-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #475569;
  background: #1e293b;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
}
.collapse-btn:hover, .func-collapse-btn:hover {
  border-color: #38bdf8;
  color: #38bdf8;
}

/* 统一列表容器 */
.ticket-list, .func-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

/* 统一卡片 */
.ticket-card, .func-card {
  background: #334155;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: 0.2s;
}
.ticket-card.active, .func-card.active {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
}
.ticket-card:hover, .func-card:hover {
  border-color: #64748b;
}

/* 工单收起 */
.ticket-collapsed {
  text-align: center;
  font-weight: bold;
}
.ticket-expanded {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 功能卡收起 */
.func-card-collapsed {
  text-align: center;
  font-weight: bold;
}
.func-card-expanded {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.func-card-expanded h4 {
  font-size: 14px;
  font-weight: bold;
  margin: 0 0 4px 0;
}
.func-card-expanded p {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.4;
}

/* 危险等级 */
.severity-badge {
  width: fit-content;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  color: #fff;
}
.severity-badge.high { background: #ef4444; }
.severity-badge.critical { background: #b91c1c; }

.status-badge {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 右侧内容 */
.content-wrapper {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 16px;
  overflow-y: auto;
}
</style>