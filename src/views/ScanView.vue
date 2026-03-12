<template>
  <div class="scan-content">
    <h3>智能合约漏洞检测</h3>
    <!-- 检测的具体功能：上传合约 + Agent选择 + 扫描结果 -->
    <div class="upload-zone">
      <span class="chip">当前文件：{{ currentFileName }}</span>
      <label class="btn primary">
        上传合约文件<input type="file" accept=".sol" style="display: none;" @change="onFileChange" />
      </label>
    </div>
    <pre class="code-box mono">{{ codeText }}</pre>
    
    <h4>选择检测Agent</h4>
    <div class="agent-list">
      <label v-for="agent in scanAgents" :key="agent.id" class="agent-card"
             :class="{ active: selectedAgents.includes(agent.id) }">
        <input type="checkbox" :value="agent.id" v-model="selectedAgents" />
        <div>
          <h4>{{ agent.name }}<span class="chip">{{ agent.tag }}</span></h4>
          <p>{{ agent.description }}</p>
        </div>
      </label>
    </div>
    <button class="btn primary" @click="startScan">开始扫描</button>

    <h4 v-if="shownResults.length">扫描结果</h4>
    <table class="table" v-if="shownResults.length">
      <thead><tr><th>ID</th><th>漏洞描述</th><th>等级</th><th>置信度</th></tr></thead>
      <tbody><tr v-for="item in shownResults" :key="item.id">
        <td>{{ item.id }}</td><td>{{ item.title }}</td>
        <td><span class="severity" :class="item.severity">{{ item.severity }}</span></td>
        <td>{{ item.confidence }}</td>
      </tr></tbody>
    </table>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { scanAgents, defaultCode, scanResults } from '../data/mockData';

// 仅保留检测功能的状态和方法
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
const startScan = () => (shownResults.value = scanResults);
</script>

<style scoped>
/* 仅保留检测内容的样式，去掉布局样式 */
.scan-content { width: 100%; }
.upload-zone { margin: 16px 0; display: flex; gap: 12px; align-items: center; }
.btn { padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.btn.primary { background: #7dd3fc; color: #000; border: none; }
.code-box {
  height: 200px;
  overflow: auto;
  background: #0a0f1a;
  padding: 12px;
  border-radius: 8px;
  margin: 12px 0;
}
.agent-list { display: grid; gap: 8px; margin: 12px 0; }
.agent-card {
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
}
.agent-card.active { border-color: #7dd3fc; background: rgba(125,211,252,0.1); }
.table { width: 100%; border-collapse: collapse; margin: 12px 0; }
.table th, .table td { padding: 8px; border: 1px solid #1e293b; }
</style>