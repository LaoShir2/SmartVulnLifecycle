<template>
  <section class="ticket-layout">
    <article class="card">
      <header class="card-hd">
        <h3 class="card-title">漏洞工单列表</h3>
        <p class="card-sub">按严重等级和生命周期阶段进行处理优先级排序。</p>
      </header>

      <div class="card-bd" style="display: grid; gap: 8px;">
        <div
          v-for="item in tickets"
          :key="item.id"
          class="ticket-item"
          :class="{ active: item.id === activeTicket.id }"
          @click="switchTicket(item.id)"
        >
          <div class="row" style="justify-content: space-between; align-items: center;">
            <h4>{{ item.id }}</h4>
            <span class="severity" :class="item.severity">{{ item.severity }}</span>
          </div>
          <p>{{ item.title }}</p>
          <div class="row" style="margin-top: 8px;">
            <span class="chip"><i class="dot bad" v-if="item.severity === 'HIGH'" /><i class="dot warn" v-else />{{ item.stage }}</span>
            <span class="chip mono">{{ item.chain }}</span>
          </div>
        </div>
      </div>
    </article>

    <article class="card">
      <header class="card-hd detail-header">
        <div>
          <h3 class="card-title">工单详情：{{ activeTicket.title }}</h3>
          <p class="card-sub">{{ activeTicket.summary }}</p>
        </div>
        <div class="row">
          <button class="btn primary" @click="activeTab = 'patch'">启动修复</button>
          <button class="btn primary" @click="activeTab = 'verify'">进入验证</button>
          <button class="btn ghost" @click="exportReport">导出报告</button>
        </div>
      </header>

      <div class="card-bd">
        <div class="row">
          <span class="chip"><i class="dot warn pulse" /> Stage: {{ activeTicket.stage }}</span>
          <span class="chip">Chain: {{ activeTicket.chain }}</span>
          <span class="chip mono">Contract: {{ activeTicket.contract }}</span>
          <span class="chip">Type: {{ activeTicket.type }}</span>
          <span class="chip">Conf: {{ activeTicket.confidence.toFixed(2) }}</span>
        </div>

        <div class="ticket-tabs">
          <button
            v-for="tab in tabDefs"
            :key="tab.key"
            class="ticket-tab"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <section v-if="activeTab === 'overview'" class="tab-panel">
          <div class="grid grid-cols-2">
            <article class="card">
              <header class="card-hd">
                <h3 class="card-title">一句结论（定性）</h3>
              </header>
              <div class="card-bd">
                <p class="card-sub" style="margin: 0;">{{ activeTicket.oneLine }}</p>
              </div>
            </article>
            <article class="card">
              <header class="card-hd">
                <h3 class="card-title">根因要点 / 修复约束</h3>
              </header>
              <div class="card-bd">
                <ul class="list-plain" style="margin-top: 0;">
                  <li v-for="item in activeTicket.constraints" :key="item">{{ item }}</li>
                </ul>
              </div>
            </article>
          </div>
        </section>

        <section v-if="activeTab === 'findings'" class="tab-panel">
          <article class="card">
            <header class="card-hd">
              <h3 class="card-title">定位与归因</h3>
            </header>
            <div class="card-bd">
              <div class="row">
                <span v-for="item in activeTicket.findings" :key="item" class="chip">{{ item }}</span>
              </div>
            </div>
          </article>

          <article class="card" style="margin-top: 12px;">
            <header class="card-hd">
              <h3 class="card-title">代码证据（带错误标注）</h3>
            </header>
            <div class="card-bd">
              <!-- 用 v-html 渲染高亮后的代码注释，错误注释用红色 -->
              <pre class="code-box mono" style="margin-top: 0;"><code v-html="highlightedCodeSnippet"></code></pre>
            </div>
          </article>
        </section>

        <section v-if="activeTab === 'verify'" class="tab-panel">
          <article class="card">
            <header class="card-hd">
              <h3 class="card-title">交易语义还原（Tx Timeline）</h3>
            </header>
            <div class="card-bd">
              <div class="row" style="margin-bottom: 10px;">
                <button class="btn primary" @click="exportEvidence">导出证据包</button>
                <button class="btn ghost" @click="sealEnvironment">固化环境</button>
              </div>
              <table class="table">
                <thead>
                  <tr>
                    <th>交易</th>
                    <th>动作</th>
                    <th class="right">结果</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in activeTicket.txTimeline" :key="row.tx + row.action">
                    <td class="mono">{{ row.tx }}</td>
                    <td>{{ row.action }}</td>
                    <td class="right">{{ row.result }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article class="card" style="margin-top: 12px;">
            <header class="card-hd">
              <h3 class="card-title">PoC Runner（Foundry / Hardhat）</h3>
            </header>
            <div class="card-bd">
              <div class="row">
                <span class="chip mono">Fork Block: 19,233,001</span>
                <span class="chip mono">RPC: /mock-rpc</span>
                <span class="chip">Runner: Foundry</span>
              </div>
              <div class="row" style="margin-top: 10px;">
                <button class="btn primary" @click="runPoc">运行 PoC</button>
                <button class="btn ghost" @click="generatePocSkeleton">生成骨架</button>
              </div>
              <pre class="code-box mono" style="margin-top: 10px; max-height: 220px;">{{ pocLogs }}</pre>
            </div>
          </article>
        </section>

        <section v-if="activeTab === 'patch'" class="tab-panel patch-column">
          <article class="card">
            <header class="card-hd">
              <h3 class="card-title">输入约束（修复护栏）</h3>
            </header>
            <div class="card-bd">
              <ul class="list-plain" style="margin-top: 0;">
                <li v-for="item in activeTicket.constraints" :key="item">{{ item }}</li>
              </ul>
              <div class="row" style="margin-top: 10px;">
                <label class="chip">
                  <input v-model="patchOptions.generateAssert" type="checkbox" />
                  生成断言
                </label>
                <label class="chip">
                  <input v-model="patchOptions.lockInterface" type="checkbox" />
                  🔒 接口不变
                </label>
              </div>
            </div>
          </article>

          <article class="card">
            <header class="card-hd">
              <h3 class="card-title">补丁候选（方案 A / B / C）</h3>
            </header>
            <div class="card-bd">
              <div class="row" style="margin-bottom: 10px;">
                <button
                  v-for="key in patchKeys"
                  :key="key"
                  class="btn"
                  :class="{ primary: selectedPatchKey === key, ghost: selectedPatchKey !== key }"
                  @click="selectedPatchKey = key"
                >
                  方案{{ key }}
                </button>
              </div>
              <pre class="code-box mono" style="margin-top: 0;">{{ selectedPatch.diff }}</pre>
              <div class="row" style="margin-top: 10px;">
                <button class="btn primary" @click="selectPatchPlan">选择方案（{{ selectedPatchKey }}）</button>
                <button class="btn ghost" @click="semanticMigrate">语义迁移</button>
              </div>
            </div>
          </article>

          <article class="card">
            <header class="card-hd">
              <h3 class="card-title">影响评估（Gas / 接口 / 兼容性 / 风险）</h3>
            </header>
            <div class="card-bd">
              <table class="table">
                <tbody>
                  <tr>
                    <th>Gas 增量</th>
                    <td class="right"><span class="impact-badge" :class="impactClass.gas">{{ selectedImpact.gas }}</span></td>
                  </tr>
                  <tr>
                    <th>接口变化</th>
                    <td class="right"><span class="impact-badge" :class="impactClass.compat">{{ selectedImpact.compat }}</span></td>
                  </tr>
                  <tr>
                    <th>升级兼容性</th>
                    <td class="right"><span class="impact-badge" :class="impactClass.upgrade">{{ selectedImpact.upgrade }}</span></td>
                  </tr>
                  <tr>
                    <th>引入风险</th>
                    <td class="right"><span class="impact-badge" :class="impactClass.risk">{{ selectedImpact.risk }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section v-if="activeTab === 'gate'" class="tab-panel">
          <article class="card">
            <header class="card-hd">
              <h3 class="card-title">变体攻击回归</h3>
            </header>
            <div class="card-bd">
              <table class="table">
                <thead>
                  <tr><th>变体</th><th>说明</th><th class="right">状态</th></tr>
                </thead>
                <tbody>
                  <tr v-for="item in activeTicket.gate.variants" :key="item.id">
                    <td class="mono">{{ item.id }}</td>
                    <td>{{ item.title }}</td>
                    <td class="right">
                      <span class="chip"><i :class="statusDotClass(item.status)" class="dot" />{{ item.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article class="card" style="margin-top: 12px;">
            <header class="card-hd">
              <h3 class="card-title">发布门禁状态（四项核心指标）</h3>
            </header>
            <div class="card-bd">
              <div class="row">
                <span v-for="item in activeTicket.gate.checks" :key="item.name" class="chip">
                  <i :class="statusDotClass(item.status)" class="dot" />
                  {{ item.name }}：{{ item.status }}
                </span>
              </div>
              <div class="row" style="margin-top: 12px;">
                <button class="btn primary">提交发布审批</button>
                <button class="btn danger">回滚候选</button>
              </div>
            </div>
          </article>
        </section>

        <section v-if="activeTab === 'timeline'" class="tab-panel">
          <article class="card">
            <header class="card-hd">
              <h3 class="card-title">可审计 Timeline（Audit Trail）</h3>
            </header>
            <div class="card-bd">
              <table class="table">
                <thead>
                  <tr><th>时间</th><th>角色</th><th>操作</th></tr>
                </thead>
                <tbody>
                  <tr v-for="log in activeTicket.timelineLogs" :key="log.time + log.actor + log.action">
                    <td class="mono">{{ log.time }}</td>
                    <td>{{ log.actor }}</td>
                    <td>{{ log.action }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="row" style="margin-top: 10px;">
                <button class="btn primary">@复核</button>
                <button class="btn ghost" @click="openAttachDialog">+附件</button>
                <input ref="attachInputRef" type="file" style="display: none;" @change="onAttachChange" />
              </div>
              <div v-if="attachedFileName" class="row" style="margin-top: 8px;">
                <span class="chip">已添加附件：{{ attachedFileName }}</span>
              </div>
            </div>
          </article>
        </section>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { tickets } from '../data/mockData';

const tabDefs = [
  { key: 'overview', label: '概览' },
  { key: 'findings', label: '检测 Findings' },
  { key: 'verify', label: '验证' },
  { key: 'patch', label: '修复' },
  { key: 'gate', label: '回归门禁' },
  { key: 'timeline', label: '记录与协作' }
];

const patchKeys = ['A', 'B', 'C'];

const activeId = ref(tickets[0]?.id ?? '');
const activeTab = ref('overview');
const pocLogs = ref('[Ready] 等待运行 PoC...\n');
const selectedPatchKey = ref('A');
const attachedFileName = ref('');
const attachInputRef = ref(null);

// 修复输入约束的附加选项。
const patchOptions = ref({
  generateAssert: true,
  lockInterface: true
});

const activeTicket = computed(() => tickets.find((item) => item.id === activeId.value) ?? tickets[0]);

const selectedPatch = computed(() => {
  const found = activeTicket.value.patchCandidates.find((item) => item.key === selectedPatchKey.value);
  if (found) return found;
  return {
    key: selectedPatchKey.value,
    diff: `// 方案${selectedPatchKey.value} 暂无预置代码\n// 你可以在这里接后端返回的 AI 补丁。`,
    impact: { gas: '--', compat: '暂无数据', upgrade: '暂无数据', risk: 'Unknown' }
  };
});

const selectedImpact = computed(() => selectedPatch.value.impact);

const impactClass = computed(() => ({
  gas: impactColorForGas(selectedImpact.value.gas),
  compat: impactColorForCompat(selectedImpact.value.compat),
  upgrade: impactColorForUpgrade(selectedImpact.value.upgrade),
  risk: impactColorForRisk(selectedImpact.value.risk)
}));

// 在代码证据中把错误注释染成红色，突出“案发现场”。
const highlightedCodeSnippet = computed(() => {
  const escaped = escapeHtml(activeTicket.value.codeSnippet);
  return escaped
    .split('\n')
    .map((line) => {
      if (!line.includes('//')) return line;
      const index = line.indexOf('//');
      const left = line.slice(0, index);
      const right = line.slice(index);
      if (right.includes('✗') || right.includes('错误')) {
        return `${left}<span class="error-comment">${right}</span>`;
      }
      return `${left}<span class="normal-comment">${right}</span>`;
    })
    .join('\n');
});

const switchTicket = (id) => {
  activeId.value = id;
  activeTab.value = 'overview';
  selectedPatchKey.value = 'A';
  pocLogs.value = `[Ready] ticket=${id}\n`;
  attachedFileName.value = '';
};

const statusDotClass = (status) => {
  if (status === 'PASS') return 'good';
  if (status === 'WARN') return 'warn';
  return 'bad';
};

const runPoc = () => {
  const ts = new Date().toLocaleTimeString();
  pocLogs.value +=
    `[${ts}] start_poc: ${activeTicket.value.id}\n` +
    `[${ts}] fork=19233001 rpc=/mock-rpc\n` +
    `[${ts}] tx1 setup ... ok\n` +
    `[${ts}] tx2 trigger ... ok\n` +
    `[${ts}] tx3 exploit ... reproducible\n`;
};

const generatePocSkeleton = () => {
  const ts = new Date().toLocaleTimeString();
  pocLogs.value +=
    `[${ts}] generate_skeleton: Foundry template created\n` +
    `[${ts}] file: test/${activeTicket.value.id.toLowerCase()}.t.sol\n`;
};

const exportEvidence = () => {
  const ts = new Date().toLocaleTimeString();
  pocLogs.value += `[${ts}] export_evidence_bundle: done\n`;
};

const sealEnvironment = () => {
  const ts = new Date().toLocaleTimeString();
  pocLogs.value += `[${ts}] seal_environment: snapshot saved\n`;
};

const selectPatchPlan = () => {
  const ts = new Date().toLocaleTimeString();
  pocLogs.value += `[${ts}] patch_selected: ${selectedPatchKey.value}\n`;
};

const semanticMigrate = () => {
  const ts = new Date().toLocaleTimeString();
  pocLogs.value += `[${ts}] semantic_migration: checking compatibility\n`;
};

const exportReport = () => {
  const ts = new Date().toLocaleTimeString();
  pocLogs.value += `[${ts}] export_report: ${activeTicket.value.id}.pdf\n`;
};

const openAttachDialog = () => {
  attachInputRef.value?.click();
};

const onAttachChange = (event) => {
  const [file] = event.target.files ?? [];
  if (!file) return;
  attachedFileName.value = file.name;
};

function impactColorForGas(gasText) {
  const value = Number(String(gasText).replace('%', '').replace('+', ''));
  if (Number.isNaN(value)) return 'impact-mid';
  if (value <= 1.5) return 'impact-good';
  if (value <= 4) return 'impact-mid';
  return 'impact-bad';
}

function impactColorForCompat(text) {
  if (text.includes('不变')) return 'impact-good';
  if (text.includes('小改动')) return 'impact-mid';
  return 'impact-bad';
}

function impactColorForUpgrade(text) {
  if (text.includes('兼容')) return 'impact-good';
  if (text.includes('迁移')) return 'impact-bad';
  return 'impact-mid';
}

function impactColorForRisk(text) {
  if (text.toLowerCase().includes('low')) return 'impact-good';
  if (text.toLowerCase().includes('med')) return 'impact-mid';
  if (text.toLowerCase().includes('high')) return 'impact-bad';
  return 'impact-mid';
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
</script>

<style scoped>
.detail-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.ticket-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.ticket-tab {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: #94a3b8;
  padding: 8px 10px;
  cursor: pointer;
}

.ticket-tab.active {
  color: #e6edf3;
  border-color: rgba(125, 211, 252, 0.55);
  background: linear-gradient(90deg, rgba(125, 211, 252, 0.14), rgba(217, 70, 239, 0.1));
}

.tab-panel {
  margin-top: 12px;
}

.patch-column {
  display: grid;
  gap: 12px;
}

:deep(.error-comment) {
  color: #f87171;
  font-weight: 700;
}

:deep(.normal-comment) {
  color: #94a3b8;
}

.impact-badge {
  display: inline-block;
  border-radius: 999px;
  padding: 3px 8px;
  border: 1px solid transparent;
}

.impact-good {
  color: #86efac;
  background: rgba(34, 197, 94, 0.16);
  border-color: rgba(34, 197, 94, 0.32);
}

.impact-mid {
  color: #fcd34d;
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
}

.impact-bad {
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.14);
  border-color: rgba(239, 68, 68, 0.3);
}
</style>
