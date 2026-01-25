# SmartVulnLifecycle - 前端实现

## 项目介绍

本项目是 **智能合约漏洞全生命周期管理系统** 的前端实现，基于 Vue 3 + Vite 构建，提供「漏洞检测 → 漏洞验证 → 漏洞修复 → 回归验证」的端到端可视化操作界面。

前端聚焦于用户体验与功能闭环，通过组件化设计实现了多模块协同工作，支持智能合约漏洞的全流程管理，适配区块链安全审计人员、智能合约开发者的日常工作需求。

核心价值：
- 可视化呈现漏洞生命周期状态流转
- 简化多智能体扫描、PoC 生成、漏洞修复的操作流程
- 提供完整的证据链与审计追溯能力
- 适配多链合约场景，支持自定义扫描与修复策略

## 核心功能模块

### 1. 总览面板（Dashboard）
- 漏洞生命周期分布统计（Detected/Reproducible/Confirmed 等状态）
- 自动化产出数据展示（扫描次数、PoC 数量、补丁候选数）
- 核心功能快速入口（一键跳转检测、验证、修复模块）
- 关键指标监控（MTTR 平均修复时间、高危漏洞数量等）

### 2. 检测中心（Scan Center）
- 多链合约资产选择（支持按链、协议、合约族筛选）
- 多智能体扫描策略配置（静态分析、符号执行、Fuzz 测试等引擎组合）
- 扫描参数自定义（超时预算、并发数、路径上限、风险优先级）
- 扫描结果可视化（漏洞类型、定位、置信度、一键转工单）

### 3. 漏洞工单管理（Vulnerability Ops）
- 工单列表分页/筛选/搜索（按合约、漏洞类型、工单 ID、函数名）
- 工单生命周期状态追踪（Detected → Reproducible → Confirmed → Patching → Verified → Closed）
- 工单详情多维度展示（概览、检测结果、验证信息、修复方案、回归记录）
- 证据链整合（扫描报告、PoC 脚本、执行日志、修复补丁）

### 4. 验证实验室（Verification Lab）
- 漏洞信息详情（根因、依赖条件、触发路径、风险等级）
- 自动化 PoC 生成（支持 Foundry/Hardhat 风格脚本，可复制/下载）
- 交易语义还原（攻击叙事、Tx 时间线、关键状态差分）
- PoC 运行与回放（Fork 链上环境、日志输出、证据包导出）
- PoC 迭代优化（用户自定义约束调整）

### 5. 修复工作室（Patch Studio）
- 多方案补丁候选（基于语义迁移的修复建议，如 ReentrancyGuard+CEI、纯 CEI、Pull-Payment）
- 补丁影响评估（安全等级、Gas 消耗、兼容性、升级难度）
- PoC 回归验证（补丁前后漏洞触发对比、资产安全断言）
- 修复日志与报告导出（验证结果、Diff 对比、业务语义兼容性检查）

## 技术栈

| 技术/工具       | 版本要求       | 用途说明                     |
|-----------------|----------------|------------------------------|
| Vue.js          | ≥ 3.3.x        | 核心前端框架（组件化开发）   |
| Vite            | ≥ 5.0.x        | 构建工具（快速热更新、打包） |
| Vue Router      | ≥ 4.2.x        | 路由管理（页面跳转、状态同步）|
| CSS             | 原生 + 自定义变量 | 样式设计（响应式、暗黑主题） |
| Node.js         | ≥ 16.x         | 运行环境                     |
| npm/yarn        | 最新稳定版     | 依赖管理                     |

## 安装与部署

### 前置环境准备
1. 安装 Node.js（≥16.x）：[https://nodejs.org/](https://nodejs.org/)
2. 安装 npm/yarn：随 Node.js 自带，或手动升级至最新版
   ```bash
   npm install -g npm@latest
   # 或安装 yarn
   npm install -g yarn
   ```

### 部署步骤
1. 克隆仓库
   ```bash
   git clone https://github.com/your-username/SmartVulnLifecycle.git
   cd SmartVulnLifecycle
   ```

2. 安装依赖
   ```bash
   cd frontend
   # 使用 npm
   npm install
   ```

3. 配置环境变量（可选）
   复制 `.env.example` 为 `.env`，根据需求修改配置（如 RPC 地址、默认链、Fork 区块高度）：
   ```env
   # 示例配置
   VITE_DEFAULT_CHAIN=ethereum
   VITE_FORK_BLOCK=19233001
   VITE_RPC_URL=https://mainnet.infura.io/v3/your-api-key
   VITE_APP_TITLE=VulnOps for Smart Contracts
   ```

4. 启动开发环境
   ```bash
   npm run dev
   # 或
   yarn dev
   ```
   启动后访问终端输出的地址（默认：`http://localhost:3000`）即可看到界面。

5. 构建生产版本（部署到服务器时使用）
   ```bash
   npm run build
   # 或
   yarn build
   ```
   构建产物会输出到 `dist` 目录，可通过 Nginx、Apache 等服务器部署。

## 使用指南

### 快速操作流程
1. **进入检测中心**：上传智能合约代码（或通过合约地址同步链上合约）
2. **配置扫描策略**：选择目标链、扫描引擎（多智能体）、参数，启动扫描
3. **查看扫描结果**：将候选漏洞一键转为工单，进入漏洞工单管理页面
4. **验证漏洞**：在验证实验室运行自动生成的 PoC 脚本，确认漏洞可利用性
5. **修复漏洞**：在修复工作室选择补丁方案，通过 PoC 回归验证修复效果
6. **导出报告**：完成修复后导出审计报告与证据包，关闭工单

### 关键操作说明
- **合约上传**：支持本地 Solidity 文件上传，或输入合约地址同步链上代码
- **扫描策略配置**：根据合约风险画像（权限、外部调用、资产可转移性）动态调整扫描深度
- **PoC 运行**：支持 Fork 指定区块高度的链上环境，确保验证环境一致性
- **补丁选择**：可对比多个修复方案的安全等级、Gas 消耗、兼容性，选择最优解

## 项目目录结构

```
src/
├── assets/                # 静态资源
│   └── styles.css         # 全局样式（暗黑主题、响应式布局）
├── components/            # 公共组件
│   ├── Sidebar.vue        # 侧边栏导航（功能模块入口）
│   ├── Topbar.vue         # 顶部栏（搜索、环境配置、时间戳）
│   ├── TicketDetail.vue   # 工单详情组件（多标签页展示）
│   ├── PoCCode.vue        # PoC 代码展示组件（语法高亮、复制功能）
│   └── PatchCard.vue      # 补丁候选卡片（方案对比、影响评估）
├── views/                 # 页面视图
│   ├── Dashboard.vue      # 总览面板
│   ├── ScanCenter.vue     # 检测中心
│   ├── VulnOps.vue        # 漏洞工单管理
│   ├── VerificationLab.vue# 验证实验室
│   └── PatchStudio.vue    # 修复工作室
├── router/                # 路由配置
│   └── index.js           # 页面路由映射、导航守卫
├── utils/                 # 工具函数
│   ├── format.js          # 数据格式化（时间、漏洞等级、合约地址）
│   └── api.js             # 接口请求封装（后续对接后端使用）
├── App.vue                # 根组件（布局容器）
└── main.js                # 入口文件（初始化 Vue 实例、路由）
```

## 响应式支持

本项目适配桌面端与平板设备，响应式规则如下：
- 屏幕宽度 ≥ 1100px：完整布局（侧边栏 + 多栏内容区）
- 屏幕宽度 < 1100px：适配移动端（侧边栏隐藏、单栏布局、自适应组件大小）

## 扩展与定制

### 1. 对接后端接口
修改 `src/utils/api.js` 中的接口请求函数，替换模拟数据为真实后端接口：
```javascript
// 示例：扫描结果请求
export const fetchScanResults = async (scanId) => {
  const res = await fetch(`/api/scan/results/${scanId}`);
  return res.json();
};
```

### 2. 集成组件库
若需优化 UI 交互，可集成 Element Plus、Naive UI 等 Vue 3 组件库：
```bash
# 安装 Element Plus
npm install element-plus @element-plus/icons-vue
```
在 `main.js` 中全局引入，替换原生按钮、表格、弹窗等组件。

### 3. 新增功能模块
- 新增页面：在 `views/` 目录下创建新页面组件，在 `router/index.js` 中配置路由
- 新增组件：在 `components/` 目录下创建公共组件，通过 props/emit 实现数据通信
- 扩展样式：在 `assets/styles.css` 中新增自定义变量或样式类

## 注意事项
1. 本项目为前端原型实现，默认使用模拟数据，实际部署需对接后端服务
2. PoC 脚本执行、链上数据同步等功能需依赖区块链节点 RPC 接口（如 Infura、Alchemy）
3. 生产环境部署时需配置 HTTPS，避免敏感数据传输风险
4. 若需支持更多区块链网络，可扩展 `assets/utils/chain.js` 中的链配置信息

## 贡献指南
1. Fork 本仓库
2. 创建特性分支（`git checkout -b feature/xxx`）
3. 提交代码变更（`git commit -m "feat: 新增xxx功能"`）
4. 推送分支（`git push origin feature/xxx`）
5. 提交 Pull Request，描述功能变更与测试结果

## 许可证
本项目基于 [MIT 许可证](LICENSE) 开源，允许自由使用、修改与分发，前提是保留原作者版权声明。

## 联系我们
- 项目地址：[https://github.com/your-username/VulnerabilityLifecycleManagement](https://github.com/your-username/VulnerabilityLifecycleManagement)
- 问题反馈：通过 Issues 提交 Bug 报告或功能建议
- 技术交流：可通过 GitHub 主页预留的邮箱联系开发团队