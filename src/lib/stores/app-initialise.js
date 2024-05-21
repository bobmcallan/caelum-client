// ****************************************************************
// Internal Plugins
// ****************************************************************
import * as ENV from '@t3b/app.config';
import { newlogger } from '@t3b/lib/vue/vue-logger';

// ****************************************************************
// 3rd Party Plugins
// ****************************************************************
import { createPinia } from 'pinia';

// Router and Stores
import { configStore } from './app-config.js';
import { apodStore } from "@t3b/lib/stores/data-apod";

// ****************************************************************
// Install
// ****************************************************************
export default async function installPlugins(app) {

    const logger = newlogger({ name: "storePlugins", level: ENV.LOGLEVEL });

    if (!app) throw 'app not defined'

    // Install Pinia State Mgmt.
    const pinia = createPinia();
    app.use(pinia);
    logger.debug('Installed plugin:pinia');

    // Install Config
    const config = configStore();
    await config.initalise();
    logger.debug('Initialised configStore');

    // Install Apod
    const apodstore = apodStore();
    await apodstore.initalise();
    logger.debug('Initialised apodStore');

    // Inject stores into all stores
    pinia.use(() => (
        {
            __configStore: config
        }
    )); // !! Must end with ;, otherwise client error !!

    // Install data plugin
    // pinia.use(dataPlugin);

    // return { "auth": auth, "config": config }
    return { "config": config }
}