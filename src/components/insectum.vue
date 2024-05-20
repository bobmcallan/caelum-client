<template>
    <section class="highlight" v-if="isDebug">
        <highlightjs v-for="item in items" class="debug" language="json" :code="generate(item)" />
    </section>
</template>

<script setup>
    import * as ENV from '@t3b/app.config';
    import { ref, computed, isReactive, isRef, watch } from "vue";
    import { storeToRefs } from 'pinia'

    import { newlogger } from '@t3b/lib/vue/vue-logger';
    import { insectumStore } from "@t3b/lib/stores/app-insectum";

    const __name = "insectumCtrl"
    const DEFAULTINPUT = { title: null, data: null }
    const logger = newlogger({ name: __name, level: (ENV.DEBUG) ? 'info' : 'warn' });

    const insectumstore = insectumStore();
    const { source } = storeToRefs(insectumstore)

    const items = computed(() => {
        const out = []

        for (const [key, value] of source.value.entries()) {
            out.push({ title: key, data: value });
        }

        return out

    })

    const cache = [];
    const replacer = (key, value) => {

        // Check for circular reference
        if (typeof value === 'object' && value !== null) {

            if (cache.indexOf(value) !== -1) {
                // Circular reference found, replace with a placeholder
                return '[Circular Reference]';
            }
            // Store value in cache
            cache.push(value);
        }
        return value;
    }

    const generate = (input = null) => {

        // logger.debug('[generate] start');

        // logger.debug('[generate] start input:\n%s', functions.toJson(input));

        input = Object.assign(DEFAULTINPUT, input)

        let _input = !_.isNil(input.title) ? `<!-- ${input.title} --> \n` : '';

        // logger.debug('[generate] isRef:%s', isRef(input.data));

        const createjson = (input) => {

            logger.debug('[generate] isRef:%s isFunction:%s', isRef(input), _.isFunction(input));

            if (isReactive(input) || isRef(input)) {

                // logger.debug('[generate] item:%s', functions.toJson(input.value));

                // _input += JSON.stringify(computed(() => input.value).value, replacer, 2);

                _input += JSON.stringify(input.value, null, 2);

            } else if (_.isFunction(input)) {

                _input += JSON.stringify(computed(() => input()).value, null, 2);

            } else {

                _input += _.isObject(input) || _.isArray(input) ? JSON.stringify(input, null, 2) : input;

            }

        }

        createjson(input.data)

        return _input;

    }

</script>