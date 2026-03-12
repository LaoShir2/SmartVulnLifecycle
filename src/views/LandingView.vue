<template>
  <section class="landing">
    <!-- 第一步：上传区域 -->
    <div v-if="!uploaded" class="upload-container">
      <h1 class="title">智能合约漏洞全生命周期管理</h1>
      <p class="sub-title">上传合约代码，一键完成检测、验证、修复</p>
      <label class="upload-btn">
        <span>📁 点击上传 Solidity 合约文件</span>
        <input type="file" accept=".sol" style="display: none;" @change="onFileChange" />
      </label>
    </div>

    <!-- 第二步：上传成功过场动画 -->
    <div v-if="showAnimation" class="animation-container">
      <div class="loader"></div>
      <p>合约上传成功，正在初始化环境...</p>
    </div>

    <!-- 第三步：代码展示+Agent选择 -->
    <div v-if="uploaded && !showAnimation" class="scan-setting">
      <h1 class="title">合约检测配置</h1>
      <div class="layout">
        <!-- 左侧：代码展示 -->
        <div class="code-area">
          <h3>合约代码</h3>
          <pre class="code-box mono">{{ codeText }}</pre>
        </div>
        <!-- 右侧：Agent选择 -->
        <div class="agent-area">
          <h3>选择检测Agent</h3>
          <div class="agent-list">
            <label v-for="agent in scanAgents" :key="agent.id" class="agent-card" :class="{ active: selectedAgents.includes(agent.id) }">
              <input type="checkbox" :value="agent.id" v-model="selectedAgents" />
              <div>
                <h4>{{ agent.name }}<span class="chip">{{ agent.tag }}</span></h4>
                <p>{{ agent.description }}</p>
              </div>
            </label>
          </div>
          <button class="start-btn" @click="startToScan">开始检测 →</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { scanAgents, defaultCode } from '../data/mockData';
const router = useRouter();

// 状态
const uploaded = ref(false);
const showAnimation = ref(false);
const codeText = ref(defaultCode);
const selectedAgents = ref(['static', 'symbolic']);

// 上传文件
const onFileChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (res) => {
    codeText.value = res.target?.result;
    uploaded.value = true;
    // 显示过场动画1.5秒
    showAnimation.value = true;
    setTimeout(() => showAnimation.value = false, 1500);
  };
  reader.readAsText(file);
};

// LandingView.vue 中 startToScan 方法修改
const startToScan = () => {
  router.push('/vuln/scan'); // 跳转到公共布局的检测页面
};
</script>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0d1117;
  color: #e6edf3;
  padding: 20px;
}
.upload-container, .scan-setting {
  width: 100%;
  max-width: 1200px;
  text-align: center;
}
.title {
  font-size: 32px;
  margin-bottom: 12px;
}
.sub-title {
  color: #94a3b8;
  margin-bottom: 40px;
}
.upload-btn {
  display: inline-block;
  padding: 16px 40px;
  background: linear-gradient(90deg, rgba(125,211,252,0.2), rgba(217,70,239,0.2));
  border: 1px solid #7dd3fc;
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
}
/* 过场动画 */
.animation-container {
  text-align: center;
}
.loader {
  width: 50px;
  height: 50px;
  border: 4px solid #1e293b;
  border-top: 4px solid #7dd3fc;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
  margin: 0 auto 20px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
/* 布局 */
.layout {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 20px;
  margin-top: 20px;
}
.code-area, .agent-area {
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 16px;
  text-align: left;
}
.code-box {
  height: 400px;
  overflow: auto;
  background: #0a0f1a;
  padding: 12px;
  border-radius: 8px;
}
.agent-list {
  display: grid;
  gap: 8px;
  margin: 12px 0;
}
.agent-card {
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  text-align: left;
}
.agent-card.active {
  border-color: #7dd3fc;
  background: rgba(125,211,252,0.1);
}
.start-btn {
  width: 100%;
  padding: 12px;
  background: #7dd3fc;
  color: #0d1117;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
}
</style>