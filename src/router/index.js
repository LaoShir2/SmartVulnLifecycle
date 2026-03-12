import { createRouter, createWebHashHistory } from 'vue-router';
import LandingView from '../views/LandingView.vue';
// 导入公共布局
import VulnLayout from '../layouts/VulnLayout.vue';
// 导入纯内容组件
import ScanView from '../views/ScanView.vue';
import VerificationView from '../views/VerificationView.vue';
import PatchView from '../views/PatchView.vue';

const routes = [
  // 首页（上传）
  {
    path: '/',
    name: 'landing',
    component: LandingView
  },
  // 父路由：公共布局
  {
    path: '/vuln',
    name: 'vuln',
    component: VulnLayout,
    redirect: '/vuln/scan', // 默认显示检测页面
    // 子路由：对应三个功能
    children: [
      {
        path: 'scan',
        name: 'scan',
        component: ScanView
      },
      {
        path: 'verify',
        name: 'verify',
        component: VerificationView
      },
      {
        path: 'patch',
        name: 'patch',
        component: PatchView
      }
    ]
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;