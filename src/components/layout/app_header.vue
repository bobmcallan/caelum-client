<template>
    <section>

        <el-menu :default-active="activePageIndex" mode="horizontal" :ellipsis="false" @select="handleSelect">

            <el-menu-item>
                <el-image style="width: 100px; height: 100px" src="/t3b_logo_158_50.png" fit="scale-down" />
            </el-menu-item>

            <!-- https://icon-sets.iconify.design/ -->

            <el-menu-item index="home">
                <el-icon><i-carbon-home /></el-icon>
                Home
            </el-menu-item>

            <el-menu-item index="astronomy">
                <el-icon><i-carbon-star /></el-icon>
                Astronomy
            </el-menu-item>

            <el-menu-item index="catalogue">
                <el-icon><i-carbon-carousel-vertical /></el-icon>
                Catalogue
            </el-menu-item>

            <div class="flex-grow" />

            <el-menu-item>

                <el-link :underline="false">
                    <el-icon :class="isloading ? 'is-loading is-loading-red' : ''" size="20" @click.exact="reloadEvent(false)" @click.ctrl.exact="reloadEvent(true)" :disabled="isloading">
                        <Orange />
                    </el-icon>
                </el-link>

            </el-menu-item>

        </el-menu>

    </section>

</template>

<script setup>

import * as ENV from '@t3b/app.config';
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import routerFunctions from "@t3b/lib/vue/vue-router-functions";
import { insectumStore } from "@t3b/lib/stores/app-insectum";
import { nuncStore } from "@t3b/lib/stores/app-nunc";
import { apodStore } from "@t3b/lib/stores/data-apod";

import emitter from '@t3b/lib/vue/vue-emitter';
import { newlogger } from '@t3b/lib/vue/vue-logger';

import { toJson, paramsToObject, objectToParams } from '@t3b/lib/functions/func-general';

const _name = "page-headerCntrl"
const _logger = newlogger({ name: _name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

const router = useRouter();
const routerfunctions = routerFunctions();

const insectumstore = insectumStore();
const nuncstore = nuncStore();

const apodstore = apodStore();

const isloading = computed(() => false)

const activePageIndex = ref()

const props = defineProps({
    index: {
        type: [String, Number],
        default: "home",
    }
})

const handleSelect = async (key, keyPath) => {
    activePageIndex.value = key;
}

onMounted(() => {

    _logger.debug('[onMounted] props:%s', toJson(props, true));

    router.isReady(

        activePageIndex.value = props.index ?? 'home'

    )

})

onBeforeUnmount(() => {
    insectumstore.remove(_name)
})

const reloadEvent = (force = false) => {
    _logger.trace('[rebuildEvent] force:%s', force);
    emitter.$emit('reload', force)
}

watch([activePageIndex], async () => {

    _logger.debug('[watch|activePageIndex] activePageIndex:%s', activePageIndex.value);

    switch (activePageIndex.value) {
        case 'astronomy':
            await routerfunctions.routerPush({ name: 'astronomy', params: { index: activePageIndex.value } })
            break;

        case 'catalogue':
            await routerfunctions.routerPush({ name: 'catalogue', params: { index: activePageIndex.value } })
            break;

        default:
            await routerfunctions.routerPush({ name: 'home', params: { index: null } })
    }

    // _logger.debug('[watch|activePageIndex] activePageIndex:%s', activePageIndex.value);

})

</script>

<style lang="scss">
.flex-grow {
    flex-grow: 1;
}

.el-menu--horizontal {

    .el-menu--horizontal>.el-menu-item.is-active,
    .el-menu-item:not(.is-disabled):focus,
    .el-menu-item:not(.is-disabled):hover {
        background-color: transparent;
    }
}
</style>