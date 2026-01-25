import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import ScanCenter from '../views/ScanCenter.vue'
import VulnOps from '../views/VulnOps.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/scan', name: 'ScanCenter', component: ScanCenter },
  { path: '/ops', name: 'VulnOps', component: VulnOps }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router