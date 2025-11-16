import { createApp } from 'vue'
import App from './CoordinatorApp.vue'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import '@/css/main.css'
import 'v-calendar/style.css'
import VCalendar from 'v-calendar'
//@ts-expect-error
import Chat from 'vue3-beautiful-chat'




const vuetify = createVuetify({
  components,
  directives,
})
createApp(App).use(vuetify).use(VCalendar).use(Chat).mount('#app')
