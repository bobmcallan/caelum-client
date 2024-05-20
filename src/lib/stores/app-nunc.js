import * as ENV from '@t3b/app.config';
import { defineStore, storeToRefs } from 'pinia'
import { customAlphabet, urlAlphabet } from 'nanoid'

import { newlogger } from '@t3b/lib/vue/vue-logger';


export const nuncStore = defineStore('app-nunc', () => {

    const _componentId = "app-nunc"
    const _logger = newlogger({ name: _componentId, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    const nanoid = customAlphabet(urlAlphabet, 5)

    const isLoading = false

    const initalise = async () => {
        // savedCharts.value = await superchartstore.getCharts()
    }

    const generateId = () => nanoid()

    return {
        isLoading,
        generateId,
        initalise
    }

});