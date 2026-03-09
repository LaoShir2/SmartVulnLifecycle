<template>
  <!-- 完全对齐TicketsView的左右分栏布局 -->
  <section class="ticket-layout">
    <!-- 左侧：可收起的待验证工单列表 -->
    <aside class="card sidebar-card" :class="{ collapsed: isSidebarCollapsed }">
      <!-- 收起状态：仅显示窄栏和展开按钮 -->
      <div v-if="isSidebarCollapsed" class="collapsed-sidebar">
        <button class="toggle-btn" @click="toggleSidebar" title="展开工单列表">
          <span class="toggle-icon">›</span>
        </button>
        <div class="collapsed-label">工单</div>
      </div>
      <!-- 展开状态：显示完整工单列表 -->
      <template v-else>
        <header class="card-hd">
          <div class="row" style="justify-content: space-between; align-items: center;">
            <h3 class="card-title">待验证工单列表</h3>
            <button class="toggle-btn" @click="toggleSidebar" title="收起工单列表">
              <span class="toggle-icon">‹</span>
            </button>
          </div>
          <p class="card-sub">仅展示待确认阶段的漏洞工单，按严重等级排序。</p>
        </header>
        <div class="card-bd" style="display: grid; gap: 8px;">
          <div
            v-for="item in verifyTickets"
            :key="item.id"
            class="ticket-item"
            :class="{ active: item.id === expandedTicketId }"
            @click="toggleTicket(item.id)"
          >
            <div class="row" style="justify-content: space-between; align-items: center;">
              <h4>{{ item.id }}</h4>
              <span class="severity" :class="item.severity">{{ item.severity }}</span>
            </div>
            <p>{{ item.title }}</p>
            <div class="row" style="margin-top: 8px;">
              <span class="chip"><i class="dot warn pulse" />{{ item.stage }}</span>
              <span class="chip mono">{{ item.chain }}</span>
            </div>
            <!-- 漏洞信息：仅在选中时展开，紧凑表格布局 -->
            <div v-if="expandedTicketId === item.id" class="mini-detail">
              <table class="table mini-table">
                <tbody>
                  <tr>
                    <th>合约</th>
                    <td class="mono">{{ item.contract }}</td>
                  </tr>
                  <tr>
                    <th>类型</th>
                    <td>{{ item.type }}</td>
                  </tr>
                  <tr>
                    <th>置信度</th>
                    <td>{{ item.confidence.toFixed(2) }}</td>
                  </tr>
                  <tr>
                    <th>依赖条件</th>
                    <td>{{ item.dependency }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
    </aside>
    <!-- 右侧：验证工作台主内容区（原有核心功能完整保留） -->
    <main style="display: flex; flex-direction: column; gap: 12px;">
      <!-- 顶部工单基础信息栏 -->
      <div class="card">
        <div class="card-bd">
          <div class="row" style="justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <div class="row" style="align-items: center; gap: 12px; flex-wrap: wrap;">
              <span class="severity" :class="activeTicket.severity">{{ activeTicket.severity.toUpperCase() }}</span>
              <h3 class="card-title" style="margin: 0;">{{ activeTicket.id }} - {{ activeTicket.title }}</h3>
              <span class="chip"><i class="dot warn pulse" /> {{ activeTicket.stage }}</span>
              <span class="chip">Conf: {{ activeTicket.confidence.toFixed(2) }}</span>
            </div>
            <div class="row">
              <button class="btn primary" @click="sealEnvironment">固化环境</button>
              <button class="btn ghost" @click="exportEvidence">导出证据包</button>
            </div>
          </div>
        </div>
      </div>
      <!-- 上半部分：PoC代码模块（漏洞信息已移动到左侧列表） -->
      <article class="card">
        <header class="card-hd">
          <h3 class="card-title">生成的可验证PoC代码</h3>
          <p class="card-sub">Foundry/Hardhat 风格可直接执行的攻击验证脚本</p>
        </header>
        <div class="card-bd">
          <div class="row" style="margin-bottom: 12px;">
            <span class="chip">框架: Foundry</span>
            <span class="chip">入口: testExploit()</span>
            <span class="chip">输出: evidence_bundle</span>
          </div>
          <pre class="code-box mono" style="margin: 0; max-height: 380px;">{{ pocCode }}</pre>
          <div class="row" style="margin-top: 12px;">
            <button class="btn primary" @click="runPoc">运行 PoC</button>
            <button class="btn ghost" @click="copyPocCode">复制代码</button>
            <button class="btn ghost" @click="downloadPoc">下载骨架</button>
            <button class="btn ghost" @click="resetPocCode">重制代码</button>
          </div>
        </div>
      </article>
      <!-- PoC运行语义理解及还原模块（核心优化：交易执行列表重构） -->
      <article class="card">
        <header class="card-hd">
          <h3 class="card-title">PoC运行语义理解及还原</h3>
          <p class="card-sub">交易时序、攻击路径与关键状态的语义化还原，辅助漏洞理解</p>
          <div class="row" style="margin-top: 8px; gap: 8px;">
            <button class="btn ghost" style="padding: 4px 12px; font-size: 12px;" @click="expandAllTx">全部展开</button>
            <button class="btn ghost" style="padding: 4px 12px; font-size: 12px;" @click="collapseAllTx">全部收起</button>
          </div>
        </header>
        <div class="card-bd">
          <!-- 环境信息标签 -->
          <div class="row" style="margin-bottom: 16px; gap: 12px; flex-wrap: wrap;">
            <span class="chip">Fork Block: 19,233,001</span>
            <span class="chip">RPC: /mock-rpc</span>
            <span class="chip">Gas: 38M</span>
          </div>

          <!-- 核心优化：层级化交易流程列表（参考Phalcon设计） -->
          <div class="tx-timeline">
            <div
              v-for="txItem in pocSemanticData"
              :key="txItem.step"
              class="tx-item"
              :class="{ 'tx-item-success': txItem.status === 'success', 'tx-item-warning': txItem.status === 'warning', 'tx-item-error': txItem.status === 'error' }"
            >
              <!-- 交易主步骤头部 -->
              <div class="tx-header" @click="toggleTxExpand(txItem.step)">
                <div class="tx-header-left">
                  <!-- 折叠/展开按钮 -->
                  <button class="tx-toggle-btn">
                    <span class="tx-toggle-icon" :class="{ rotated: expandedTxSteps.includes(txItem.step) }">▸</span>
                  </button>
                  <!-- 序号+交易ID -->
                  <span class="tx-step mono">Tx{{ txItem.step }}</span>
                  <!-- 调用关系 -->
                  <span class="tx-from">{{ txItem.from || '攻击者合约' }}</span>
                  <span class="tx-arrow">→</span>
                  <span class="tx-to">{{ txItem.to || '目标合约' }}</span>
                  <!-- 函数名高亮 -->
                  <span v-if="txItem.function" class="tx-function mono">{{ txItem.function }}</span>
                </div>
                <div class="tx-header-right">
                  <span class="tx-status" :class="txItem.status || 'success'">
                    {{ txItem.result || '执行成功' }}
                  </span>
                </div>
              </div>

              <!-- 交易详情（展开时显示） -->
              <div v-show="expandedTxSteps.includes(txItem.step)" class="tx-detail">
                <!-- 执行动作描述 -->
                <div class="tx-section">
                  <div class="tx-section-title">执行动作</div>
                  <div class="tx-section-content">{{ txItem.action }}</div>
                </div>

                <!-- 关键参数（如果有） -->
                <div v-if="txItem.params" class="tx-section">
                  <div class="tx-section-title">关键参数</div>
                  <div class="tx-params mono">
                    <div v-for="(value, key) in txItem.params" :key="key" class="tx-param-item">
                      <span class="tx-param-key">{{ key }}:</span>
                      <span class="tx-param-value">{{ value }}</span>
                    </div>
                  </div>
                </div>

                <!-- 关键状态变更 -->
                <div class="tx-section">
                  <div class="tx-section-title">关键状态变更</div>
                  <div class="tx-state-change mono">
                    {{ txItem.keyState }}
                  </div>
                </div>

                <!-- 子步骤/内部调用（如果有，支持无限层级） -->
                <div v-if="txItem.children && txItem.children.length" class="tx-children">
                  <div
                    v-for="childItem in txItem.children"
                    :key="childItem.step"
                    class="tx-child-item"
                  >
                    <div class="tx-child-header">
                      <span class="tx-child-step mono">└─ {{ childItem.step }}</span>
                      <span class="tx-child-from">{{ childItem.from }}</span>
                      <span class="tx-arrow">→</span>
                      <span class="tx-child-to">{{ childItem.to }}</span>
                      <span class="tx-child-function mono">{{ childItem.function }}</span>
                      <span class="tx-child-result">{{ childItem.result }}</span>
                    </div>
                    <div v-if="childItem.action" class="tx-child-content">
                      {{ childItem.action }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 关键约束 -->
          <div style="margin-top: 24px;">
            <h4 class="card-title" style="margin-bottom: 12px; font-size: 14px;">关键约束（PoC 合成/验证断言）</h4>
            <div class="row" style="flex-wrap: wrap; gap: 8px;">
              <span v-for="item in pocKeyConstraints" :key="item" class="chip">{{ item }}</span>
            </div>
          </div>
        </div>
      </article>

      <!-- 下半部分：PoC运行日志（核心优化） + PoC迭代 左右分栏 -->
      <div class="grid grid-cols-2">
        <!-- PoC运行日志模块（优化后） -->
        <article class="card">
          <header class="card-hd">
            <h3 class="card-title">PoC运行日志</h3>
            <p class="card-sub">展示编译、部署、触发、回滚、断言全流程执行日志</p>
            <!-- 新增：日志筛选栏 -->
            <div class="log-filter-row" style="margin-top: 12px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
              <!-- 级别筛选 -->
              <select v-model="selectedLogLevel" class="log-filter-select" @change="filterLogs">
                <option value="all">全部级别</option>
                <option value="ERROR">ERROR（错误）</option>
                <option value="WARN">WARN（警告）</option>
                <option value="INFO">INFO（信息）</option>
                <option value="SUCCESS">SUCCESS（成功）</option>
              </select>
              <!-- 关键词搜索 -->
              <input
                v-model="logSearchKey"
                class="log-filter-input"
                placeholder="输入关键词搜索日志..."
                @input="filterLogs"
              />
              <!-- 清空日志按钮 -->
              <button class="btn ghost" style="margin-left: auto; padding: 4px 12px; font-size: 12px;" @click="clearLogs">
                清空日志
              </button>
            </div>
          </header>
          <div class="card-bd">
            <!-- 优化后：结构化日志列表 -->
            <div class="log-container" ref="logContainer">
              <div
                v-for="(logItem, index) in filteredLogs"
                :key="index"
                class="log-item"
                :class="`log-level-${logItem.level.toLowerCase()}`"
              >
                <!-- 日志级别图标 -->
                <span class="log-level-icon">
                  <i v-if="logItem.level === 'ERROR'">❌</i>
                  <i v-if="logItem.level === 'WARN'">⚠️</i>
                  <i v-if="logItem.level === 'INFO'">ℹ️</i>
                  <i v-if="logItem.level === 'SUCCESS'">✅</i>
                </span>
                <!-- 日志时间 -->
                <span class="log-time mono">{{ logItem.time }}</span>
                <!-- 日志内容（关键词高亮） -->
                <span class="log-content" v-html="highlightLogKeyword(logItem.content)"></span>
              </div>
              <!-- 无日志提示 -->
              <div v-if="filteredLogs.length === 0" class="log-empty">
                暂无匹配日志
              </div>
            </div>
          </div>
        </article>

        <!-- PoC迭代模块 -->
        <article class="card">
          <header class="card-hd">
            <h3 class="card-title">PoC迭代优化</h3>
            <p class="card-sub">输入自定义约束与需求，自动化调整PoC代码与验证逻辑</p>
          </header>
          <div class="card-bd">
            <textarea
              v-model="pocIterateInput"
              class="code-box mono"
              style="width: 100%; min-height: 160px; margin: 0; resize: vertical;"
              placeholder="请输入PoC优化需求，例如：
1. 增加闪电贷操纵场景的验证
2. 适配代理合约的重入场景
3. 增加多签权限绕过的验证逻辑
4. 优化Gas消耗，适配不同Solidity版本"
            ></textarea>
            <div class="row" style="margin-top: 12px; justify-content: flex-end;">
              <button class="btn ghost" @click="pocIterateInput = ''">清空输入</button>
              <button class="btn primary" @click="iteratePoc">提交迭代优化</button>
            </div>
          </div>
        </article>
      </div>
    </main>
  </section>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { tickets, defaultPocCode, pocSemanticData, pocKeyConstraints } from '../data/mockData';

// 核心状态
const activeTicketId = ref(tickets[0]?.id ?? 'TCK-1042');
const expandedTicketId = ref(null);
const pocCode = ref(defaultPocCode);
const pocIterateInput = ref('');
const isSidebarCollapsed = ref(false);

// 新增：日志相关状态（结构化存储+筛选）
const rawLogs = ref([
  { time: '', level: 'INFO', content: '[Ready] 等待PoC执行...' }
]);
const selectedLogLevel = ref('all');
const logSearchKey = ref('');
const logContainer = ref(null);

// 计算属性：过滤后的日志
const filteredLogs = computed(() => {
  return rawLogs.value.filter(logItem => {
    // 级别筛选
    const levelMatch = selectedLogLevel.value === 'all' 
      ? true 
      : logItem.level === selectedLogLevel.value;
    // 关键词筛选（忽略大小写）
    const keywordMatch = logSearchKey.value.trim() === ''
      ? true
      : logItem.content.toLowerCase().includes(logSearchKey.value.toLowerCase());
    return levelMatch && keywordMatch;
  });
});

// 新增：交易步骤展开状态管理
const expandedTxSteps = ref([1,2,3,4,5]); // 默认全部展开
const toggleTxExpand = (step) => {
  const index = expandedTxSteps.value.indexOf(step);
  if (index > -1) {
    expandedTxSteps.value.splice(index, 1);
  } else {
    expandedTxSteps.value.push(step);
  }
};
const expandAllTx = () => {
  expandedTxSteps.value = pocSemanticData.map(item => item.step);
};
const collapseAllTx = () => {
  expandedTxSteps.value = [];
};

// 切换侧边栏收起/展开
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

// 计算属性：过滤待验证工单（仅展示待确认阶段）
const verifyTickets = computed(() => {
  return tickets.filter(item => item.stage === '待确认');
});

// 当前选中的工单
const activeTicket = computed(() => {
  return tickets.find(item => item.id === activeTicketId.value) ?? tickets[0];
});

// 切换工单：第一次点击展开详情并更新右侧，第二次点击收起详情
const toggleTicket = (ticketId) => {
  if (expandedTicketId.value === ticketId) {
    expandedTicketId.value = null;
    return;
  }
  expandedTicketId.value = ticketId;
  switchTicket(ticketId);
};

// 工单切换方法（和TicketsView完全一致的交互逻辑）
const switchTicket = (ticketId) => {
  activeTicketId.value = ticketId;
  resetPocCode();
};

// 新增：日志筛选方法
const filterLogs = () => {
  // 筛选逻辑通过computed自动触发，此处仅用于触发更新
};

// 新增：日志关键词高亮
const highlightLogKeyword = (content) => {
  if (!logSearchKey.value.trim()) return content;
  const reg = new RegExp(`(${logSearchKey.value})`, 'gi');
  return content.replace(reg, '<span class="log-keyword-highlight">$1</span>');
};

// 新增：清空日志
const clearLogs = () => {
  rawLogs.value = [{ time: '', level: 'INFO', content: '[Ready] 等待PoC执行...' }];
};

// 新增：添加日志（结构化）
const addLog = (level, content) => {
  const ts = new Date().toLocaleTimeString();
  rawLogs.value.push({
    time: ts,
    level: level,
    content: content
  });
  // 自动滚动到最新日志
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

// 业务方法实现（修改：日志输出改为结构化添加）
const runPoc = () => {
  resetLogs();
  addLog('INFO', '开始执行PoC测试');
  addLog('INFO', `Fork 环境初始化完成，Block: 19233001`);
  addLog('INFO', '目标合约编译部署完成');
  addLog('INFO', '攻击合约编译部署完成');
  addLog('INFO', `=== 开始${activeTicket.value.type}攻击测试 ===`);
  addLog('INFO', '攻击前合约余额: 100 ETH');
  addLog('INFO', '攻击前攻击者余额: 10 ETH');
  
  setTimeout(() => {
    addLog('WARN', '触发漏洞函数调用，外部转账执行');
    setTimeout(() => {
      addLog('WARN', '进入攻击执行逻辑');
      addLog('WARN', '漏洞利用成功，资产提取完成');
      setTimeout(() => {
        addLog('INFO', '=== 攻击执行完成 ===');
        addLog('SUCCESS', '攻击后合约余额: 80 ETH');
        addLog('SUCCESS', '攻击后攻击者余额: 30 ETH');
        addLog('SUCCESS', '✅ 漏洞可复现，攻击成功');
        addLog('SUCCESS', '测试用例执行通过，漏洞确认有效');
      }, 600);
    }, 400);
  }, 300);
};

// 修改：重置日志（结构化）
const resetLogs = () => {
  rawLogs.value = [{ time: '', level: 'INFO', content: '[Ready] 等待PoC执行...' }];
};

const resetPocCode = () => {
  pocCode.value = defaultPocCode;
  resetLogs();
  pocIterateInput.value = '';
};

const copyPocCode = async () => {
  try {
    await navigator.clipboard.writeText(pocCode.value);
    addLog('SUCCESS', 'PoC代码已复制到剪贴板');
  } catch (err) {
    addLog('ERROR', '复制失败，请手动复制代码');
  }
};

const downloadPoc = () => {
  addLog('INFO', `PoC骨架文件下载完成: ${activeTicketId.value.toLowerCase()}.t.sol`);
};

const sealEnvironment = () => {
  addLog('INFO', '测试环境已固化，快照已保存');
};

const exportEvidence = () => {
  addLog('INFO', '漏洞证据包导出完成，包含PoC、日志、状态快照');
};

const iteratePoc = () => {
  if (!pocIterateInput.value.trim()) return;
  addLog('INFO', `开始PoC迭代优化，需求: ${pocIterateInput.value.slice(0, 50)}...`);
  setTimeout(() => {
    addLog('SUCCESS', 'PoC代码已根据需求完成优化，可点击「重制代码」查看更新');
  }, 800);
};

// 监听日志变化，自动滚动到底部
watch(rawLogs, () => {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
}, { deep: true });
</script>

<style scoped>
/* 原有布局样式完全保留 */
.ticket-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  width: 100%;
  transition: grid-template-columns 0.3s ease;
}
.ticket-layout:has(.sidebar-card.collapsed) {
  grid-template-columns: 60px 1fr;
}
.sidebar-card {
  transition: all 0.3s ease;
  overflow: hidden;
}
.sidebar-card.collapsed {
  padding: 0;
}
.collapsed-sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  height: 100%;
  gap: 16px;
}
.collapsed-label {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 14px;
  color: #94a3b8;
  font-weight: 500;
}
.toggle-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #1e293b;
  background: #0f172a;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}
.toggle-btn:hover {
  border-color: #38bdf8;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
}
.toggle-icon {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
}
.ticket-item {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #1e293b;
  background: #0f172a;
  cursor: pointer;
  transition: all 0.2s ease;
}
.ticket-item:hover {
  border-color: #334155;
  background: #131c31;
}
.ticket-item.active {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.05);
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.2);
}
.ticket-item h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
}
.ticket-item p {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.4;
}
.mini-detail {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(148, 163, 184, 0.3);
  overflow: hidden;
}
.mini-table {
  width: 100%;
  table-layout: fixed;
}
.mini-table th,
.mini-table td {
  padding: 6px 8px;
  font-size: 12px;
  white-space: normal;
  vertical-align: top;
}
.mini-table th {
  width: 64px;
  color: #94a3b8;
}
.mini-table td {
  overflow-wrap: anywhere;
  word-break: break-all;
}

/* ========== 新增：交易流程列表样式 ========== */
.tx-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tx-item {
  border-radius: 8px;
  border: 1px solid #1e293b;
  background: #0f172a;
  overflow: hidden;
  transition: all 0.2s ease;
}
.tx-item:hover {
  border-color: #334155;
}
.tx-item-success {
  border-left: 3px solid #22c55e;
}
.tx-item-warning {
  border-left: 3px solid #f97316;
}
.tx-item-error {
  border-left: 3px solid #ef4444;
}
/* 交易头部 */
.tx-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
  user-select: none;
}
.tx-header:hover {
  background: rgba(255, 255, 255, 0.02);
}
.tx-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
/* 折叠按钮 */
.tx-toggle-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tx-toggle-icon {
  transition: transform 0.2s ease;
  font-size: 12px;
}
.tx-toggle-icon.rotated {
  transform: rotate(90deg);
}
/* 交易头部文本样式 */
.tx-step {
  font-size: 13px;
  font-weight: 600;
  color: #38bdf8;
  min-width: 40px;
}
.tx-from, .tx-to {
  font-size: 13px;
  color: #cbd5e1;
}
.tx-arrow {
  color: #94a3b8;
  font-size: 12px;
}
.tx-function {
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  font-size: 12px;
}
.tx-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
.tx-status.success {
  background: rgba(34, 197, 94, 0.1);
  color: #86efac;
}
.tx-status.warning {
  background: rgba(249, 115, 22, 0.1);
  color: #fdba74;
}
.tx-status.error {
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
}
/* 交易详情 */
.tx-detail {
  padding: 0 16px 16px 46px;
  border-top: 1px solid #1e293b;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.tx-section {
  margin-top: 12px;
}
.tx-section-title {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 6px;
  font-weight: 500;
}
.tx-section-content {
  font-size: 14px;
  color: #f1f5f9;
  line-height: 1.5;
}
/* 参数样式 */
.tx-params {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #0a0f1a;
}
.tx-param-item {
  display: flex;
  gap: 8px;
}
.tx-param-key {
  color: #94a3b8;
  min-width: 100px;
}
.tx-param-value {
  color: #38bdf8;
}
/* 状态变更样式 */
.tx-state-change {
  padding: 8px 12px;
  border-radius: 6px;
  background: #0a0f1a;
  color: #86efac;
  font-size: 13px;
  line-height: 1.5;
}
/* 子步骤样式 */
.tx-children {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tx-child-item {
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.02);
  border-left: 2px solid #1e293b;
}
.tx-child-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tx-child-step {
  font-size: 12px;
  color: #94a3b8;
}
.tx-child-from, .tx-child-to {
  font-size: 12px;
  color: #cbd5e1;
}
.tx-child-function {
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  font-size: 11px;
}
.tx-child-result {
  font-size: 12px;
  color: #86efac;
}
.tx-child-content {
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
  padding-left: 24px;
}

/* ========== 新增：日志模块样式 ========== */
.log-filter-row {
  width: 100%;
}
.log-filter-select {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #1e293b;
  background: #0f172a;
  color: #f1f5f9;
  font-size: 13px;
  min-width: 120px;
}
.log-filter-input {
  flex: 1;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #1e293b;
  background: #0f172a;
  color: #f1f5f9;
  font-size: 13px;
  min-width: 180px;
}
.log-container {
  width: 100%;
  min-height: 240px;
  max-height: 300px;
  overflow-y: auto;
  background: #0a0f1a;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.log-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  line-height: 1.5;
  padding: 6px 8px;
  border-radius: 4px;
}
/* 不同级别日志样式 */
.log-level-error {
  border-left: 3px solid #ef4444;
  background: rgba(239, 68, 68, 0.05);
}
.log-level-warn {
  border-left: 3px solid #f97316;
  background: rgba(249, 115, 22, 0.05);
}
.log-level-info {
  border-left: 3px solid #38bdf8;
  background: rgba(56, 189, 248, 0.05);
}
.log-level-success {
  border-left: 3px solid #22c55e;
  background: rgba(34, 197, 94, 0.05);
}
.log-level-icon {
  font-size: 14px;
  margin-top: 2px;
  flex-shrink: 0;
}
.log-time {
  color: #94a3b8;
  min-width: 110px;
  flex-shrink: 0;
}
.log-content {
  color: #f1f5f9;
  flex: 1;
  word-break: break-all;
}
.log-keyword-highlight {
  color: #f87171;
  font-weight: 700;
  background: rgba(248, 113, 113, 0.1);
  padding: 0 2px;
  border-radius: 2px;
}
.log-empty {
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
  padding: 20px 0;
}
</style>