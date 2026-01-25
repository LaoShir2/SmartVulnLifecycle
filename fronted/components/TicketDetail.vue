<template>
  <div class="card">
    <div class="hd">
      <div>
        <div class="h">{{ ticket.title || '—' }}</div>
        <div class="sub">{{ ticket.sub || '—' }}</div>
      </div>
      <div class="btns">
        <button class="btn primary" @click="toast('已启动验证：回放 + PoC 生成（Demo）')">▣ 启动验证</button>
        <button class="btn primary" @click="toast('已生成补丁候选 A/B/C（Demo）')">⧉ 进入修复</button>
        <button class="btn" @click="toast('已生成对外报告（Demo）')">⤓ 导出报告</button>
      </div>
    </div>
    <div class="bd">
      <div class="row" style="justify-content:space-between; align-items:flex-start">
        <div class="stepper">
          <div class="step on">Detected</div>
          <div class="step on">Reproducible</div>
          <div class="step on">Confirmed</div>
          <div class="step">Patching</div>
          <div class="step">Verified</div>
          <div class="step">Closed</div>
        </div>
        <div class="row" style="justify-content:flex-end">
          <span class="chip">{{ ticket.chain || '—' }}</span>
          <span class="chip">{{ ticket.contract || '—' }}</span>
          <span class="chip">{{ ticket.type || '—' }}</span>
          <span class="chip">{{ ticket.conf || '—' }}</span>
        </div>
      </div>

      <div class="tabs" style="margin-top:12px">
        <div 
          class="tab" 
          :class="{ active: activeTab === 'overview' }"
          @click="activeTab = 'overview'"
        >概览</div>
        <div 
          class="tab" 
          :class="{ active: activeTab === 'findings' }"
          @click="activeTab = 'findings'"
        >检测 Findings</div>
        <div 
          class="tab" 
          :class="{ active: activeTab === 'verification' }"
          @click="activeTab = 'verification'"
        >验证（交易语义理解/PoC回放）</div>
        <div 
          class="tab" 
          :class="{ active: activeTab === 'patch' }"
          @click="activeTab = 'patch'"
        >修复（漏洞修复智能体）</div>
        <div 
          class="tab" 
          :class="{ active: activeTab === 'regression' }"
          @click="activeTab = 'regression'"
        >回归门禁</div>
        <div 
          class="tab" 
          :class="{ active: activeTab === 'timeline' }"
          @click="activeTab = 'timeline'"
        >记录与协作</div>
      </div>

      <div style="margin-top:12px">
        <!-- 概览面板 -->
        <div class="panel" :class="{ active: activeTab === 'overview' }">
          <div class="grid cols-2">
            <div class="card" style="box-shadow:none">
              <div class="hd">
                <div>
                  <div class="h">一句话结论</div>
                  <div class="sub">系统自动生成，用于快速决策与转交。</div>
                </div>
                <span class="pill">Summary</span>
              </div>
              <div class="bd">
                <p style="margin:0; line-height:1.65; color:#e9edff">
                  {{ ticket.summary || '合约 withdraw() 函数存在重入漏洞，攻击者可通过构造恶意合约在资金转移前调用 fallback 函数重复提取资产，置信度 0.92，已生成可复现 PoC，涉及资产约 12.4M USDC。' }}
                </p>
                <div class="row" style="margin-top:10px">
                  <span class="chip"><span class="dot bad"></span>可转移资产风险</span>
                  <span class="chip"><span class="dot warn"></span>需要多交易序列</span>
                  <span class="chip"><span class="dot good"></span>可Fork复现</span>
                </div>
              </div>
            </div>

            <div class="card" style="box-shadow:none">
              <div class="hd">
                <div>
                  <div class="h">根因要点（约束）</div>
                  <div class="sub">进入修复时，作为 Patch Agent 的 Guardrails。</div>
                </div>
                <span class="pill">Constraints</span>
              </div>
              <div class="bd">
                <ul style="margin:0; padding-left:18px; color:var(--muted); line-height:1.7">
                  <li>资金转移（call.value()）发生在状态更新前</li>
                  <li>未使用 ReentrancyGuard 修饰器</li>
                  <li>无交易次数/金额的单次限制</li>
                  <li>外部合约调用未做权限校验</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- 检测 Findings 面板 -->
        <div class="panel" :class="{ active: activeTab === 'findings' }">
          <div class="grid cols-2">
            <div class="card" style="box-shadow:none">
              <div class="hd">
                <div>
                  <div class="h">定位与归因</div>
                  <div class="sub">多引擎输出融合：函数级/行级/调用链摘要。</div>
                </div>
                <span class="pill">Attribution</span>
              </div>
              <div class="bd">
                <div class="row">
                  <span class="chip">函数：withdraw()</span>
                  <span class="chip">行号：L42-L58</span>
                  <span class="chip">调用链：withdraw → call.value → fallback</span>
                  <span class="chip">根因：重入</span>
                </div>
                <p class="hintline" style="margin-top:10px">
                  特色：不仅“报存在”，还输出触发条件、关键状态变量、跨合约调用链，方便 PoC 合成与补丁生成。
                </p>
              </div>
            </div>

            <div class="card" style="box-shadow:none">
              <div class="hd">
                <div>
                  <div class="h">代码片段（Demo）</div>
                  <div class="sub">这里可替换为 diff viewer / 语义IR视图。</div>
                </div>
                <span class="pill mono">Solidity</span>
              </div>
              <div class="bd">
                <div class="codebox">
                  function withdraw() public payable {
                    uint256 amount = balances[msg.sender];
                    // 风险：状态更新前调用外部合约
                    (bool success, ) = msg.sender.call{value: amount}("");
                    require(success, "Transfer failed");
                    balances[msg.sender] = 0; // 状态更新在调用后
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 其他面板省略（可参考原有HTML补充） -->
        <div class="panel" :class="{ active: activeTab === 'verification' }">
          <div class="hintline">验证面板内容（可参考原有HTML补充）</div>
        </div>
        <div class="panel" :class="{ active: activeTab === 'patch' }">
          <div class="hintline">修复面板内容（可参考原有HTML补充）</div>
        </div>
        <div class="panel" :class="{ active: activeTab === 'regression' }">
          <div class="hintline">回归门禁面板内容（可参考原有HTML补充）</div>
        </div>
        <div class="panel" :class="{ active: activeTab === 'timeline' }">
          <div class="hintline">记录与协作面板内容（可参考原有HTML补充）</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('overview')
const props = defineProps({
  ticket: {
    type: Object,
    default: () => ({})
  }
})

const toast = (msg) => {
  window.alert(msg) // 简化实现，实际项目可替换为UI组件库的toast
}
</script>