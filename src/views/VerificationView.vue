<template>
  <div class="verification-view">
    <div class="verify-layout">
      <!-- 左侧：验证信息 + Call Graph + 资金流动 -->
      <div class="verify-left">
        <!-- 1. 验证信息卡片 -->
        <div class="panel unified-panel">
          <h3 class="panel-title">验证信息</h3>
          <div class="info-row">
            <!-- 触发性评估 -->
            <div class="info-card">
              <h4>🔍 触发性评估</h4>
              <p>触发条件：{{ activeTicket.dependency }}</p>
              <p>触发难度：{{ triggerDifficulty }}</p>
              <p>可利用状态：{{ activeTicket.triggered ? '✅ 可触发' : '❌ 不可触发' }}</p>
            </div>
            <!-- 危害性评估 -->
            <div class="info-card">
              <h4>⚠️ 危害性评估</h4>
              <p>风险等级：{{ activeTicket.severity.toUpperCase() }}</p>
              <p>资产损失：{{ activeTicket.loss }}</p>
              <p>影响范围：{{ activeTicket.scope }}</p>
            </div>
          </div>
          <!-- 漏洞详细信息 -->
          <div class="info-card full-card">
            <h4>📄 漏洞详细信息</h4>
            <p>漏洞类型：{{ activeTicket.type }}</p>
            <p>合约地址：{{ activeTicket.contract }}</p>
            <p>置信度：{{ activeTicket.confidence }}</p>
            <p>漏洞描述：{{ activeTicket.oneLine }}</p>
          </div>
        </div>

        <!-- 2. Call Graph -->
        <div class="panel unified-panel">
          <h3 class="panel-title">函数调用图 Call Graph</h3>
          <div class="graph-box">
            <svg viewBox="0 0 700 300" width="100%" height="280">
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
        <div class="panel unified-panel">
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
      </div>

      <!-- 右侧：漏洞PoC代码 + 日志 + 语义 + 迭代 -->
      <div class="verify-right">
        <div class="panel unified-panel">
          <h3 class="panel-title">漏洞PoC验证</h3>
          <div class="poc-box">
            <h4>可验证PoC代码（Foundry）</h4>
            <pre class="code-box">{{ pocCode }}</pre>
            <div class="btn-group">
              <button class="btn primary" @click="runPoc">执行PoC</button>
              <button class="btn ghost" @click="copyPoc">复制代码</button>
              <button class="btn ghost" @click="downloadPoc">下载代码</button>
            </div>
          </div>
        </div>

        <div class="panel unified-panel">
          <div class="poc-box">
            <h4>PoC运行日志</h4>
            <div class="log-filter-row">
              <select v-model="selectedLogLevel" @change="filterLogs">
                <option value="all">全部级别</option>
                <option value="ERROR">ERROR</option>
                <option value="WARN">WARN</option>
                <option value="INFO">INFO</option>
                <option value="SUCCESS">SUCCESS</option>
              </select>
              <input v-model="logSearchKey" placeholder="搜索日志..." @input="filterLogs"/>
              <button class="btn ghost" @click="clearLogs">清空</button>
            </div>
            <div class="log-container" ref="logContainer">
              <div v-for="(logItem, idx) in filteredLogs" :key="idx"
                   class="log-item" :class="`log-level-${logItem.level.toLowerCase()}`">
                <span class="log-level-icon">
                  <i v-if="logItem.level==='ERROR'">❌</i>
                  <i v-if="logItem.level==='WARN'">⚠️</i>
                  <i v-if="logItem.level==='INFO'">ℹ️</i>
                  <i v-if="logItem.level==='SUCCESS'">✅</i>
                </span>
                <span class="log-time mono">{{ logItem.time }}</span>
                <span class="log-content" v-html="highlightLogKeyword(logItem.content)"></span>
              </div>
              <div v-if="filteredLogs.length===0" class="log-empty">暂无匹配日志</div>
            </div>
          </div>
        </div>

        <div class="panel unified-panel">
          <div class="poc-box">
            <h4>PoC运行语义理解及还原</h4>
            <div class="semantic-box">
              <p>{{ activeTicket.semantic }}</p>
              <p>攻击流程：部署合约 → 存入资金 → 调用withdraw触发漏洞 → fallback重入 → 循环提取资产 → 攻击完成</p>
              <p>验证结论：{{ activeTicket.triggered ? '✅ 漏洞可复现，验证通过' : '❌ 漏洞不可触发' }}</p>
              <div class="semantic-steps">
                <h5>详细攻击步骤</h5>
                <div v-for="(step, idx) in semanticSteps" :key="idx" class="semantic-step">
                  <span class="step-num">{{ idx+1 }}.</span>
                  <span class="step-content">{{ step }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel unified-panel">
          <div class="poc-box">
            <h4>PoC迭代优化</h4>
            <textarea v-model="pocIterateInput" class="code-box mono"
                      placeholder="输入优化需求..."></textarea>
            <div class="btn-group">
              <button class="btn ghost" @click="pocIterateInput=''">清空输入</button>
              <button class="btn primary" @click="iteratePoc">提交迭代</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { tickets, defaultPocCode } from '../data/mockData';

// 核心状态
const activeTicketId = ref(tickets[0]?.id ?? 'TCK-1042');
const pocCode = ref(defaultPocCode);
const pocIterateInput = ref('');
const triggerDifficulty = ref('中等');
const semanticSteps = ref([
  '初始化Fork环境，锁定目标区块高度',
  '部署目标合约与攻击者合约',
  '正常用户向合约存入资金，模拟真实场景',
  '攻击者存入少量资金，获取提款权限',
  '调用withdraw()函数触发外部转账，开启重入窗口',
  'fallback函数中重复调用withdraw()，实现重入攻击',
  '循环提取资产直到合约余额耗尽',
  '攻击完成，验证资产转移结果'
]);

// 日志状态
const rawLogs = ref([{ time:'', level:'INFO', content:'[Ready] 等待PoC执行...' }]);
const selectedLogLevel = ref('all');
const logSearchKey = ref('');
const logContainer = ref(null);

// 计算属性：当前工单
const activeTicket = computed(() => tickets.find(t => t.id===activeTicketId.value) ?? tickets[0]);

// 过滤后的日志
const filteredLogs = computed(() => rawLogs.value.filter(logItem=>{
  const levelMatch = selectedLogLevel.value==='all' ? true : logItem.level===selectedLogLevel.value;
  const keywordMatch = logSearchKey.value.trim()==='' ? true : logItem.content.toLowerCase().includes(logSearchKey.value.toLowerCase());
  return levelMatch && keywordMatch;
}));

// 日志方法
const filterLogs = () => {};
const highlightLogKeyword = (content) => {
  if(!logSearchKey.value.trim()) return content;
  const reg = new RegExp(`(${logSearchKey.value})`, 'gi');
  return content.replace(reg, '<span class="log-keyword-highlight">$1</span>');
};
const clearLogs = () => { rawLogs.value = [{ time:'', level:'INFO', content:'[Ready] 等待PoC执行...' }]; };
const addLog = (level, content) => {
  const ts = new Date().toLocaleTimeString().slice(0,8);
  rawLogs.value.push({ time: ts, level, content });
  nextTick(() => { if(logContainer.value) logContainer.value.scrollTop = logContainer.value.scrollHeight; });
};

// PoC方法
const runPoc = () => {
  clearLogs();
  addLog('INFO','开始执行PoC测试');
  addLog('INFO',`Fork环境初始化完成，Block: 19233001`);
  addLog('INFO','目标合约与攻击合约部署完成');
  addLog('INFO','开始执行重入攻击流程');
  setTimeout(()=>{ addLog('WARN','触发withdraw()函数，开启重入窗口');
  setTimeout(()=>{ addLog('WARN','fallback函数触发重入调用'); setTimeout(()=>{ addLog('SUCCESS','攻击执行完成，资产提取成功'); addLog('SUCCESS','✅ 漏洞可复现，验证通过');},800);},800);},800);
};

const copyPoc = async() => {
  try { await navigator.clipboard.writeText(pocCode.value); addLog('SUCCESS','PoC代码已复制到剪贴板'); }
  catch(err){ addLog('ERROR','复制失败，请手动复制'); }
};

const downloadPoc = () => {
  const blob = new Blob([pocCode.value], { type:'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${activeTicketId.value}-poc.t.sol`;
  a.click();
  URL.revokeObjectURL(url);
  addLog('SUCCESS',`PoC代码已下载：${activeTicketId.value}-poc.t.sol`);
};

const iteratePoc = () => {
  if(!pocIterateInput.value.trim()) return;
  addLog('INFO',`开始PoC迭代优化，需求：${pocIterateInput.value.slice(0,50)}...`);
  setTimeout(()=>{ addLog('SUCCESS','PoC迭代优化完成，已更新代码'); }, 1000);
};

// 自动滚动日志
watch(rawLogs, ()=>{
  nextTick(()=>{ if(logContainer.value) logContainer.value.scrollTop = logContainer.value.scrollHeight; });
},{ deep:true });
</script>

<style scoped>
/* 核心左右布局 */
.verify-layout { display:grid; grid-template-columns:58% 40%; gap:2%; width:100%; }

/* 左右栏间距 */
.verify-left, .verify-right { display:flex; flex-direction:column; gap:12px; }

/* Panel统一风格 */
.panel.unified-panel {
  background:#334155;
  border-radius:8px;
  border:1px solid #475569;
  padding:16px;
  box-sizing:border-box;
}

/* Panel标题 */
.panel-title { margin:0 0 16px 0; font-size:18px; font-weight:700; color:#f1f5f9; }

/* Info卡片 */
.info-row { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
.info-card { flex:1; min-width:200px; background:#1e293b; padding:12px; border-radius:8px; }
.info-card.full-card { flex:none; width:100%; }
.info-card h4 { margin:0 0 8px 0; color:#38bdf8; font-size:14px; }
.info-card p { margin:4px 0; color:#cbd5e1; font-size:13px; line-height:1.4; }

/* Code Box */
.code-box { width:100%; background:#0a0f1a; border-radius:8px; padding:12px; font-size:13px; line-height:1.5; color:#f1f5f9; overflow-x:auto; box-sizing:border-box; }

/* Call Graph & Flow */
.graph-box, .flow-box { background:#0a0f1a; border-radius:8px; padding:16px; }
.graph-tip, .flow-info { margin-top:12px; color:#94a3b8; font-size:13px; }
.node-normal { stroke:#38bdf8; fill:#1e293b; stroke-width:2; }
.node-danger { stroke:#ef4444; fill:rgba(239,68,68,0.1); stroke-width:2; }
.node-warning { stroke:#f97316; fill:rgba(249,115,22,0.1); stroke-width:2; }

/* Flow节点 */
.flow-item { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
.flow-node { flex:1; min-width:120px; text-align:center; padding:12px; border-radius:8px; color:#f1f5f9; }
.user-node { background: rgba(56,189,248,0.1); border:1px solid #38bdf8; }
.contract-node { background: rgba(34,197,94,0.1); border:1px solid #22c55e; }
.attacker-node { background: rgba(239,68,68,0.1); border:1px solid #ef4444; }
.flow-arrow { font-size:20px; color:#38bdf8; }
.danger-arrow { color:#ef4444; font-weight:700; }

/* PoC相关样式 */
.poc-box { width:100%; box-sizing:border-box; }
.btn-group { display:flex; gap:8px; margin-top:8px; }
.btn { padding:6px 12px; border-radius:6px; font-size:13px; cursor:pointer; transition:all 0.2s ease; }
.btn.primary { background:#38bdf8; color:#0f172a; font-weight:600; }
.btn.ghost { background:#1e293b; color:#cbd5e1; }

/* Semantic */
.semantic-box { background:#1e293b; border-radius:8px; padding:12px; color:#cbd5e1; font-size:13px; line-height:1.6; }
.semantic-step { display:flex; gap:8px; margin:4px 0; align-items:flex-start; }
.step-num { color:#38bdf8; font-weight:700; min-width:20px; text-align:right; }

/* 日志 */
.log-container { width:100%; min-height:140px; max-height:180px; overflow-y:auto; background:#0a0f1a; border-radius:6px; padding:8px; display:flex; flex-direction:column; gap:4px; }
.log-item { display:flex; align-items:flex-start; gap:8px; font-size:12px; line-height:1.4; padding:4px 6px; border-radius:4px; }
.log-level-error { border-left:2px solid #ef4444; background: rgba(239,68,68,0.05); }
.log-level-warn { border-left:2px solid #f97316; background: rgba(249,115,22,0.05); }
.log-level-info { border-left:2px solid #38bdf8; background: rgba(56,189,248,0.05); }
.log-level-success { border-left:2px solid #22c55e; background: rgba(34,197,94,0.05); }
.log-level-icon { font-size:12px; margin-top:1px; flex-shrink:0; }
.log-time { color:#94a3b8; min-width:70px; flex-shrink:0; font-size:11px; }
.log-content { color:#f1f5f9; flex:1; word-break:break-all; }
.log-keyword-highlight { color:#f87171; font-weight:700; background: rgba(248,113,113,0.1); padding:0 2px; border-radius:2px; }
.log-empty { color:#94a3b8; font-size:12px; text-align:center; padding:20px 0; }

/* 响应式布局 */
@media(max-width:1200px){ .verify-layout{grid-template-columns:1fr;} }
</style>