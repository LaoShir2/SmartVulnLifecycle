<template>
  <div class="verify-content">
    <!-- 标签页切换 -->
    <div class="verify-tabs">
      <button 
        v-for="tab in tabList" 
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 1. 验证信息面板 -->
    <div v-if="activeTab === 'info'" class="panel">
      <h3 class="panel-title">验证信息</h3>
      <div class="info-row">
        <div class="info-card">
          <h4>🔍 触发性评估</h4>
          <p>触发条件：{{ activeTicket.dependency }}</p>
          <p>触发难度：{{ triggerDifficulty }}</p>
          <p>可利用状态：{{ activeTicket.triggered ? '✅ 可触发' : '❌ 不可触发' }}</p>
        </div>
        <div class="info-card">
          <h4>⚠️ 危害性评估</h4>
          <p>风险等级：{{ activeTicket.severity.toUpperCase() }}</p>
          <p>资产损失：{{ activeTicket.loss }}</p>
          <p>影响范围：{{ activeTicket.scope }}</p>
        </div>
      </div>
      <div class="info-card full-card">
        <h4>📄 漏洞详细信息</h4>
        <p>漏洞类型：{{ activeTicket.type }}</p>
        <p>合约地址：{{ activeTicket.contract }}</p>
        <p>置信度：{{ activeTicket.confidence }}</p>
        <p>漏洞描述：{{ activeTicket.oneLine }}</p>
      </div>
      <pre class="code-box">{{ activeTicket.codeSnippet }}</pre>
    </div>

    <!-- 2. Call Graph 函数调用图 -->
    <div v-if="activeTab === 'call'" class="panel">
      <h3 class="panel-title">函数调用图 Call Graph</h3>
      <div class="graph-box">
        <svg viewBox="0 0 700 300" width="100%" height="280">
          <!-- 箭头标记 -->
          <defs>
            <marker id="arrow-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0 10 3.5 0 7" fill="#38bdf8" />
            </marker>
            <marker id="arrow-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0 10 3.5 0 7" fill="#ef4444" />
            </marker>
          </defs>

          <!-- 函数节点 -->
          <rect x="60" y="80" width="110" height="45" rx="6" class="node node-normal" />
          <text x="115" y="105" text-anchor="middle" fill="#fff">deposit()</text>
          
          <rect x="250" y="80" width="110" height="45" rx="6" class="node node-danger" />
          <text x="305" y="105" text-anchor="middle" fill="#fff">withdraw()</text>
          
          <rect x="440" y="80" width="110" height="45" rx="6" class="node node-warning" />
          <text x="495" y="105" text-anchor="middle" fill="#fff">fallback()</text>

          <rect x="250" y="180" width="110" height="45" rx="6" class="node node-normal" />
          <text x="305" y="205" text-anchor="middle" fill="#fff">transfer()</text>

          <!-- 调用箭头 -->
          <line x1="170" y1="102" x2="248" y2="102" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow-blue)" />
          <line x1="360" y1="102" x2="438" y2="102" stroke="#ef4444" stroke-width="2" marker-end="url(#arrow-red)" />
          <line x1="305" y1="125" x2="305" y2="178" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow-blue)" />
          <line x1="495" y1="125" x2="305" y2="125" stroke="#ef4444" stroke-width="2" marker-end="url(#arrow-red)" />
        </svg>
        <div class="graph-tip">
          <span>🔵 正常调用</span>
          <span>🔴 恶意重入调用</span>
        </div>
      </div>
    </div>

    <!-- 3. 资金流动图 -->
    <div v-if="activeTab === 'flow'" class="panel">
      <h3 class="panel-title">资金流动图</h3>
      <div class="flow-box">
        <div class="flow-item">
          <div class="flow-node user-node">
            <div>用户地址</div>
            <small>0x123...abc</small>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-node contract-node">
            <div>目标合约</div>
            <small>{{ activeTicket.contract.substring(0,10) }}...</small>
          </div>
          <div class="flow-arrow danger-arrow">←</div>
          <div class="flow-node attacker-node">
            <div>攻击者合约</div>
            <small>0x456...def</small>
          </div>
        </div>
        <div class="flow-info">
          <p>正常资金：用户 → 合约（存款）</p>
          <p>攻击资金：合约 → 攻击者（盗取）</p>
          <p>预估损失：{{ activeTicket.loss }}</p>
        </div>
      </div>
    </div>

    <!-- 4. 漏洞PoC代码模块 -->
    <div v-if="activeTab === 'poc'" class="panel">
      <h3 class="panel-title">漏洞PoC验证</h3>
      
      <!-- 4.1 可验证PoC代码 -->
      <div class="poc-box">
        <h4>可验证PoC代码（Foundry）</h4>
        <pre class="code-box">{{ defaultPocCode }}</pre>
        <div class="btn-group">
          <button class="btn primary" @click="runPoc">执行PoC</button>
          <button class="btn ghost" @click="copyPoc">复制代码</button>
        </div>
      </div>

      <!-- 4.2 PoC运行日志 -->
      <div class="poc-box">
        <h4>PoC运行日志</h4>
        <pre class="code-box log-box">{{ pocLogs }}</pre>
      </div>

      <!-- 4.3 PoC语义理解与还原 -->
      <div class="poc-box">
        <h4>PoC运行语义理解及还原</h4>
        <div class="semantic-box">
          <p>{{ activeTicket.semantic }}</p>
          <p>攻击流程：部署合约 → 存入资金 → 调用withdraw触发漏洞 → fallback重入 → 循环提取资产 → 攻击完成</p>
          <p>验证结论：{{ activeTicket.triggered ? '✅ 漏洞可复现，验证通过' : '❌ 漏洞不可触发' }}</p>
        </div>
      </div>

      <!-- 4.4 PoC迭代 -->
      <div class="poc-box">
        <h4>PoC迭代优化</h4>
        <textarea 
          v-model="iterateText" 
          class="iterate-input"
          placeholder="输入迭代需求：如适配闪电贷、增加权限校验、优化Gas、修改攻击逻辑等"
        ></textarea>
        <div class="btn-group">
          <button class="btn ghost" @click="iterateText = ''">清空</button>
          <button class="btn primary" @click="iteratePoc">提交迭代</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { tickets, defaultPocCode, beforeFixLogs } from '../data/mockData';

// 标签页
const tabList = [
  { key: 'info', label: '验证信息' },
  { key: 'call', label: 'Call Graph' },
  { key: 'flow', label: '资金流动' },
  { key: 'poc', label: '漏洞PoC' }
];
const activeTab = ref('info');

// 当前选中漏洞（从公共布局传入/全局获取）
const activeTicket = computed(() => {
  const ticket = tickets[0];
  // 自动补充验证所需字段
  return {
    ...ticket,
    triggered: true,
    loss: '20 ETH',
    scope: '合约全部资产',
    semantic: '该PoC利用重入漏洞，在合约更新余额前反复调用withdraw，实现资产非法提取',
    dependency: ticket.dependency || '需要fallback函数+多笔交易'
  };
});

// 触发难度计算
const triggerDifficulty = computed(() => {
  return activeTicket.value.severity === 'high' ? '低' : '中';
});

// PoC相关
const pocLogs = ref('[等待执行] 点击「执行PoC」查看运行轨迹');
const iterateText = ref('');

// 执行PoC
const runPoc = () => {
  pocLogs.value = beforeFixLogs;
};

// 复制PoC
const copyPoc = async () => {
  await navigator.clipboard.writeText(defaultPocCode);
  alert('PoC代码已复制到剪贴板');
};

// PoC迭代
const iteratePoc = () => {
  if (!iterateText.value) return;
  pocLogs.value += `\n[迭代优化] ${new Date().toLocaleString()}：${iterateText.value}`;
};
</script>

<style scoped>
/* 验证页面内容样式（与全局统一） */
.verify-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 标签页 */
.verify-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #334155;
  padding-bottom: 8px;
}
.tab-btn {
  padding: 8px 16px;
  background: #334155;
  border: 1px solid #475569;
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
}
.tab-btn.active {
  background: #38bdf8;
  color: #0f172a;
  border-color: #38bdf8;
}

/* 面板通用 */
.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #e2e8f0;
}

/* 验证信息 */
.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.info-card {
  background: #334155;
  border: 1px solid #475569;
  border-radius: 10px;
  padding: 16px;
}
.info-card.full-card {
  grid-column: 1 / -1;
}
.info-card h4 {
  margin: 0 0 10px 0;
  color: #38bdf8;
  font-size: 14px;
}
.info-card p {
  margin: 6px 0;
  font-size: 13px;
  color: #e2e8f0;
}

/* 代码框 */
.code-box {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 16px;
  font-size: 12px;
  line-height: 1.5;
  overflow: auto;
  max-height: 240px;
  font-family: monospace;
  color: #e2e8f0;
}
.log-box {
  max-height: 180px;
}

/* Call Graph */
.graph-box {
  background: #334155;
  border: 1px solid #475569;
  border-radius: 10px;
  padding: 20px;
}
.node {
  fill: #475569;
  stroke-width: 2px;
}
.node-normal {
  stroke: #38bdf8;
}
.node-danger {
  stroke: #ef4444;
}
.node-warning {
  stroke: #f59e0b;
}
.graph-tip {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
  font-size: 12px;
  color: #94a3b8;
}

/* 资金流动 */
.flow-box {
  background: #334155;
  border: 1px solid #475569;
  border-radius: 10px;
  padding: 20px;
}
.flow-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}
.flow-node {
  width: 130px;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  color: #fff;
  font-size: 13px;
}
.user-node {
  background: #22c55e;
}
.contract-node {
  background: #38bdf8;
  color: #0f172a;
}
.attacker-node {
  background: #ef4444;
}
.flow-arrow {
  font-size: 22px;
  color: #38bdf8;
  font-weight: bold;
}
.danger-arrow {
  color: #ef4444;
}
.flow-info {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}

/* PoC模块 */
.poc-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.poc-box h4 {
  margin: 0;
  font-size: 14px;
  color: #38bdf8;
}
.btn-group {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.btn {
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #475569;
}
.btn.primary {
  background: #38bdf8;
  color: #0f172a;
  border-color: #38bdf8;
}
.btn.ghost {
  background: transparent;
  color: #e2e8f0;
}

/* 语义框 */
.semantic-box {
  background: #334155;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
  color: #e2e8f0;
}

/* 迭代输入框 */
.iterate-input {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px;
  color: #e2e8f0;
  min-height: 100px;
  resize: vertical;
}
</style>