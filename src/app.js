// **************************************************

// Vue Application -> Main entry point
import { createApp } from 'vue'
import app_core from './app.vue';

// Config
import * as ENV from '@t3b/app.config';

// Logger
import { newlogger } from '@t3b/lib/vue/vue-logger';

// Plugin Config
import store_plugins from '@t3b/lib/stores/app-initialise'
import vue_plugins from '@t3b/lib/vue/vue-initialise'

// CSS
import 'virtual:uno.css'

// T3B Components
import insectum from './components/insectum.vue';

const logger = newlogger({ name: "app.js", level: ENV.LOGLEVEL });

logger.info("Creating application...")

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

logger.info('Creating Application');

store_plugins(app)
    .then((stores) => {
        vue_plugins(app, stores)
    })
    .then(() => app.mount('#app'))

logger.info('Application created');