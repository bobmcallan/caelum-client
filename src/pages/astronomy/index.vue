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

        <h2 class="text-center">Astronomy Picture of the Day</h2>

        <hr class="is-underline" />

        <el-form :model="apodData" label-width="auto" label-position="left">

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

const refresh = async () => {

    await initalise(true);

    emitter.$emit('refresh', true)

}

emitter.$on('refresh', () => {

    refresh();

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