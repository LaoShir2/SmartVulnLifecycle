<template>
  <div class="scan-content">
    <h3 class="section-title unified-panel">智能合约漏洞检测</h3>

    <!-- 上传合约文件 -->
    <div class="panel unified-panel upload-zone">
      <span class="chip">当前文件：{{ currentFileName }}</span>
      <label class="btn primary">
        上传合约文件
        <input type="file" accept=".sol" style="display: none;" @change="onFileChange" />
      </label>
    </div>

    <!-- 合约代码 -->
    <div class="panel unified-panel">
      <pre class="code-box mono">{{ codeText }}</pre>
    </div>

    <!-- Agent选择 -->
    <div class="panel unified-panel">
      <h4>选择检测Agent</h4>
      <div class="agent-list">
        <label v-for="agent in scanAgents" :key="agent.id" class="agent-card"
               :class="{ active: selectedAgents.includes(agent.id) }">
          <input type="checkbox" :value="agent.id" v-model="selectedAgents" />
          <div>
            <h4>{{ agent.name }} <span class="chip">{{ agent.tag }}</span></h4>
            <p>{{ agent.description }}</p>
          </div>
        </label>
      </div>
      <button class="btn primary" @click="startScan">开始扫描</button>
    </div>

    <!-- 扫描结果 -->
    <div v-if="shownResults.length" class="panel unified-panel">
      <h4>扫描结果</h4>
      <table class="table">
        <thead>
          <tr><th>ID</th><th>漏洞描述</th><th>等级</th><th>置信度</th></tr>
        </thead>
        <tbody>
          <tr v-for="item in shownResults" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.title }}</td>
            <td><span class="severity" :class="item.severity">{{ item.severity }}</span></td>
            <td>{{ item.confidence }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { scanAgents, defaultCode, scanResults } from '../data/mockData';

const currentFileName = ref('sample-vault.sol');
const codeText = ref(defaultCode);
const selectedAgents = ref(['static', 'symbolic']);
const shownResults = ref([]);

const onFileChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  currentFileName.value = file.name;
  const reader = new FileReader();
  reader.onload = (res) => codeText.value = res.target?.result;
  reader.readAsText(file);
};

const startScan = () => {
  shownResults.value = scanResults;
};
</script>

<style scoped>
.scan-content { width: 100%; display:flex; flex-direction:column; gap:16px; }

/* Panel统一风格 */
.panel.unified-panel {
  background: #334155;
  border-radius: 8px;
  border: 1px solid #475569;
  padding: 16px;
  box-sizing: border-box;
}

/* 标题 */
.section-title { margin:0; font-size:18px; font-weight:bold; color:#e2e8f0; }

/* 上传文件区域 */
.upload-zone { display:flex; gap:12px; align-items:center; }
.btn { padding:8px 12px; border-radius:6px; cursor:pointer; font-size:13px; }
.btn.primary { background:#38bdf8; color:#0f172a; border:none; font-weight:600; }

/* 代码框 */
.code-box { background:#0f172a; border-radius:6px; padding:16px; font-size:13px; line-height:1.6; color:#f1f5f9; overflow:auto; font-family:monospace; }

/* Agent列表 */
.agent-list { display:grid; gap:8px; margin:12px 0; }
.agent-card {
  display:flex; flex-direction:row; gap:8px; border-radius:8px; border:1px solid #1e293b; padding:8px; cursor:pointer;
  background: #1e293b;
}
.agent-card.active { border-color:#38bdf8; background: rgba(56,189,248,0.1); }
.agent-card h4 { margin:0; color:#cbd5e1; font-size:14px; }
.agent-card p { margin:2px 0 0 0; color:#94a3b8; font-size:12px; }
.chip { background: rgba(56,189,248,0.2); color:#38bdf8; padding:0 4px; border-radius:4px; font-size:11px; margin-left:4px; }

/* 扫描结果表格 */
.table { width:100%; border-collapse:collapse; margin-top:12px; }
.table th, .table td { padding:8px; border:1px solid #1e293b; font-size:13px; }
.severity.low { color:#10b981; font-weight:600; }
.severity.medium { color:#f59e0b; font-weight:600; }
.severity.high { color:#ef4444; font-weight:600; }
</style>