import { createRouter, createWebHashHistory } from 'vue-router'

import * as ENV from '@t3b/app.config';

import { newlogger } from './vue-logger.js';

import appHeader from '@t3b/components/layout/app_header.vue';
import appFooter from '@t3b/components/layout/app_footer.vue';

const logger = newlogger({ name: 'vue-router', level: ENV.LOGLEVEL });

logger.info('Loading..');

const defaultTemplate = { template: '<section class="container">{{ $route.path }}</section>' };

const app_router = {
    linkActiveClass: 'active',
    linkExactActiveClass: 'exact-active',
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            components: {
                header: appHeader,
                default: () => import('@t3b/pages/index.vue'),
                footer: appFooter
            },
            meta: { auth: false, title: 'Home', icon: 'home' },
            props: { default: true, header: true },
        },
        {
            path: '/:index(astronomy)',
            name: 'astronomy',
            components: {
                header: appHeader,
                default: () => import('@t3b/pages/astronomy.vue'),
                footer: appFooter
            },
            meta: { auth: false, title: 'Home', icon: 'home' },
            props: { default: false, header: true },
        },
        {
            path: '/:index(catalogue)',
            name: 'catalogue',
            components: {
                header: appHeader,
                default: () => import('@t3b/pages/catalogue.vue'),
                footer: appFooter
            },
            meta: { auth: false, title: 'Home', icon: 'home' },
            props: { default: false, header: true },
        },
        {
            path: '/:pathMatch(.*)',
            redirect: 'home',
            name: 'NotFound',
            components: {
                header: appHeader,
                default: () => import('@t3b/pages/notfound.vue'),
                footer: appFooter
            },
            hidden: true
        },
    ],
};


export const appRouter = (auth) => {

    const router = createRouter(app_router);

    // router.beforeEach((to, from, next) => {
    //     logger.info('beforeenter to:%s', to.path);

    //     if (!to.path.includes('superchart'))
    //         next();

    // })

    // router.beforeEach(async (to, from) => {


    //     const _from = Object.assign({ index: null }, from)
    //     const _to = Object.assign({ index: null }, to)

    //     logger.debug(`[beforeEach] from:${JSON.stringify(_from.params['index'])}`);
    //     logger.debug(`[beforeEach] to:${JSON.stringify(_to.params['index'])}`);


    // })

    // router.afterEach(async (to, from) => {


    //     const _from = Object.assign({ index: null }, from)
    //     const _to = Object.assign({ index: null }, to)

    //     logger.debug(`[afterEach] from:${JSON.stringify(_from.params['index'])}`);
    //     logger.debug(`[afterEach] to:${JSON.stringify(_to.params['index'])}`);


    // })

    return router

}