<template>
  <!-- 完全对齐TicketsView的左右分栏布局 -->
  <section class="ticket-layout">
    <!-- 左侧：可收起的待修复工单列表 -->
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
            <h3 class="card-title">待修复工单列表</h3>
            <button class="toggle-btn" @click="toggleSidebar" title="收起工单列表">
              <span class="toggle-icon">‹</span>
            </button>
          </div>
          <p class="card-sub">仅展示待修复阶段的漏洞工单，按严重等级排序。</p>
        </header>
        <div class="card-bd" style="display: grid; gap: 8px;">
          <div
            v-for="item in patchTickets"
            :key="item.id"
            class="ticket-item"
            :class="{ active: item.id === activeTicketId }"
            @click="switchTicket(item.id)"
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
          </div>
        </div>
      </template>
    </aside>
    <!-- 右侧：修复工作台主内容区（原有核心功能完整保留） -->
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
              <button class="btn primary" @click="generatePatch">推荐补丁模板</button>
              <button class="btn ghost" @click="semanticMigrate">语义迁移</button>
            </div>
          </div>
        </div>
      </div>
      <!-- 分区选择栏 -->
      <div class="section-tabs">
        <button
          v-for="section in sectionDefs"
          :key="section.key"
          class="section-tab"
          :class="{ active: activeSection === section.key }"
          @click="activeSection = section.key"
        >
          {{ section.label }}
        </button>
      </div>
      <!-- 待修复代码情况 -->
      <section v-if="activeSection === 'code'">
        <article class="card">
          <header class="card-hd">
            <h3 class="card-title">待修复代码情况</h3>
            <p class="card-sub">漏洞合约的原始代码、根因与修复约束</p>
          </header>
          <div class="card-bd">
            <div class="row" style="margin-bottom: 12px;">
              <span class="chip">合约: {{ activeTicket.contract }}</span>
              <span class="chip">链: {{ activeTicket.chain }}</span>
              <span class="chip">漏洞类型: {{ activeTicket.type }}</span>
            </div>
            <div style="margin-bottom: 16px;">
              <h4 class="card-title" style="margin-bottom: 8px;">升级难度</h4>
              <p style="margin: 0; color: #cbd5e1;">{{ activeTicket.upgradeDifficulty }}</p>
            </div>
            <div style="margin-bottom: 16px;">
              <h4 class="card-title" style="margin-bottom: 8px;">根因约束（必须满足）</h4>
              <div class="row" style="flex-wrap: wrap; gap: 8px;">
                <span v-for="item in activeTicket.rootConstraints" :key="item" class="chip">{{ item }}</span>
              </div>
            </div>
            <div style="margin-bottom: 16px;">
              <h4 class="card-title" style="margin-bottom: 8px;">修复约束（必须满足）</h4>
              <ul class="list-plain" style="margin-top: 0;">
                <li v-for="item in activeTicket.constraints" :key="item">{{ item }}</li>
              </ul>
            </div>
            <div>
              <h4 class="card-title" style="margin-bottom: 8px;">漏洞原始代码</h4>
              <pre class="code-box mono" style="margin: 0; max-height: 320px;"><code v-html="highlightedCodeSnippet"></code></pre>
            </div>
          </div>
        </article>
      </section>
      <!-- 补丁候选列表 -->
      <section v-if="activeSection === 'patches'">
        <article class="card">
          <header class="card-hd">
            <h3 class="card-title">补丁候选列表</h3>
            <p class="card-sub">多方案可选补丁，附带diff与影响评估</p>
          </header>
          <div class="card-bd">
            <div class="row" style="margin-bottom: 12px; flex-wrap: wrap;">
              <button
                v-for="patch in activeTicket.patchCandidates"
                :key="patch.key"
                class="btn"
                :class="{ primary: selectedPatchKey === patch.key, ghost: selectedPatchKey !== patch.key }"
                @click="selectedPatchKey = patch.key"
              >
                方案{{ patch.key }}: {{ patch.title }}
              </button>
            </div>
            <pre class="code-box mono" style="margin: 0; max-height: 280px;">{{ selectedPatch.diff }}</pre>
            <div style="margin-top: 16px;">
              <h4 class="card-title" style="margin-bottom: 8px;">影响评估（Gas / 兼容性 / 风险）</h4>
              <table class="table">
                <tbody>
                  <tr>
                    <th style="width: 140px;">Gas 增量</th>
                    <td class="right">
                      <span class="chip" :class="getImpactClass('gas', selectedPatch.impact.gas)">
                        {{ selectedPatch.impact.gas }}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>接口兼容性</th>
                    <td class="right">
                      <span class="chip" :class="getImpactClass('compat', selectedPatch.impact.compat)">
                        {{ selectedPatch.impact.compat }}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>升级兼容性</th>
                    <td class="right">
                      <span class="chip" :class="getImpactClass('upgrade', selectedPatch.impact.upgrade)">
                        {{ selectedPatch.impact.upgrade }}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>引入风险</th>
                    <td class="right">
                      <span class="chip" :class="getImpactClass('risk', selectedPatch.impact.risk)">
                        {{ selectedPatch.impact.risk }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="row" style="margin-top: 12px;">
              <button class="btn primary" @click="selectPatch">选择当前方案</button>
              <button class="btn ghost" @click="exportPatch">导出补丁</button>
            </div>
          </div>
        </article>
      </section>
      <!-- PoC回归验证 -->
      <section v-if="activeSection === 'verify'">
        <article class="card">
          <header class="card-hd">
            <h3 class="card-title">PoC回归验证</h3>
            <p class="card-sub">基于原始漏洞PoC，验证补丁修复效果与业务兼容性</p>
          </header>
          <div class="card-bd">
            <div class="row" style="margin-bottom: 12px;">
              <span class="chip">PoC: testExploit()</span>
              <span class="chip">Fork: 19,233,001</span>
              <span class="chip">Ticket: {{ activeTicket.id }}</span>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>检查项</th>
                  <th class="right">验证结果</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in verifyList" :key="item.key">
                  <td>{{ item.name }}</td>
                  <td class="right">
                    <span class="chip">
                      <i :class="getStatusClass(item.status)" class="dot" />
                      {{ item.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div style="margin-top: 16px;">
              <p class="card-sub" style="margin-bottom: 8px;">
                说明：Blocked 表示PoC在应用补丁后无法成功触发漏洞，是修复有效的核心指标；
                业务语义校验确保补丁不影响原有正常业务逻辑。
              </p>
              <div class="row">
                <button class="btn primary" @click="runVerify">使用PoC验证</button>
                <button class="btn ghost" @click="exportVerifyReport">导出验证报告</button>
                <button class="btn danger" @click="markFailed">标记不通过</button>
              </div>
            </div>
          </div>
        </article>
      </section>
      <!-- PoC验证日志对比（优化后） -->
      <section v-if="activeSection === 'logs'">
        <article class="card">
          <header class="card-hd">
            <h3 class="card-title">PoC验证日志对比</h3>
            <p class="card-sub">补丁修复前后的PoC执行日志对比，直观展示修复效果</p>
            <!-- 新增：日志筛选栏 -->
            <div class="log-filter-row" style="margin-top: 12px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
              <!-- 日志视图切换 -->
              <button
                class="btn"
                :class="{ primary: showLogType === 'before', ghost: showLogType !== 'before' }"
                @click="showLogType = 'before'"
              >
                修复前日志
              </button>
              <button
                class="btn"
                :class="{ primary: showLogType === 'after', ghost: showLogType !== 'after' }"
                @click="showLogType = 'after'"
              >
                修复后日志
              </button>
              <button
                class="btn"
                :class="{ primary: showLogType === 'diff', ghost: showLogType !== 'diff' }"
                @click="showLogType = 'diff'"
              >
                对比视图
              </button>
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
            <!-- 修复前日志（结构化+高亮） -->
            <div v-if="showLogType === 'before'" class="log-container" ref="beforeLogContainer">
              <div
                v-for="(logItem, index) in filteredBeforeLogs"
                :key="index"
                class="log-item"
                :class="`log-level-${logItem.level.toLowerCase()}`"
              >
                <span class="log-level-icon">
                  <i v-if="logItem.level === 'ERROR'">❌</i>
                  <i v-if="logItem.level === 'WARN'">⚠️</i>
                  <i v-if="logItem.level === 'INFO'">ℹ️</i>
                  <i v-if="logItem.level === 'SUCCESS'">✅</i>
                </span>
                <span class="log-time mono">{{ logItem.time }}</span>
                <span class="log-content" v-html="highlightLogKeyword(logItem.content)"></span>
              </div>
              <div v-if="filteredBeforeLogs.length === 0" class="log-empty">
                暂无匹配日志
              </div>
            </div>

            <!-- 修复后日志（结构化+高亮） -->
            <div v-if="showLogType === 'after'" class="log-container" ref="afterLogContainer">
              <div
                v-for="(logItem, index) in filteredAfterLogs"
                :key="index"
                class="log-item"
                :class="`log-level-${logItem.level.toLowerCase()}`"
              >
                <span class="log-level-icon">
                  <i v-if="logItem.level === 'ERROR'">❌</i>
                  <i v-if="logItem.level === 'WARN'">⚠️</i>
                  <i v-if="logItem.level === 'INFO'">ℹ️</i>
                  <i v-if="logItem.level === 'SUCCESS'">✅</i>
                </span>
                <span class="log-time mono">{{ logItem.time }}</span>
                <span class="log-content" v-html="highlightLogKeyword(logItem.content)"></span>
              </div>
              <div v-if="filteredAfterLogs.length === 0" class="log-empty">
                暂无匹配日志
              </div>
            </div>

            <!-- 对比视图（双栏结构化日志） -->
            <div v-if="showLogType === 'diff'" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <div class="chip" style="margin-bottom: 8px; display: inline-block;">修复前</div>
                <div class="log-container" style="min-height: 250px; max-height: 250px; font-size: 11px;">
                  <div
                    v-for="(logItem, index) in filteredBeforeLogs"
                    :key="index"
                    class="log-item"
                    :class="`log-level-${logItem.level.toLowerCase()}`"
                  >
                    <span class="log-level-icon">
                      <i v-if="logItem.level === 'ERROR'">❌</i>
                      <i v-if="logItem.level === 'WARN'">⚠️</i>
                      <i v-if="logItem.level === 'INFO'">ℹ️</i>
                      <i v-if="logItem.level === 'SUCCESS'">✅</i>
                    </span>
                    <span class="log-time mono">{{ logItem.time }}</span>
                    <span class="log-content" v-html="highlightLogKeyword(logItem.content)"></span>
                  </div>
                  <div v-if="filteredBeforeLogs.length === 0" class="log-empty">
                    暂无匹配日志
                  </div>
                </div>
              </div>
              <div>
                <div class="chip" style="margin-bottom: 8px; display: inline-block;">修复后</div>
                <div class="log-container" style="min-height: 250px; max-height: 250px; font-size: 11px;">
                  <div
                    v-for="(logItem, index) in filteredAfterLogs"
                    :key="index"
                    class="log-item"
                    :class="`log-level-${logItem.level.toLowerCase()}`"
                  >
                    <span class="log-level-icon">
                      <i v-if="logItem.level === 'ERROR'">❌</i>
                      <i v-if="logItem.level === 'WARN'">⚠️</i>
                      <i v-if="logItem.level === 'INFO'">ℹ️</i>
                      <i v-if="logItem.level === 'SUCCESS'">✅</i>
                    </span>
                    <span class="log-time mono">{{ logItem.time }}</span>
                    <span class="log-content" v-html="highlightLogKeyword(logItem.content)"></span>
                  </div>
                  <div v-if="filteredAfterLogs.length === 0" class="log-empty">
                    暂无匹配日志
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  </section>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { tickets, patchVerifyItems, beforeFixLogs, afterFixLogs } from '../data/mockData';

const sectionDefs = [
  { key: 'code', label: '待修复代码情况' },
  { key: 'patches', label: '补丁候选列表' },
  { key: 'verify', label: 'PoC回归验证' },
  { key: 'logs', label: 'PoC验证日志对比' }
];

// 核心状态
const activeTicketId = ref(tickets[1]?.id ?? 'TCK-1043');
const selectedPatchKey = ref('A');
const showLogType = ref('before');
const verifyList = ref(JSON.parse(JSON.stringify(patchVerifyItems)));
const isSidebarCollapsed = ref(false);
const activeSection = ref('code');

// 新增：日志相关状态（结构化存储+筛选）
const rawBeforeLogs = ref(parseLogString(beforeFixLogs));
const rawAfterLogs = ref(parseLogString(afterFixLogs));
const selectedLogLevel = ref('all');
const logSearchKey = ref('');
const beforeLogContainer = ref(null);
const afterLogContainer = ref(null);

// 解析原始日志字符串为结构化数据
function parseLogString(logStr) {
  const lines = logStr.split('\n').filter(line => line.trim());
  return lines.map(line => {
    // 提取时间和内容
    const timeMatch = line.match(/\[(\d{2}:\d{2}:\d{2})\]/);
    const time = timeMatch ? timeMatch[1] : '';
    const content = line.replace(/\[\d{2}:\d{2}:\d{2}\]/, '').trim();
    
    // 判断日志级别
    let level = 'INFO';
    if (content.includes('❌') || content.includes('失败') || content.includes('回滚')) {
      level = 'ERROR';
    } else if (content.includes('⚠️') || content.includes('警告') || content.includes('风险')) {
      level = 'WARN';
    } else if (content.includes('✅') || content.includes('成功') || content.includes('修复')) {
      level = 'SUCCESS';
    }
    
    return { time, level, content };
  });
}

// 计算属性：过滤后的修复前日志
const filteredBeforeLogs = computed(() => {
  return rawBeforeLogs.value.filter(logItem => {
    const levelMatch = selectedLogLevel.value === 'all' 
      ? true 
      : logItem.level === selectedLogLevel.value;
    const keywordMatch = logSearchKey.value.trim() === ''
      ? true
      : logItem.content.toLowerCase().includes(logSearchKey.value.toLowerCase());
    return levelMatch && keywordMatch;
  });
});

// 计算属性：过滤后的修复后日志
const filteredAfterLogs = computed(() => {
  return rawAfterLogs.value.filter(logItem => {
    const levelMatch = selectedLogLevel.value === 'all' 
      ? true 
      : logItem.level === selectedLogLevel.value;
    const keywordMatch = logSearchKey.value.trim() === ''
      ? true
      : logItem.content.toLowerCase().includes(logSearchKey.value.toLowerCase());
    return levelMatch && keywordMatch;
  });
});

// 切换侧边栏收起/展开
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

// 计算属性：过滤待修复工单（仅展示待修复阶段）
const patchTickets = computed(() => {
  return tickets.filter(item => item.stage === '待修复');
});

// 当前选中的工单
const activeTicket = computed(() => {
  return tickets.find(item => item.id === activeTicketId.value) ?? tickets[1];
});

// 当前选中的补丁
const selectedPatch = computed(() => {
  return activeTicket.value.patchCandidates.find(item => item.key === selectedPatchKey.value) ?? activeTicket.value.patchCandidates[0];
});

// 工单切换方法（和TicketsView完全一致的交互逻辑）
const switchTicket = (ticketId) => {
  activeTicketId.value = ticketId;
  selectedPatchKey.value = activeTicket.value.patchCandidates[0]?.key ?? 'A';
  verifyList.value = JSON.parse(JSON.stringify(patchVerifyItems));
  showLogType.value = 'before';
  activeSection.value = 'code';
  // 重置日志
  resetLogs();
};

// 代码高亮逻辑
const highlightedCodeSnippet = computed(() => {
  const escapeHtml = (str) => {
    return str
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  };
  const escaped = escapeHtml(activeTicket.value.codeSnippet);
  return escaped
    .split('\n')
    .map(line => {
      if (!line.includes('//')) return line;
      const index = line.indexOf('//');
      const left = line.slice(0, index);
      const right = line.slice(index);
      if (right.includes('✗') || right.includes('错误')) {
        return `${left}<span style="color: #f87171; font-weight: 700;">${right}</span>`;
      }
      return `${left}<span style="color: #94a3b8;">${right}</span>`;
    })
    .join('\n');
});

// 工具方法
const getImpactClass = (type, value) => {
  const map = {
    gas: (val) => {
      const num = Number(val.replace('%', '').replace('+', ''));
      if (num <= 1.5) return 'good';
      if (num <= 4) return 'warn';
      return 'bad';
    },
    compat: (val) => val.includes('不变') ? 'good' : val.includes('小改动') ? 'warn' : 'bad',
    upgrade: (val) => val.includes('兼容') ? 'good' : 'bad',
    risk: (val) => val.toLowerCase() === 'low' ? 'good' : val.toLowerCase() === 'med' ? 'warn' : 'bad'
  };
  return map[type](value);
};

const getStatusClass = (status) => {
  if (status === 'PASS') return 'good';
  if (status === 'FAIL') return 'bad';
  if (status === 'Pending') return 'warn';
  return 'warn';
};

// 新增：日志相关方法
const filterLogs = () => {
  // 筛选逻辑通过computed自动触发
};

const highlightLogKeyword = (content) => {
  if (!logSearchKey.value.trim()) return content;
  const reg = new RegExp(`(${logSearchKey.value})`, 'gi');
  return content.replace(reg, '<span class="log-keyword-highlight">$1</span>');
};

const clearLogs = () => {
  rawBeforeLogs.value = parseLogString(beforeFixLogs);
  rawAfterLogs.value = parseLogString(afterFixLogs);
};

const resetLogs = () => {
  rawBeforeLogs.value = parseLogString(beforeFixLogs);
  rawAfterLogs.value = parseLogString(afterFixLogs);
  selectedLogLevel.value = 'all';
  logSearchKey.value = '';
};

// 新增：添加实时日志（验证时使用）
const addRealtimeLog = (isBefore, level, content) => {
  const ts = new Date().toLocaleTimeString().slice(0, 8);
  const logItem = { time: ts, level, content };
  if (isBefore) {
    rawBeforeLogs.value.push(logItem);
    nextTick(() => {
      if (beforeLogContainer.value) {
        beforeLogContainer.value.scrollTop = beforeLogContainer.value.scrollHeight;
      }
    });
  } else {
    rawAfterLogs.value.push(logItem);
    nextTick(() => {
      if (afterLogContainer.value) {
        afterLogContainer.value.scrollTop = afterLogContainer.value.scrollHeight;
      }
    });
  }
};

// 业务方法
const selectPatch = () => {
  const ts = new Date().toLocaleTimeString();
  addRealtimeLog(false, 'INFO', `已选择补丁方案${selectedPatchKey.value}`);
};

const exportPatch = () => {
  const ts = new Date().toLocaleTimeString();
  addRealtimeLog(false, 'SUCCESS', `补丁方案${selectedPatchKey.value}已导出`);
};

const generatePatch = () => {
  const ts = new Date().toLocaleTimeString();
  addRealtimeLog(false, 'SUCCESS', '已生成推荐补丁模板');
};

const semanticMigrate = () => {
  const ts = new Date().toLocaleTimeString();
  addRealtimeLog(false, 'SUCCESS', '语义迁移校验完成，补丁与业务逻辑兼容');
};

const runVerify = () => {
  verifyList.value.forEach(item => item.status = 'Pending');
  const ts = new Date().toLocaleTimeString();
  
  // 修复前日志添加验证记录
  addRealtimeLog(true, 'INFO', '开始执行修复前PoC验证');
  setTimeout(() => {
    addRealtimeLog(true, 'WARN', '漏洞触发成功，PoC执行通过');
    setTimeout(() => {
      // 修复后日志添加验证记录
      addRealtimeLog(false, 'INFO', '开始执行修复后PoC验证');
      setTimeout(() => {
        verifyList.value[0].status = 'PASS';
        setTimeout(() => {
          verifyList.value[1].status = 'PASS';
          setTimeout(() => {
            verifyList.value[2].status = 'PASS';
            setTimeout(() => {
              verifyList.value[3].status = 'WARN';
              addRealtimeLog(false, 'SUCCESS', '漏洞已修复，PoC执行失败（符合预期）');
              showLogType.value = 'after';
            }, 400);
          }, 300);
        }, 300);
      }, 300);
    }, 300);
  }, 300);
};

const exportVerifyReport = () => {
  const ts = new Date().toLocaleTimeString();
  addRealtimeLog(false, 'SUCCESS', '验证报告已导出，包含补丁、验证日志、结果快照');
};

const markFailed = () => {
  verifyList.value.forEach(item => item.status = 'FAIL');
  addRealtimeLog(false, 'ERROR', '验证不通过，漏洞未完全修复');
  showLogType.value = 'diff';
};

// 监听日志变化，自动滚动到底部
watch(rawBeforeLogs, () => {
  nextTick(() => {
    if (beforeLogContainer.value && showLogType === 'before') {
      beforeLogContainer.value.scrollTop = beforeLogContainer.value.scrollHeight;
    }
  });
}, { deep: true });

watch(rawAfterLogs, () => {
  nextTick(() => {
    if (afterLogContainer.value && showLogType === 'after') {
      afterLogContainer.value.scrollTop = afterLogContainer.value.scrollHeight;
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

/* 分区标签样式 */
.section-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}
.section-tab {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #1e293b;
  background: #0f172a;
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.section-tab.active {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
}
.section-tab:hover {
  border-color: #334155;
  background: #131c31;
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
  min-height: 280px;
  max-height: 280px;
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
  min-width: 80px;
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