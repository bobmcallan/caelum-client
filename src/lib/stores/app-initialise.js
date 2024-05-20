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
import { factStore } from './data-fact.js';
import { nuncStore } from "@t3b/lib/stores/app-nunc";
import { superChartStore } from "@t3b/lib/stores/data-superchart";
// import { dataPlugin } from './data-common.js';

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

    // Install factsStore
    const factsstore = factStore();
    await factsstore.initalise();
    logger.debug('Initialised factsStore');

    // Install nuncStore
    const nuncstore = nuncStore();
    await nuncstore.initalise();
    logger.debug('Initialised nuncStore');

    // Install superchartStore
    const superchartStore = superChartStore();
    await superchartStore.initalise();
    logger.debug('Initialised superchartStore');

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