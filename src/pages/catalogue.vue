<template>
    <el-main>

        <nav class="level">

            <div class="level-left">

            </div>

            <div class="level-right">

                <el-space>

                    <el-button @click="refresh()" size="small">
                        <el-icon><i-carbon-renew /></el-icon>
                    </el-button>

                </el-space>

            </div>

        </nav>

        <h2 class="text-center">Catalogue</h2>

    </el-main>

    <hr class="is-spacer" />

    <insectum />
</template>

<script setup>

import * as ENV from '@t3b/app.config';
import { computed, ref, watch, nextTick, onMounted } from "vue";
import { storeToRefs } from 'pinia'

import routerFunctions from "@t3b/lib/vue/vue-router-functions";
import * as functions from '@t3b/lib/functions/func-general';
import * as common from '@t3b/pages/common';

import emitter from '@t3b/lib/vue/vue-emitter';

import { insectumStore } from "@t3b/lib/stores/app-insectum";
import { newlogger } from '@t3b/lib/vue/vue-logger';

// Compoent and Logging
const __name = "indexCntrl"
const logger = newlogger({ name: __name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

// Stores
const insectumstore = insectumStore();

// Refs
const initalise = async (rebuild = false) => {

    logger.trace('[initalise] start');

    logger.trace('[initalise] end');

}

emitter.$on('refresh', () => {

    refresh();

})

</script>

<style lang="scss">
@import './common.scss';

.flex-grow {
    flex-grow: 1;
}
</style>