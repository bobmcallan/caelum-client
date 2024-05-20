import * as ENV from '@t3b/app.config';

import { toRef, ref } from "@vue/reactivity"
import { nanoid } from 'nanoid'

import { queryObjectsWithMap, toJson } from '@t3b/lib/functions/func-general';
import { newlogger } from '@t3b/lib/vue/vue-logger';

const logger = newlogger({ name: "piniaPlugin", level: 'debug' });
const DATA_DEFAULTS = {
    source: null,
    loading: false,
}

const DATA_STORES = ['data-measures', 'data-onedigital']
const FIELDS_DEFAULTS = ["measure_name", "division", "purchase_type", "member_status", "segment_index"]

export const dataPlugin = ({ store, options = {} }) => {

    const storeid = store.$id
    const storedata = `$${store.$id}`

    store.$logger = newlogger({ name: `${storeid}`, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    if (!DATA_STORES.includes(storeid)) {
        logger.trace('NOT adding plugin to store:%s -> return', storeid);
        return
    }

    Object.assign(store.$state, {}, DATA_DEFAULTS)
    for (const property in store.$state) {
        store[property] = toRef(store.$state, property)
    }

    // Functions

    store._executeQuery = async (source, opts = {}) => {

        if (!source || _.isEmpty(source)) {
            store.$logger.warn('[_executeQuery] source is empty');
            return null;
        }

        // store.$logger.debug("[_executeQuery] start")

        const _opts = Object.assign({}, opts)

        const _output = new Map();
        const _params = new Map()

        for (const key in _opts) {

            // store.$logger.debug('[_executeQuery] key:%s value:%s', key, _opts[key]);

            if (!FIELDS_DEFAULTS.includes(key)) continue;

            _params.set(key, _opts[key])
        }

        // store.$logger.debug('[_executeQuery] _params:\n%s', toJson(_params));

        const division_param = _params.get("division");

        if (_.isEmpty(division_param)) {
            _params.set("division", ["onepass", "all"])
        }

        if (!_.isArray(division_param) && !_.isEmpty(division_param)) {
            _params.set("division", [division_param])
        }

        // store.$logger.debug('[_executeQuery] start _params:\n%s', toJson(_params));

        const _result = await queryObjectsWithMap(source, _params);

        // store.$logger.debug('[_executeQuery] finish');

        if (_result && !_.isEmpty(_result)) {
            _result.map(x => {
                const record = Object.assign({}, x)
                _output.set(nanoid(10), record)
            })

        }

        // store.$logger.debug('[_executeQuery] result no.:%s', _result.length);
        // store.$logger.debug('[_executeQuery] result:\n%s', toJson(_result));
        return [..._output.values()]

    }

}