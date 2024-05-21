import * as ENV from '@t3b/app.config';
import { newlogger } from '@t3b/lib/vue/vue-logger';

import { computed } from "vue";
import { useRouter, useRoute } from 'vue-router'
import { Mutex } from 'async-mutex';

const logger = newlogger({ name: "vue-router-functions", level: (ENV.DEBUG) ? 'debug' : 'warn' });
logger.debug('Loading..');

export default function routerFunctions() {

    const mutex = new Mutex();

    const router = useRouter();
    const route = useRoute();

    const currentParams = computed(() => route.params)
    const currentQuery = computed(() => route.query)
    const currentRouteName = computed(() => route.name)
    const currentRoute = computed(() => ({ name: currentRouteName.value, params: currentParams.value, query: currentQuery.value }))

    const getParam = (param, defaultValue) => {
        defaultValue = _.isNil(defaultValue) ? null : defaultValue;

        logger.trace(`[getParam] param:${param} defaultValue:${defaultValue} route.params:${JSON.stringify(route.params)}`);

        return _.get(route.params, param, defaultValue);
    }

    const routerPush = async (input = { name: null, params: null, query: null }, replace = false) => {

        const release = await mutex.acquire();

        logger.trace(`[routerPush] input:${JSON.stringify(input)} replace:${replace}`);

        try {

            let _params = Object.assign({}, (replace) ? null : route.params, input.params)
            let _query = Object.assign({}, (replace) ? null : route.query, input.query)

            const _route = { name: input.name, params: _params, query: _query }

            logger.trace(`[routerPush] push:${JSON.stringify(_route)}`);

            await router.push(_route)

        }
        catch (err) {
            console.log(err)
        }
        finally {
            logger.trace(`[routerPush] end`);
            release()
        }

    }

    const setParams = async (input = {}) => {

        logger.trace(`[setParams] start`);

        const release = await mutex.acquire();

        logger.trace(`[setParams] input:${JSON.stringify(input)}`);
        logger.trace(`[setParams] current route.params:${JSON.stringify(route.params)}`);
        logger.trace(`[setParams] current route.query:${JSON.stringify(route.query)}`);

        try {

            const _route = { name: route.name, params: input, query: route.query }

            logger.trace(`[setParams] push:${JSON.stringify(_route)}`);
            await router.push(_route)
        }
        catch (err) {
            console.log(err)
            logger.error('[setParams] error %s', err);
        }
        finally {
            release()
        }

        logger.trace(`[setParams] pushed route.params:${JSON.stringify(route.params)}`);
        logger.trace(`[setParams] pushed route.query:${JSON.stringify(route.query)}`);

    }

    const getQuery = (param, defaultValue) => {
        defaultValue = _.isNil(defaultValue) ? null : defaultValue;

        logger.trace(`[getParam] param:${param} defaultValue:${defaultValue} route.query:${JSON.stringify(route.query)}`);

        return _.get(route.query, param, defaultValue);
    }

    const setQuery = async (input = {}) => {

        logger.trace(`[setQuery] start`);

        const release = await mutex.acquire();

        logger.trace(`[setQuery] input:${JSON.stringify(input)}`);
        logger.trace(`[setQuery] current route.query:${JSON.stringify(route.query)}`);
        logger.trace(`[setQuery] current route.params:${JSON.stringify(route.params)}`);

        try {
            // const _route = { name: route.name, params: route.params, query: input }
            const _route = { query: input }
            logger.trace(`[setQuery] push:${JSON.stringify(_route)}`);

            await router.push(_route)
        }
        catch (err) {
            console.log(err)
        }
        finally {
            logger.trace(`[setQuery] end`);
            release()
        }

        logger.trace(`[setQuery] pushed route.params:${JSON.stringify(route.params)}`);
        logger.trace(`[setQuery] pushed route.query:${JSON.stringify(route.query)}`);
    }

    const removeQuery = async (input) => {

        const release = await mutex.acquire();

        logger.trace(`[removeQuery] input:${JSON.stringify(input)}`);
        logger.trace(`[removeQuery] route.query:${JSON.stringify(route.query)}`);

        try {

            const _params = { ...route.query };

            delete _params[input];

            logger.debug(`[removeQuery] push:${JSON.stringify(_params)}`);

            await router.push(_params)

        }
        catch (err) {
            console.log(err)
        }
        finally {
            logger.debug(`[removeQuery] end`);
            release()
        }
    }

    return {
        getParam,
        setParams,
        getQuery,
        setQuery,
        removeQuery,
        currentParams,
        currentQuery,
        currentRouteName,
        currentRoute,
        routerPush
    }

}

