<template>
  <div class="content">
    <div class="grid cols-4">
      <div class="kpi">
        <div class="n">23</div>
        <div class="t">候选漏洞（检测输出）</div>
        <div class="row">
          <span class="chip"><span class="dot warn"></span>高危 6</span>
          <span class="chip"><span class="dot good"></span>中危 11</span>
          <span class="chip"><span class="dot good"></span>低危 6</span>
        </div>
      </div>
      <div class="kpi">
        <div class="n">8</div>
        <div class="t">已可复现（验证就绪）</div>
        <div class="hintline">“交易语义理解及还原”已生成 evidence bundle。</div>
      </div>
      <div class="kpi">
        <div class="n">5</div>
        <div class="t">已确认可利用（待修复）</div>
        <div class="hintline">建议进入 Patch Studio：多方案补丁 + 兼容性评估。</div>
      </div>
      <div class="kpi">
        <div class="n">2.7h</div>
        <div class="t">MTTR（检测 → 可复现）</div>
        <div class="hintline">目标：<span class="mono">≤ 1h</span>（自动化 PoC 生成 + 回放加速）。</div>
      </div>
    </div>

    <div class="grid cols-2" style="margin-top:12px">
      <div class="card">
        <div class="hd">
          <div>
            <div class="h">闭环状态分布（Detected → Verified）</div>
            <div class="sub">核心看板：一眼看出哪里堵住了（检测/验证/修复）。</div>
          </div>
          <span class="pill">SLA 监控</span>
        </div>
        <div class="bd">
          <div class="row">
            <span class="chip"><span class="dot warn"></span>Detected 10</span>
            <span class="chip"><span class="dot warn"></span>Reproducible 8</span>
            <span class="chip"><span class="dot bad"></span>Confirmed 5</span>
            <span class="chip"><span class="dot warn"></span>Patching 3</span>
            <span class="chip"><span class="dot good"></span>Verified 4</span>
            <span class="chip"><span class="dot good"></span>Closed 12</span>
          </div>
          <p class="hintline" style="margin-top:10px">
            亮点：每个工单都绑定 <b>证据链</b>（trace + state diff + asset flow），并在修复阶段强制走 <b>回归门禁</b>。
          </p>
        </div>
      </div>

      <div class="card">
        <div class="hd">
          <div>
            <div class="h">近期事件流（自动化产出）</div>
            <div class="sub">扫描运行、PoC 生成、补丁候选、回归失败等都可追溯。</div>
          </div>
          <span class="pill">Timeline</span>
        </div>
        <div class="bd">
          <table class="table">
            <thead>
              <tr><th>时间</th><th>事件</th><th class="right">对象</th></tr>
            </thead>
            <tbody>
              <tr><td class="mono">16:02</td><td>PoC 生成完成（引导式fuzz + 约束修补）</td><td class="right mono">TCK-1042</td></tr>
              <tr><td class="mono">15:41</td><td>交易语义还原：Bundle（Tx1→Tx3）</td><td class="right mono">TCK-1039</td></tr>
              <tr><td class="mono">15:10</td><td>扫描完成：差分扫描（upgrade 前后）</td><td class="right mono">RUN-8891</td></tr>
              <tr><td class="mono">14:32</td><td>回归失败：变体攻击仍可绕过</td><td class="right mono">TCK-1037</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div style="margin-top:12px" class="card">
      <div class="hd">
        <div>
          <div class="h">快速入口</div>
          <div class="sub">从“检测-验证-修复”角度快速进入核心工作台。</div>
        </div>
        <span class="pill">MVP 建议：工单页优先</span>
      </div>
      <div class="bd btns">
        <button class="btn primary" @click="$router.push('/scan')">⚙ 进入检测 Scan Center</button>
        <button class="btn primary" @click="$router.push('/ops')">✦ 进入漏洞工单 Ops</button>
        <button class="btn primary">▣ 进入验证 Verification Lab</button>
        <button class="btn primary">⧉ 进入修复 Patch Studio</button>
        <button class="btn danger" @click="toast('已触发：紧急模式（Demo）')">⛔ 紧急模式（冻结发布）</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const toast = (msg) => {
  window.alert(msg)
}
</script>