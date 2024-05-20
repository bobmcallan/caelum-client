import * as ENV from '@t3b/app.config';

import { eventStore } from "@t3b/lib/stores/app-events";

import { newlogger } from '@t3b/lib/vue/vue-logger';

export let _Vue;

const logger = newlogger({ name: "events-plugin", level: (ENV.DEBUG) ? ENV.LOGLEVEL : 'warn' });

const plugin = {

    name: 'vue-events',

    install: (app, options) => {

        if (app.config.globalProperties.$events) {
            logger.warn('Already installed. app.use(main) should be called only once.');
            return;
        }

        app.config.globalProperties.$events = eventStore();

        logger.debug('Installed.');

    },
};

export default plugin;
