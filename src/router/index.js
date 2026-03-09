import { createRouter, createWebHashHistory } from 'vue-router';
import OverviewView from '../views/OverviewView.vue';
import ScanView from '../views/ScanView.vue';
import TicketsView from '../views/TicketsView.vue';
import VerificationView from '../views/VerificationView.vue';
import PatchView from '../views/PatchView.vue';

// 使用 hash 路由可直接双击 index.html 打开打包产物，部署也更省心。
const routes = [
  {
    path: '/',
    redirect: '/overview'
  },
  {
    path: '/overview',
    name: 'overview',
    component: OverviewView,
    meta: {
      title: '总览 Dashboard',
      crumb: '/ 总览'
    }
  },
  {
    path: '/scan',
    name: 'scan',
    component: ScanView,
    meta: {
      title: '检测 Scan Center',
      crumb: '/ 检测'
    }
  },
  {
    path: '/tickets',
    name: 'tickets',
    component: TicketsView,
    meta: {
      title: '漏洞工单 Vulnerability Ops',
      crumb: '/ 漏洞工单'
    }
  },
  {
    path: '/verify',
    name: 'verify',
    component: () => import('../views/VerificationView.vue'),
    meta: {
      title: '验证 Verification Lab',
      crumb: '/ 验证'
    }
  },
  {
    path: '/patch',
    name: 'patch',
    component: () => import('../views/PatchView.vue'),
    meta: {
      title: '修复 Patch Studio',
      crumb: '/ 修复'
    }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
