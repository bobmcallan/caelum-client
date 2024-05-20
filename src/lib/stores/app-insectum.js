import * as ENV from '@t3b/app.config';
import { defineStore } from 'pinia'

import { newlogger } from '@t3b/lib/vue/vue-logger';

const logger = newlogger({ name: "vue-insectum", level: (ENV.DEBUG) ? 'debug' : 'warn' });

const DEFAULTINPUT = { title: null, data: null }

export const insectumStore = defineStore({

    id: 'insectum',

    state: () => ({

        isloading: false,

        source: new Map(),

    }),

    getters: {

        isLoading: (state) => state.isloading,

        // items: (state) => state.source,

        // output: (state) => {
        //     // return (!state.source || state.source.size === 0) ? null : Array.from(state.source, ([key, value]) => [{ title: key, data: value }]).flat()
        // },

    },

    actions: {

        add(input = [], name = null) {

            if (_.isNil(input)) {
                logger.warn('[add] input is empty');
                return
            }

            // logger.debug('[add] start');

            if (!_.isArray(input)) {
                input = [input]
            }

            for (let item of input) {

                item = Object.assign(DEFAULTINPUT, item)

                logger.trace('[add] name:%s title:%s', name, item.title);

                if (!_.isNull(name)) {
                    this.source.set(`${name}-${item.title}`, item.data)
                } else {
                    this.source.set(`${item.title}`, item.data)
                }

            }

            logger.trace('[add] end source (%s)', this.source.size);

        },

        remove(input = null) {

            if (_.isEmpty(input)) {
                return
            }

            if (!_.isArray(input)) {
                input = [input]
            }

            logger.trace('[remove] start source (%s)', this.source.size);

            // logger.debug('[remove] input:%s', functions.toJson(input, true));

            for (const i of input) {

                for (const key of this.source.keys()) {

                    // logger.debug('[remove] i:%s key:%s key.includes(i):%s', i, key, key.includes(i));

                    if (key.includes(i)) {

                        logger.trace('[remove] removing key:%s', key);

                        this.source.delete(key);
                    }

                }

            }

            logger.trace('[remove] end source (%s)', this.source.size);

        }

    }

});