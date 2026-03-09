import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './styles/theme.css';

const app = createApp(App);

// 将路由挂载到应用中，后续所有页面切换都由路由控制。
app.use(router);

// 启动应用并挂载到 index.html 的 #app 节点。
app.mount('#app');
