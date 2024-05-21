import * as ENV from '@t3b/app.config';

import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'

import { newlogger } from '@t3b/lib/vue/vue-logger';

import { emitter } from './vue-emitter';

const logger = newlogger({ name: 'vue-ticker', level: ENV.LOGLEVEL });
logger.debug('Loading..');

var DEFAULTEVENT = {
    id: '',
    mode: 'down',
    status: 'active',
    frequency: 0,
    timeout: -1,
    handler: null,
    error: null,
    errorCnt: 0,
    init: true,
    repeat: -1,
    cntr: 0,
};

export const appTicker = defineStore({
    id: 'ticker',

    state: () => ({
        uid: nanoid(10),

        events: new Map(),
        eventcount: 0,

        // ticker
        tickerId: null,
        ticketInterval: 1000,
        tickerCnt: 0,
    }),

    getters: {
        getUid: (state) => state.uid,
        counter: (state) => state.tickerCnt,
    },

    actions: {

        initalise() {

            logger.debug("[initalise] initalising...")

            emitter.on(ENV.TICKERSTART, async () => {
                this.tick();
            })

            emitter.on(ENV.TICKERSTOP, async () => {
                this.tok();
            })
        },

        // Ticket Methods
        start() {
            this.tick();
        },

        stop() {
            this.tok();
        },

        tick() {

            if (this.tickerId || !_.isNil(this.tickerId)) {
                logger.debug('[tick] Complete -> Ticker is running tickerId:%s', this.tickerId);
                return;
            }

            this.tickerId = setTimeout(() => {

                this.tickerId = (this.tickerId == null) ? null : clearTimeout(this.tickerId);

                this.tickerCnt++

                this.tick()

            }, this.ticketInterval);
        },

        tok() {

            logger.debug('[tok] Stopping Ticker');

            if (this.tickerId) {
                clearTimeout(this.tickerId);
            }

            this.tickerCnt = 0;
            this.tickerId = null;

        },
    }
});

const plugin = {
    name: 'vue-ticker',

    install: (app, options) => {

        if (app.config.globalProperties.$ticker) {
            console.warn('[vue-ticker] already installed. app.use(ticker) should be called only once.');
            return;
        }

        app.config.globalProperties.$ticker = appTicker();
        console.debug('[vue-ticker] installed.');

    },
};

export default plugin;