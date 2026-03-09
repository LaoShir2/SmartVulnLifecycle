<template>
  <section>
    <div class="scan-main">
      <article class="card">
        <header class="card-hd">
          <h3 class="card-title">上传合约并展示代码</h3>
          <p class="card-sub">支持上传 `.sol` 文件，并在代码区域直接预览。</p>
        </header>

        <div class="card-bd">
          <div class="upload-zone">
            <div class="row" style="justify-content: space-between; align-items: center;">
              <span class="chip">当前文件：{{ currentFileName }}</span>
              <label class="btn primary">
                上传合约文件
                <!-- 文件输入框隐藏在按钮内部，点击按钮即可触发上传 -->
                <input type="file" accept=".sol,.txt" style="display: none;" @change="onFileChange" />
              </label>
            </div>
            <p class="card-sub" style="margin-top: 8px;">
              上传后会自动把文件内容读入左侧代码窗，若未上传则显示默认示例合约。
            </p>
          </div>

          <!-- 代码区域使用等宽字体，便于读合约与定位行逻辑 -->
          <pre class="code-box mono">{{ codeText }}</pre>
        </div>
      </article>

      <article class="card">
        <header class="card-hd">
          <h3 class="card-title">多 Agent 自定义选择</h3>
          <p class="card-sub">可按审计目标勾选 Agent，控制扫描深度和耗时。</p>
        </header>

        <div class="card-bd">
          <div class="row" style="margin-bottom: 12px;">
            <label class="chip">
              扫描模板
              <select v-model="selectedTemplate" style="border: 0; background: transparent; outline: 0; margin-left: 6px;">
                <option v-for="item in scanTemplates" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
            <span class="chip"><i class="dot warn pulse" /> 预计耗时：{{ estimatedTime }}</span>
          </div>

          <div class="agent-list">
            <!-- 点击整行可以切换勾选状态，提升操作效率 -->
            <label
              v-for="agent in scanAgents"
              :key="agent.id"
              class="agent-card"
              :class="{ active: selectedAgents.includes(agent.id) }"
            >
              <input
                type="checkbox"
                :value="agent.id"
                v-model="selectedAgents"
                style="margin-right: 8px;"
              />
              <div style="display: inline-block; width: calc(100% - 30px); vertical-align: top;">
                <h4 class="agent-title">
                  <span>{{ agent.name }}</span>
                  <span class="chip">{{ agent.tag }}</span>
                </h4>
                <p class="agent-desc">{{ agent.description }}</p>
              </div>
            </label>
          </div>

          <div class="row" style="margin-top: 12px;">
            <button class="btn primary" @click="startScan">开始扫描</button>
            <button class="btn ghost" @click="resetScan">重置配置</button>
          </div>
        </div>
      </article>
    </div>

    <article class="card scan-bottom">
      <header class="card-hd">
        <h3 class="card-title">扫描结果与一键跳转</h3>
        <p class="card-sub">扫描结果按严重级别展示，支持直接跳转到漏洞工单页面继续处理。</p>
      </header>

      <div class="card-bd">
        <div class="row" style="margin-bottom: 10px;">
          <span class="chip">任务状态：{{ scanStatus }}</span>
          <span class="chip">已选 Agent：{{ selectedAgents.length }}</span>
          <span class="chip">模板：{{ selectedTemplate }}</span>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>漏洞描述</th>
              <th>等级</th>
              <th>置信度</th>
              <th class="right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in shownResults" :key="item.id">
              <td class="mono">{{ item.id }}</td>
              <td>{{ item.title }}</td>
              <td>
                <span class="severity" :class="item.severity">{{ item.severity }}</span>
              </td>
              <td class="mono">{{ item.confidence }}</td>
              <td class="right">
                <!-- 一键跳转：满足你文档里“点击后跳转”的要求 -->
                <button class="btn primary" @click="router.push(item.nextRoute)">创建/查看工单</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { defaultCode, scanAgents, scanResults, scanTemplates } from '../data/mockData';

const router = useRouter();

// 扫描页核心状态：文件名、代码内容、模板选择、Agent 勾选、任务状态。
const currentFileName = ref('sample-vault.sol');
const codeText = ref(defaultCode);
const selectedTemplate = ref(scanTemplates[1]);
const selectedAgents = ref(['static', 'symbolic', 'formal']);
const scanStatus = ref('待开始');
const shownResults = ref([]);

const estimatedTime = computed(() => {
  if (selectedTemplate.value.includes('快速')) return '约 10 分钟';
  if (selectedTemplate.value.includes('深度')) return '约 60 分钟';
  return '约 30 分钟';
});

const onFileChange = (event) => {
  const [file] = event.target.files ?? [];
  if (!file) return;

  currentFileName.value = file.name;

  // 使用 FileReader 在前端读取本地文件，不需要任何后端依赖。
  const reader = new FileReader();
  reader.onload = () => {
    codeText.value = String(reader.result ?? '');
  };
  reader.readAsText(file, 'utf-8');
};

const startScan = () => {
  scanStatus.value = '扫描完成（Demo）';

  // 这里先用本地模拟结果展示，你接后端时只要替换成接口返回值即可。
  shownResults.value = scanResults;
};

const resetScan = () => {
  currentFileName.value = 'sample-vault.sol';
  codeText.value = defaultCode;
  selectedTemplate.value = scanTemplates[1];
  selectedAgents.value = ['static', 'symbolic', 'formal'];
  scanStatus.value = '待开始';
  shownResults.value = [];
};
</script>
