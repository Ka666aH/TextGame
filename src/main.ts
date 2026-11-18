import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './api/http'
import { queryClient, resetClientState } from './queries/client'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin, { queryClient })

/**
 * `401` на любом запросе, кроме формы входа, — разлогин.
 *
 * Личность сбрасываем через `resetClientState`: он выставляет `me` в `null`
 * и будит наблюдателей, поэтому шапка исчезает сразу. Просто `clear()`
 * здесь не годится — он выкидывает запрос, а наблюдатели остаются со
 * старым значением.
 */
setUnauthorizedHandler(() => {
  resetClientState()
  void router.push({ name: 'login' })
})

app.mount('#app')
