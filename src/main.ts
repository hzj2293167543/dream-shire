import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './style.css';
import '@/components/prompt/composables/prompt'; // 导入模态框管理器

const app = createApp(App);
app.use(router);
app.mount('#app');
