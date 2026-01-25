<template>
  <div class="content">
    <div class="split">
      <!-- 工单列表 -->
      <div class="card">
        <div class="hd">
          <div>
            <div class="h">漏洞工单列表（核心入口）</div>
            <div class="sub">所有检测/验证/修复动作都汇聚在同一工单，形成证据链与可审计流程。</div>
          </div>
          <span class="pill">Queue</span>
        </div>
        <div class="bd ticket-list" style="display:flex; flex-direction:column; gap:10px">
          <div 
            class="item" 
            :class="{ active: selectedTicket.id === ticket.id }"
            @click="selectTicket(ticket)"
            v-for="ticket in ticketList"
            :key="ticket.id"
          >
            <div class="top">
              <div class="name">{{ ticket.name }}</div>
              <span class="sev" :class="ticket.severity">{{ ticket.severity }}</span>
            </div>
            <div class="meta">{{ ticket.meta }}</div>
          </div>
        </div>
      </div>

      <!-- 工单详情 -->
      <TicketDetail :ticket="selectedTicket" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TicketDetail from '../components/TicketDetail.vue'

// 模拟工单数据
const ticketList = ref([
  {
    id: 1,
    name: 'TCK-1042: 重入漏洞（withdraw函数）',
    severity: 'HIGH',
    meta: 'Ethereum / GameFi-X / withdraw() / 置信度 0.92 / 可复现',
    title: 'TCK-1042: 重入漏洞（资金转移未做重入防护）',
    sub: 'Ethereum - GameFi-X 合约 withdraw 函数重入风险',
    chain: 'Chain: Ethereum',
    contract: 'Contract: GameFi-X:0x...',
    type: 'Type: 重入',
    conf: 'Conf: 0.92'
  },
  {
    id: 2,
    name: 'TCK-1039: 授权滥用（approve）',
    severity: 'MED',
    meta: 'Ethereum / GameFi-X / approve() / 置信度 0.74 / 已确认',
    title: 'TCK-1039: 授权滥用（approve函数无额度限制）',
    sub: 'Ethereum - GameFi-X 合约 approve 函数权限风险',
    chain: 'Chain: Ethereum',
    contract: 'Contract: GameFi-X:0x...',
    type: 'Type: 授权滥用',
    conf: 'Conf: 0.74'
  },
  {
    id: 3,
    name: 'TCK-1044: 价格操纵（oracle）',
    severity: 'MED',
    meta: 'Ethereum / GameFi-X / getPrice() / 置信度 0.68 / 待验证',
    title: 'TCK-1044: 价格操纵（oracle缺少sanity check）',
    sub: 'Ethereum - GameFi-X 合约 oracle 价格操纵风险',
    chain: 'Chain: Ethereum',
    contract: 'Contract: GameFi-X:0x...',
    type: 'Type: 价格操纵',
    conf: 'Conf: 0.68'
  }
])

const selectedTicket = ref(ticketList.value[0])

const selectTicket = (ticket) => {
  selectedTicket.value = ticket
}
</script>