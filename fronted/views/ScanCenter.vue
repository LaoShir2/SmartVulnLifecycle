<template>
  <div class="content">
    <div class="grid cols-2">
      <div class="card">
        <div class="hd">
          <div>
            <div class="h">资产选择器（多链合约画像）</div>
            <div class="sub">按链 / 协议 / 合约族（Proxy/Impl/Library）筛选扫描范围。</div>
          </div>
          <span class="pill">Inventory</span>
        </div>
        <div class="bd">
          <div class="row">
            <span class="chip"><span class="dot good"></span>Chain: Ethereum</span>
            <span class="chip"><span class="dot warn"></span>Protocol: GameFi-X</span>
            <span class="chip"><span class="dot warn"></span>Proxy: UUPS</span>
            <span class="chip"><span class="dot good"></span>TVL: 12.4M</span>
          </div>
          <p class="hintline" style="margin-top:10px">
            技术特色：扫描策略会参考风险画像（权限/外部调用密集度/资产可转移性）动态分配“深度与预算”。
          </p>
          <div class="btns" style="margin-top:10px">
            <button class="btn">＋ 添加资产</button>
            <button class="btn">⟲ 同步链上信息</button>
            <button class="btn">⧉ 识别代理关系</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="hd">
          <div>
            <div class="h">扫描策略模板（智能体编排）</div>
            <div class="sub">静态/符号/模糊/差分多引擎组合，智能体自动分解并行任务。</div>
          </div>
          <span class="pill">Agentic Orchestration</span>
        </div>
        <div class="bd">
          <div class="row">
            <span class="chip">⚡ 快速静态扫描（规则+AST）</span>
            <span class="chip">🧭 深度路径探索（符号+引导fuzz）</span>
            <span class="chip">Δ 差分扫描（upgrade 前后）</span>
          </div>
          <div class="grid cols-2" style="margin-top:12px">
            <div class="kpi">
              <div class="n mono">60m</div>
              <div class="t">超时预算</div>
            </div>
            <div class="kpi">
              <div class="n mono">32</div>
              <div class="t">并发</div>
            </div>
            <div class="kpi">
              <div class="n mono">2,000</div>
              <div class="t">路径上限</div>
            </div>
            <div class="kpi">
              <div class="n mono">High</div>
              <div class="t">风险优先级</div>
            </div>
          </div>
          <div class="btns" style="margin-top:10px">
            <button class="btn primary" @click="toast('已启动扫描 RUN-8892（Demo）')">▶ 启动扫描</button>
            <button class="btn" @click="toast('已保存为模板：GameFi-X DeepScan（Demo）')">💾 保存为模板</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:12px">
      <div class="hd">
        <div>
          <div class="h">扫描结果（候选漏洞 → 一键转工单）</div>
          <div class="sub">输出“根因标签/置信度/影响猜测”，并支持去重合并到已有工单。</div>
        </div>
        <span class="pill">RUN-8892</span>
      </div>
      <div class="bd">
        <table class="table">
          <thead>
          <tr>
            <th>候选</th><th>类型</th><th>定位</th><th>置信度</th><th class="right">操作</th>
          </tr>
          </thead>
          <tbody>
            <tr>
              <td class="mono">FND-211</td>
              <td>重入 / 资金转移</td>
              <td class="mono">withdraw() → call.value()</td>
              <td><span class="chip"><span class="dot bad"></span>0.92</span></td>
              <td class="right"><button class="btn" @click="$router.push('/ops')">转工单</button></td>
            </tr>
            <tr>
              <td class="mono">FND-219</td>
              <td>授权滥用 / allowance</td>
              <td class="mono">approve() 不受限</td>
              <td><span class="chip"><span class="dot warn"></span>0.74</span></td>
              <td class="right"><button class="btn" @click="toast('已合并入 TCK-1039（Demo）')">合并</button></td>
            </tr>
            <tr>
              <td class="mono">FND-233</td>
              <td>价格操纵 / oracle</td>
              <td class="mono">getPrice() 缺少 sanity check</td>
              <td><span class="chip"><span class="dot warn"></span>0.68</span></td>
              <td class="right"><button class="btn" @click="toast('已创建新工单 TCK-1044（Demo）')">新建工单</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
const toast = (msg) => {
  window.alert(msg)
}
</script>