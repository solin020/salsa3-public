import { createApp } from 'vue'
import App from './AdminApp.vue'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import VCalendar from 'v-calendar'
import '@/css/main.css'
import 'v-calendar/style.css'
const vuetify = createVuetify({
  components,
  directives,
  defaults: {
    VBtn: {
      color: 'primary',
      variant: 'outlined',
      rounded: true,
    },
  },
})
createApp(App).use(vuetify).use(VCalendar, {}).mount('#app')
