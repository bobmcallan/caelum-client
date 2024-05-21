import * as ENV from '@t3b/app.config';

import { configStore } from "@t3b/lib/stores/app-config";
import { newlogger } from '@t3b/lib/vue/vue-logger';

const logger = newlogger({ name: "vue-configuration", level: (ENV.DEBUG) ? ENV.LOGLEVEL : 'warn' });
logger.debug('Loading..');

const plugin = {
    name: 'vue-config',

    install: (app, options) => {

        if (app.config.globalProperties.$config) {
            logger.warn('[vue-configuration] already installed. app.use(config) should be called only once.');
            return;
        }

        app.config.globalProperties.$config = configStore();
        logger.debug('[vue-configuration] installed.');

    },
};

export default plugin;