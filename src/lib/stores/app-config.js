import * as ENV from '@t3b/app.config';
import { DEFAULTAPIURL } from '@t3b/lib/api-common';

import { version } from 'vue'
import { defineStore } from 'pinia'
import { newlogger } from '@t3b/lib/vue/vue-logger';


const logger = newlogger({ name: "configStore", level: (ENV.DEBUG) ? ENV.LOGLEVEL : 'warn' });

const __DEFAULT_CONFIG = {
    scope: "",
    name: "",
    version: "",
    support: "",
    url: "",
    loglevel: "",
}

export const configStore = defineStore({

    id: 'config',

    state: () => ({

        environment: new Map(),

        loading: false,
        initalised: false,

        // __api: new requestor()


    }),

    getters: {
        isLoading: (state) => state.loading,
        isLoaded: (state) => (state.environment.has("APIURL")),
        getDebug: (state) => (state.environment.has("DEBUG") ? state.environment.get("DEBUG") : false),
        getVueVersion: (state) => (state.environment.has("VUE") ? state.environment.get("VUE") : "NaN"),
        getEnvironment() {
            return (!this.environment) ? {} : Object.fromEntries(this.environment)
        },

        apiAddress: (state) => (state.environment.has("APIURL") ? state.environment.get("APIURL") : DEFAULTAPIURL),
    },

    actions: {

        async initalise(force = false) {

            if (this.initalised && !force) {
                logger.debug("[initalise] returning -> isinitalised:%s", this.initalised)
                return
            }

            logger.debug("[initalise] initalising...")

            this.loading = true;

            this.environment.set("VUE", version);

            let appversion = (_.isNil(import.meta.env.VITE_VERSION)) ? `0.0.0` : import.meta.env.VITE_VERSION;
            this.environment.set("VERSION", appversion);

            this.environment.set("DEBUG", (import.meta.env.MODE === "development"));
            this.environment.set("CLIENTMODE", import.meta.env.MODE);

            this.initalised = true

            logger.debug("[initalise] complete")
        },

        async refresh() {

            await this.initalise(true)

        },

        getVariable(key) {

            const _key = key.toUpperCase();

            return (this.environment.has(_key) ? this.environment.get(_key) : null)

        },

        getVariableArray() {

            return Array.from(this.environment, ([name, value]) => ({ name, value }));

        },

        // async __process(request = {}) {

        //     try {

        //         this.loading = true;

        //         let response = Object.assign({}, { result: __DEFAULT_CONFIG }, await this.__api.request(request))

        //         this.$patch(response.result)

        //     }
        //     catch (err) {

        //         console.log(err)

        //         logger.warn('[__process] error %s', JSON.stringify(err, null, 2));

        //     } finally {

        //         this.loading = false;

        //         logger.info("[__process] complete")

        //     }
        // },

    }
});