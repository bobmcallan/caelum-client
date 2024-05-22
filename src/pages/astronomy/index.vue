<template>

    <el-main>

        <nav class="level">

            <div class="level-left">

            </div>

            <div class="level-right">

                <el-space>

                    <el-button @click.exact="refresh()" @click.ctrl.exact="refresh(true)" size="small">
                        <el-icon><i-carbon-renew /></el-icon>
                    </el-button>

                </el-space>

            </div>

        </nav>

        <h2 class="text-center">Astronomy Picture of the Day</h2>

        <hr class="is-underline" />

        <el-skeleton style="width: 240px" :loading="isLoading" animated>
            <template #template>
                <el-skeleton-item variant="image" style="width: 100%; height: 240px;" />
                <div style="padding: 14px">
                    <el-skeleton-item variant="h3" style="width: 100%;" />
                    <div style="display: flex; align-items: center; justify-items: space-between; margin-top: 16px; height: 16px;">
                        <el-skeleton-item variant="text" style="margin-right: 16px" />
                        <el-skeleton-item variant="text" style="width: 30%" />
                    </div>
                </div>
            </template>

        </el-skeleton>

        <el-form v-if="apodData" :model="apodData" label-width="auto" label-position="left">

            <el-form-item label="Title:">
                {{ apodData.title }}
            </el-form-item>

            <el-form-item label="Description:">
                {{ apodData.explanation }}
            </el-form-item>

            <el-form-item label="Date:">
                {{ apodData.date }}
            </el-form-item>

            <el-form-item label="Image:">
                <el-image :src="apodData.url" fit="scale-down" />
            </el-form-item>

            <!-- <el-form-item label="Image:">
            <el-image :src="apodData.hdUrl" fit="scale-down" />
        </el-form-item> -->

        </el-form>

    </el-main>

    <hr class="is-spacer" />

    <insectum />

</template>

<script setup>

import * as ENV from '@t3b/app.config';
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
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
const { apodData } = storeToRefs(apodstore)
const form = ref({ name: null })

const isLoading = computed(() => _.isEmpty(apodData.value))

const refresh = async (force = false) => {

    logger.debug('[refresh] start %s', force);

    apodstore.getLatest(force);

    logger.debug('[refresh] end');

}

emitter.$on('refresh', () => {

    refresh();

})

onMounted(() => {

    apodstore.getLatest();

})

onBeforeUnmount(() => {

    insectumstore.remove(__name)

})

insectumstore.add([
    { title: 'apodData', data: () => apodData.value },
], __name)

</script>

<style lang="scss">
@import '../common.scss';

.flex-grow {
    flex-grow: 1;
}
</style>