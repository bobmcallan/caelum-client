// **************************************************
// Logger
import { newlogger } from '@t3b/lib/vue/vue-logger';
const logger = newlogger({ name: "app.js", level: ENV.LOGLEVEL });

// Vue Application -> Main entry point
logger.debug("Loading Vue")
import { createApp } from 'vue'
import app_core from './app.vue';

// Config
logger.debug("Loading Config")
import * as ENV from '@t3b/app.config';

// Plugins
logger.debug("Loading Plugins")
import store_plugins from '@t3b/lib/stores/app-initialise'
import vue_plugins from '@t3b/lib/vue/vue-initialise'

// CSS
logger.debug("Loading Css")
import 'virtual:uno.css'

// T3B Components
logger.debug("Loading Components")
import insectum from './components/insectum.vue';

logger.info("Creating Application...")

logger.info("ENV.DEBUG:", ENV.DEBUG)
logger.info("LOG LEVEL:", (ENV.LOGLEVEL) ? ENV.LOGLEVEL : 'warn')

const app = createApp(app_core);

app.mixin({

    components: {
        insectum
    },

    data: () => ({
        isDebug: ENV.DEBUG
    }),

})

store_plugins(app)
    .then((stores) => {
        vue_plugins(app, stores)
    })
    .then(() => app.mount('#app'))

logger.info('Application Created');