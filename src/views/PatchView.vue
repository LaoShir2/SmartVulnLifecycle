<template>
  <div class="patch-content">
    <!-- 顶部：PoC回归验证 -->
    <div class="patch-section top-section unified-panel">
      <h3 class="section-title">PoC 回归验证</h3>
      <div class="poc-verify-layout">
        <!-- 左侧验证指标 -->
        <div class="verify-indicator">
          <h4>验证指标</h4>
          <div class="indicator-list">
            <div v-for="item in verifyList" :key="item.key" class="indicator-item">
              <span class="indicator-name">{{ item.name }}</span>
              <span class="indicator-status" :class="item.status">
                {{ item.status === 'PASS' ? '通过' : item.status === 'FAIL' ? '不通过' : '待验证' }}
              </span>
            </div>
          </div>
          <button class="btn primary run-btn" @click="runVerify">执行回归验证</button>
        </div>

        <!-- 右侧日志对比 -->
        <div class="log-compare unified-panel">
          <h4>执行日志对比</h4>
          <div class="log-compare-layout">
            <div class="log-box left-log">
              <div class="log-header">修复前日志</div>
              <div class="log-body">
                <div v-for="(line, idx) in diffLogLines" :key="idx" v-html="line.left"></div>
              </div>
            </div>
            <div class="log-box right-log">
              <div class="log-header">修复后日志</div>
              <div class="log-body">
                <div v-for="(line, idx) in diffLogLines" :key="idx" v-html="line.right"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 中间：补丁影响性评估 -->
    <div class="patch-section middle-section unified-panel">
      <h3 class="section-title">补丁影响性评估</h3>
      <div class="impact-layout">
        <div class="impact-card" v-for="(item, key) in currentImpact" :key="key">
          <h4>{{ getImpactLabel(key) }}</h4>
          <div class="impact-value" :class="getImpactClass(key, item)">{{ item }}</div>
        </div>
      </div>
    </div>

    <!-- 底部：补丁代码 -->
    <div class="patch-section bottom-section unified-panel">
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
        <div class="code-origin">
          <h4>原始漏洞代码</h4>
          <pre class="code-box" v-html="highlightOriginCode"></pre>
        </div>
        <div class="code-patch">
          <h4>补丁修复代码</h4>
          <pre class="code-box" v-html="highlightPatchCode"></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { tickets, patchVerifyItems, beforeFixLogs, afterFixLogs } from '../data/mockData';

const activeTicket = computed(() => tickets[0] || tickets[1]);
const patchList = computed(() => activeTicket.value.patchCandidates || []);
const selectedPatchKey = ref('A');
const currentPatch = computed(() => patchList.value.find(i => i.key === selectedPatchKey.value) || patchList.value[0]);

const verifyList = ref(JSON.parse(JSON.stringify(patchVerifyItems)));
const runVerify = () => {
  verifyList.value.forEach(item => {
    item.status = item.key === 'variants' ? 'WARN' : 'PASS';
  });
};

const normalizeLines = (text) => text.replace(/\r/g,'').split('\n');
const beforeLogLines = computed(() => normalizeLines(beforeFixLogs));
const afterLogLines = computed(() => normalizeLines(afterFixLogs));

const diffLogLines = computed(() => {
  const result = [];
  const maxLen = Math.max(beforeLogLines.value.length, afterLogLines.value.length);
  for (let i = 0; i < maxLen; i++) {
    const bLine = beforeLogLines.value[i] || '';
    const aLine = afterLogLines.value[i] || '';
    const isDifferent = bLine.trim() !== aLine.trim();
    result.push({
      left: `<span>${bLine}</span>`,
      right: isDifferent 
        ? `<span style="background: rgba(16,185,129,0.3); color:#10b981;">${aLine}</span>` 
        : `<span>${aLine}</span>`
    });
  }
  return result;
});

const originCode = computed(() => activeTicket.value.codeSnippet || '');
const patchCode = computed(() => currentPatch.value.diff || '');

const highlightOriginCode = computed(() => originCode.value
  .replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .split('\n').map(line => `<span>${line}</span>`).join('<br>')
);

const computeCodeDiff = (origin, patch) => {
  const originLines = origin.split('\n');
  const patchLines = patch.split('\n');
  const maxLen = Math.max(originLines.length, patchLines.length);
  const result = [];
  for (let i = 0; i < maxLen; i++) {
    const oLine = originLines[i] || '';
    const pLine = patchLines[i] || '';
    if (!oLine && pLine) {
      result.push(`<span style="background: rgba(16,185,129,0.3); color:#10b981;">${pLine}</span>`);
    } else if (oLine && !pLine) {
      result.push(`<span style="background: rgba(239,68,68,0.3); color:#ef4444; text-decoration: line-through;">${oLine}</span>`);
    } else if (oLine !== pLine) {
      result.push(
        `<span style="background: rgba(239,68,68,0.3); color:#ef4444; text-decoration: line-through;">${oLine}</span><br>` +
        `<span style="background: rgba(16,185,129,0.3); color:#10b981;">${pLine}</span>`
      );
    } else {
      result.push(`<span>${pLine}</span>`);
    }
  }
  return result.join('<br>');
};

const highlightPatchCode = computed(() => computeCodeDiff(originCode.value, patchCode.value));

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
</script>

<style scoped>
.patch-content { width:100%; display:flex; flex-direction:column; gap:20px; }
.patch-section { background:#334155; border-radius:8px; border:1px solid #475569; padding:18px; }
.section-title { margin:0 0 16px 0; font-size:18px; font-weight:bold; color:#e2e8f0; }

.poc-verify-layout { display:grid; grid-template-columns:280px 1fr; gap:16px; }
.verify-indicator { border-radius:8px; padding:16px; background:#1e293b; }
.verify-indicator h4 { color:#38bdf8; margin-bottom:12px; font-size:14px; }
.indicator-list { display:flex; flex-direction:column; gap:10px; margin-bottom:16px; }
.indicator-item { display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:#0f172a; border-radius:6px; }
.indicator-name { font-size:12px; color:#e2e8f0; }
.indicator-status { font-size:12px; padding:2px 6px; border-radius:4px; }
.run-btn { width:100%; padding:8px; }

.log-compare { border-radius:8px; padding:16px; background:#1e293b; }
.log-compare h4 { margin:0 0 12px 0; color:#38bdf8; font-size:14px; }
.log-compare-layout { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.log-box { background:#0f172a; border-radius:6px; overflow:hidden; }
.log-header { background:#475569; padding:8px; text-align:center; font-size:12px; color:#e2e8f0; }
.log-body { max-height:220px; overflow-y:auto; padding:10px; font-size:11px; line-height:1.5; white-space:pre-wrap; }
.log-body span { display:block; margin:0; padding:0 2px; }

.impact-layout { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
.impact-card { background:#1e293b; border-radius:8px; padding:16px; text-align:center; }
.impact-card h4 { margin:0 0 8px 0; font-size:13px; color:#94a3b8; }
.impact-value { font-size:16px; font-weight:bold; padding:4px 8px; border-radius:6px; }
.impact-value.good { background:#10b981; color:#fff; }
.impact-value.mid { background:#f59e0b; color:#fff; }
.impact-value.bad { background:#ef4444; color:#fff; }

.patch-switch { display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
.patch-btn { background:#1e293b; border:1px solid #475569; color:#e2e8f0; }
.patch-btn.active { background:#38bdf8; color:#0f172a; border-color:#38bdf8; }
.code-compare { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.code-origin, .code-patch { border-radius:8px; padding:16px; background:#1e293b; }
.code-origin h4, .code-patch h4 { margin:0 0 10px 0; color:#38bdf8; font-size:14px; }
.code-box { background:#0f172a; border-radius:6px; padding:16px; font-size:12px; line-height:1.6; max-height:300px; overflow-y:auto; font-family:monospace; color:#e2e8f0; white-space:pre-wrap; }
</style>