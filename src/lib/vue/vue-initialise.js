// ****************************************************************
// Internal Plugins
// ****************************************************************
import * as ENV from '@t3b/app.config';
import { newlogger } from './vue-logger';

const logger = newlogger({ name: "vue-initialise", level: (ENV.DEBUG) ? ENV.LOGLEVEL : 'warn' });
logger.debug('Loading..');

import Configuration from './vue-configuration';

// ****************************************************************
// 3rd Party Plugins
// ****************************************************************
import { appRouter } from '@t3b/lib/vue/vue-router.js';
import Element from '@t3b/lib/vue/vue-element'

import 'highlight.js/styles/stackoverflow-light.css'
import 'highlight.js/lib/common';
import hljsVuePlugin from "@highlightjs/vue-plugin";

// ****************************************************************
// Install
// ****************************************************************
export default async function installPlugins(app, stores) {

    const logger = newlogger({ name: "vue_plugins", level: ENV.LOGLEVEL });

    if (!app) throw 'app not defined'

    // Install Vue-Router
    const router = appRouter();
    app.use(router);
    logger.debug('Installed plugin:vue-router');

    // Install Remainder of plugins
    [
        // Events,
        // Logger,
        hljsVuePlugin,
        Configuration,
        Element].forEach((Plugin) => {

            app.use(Plugin);

            if (Plugin.name && !Plugin.name.includes('plugin')) {
                logger.debug('Installed plugin:%s', Plugin.name);
            }

        });

    logger.debug('Install complete');

    return {}

}