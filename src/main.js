import { createApp } from 'vue'
import GoogleSignInPlugin from 'vue3-google-signin'
import App from './App.vue'

const app = createApp(App)
app.use(GoogleSignInPlugin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
})
app.mount('#app')
