// **************************************************
// Vue Application -> Main entry point
// **************************************************

import { createApp } from 'vue'

// ****************************************************************
// Interal Imports
// ****************************************************************
import * as ENV from '@t3b/app.config';
import { newlogger } from '@t3b/lib/vue/vue-logger';
import store_plugins from '@t3b/lib/stores/app-initialise'
import vue_plugins from '@t3b/lib/vue/vue-initialise'

// ****************************************************************
// 3rd Party Libs
// ****************************************************************

// ****************************************************************
// CSS / SASS
// ****************************************************************
// import 'element-plus/dist/index.css'
import 'virtual:uno.css'

// import element from '@t3b/lib/vue/vue-element'
// import elementicons from '@t3b/lib/vue/vue-elementicons'

// ****************************************************************
// T3B Components
// ****************************************************************
import insectum from './components/insectum.vue';
import fields from './components/fields.vue';

import app_core from './app.vue';

const logger = newlogger({ name: "app.js", level: ENV.LOGLEVEL });

logger.info("Creating application...")

logger.info("ENV.DEBUG:", ENV.DEBUG)
logger.info("LOG LEVEL:", (ENV.LOGLEVEL) ? ENV.LOGLEVEL : 'warn')

const app = createApp(app_core);

app.mixin({

    components: {
        insectum, fields
    },

    data: () => ({
        // componentId: nanoid(10),
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