<template>
    <section>

        <hr class="is-half" />

        <nav class="level">

            <div class="level-left">

                <el-space>

                    Menu

                </el-space>

            </div>

            <div class="level-right">

                <el-space>

                    <el-button @click="refresh()" size="small">
                        <el-icon><i-carbon-renew /></el-icon>
                    </el-button>

                </el-space>

            </div>

        </nav>

    </section>

    <hr class="is-half" />

    Goes HERE!!

    <hr class="is-spacer" />

    <insectum />

</template>

<script setup>

import * as ENV from '@t3b/app.config';
import { computed, ref, watch, nextTick, onMounted } from "vue";
import { storeToRefs } from 'pinia'

import * as functions from '@t3b/lib/functions/func-general';
import * as common from '@t3b/pages/common';

import emitter from '@t3b/lib/vue/vue-emitter';

import { apodStore } from "@t3b/lib/stores/data-apod";
import { insectumStore } from "@t3b/lib/stores/app-insectum";

import { newlogger } from '@t3b/lib/vue/vue-logger';

// Component and Logger
const __name = "astronomyCntrl"
const logger = newlogger({ name: __name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

// Stores
const apodstore = apodStore();
const insectumstore = insectumStore();

// Refs
// const { activeIndex } = storeToRefs(apodstore)

const initalise = async (rebuild = false) => {

    logger.trace('[initalise] start');

    await Promise.all([
        // factstore.initalise(),
    ])

    logger.trace('[initalise] end');

}

const refresh = async () => {

    await initalise(true);

    emitter.$emit('refresh', true)

}

emitter.$on('refresh', () => {

    refresh();

})

insectumstore.add([
    // { title: 'selectedChart', data: () => selectedChart.value },
    // { title: 'savedCharts', data: () => savedCharts.value },
    // { title: 'selectedMeasures', data: () => selectedMeasures.value },
], __name)

</script>

<style lang="scss">
@import './common.scss';

.flex-grow {
    flex-grow: 1;
}
</style>