<template>
  <div class="patch-content">
    <!-- 顶部：PoC回归验证（上部分） -->
    <div class="patch-section top-section">
      <h3 class="section-title">PoC 回归验证</h3>
      <div class="poc-verify-layout">
        <!-- 左侧：验证指标 -->
        <div class="verify-indicator">
          <h4>验证指标</h4>
          <div class="indicator-list">
            <div 
              v-for="item in verifyList" 
              :key="item.key"
              class="indicator-item"
            >
              <span class="indicator-name">{{ item.name }}</span>
              <span class="indicator-status" :class="item.status">
                {{ item.status === 'PASS' ? '✅ 通过' : item.status === 'FAIL' ? '❌ 不通过' : '⏳ 待验证' }}
              </span>
            </div>
          </div>
          <button class="btn primary run-btn" @click="runVerify">执行回归验证</button>
        </div>

        <!-- 右侧：日志对比（修复前 VS 修复后，差异高亮） -->
        <div class="log-compare">
          <h4>执行日志对比</h4>
          <div class="log-compare-layout">
            <!-- 修复前日志 -->
            <div class="log-box left-log">
              <div class="log-header">修复前日志</div>
              <div class="log-body">
                <p 
                  v-for="(line, idx) in beforeLogLines" 
                  :key="idx"
                  :class="{ diff: line !== afterLogLines[idx] }"
                >{{ line || '（空行）' }}</p>
              </div>
            </div>
            <!-- 修复后日志 -->
            <div class="log-box right-log">
              <div class="log-header">修复后日志</div>
              <div class="log-body">
                <p 
                  v-for="(line, idx) in afterLogLines" 
                  :key="idx"
                  :class="{ diff: line !== beforeLogLines[idx] }"
                >{{ line || '（空行）' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 中间：补丁影响性评估（中部分） -->
    <div class="patch-section middle-section">
      <h3 class="section-title">补丁影响性评估</h3>
      <div class="impact-layout">
        <div class="impact-card" v-for="(item, key) in currentImpact" :key="key">
          <h4>{{ getImpactLabel(key) }}</h4>
          <div class="impact-value" :class="getImpactClass(key, item)">{{ item }}</div>
        </div>
      </div>
    </div>

    <!-- 底部：补丁代码（下部分，差异高亮：新增/删除） -->
    <div class="patch-section bottom-section">
      <h3 class="section-title">补丁代码</h3>
      <div class="patch-switch">
        <button 
          v-for="patch in patchList" 
          :key="patch.key"
          class="btn patch-btn"
          :class="{ active: selectedPatchKey === patch.key }"
          @click="selectedPatchKey = patch.key"
        >
          方案{{ patch.key }}：{{ patch.title }}
        </button>
      </div>
      <div class="code-compare">
        <!-- 原始漏洞代码 -->
        <div class="code-origin">
          <h4>原始漏洞代码</h4>
          <pre class="code-box" v-html="highlightOriginCode"></pre>
        </div>
        <!-- 补丁修复代码（差异高亮） -->
        <div class="code-patch">
          <h4>补丁修复代码</h4>
          <pre class="code-box" v-html="highlightPatchCode"></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  tickets, 
  patchVerifyItems, 
  beforeFixLogs, 
  afterFixLogs 
} from '../data/mockData';

// 当前选中漏洞
const activeTicket = computed(() => tickets[0] || tickets[1]);
// 补丁列表
const patchList = computed(() => activeTicket.value.patchCandidates || []);
// 选中的补丁方案
const selectedPatchKey = ref('A');
const currentPatch = computed(() => 
  patchList.value.find(i => i.key === selectedPatchKey.value) || patchList.value[0]
);

// ===================== PoC回归验证 =====================
const verifyList = ref(JSON.parse(JSON.stringify(patchVerifyItems)));
// 日志拆分（按行）
const beforeLogLines = computed(() => beforeFixLogs.split('\n'));
const afterLogLines = computed(() => afterFixLogs.split('\n'));

// 执行回归验证
const runVerify = () => {
  verifyList.value.forEach(item => {
    item.status = item.key === 'variants' ? 'WARN' : 'PASS';
  });
};

// ===================== 补丁影响评估 =====================
const currentImpact = computed(() => currentPatch.value.impact || {});
const getImpactLabel = (key) => {
  const map = { gas: 'Gas增量', compat: '接口兼容性', upgrade: '升级兼容性', risk: '引入风险' };
  return map[key] || key;
};
const getImpactClass = (type, value) => {
  if(type === 'gas') {
    const num = Number(value.replace('%','').replace('+',''));
    return num <=1.5 ? 'good' : num <=4 ? 'mid' : 'bad';
  }
  if(type === 'compat' || type === 'upgrade') {
    return value.includes('兼容') || value.includes('不变') ? 'good' : 'bad';
  }
  if(type === 'risk') {
    return value.toLowerCase() === 'low' ? 'good' : value.toLowerCase() === 'med' ? 'mid' : 'bad';
  }
  return 'mid';
};

// ===================== 代码差异高亮 =====================
const originCode = computed(() => activeTicket.value.codeSnippet || '');
const patchCode = computed(() => currentPatch.value.diff || '');

// 原始代码（标记删除部分）
const highlightOriginCode = computed(() => {
  return originCode.value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .map(line => `<span class="origin-line">${line}</span>`)
    .join('<br>');
});

// 补丁代码（标记新增部分）
const highlightPatchCode = computed(() => {
  return patchCode.value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .map(line => {
      // 补丁新增行：绿色高亮
      if(line.trim().startsWith('// ✅') || line.trim().startsWith('function') || line.trim().startsWith('mapping') || line.trim().startsWith('uint')) {
        return `<span class="add-line">${line}</span>`;
      }
      // 补丁修改行：蓝色高亮
      if(line.trim().startsWith('//') || line.trim().startsWith('require')) {
        return `<span class="modify-line">${line}</span>`;
      }
      return `<span class="patch-line">${line}</span>`;
    })
    .join('<br>');
});
</script>

<style scoped>
/* 修复页面统一样式（与验证页对齐） */
.patch-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 通用区块 */
.patch-section {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 18px;
}
.section-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: bold;
  color: #e2e8f0;
}

/* ===================== 顶部：PoC回归验证 ===================== */
.poc-verify-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
}
/* 左侧验证指标 */
.verify-indicator {
  background: #334155;
  border-radius: 8px;
  padding: 16px;
}
.verify-indicator h4 {
  margin: 0 0 12px 0;
  color: #38bdf8;
  font-size: 14px;
}
.indicator-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}
.indicator-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: #475569;
  border-radius: 6px;
}
.indicator-name {
  font-size: 12px;
  color: #e2e8f0;
}
.indicator-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}
.indicator-status.PASS { background: #10b981; color: #fff; }
.indicator-status.FAIL { background: #ef4444; color: #fff; }
.indicator-status.Pending { background: #f59e0b; color: #fff; }
.run-btn { width: 100%; padding: 8px; }

/* 右侧日志对比 */
.log-compare { background: #334155; border-radius: 8px; padding: 16px; }
.log-compare h4 { margin: 0 0 12px 0; color: #38bdf8; font-size: 14px; }
.log-compare-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.log-box {
  background: #0f172a;
  border-radius: 6px;
  overflow: hidden;
}
.log-header {
  background: #475569;
  padding: 8px;
  text-align: center;
  font-size: 12px;
  color: #e2e8f0;
}
.log-body {
  max-height: 220px;
  overflow-y: auto;
  padding: 10px;
  font-size: 11px;
  line-height: 1.5;
}
.log-body p { margin: 0; padding: 2px 0; white-space: pre-wrap; }
/* 日志差异高亮 */
.log-body p.diff {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  font-weight: bold;
}

/* ===================== 中间：补丁影响评估 ===================== */
.impact-layout {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.impact-card {
  background: #334155;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}
.impact-card h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #94a3b8;
}
.impact-value {
  font-size: 16px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 6px;
}
.impact-value.good { background: #10b981; color: #fff; }
.impact-value.mid { background: #f59e0b; color: #fff; }
.impact-value.bad { background: #ef4444; color: #fff; }

/* ===================== 底部：补丁代码 ===================== */
.patch-switch {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.patch-btn {
  background: #334155;
  border: 1px solid #475569;
  color: #e2e8f0;
}
.patch-btn.active {
  background: #38bdf8;
  color: #0f172a;
  border-color: #38bdf8;
}
.code-compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.code-origin, .code-patch {
  background: #334155;
  border-radius: 8px;
  padding: 16px;
}
.code-origin h4, .code-patch h4 {
  margin: 0 0 10px 0;
  color: #38bdf8;
  font-size: 14px;
}
.code-box {
  background: #0f172a;
  border-radius: 6px;
  padding: 16px;
  font-size: 12px;
  line-height: 1.6;
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
  color: #e2e8f0;
  white-space: pre-wrap;
}
/* 代码差异高亮 */
.origin-line { color: #94a3b8; }
.add-line { color: #10b981; font-weight: bold; } /* 新增：绿色 */
.modify-line { color: #38bdf8; font-weight: bold; } /* 修改：蓝色 */
.patch-line { color: #e2e8f0; }
</style>