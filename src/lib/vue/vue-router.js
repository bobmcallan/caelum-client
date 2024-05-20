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
        { path: '/', redirect: { name: 'superchart' } },
        {
            path: '/:index(superchart)?/:id?',
            name: 'superchart',
            components: {
                header: appHeader,
                default: () => import('@t3b/pages/superchart/index.vue'),
                footer: appFooter
            },
            meta: { auth: false, title: 'Super Chart', icon: 'superchart' },
            props: { default: true, header: true },
        },
        // {
        //     path: '/:index(membership)?',
        //     name: 'membership',
        //     components: {
        //         header: appHeader,
        //         default: () => import('@t3b/pages/membership/index.vue'),
        //         footer: appFooter
        //     },
        //     meta: { auth: false, title: 'Membership', icon: 'membership' },
        //     props: { header: true },
        // },
        // {
        //     path: '/:index?/:division?/:purchasetype?/:scale?',
        //     name: 'index',
        //     components: {
        //         header: appHeader,
        //         default: () => import('@t3b/pages/index.vue'),
        //         footer: appFooter
        //     },
        //     meta: { auth: false, title: 'Index', icon: 'index' },
        //     props: { default: true, header: true },
        // },
        {
            path: '/:pathMatch(.*)',
            redirect: 'superchart',
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