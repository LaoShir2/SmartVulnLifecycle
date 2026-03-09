<template>
  <section>
    <div class="grid grid-cols-4">
      <article v-for="kpi in overviewKpis" :key="kpi.title" class="card">
        <div class="card-bd">
          <div class="kpi-value">{{ kpi.value }}</div>
          <div class="kpi-label">{{ kpi.title }}</div>
          <div v-if="kpi.tags" class="row" style="margin-top: 10px;">
            <span v-for="tag in kpi.tags" :key="tag" class="chip">{{ tag }}</span>
          </div>
          <p v-if="kpi.description" class="card-sub" style="margin-top: 8px;">{{ kpi.description }}</p>
        </div>
      </article>
    </div>
    <div class="grid grid-cols-2" style="margin-top: 12px;">
      <!-- 左侧：环形图展示闭环状态分布 -->
      <article class="card">
        <header class="card-hd">
          <h3 class="card-title">闭环状态分布（Detected -> Closed）</h3>
          <p class="card-sub">快速看到流程堵点，便于调整检测或工单优先级。</p>
        </header>
        <div class="card-bd">
          <div class="donut-chart-container">
            <!-- SVG 环形图 -->
            <svg viewBox="0 0 200 200" class="donut-chart">
              <!-- 背景圆环 -->
              <circle cx="100" cy="100" r="80" fill="none" stroke="#1e293b" stroke-width="24" />
              <!-- 数据圆环 -->
              <circle
                v-for="(item, index) in lifecycleStatus"
                :key="item.name"
                cx="100"
                cy="100"
                r="80"
                fill="none"
                :stroke="item.color"
                stroke-width="24"
                :stroke-dasharray="`${item.percentage} ${100 - item.percentage}`"
                :stroke-dashoffset="calculateOffset(index)"
                stroke-linecap="butt"
                transform="rotate(-90 100 100)"
                class="donut-segment"
                @mouseenter="hoveredItem = item"
                @mouseleave="hoveredItem = null"
              />
            </svg>
            <!-- 中心总数 -->
            <div class="donut-center">
              <div class="donut-total">{{ totalCount }}</div>
              <div class="donut-total-label">总工单</div>
            </div>
          </div>
          <!-- 图例 -->
          <div class="legend-container">
            <div
              v-for="item in lifecycleStatus"
              :key="item.name"
              class="legend-item"
              @mouseenter="hoveredItem = item"
              @mouseleave="hoveredItem = null"
            >
              <span class="legend-dot" :style="{ background: item.color }" />
              <span class="legend-name">{{ item.name }}</span>
              <span class="legend-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </article>

      <!-- 右侧：近期事件流（保持不变） -->
      <article class="card">
        <header class="card-hd">
          <h3 class="card-title">近期事件流（自动化产出）</h3>
          <p class="card-sub">检测、证据链生成、工单推进都会记录到时间线。</p>
        </header>
        <div class="card-bd">
          <table class="table">
            <thead>
              <tr>
                <th>时间</th>
                <th>事件</th>
                <th class="right">对象</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in recentEvents" :key="row.time + row.target">
                <td class="mono">{{ row.time }}</td>
                <td>{{ row.event }}</td>
                <td class="right mono">{{ row.target }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>
    <article class="card" style="margin-top: 12px;">
      <header class="card-hd">
        <h3 class="card-title">快捷入口</h3>
        <p class="card-sub">按你当前阶段，优先跳转到“检测”或“漏洞工单”。</p>
      </header>
      <div class="card-bd row">
        <button class="btn primary" @click="router.push('/scan')">进入检测 Scan Center</button>
        <button class="btn primary" @click="router.push('/tickets')">进入漏洞工单 Ops</button>
        <button class="btn primary" @click="router.push('/verify')">进入验证 Verification Lab</button>
        <button class="btn primary" @click="router.push('/patch')">进入修复 Patch Studio</button>
        <button class="btn danger">紧急模式（Demo）</button>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { overviewKpis, lifecycleStatus as rawLifecycleStatus, recentEvents } from '../data/mockData';

const router = useRouter();
const hoveredItem = ref(null);

// 为生命周期数据添加颜色和百分比
const lifecycleStatus = computed(() => {
  const colors = {
    'Detected': '#f97316',
    'Reproducible': '#ef4444',
    'Confirmed': '#f43f5e',
    'Patching': '#f97316',
    'Verified': '#22c55e',
    'Closed': '#22c55e'
  };
  
  const total = rawLifecycleStatus.reduce((sum, item) => sum + item.value, 0);
  
  return rawLifecycleStatus.map(item => ({
    ...item,
    color: colors[item.name] || '#94a3b8',
    percentage: (item.value / total) * 100
  }));
});

// 计算总数
const totalCount = computed(() => {
  return lifecycleStatus.value.reduce((sum, item) => sum + item.value, 0);
});

// 计算环形图偏移量
const calculateOffset = (index) => {
  let offset = 0;
  for (let i = 0; i < index; i++) {
    offset += lifecycleStatus.value[i].percentage;
  }
  return -offset;
};
</script>

<style scoped>
/* 环形图容器 */
.donut-chart-container {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
}

.donut-chart {
  width: 100%;
  height: 100%;
}

.donut-segment {
  transition: all 0.3s ease;
  cursor: pointer;
}

.donut-segment:hover {
  filter: brightness(1.2);
}

/* 中心总数 */
.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.donut-total {
  font-size: 28px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1;
}

.donut-total-label {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

/* 图例 */
.legend-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.legend-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-name {
  font-size: 13px;
  color: #cbd5e1;
}

.legend-value {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
}
</style>