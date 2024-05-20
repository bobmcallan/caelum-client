import * as ENV from '@t3b/app.config';
// import { AUTH_LIST } from "@t3b/lib/vue/vue-router";

import { defineStore } from 'pinia'
import { useRouter, useRoute } from 'vue-router'

import { newlogger } from '@t3b/lib/vue/vue-logger';
import emitter from '@t3b/lib/vue/vue-emitter';

// Stores
// import { userStore } from "./app-user";

// ENV.LOGLEVEL
const logger = newlogger({ name: "vue-events", level: (ENV.DEBUG) ? 'debug' : 'warn' });

export const eventStore = defineStore({

    id: 'events',

    state: () => ({
        isloading: false,
        loaded: new Map(),
    }),

    getters: {

        whatsLoaded() {

            // const user = userStore();

            // this.loaded.set("auth", this.__authStore.isLoaded);
            this.loaded.set("config", this.__configStore.isLoaded);
            // this.loaded.set("user", user.isLoaded);

            let output = '';
            this.loaded.forEach((value, key) => {
                output = output + `${key}:${value} `
            })

            // logger.trace("[whatsLoaded] ", output)
            return output;
        },

        isLoading: (state) => state.isloading,

    },

    actions: {

        validate() {

            logger.debug("[validate] validatating...")

            // Validate Config File
            const validate = ["TOKENKEY", "APPLICATIONFATAL", "USERAUTHORIZED", "USERREFRESH", "USERRESET", "USERTOKENUPDATED"]

            validate.forEach((key) => {
                if (!_.hasIn(ENV, key)) {
                    throw `Application Configuration (app.config.js) key:${key} Not Validated - Stop Everything!`
                }
            })

            Object.keys(ENV).forEach(key => {
                logger.trace("%s:%s", key, ENV[key])
            })

            logger.debug("[validate] complete")

        },

        initalise() {

            logger.debug("[initalise] initalising...")

            const router = useRouter();
            const route = useRoute();

            emitter.$on(ENV.APPLICATIONLOAD, async () => {

                logger.debug("[EVENT::APPLICATIONLOAD] start...")

                this.isloading = true;

                await this.__configStore.initalise();
                await this.__authStore.initalise();

                /*
                // No load if path is login || callback
                let whitelisted = AUTH_LIST.some(path => route.path.includes(path));
                if (whitelisted) {

                    logger.warn("[initalise] Path is authorisation -> User NOT loaded")
                    logger.trace("[initalise] fullPath:%s login:%s callback:%s", route.fullPath, route.fullPath.includes("login"), route.fullPath.includes("callback"))

                    this.authorised = false

                    this.initalised = true

                    logger.debug("[initalise] Complete (no token) -> isAuthorised:%s", this.isAuthorised)

                    return;
                }
                */

                /*
                if (this.__authStore.isAuthorised) {

                    logger.debug("[EVENT::APPLICATIONLOAD] Refreshsing User")

                    let userstore = userStore();

                    await userstore.refresh()

                }
                */

                this.isloading = false;

                logger.debug("[EVENT::APPLICATIONLOAD] Complete")

            });

            emitter.$on(ENV.APPLICATIONFATAL, async (message) => {

                logger.warn("[EVENT.APPLICATIONFATAL] application fail event raised")

                this.isloading = false;

                await router.push({
                    name: 'login',
                    params: { logoutmessage: message }
                })

            })

            // emitter.$on(ENV.USERAUTHORIZED, async () => {

            //     logger.debug("[EVENT.USERAUTHORIZED] start")

            //     let userstore = userStore();

            //     await userstore.refresh()

            //     logger.debug("[EVENT.USERAUTHORIZED] end")

            // })

            // emitter.$on(ENV.USERUNAUTHORIZED, async () => {

            //     logger.debug("[EVENT.USERUNAUTHORIZED] start redirect:%s", route.fullPath);

            //     await router.push({
            //         name: 'login',
            //         query: { redirect: route.fullPath }
            //     })

            //     logger.debug("[EVENT.USERUNAUTHORIZED] end")

            // })

            /*
            emitter.$on(ENV.USERREFRESH, async () => {

                logger.debug("[EVENT.USERREFRESH] event start")

                await user.load()

                logger.debug("[EVENT.USERREFRESH] end")

            })
            */

            // emitter.$on(ENV.USERRESET, () => {

            //     logger.debug("[EVENT.USERRESET] event start")

            //     this.__authStore.reset()
            //     // user.reset()

            //     // configuration.reset()
            //     // projects.$reset()
            //     // templates.$reset()

            //     logger.debug("[EVENT.USERRESET] end")

            // })

            logger.debug("[initalise] complete")

        }
    }

});