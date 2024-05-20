<template>
    <section>

        <el-menu :default-active="activePageIndex" mode="horizontal" :ellipsis="false" @select="handleSelect">

            <!-- https://icon-sets.iconify.design/ -->

            <el-menu-item index="superchart">
                <el-icon><i-carbon-chart-column-floating /></el-icon>
                Super Chart
            </el-menu-item>
            <!-- <el-menu-item index="scorecard">
                <el-icon><i-carbon-chart-point /></el-icon>
                OnePass Scorecard
            </el-menu-item> -->
            <!-- <el-menu-item index="onedigital">
                <el-icon><i-grommet-icons-transaction /></el-icon>
                Transaction Analysis
            </el-menu-item> -->
            <!-- <el-menu-item index="analysis">
                <el-icon><i-carbon-chart-cluster-bar /></el-icon>
                Trend Analysis
            </el-menu-item>
            <el-menu-item index="membership">
                <el-icon><i-carbon-group /></el-icon>
                Membership
            </el-menu-item>
            -->

            <div class="flex-grow" />

            <el-space spacer="|">

                <div class="color-red-8">{{ selectedChartId }}</div>
                <div class="color-red-8">{{ selectedChartTimestamp }} </div>
                <div class="color-purple-8">saved : {{ isSaved }} </div>

                <el-link :underline="false">
                    <el-icon :class="isloading ? 'is-loading is-loading-red' : ''" size="20" @click.exact="reloadEvent(false)" @click.ctrl.exact="reloadEvent(true)" :disabled="isloading">
                        <Orange />
                    </el-icon>
                </el-link>

            </el-space>

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
    import { factStore } from "@t3b/lib/stores/data-fact";
    import { nuncStore } from "@t3b/lib/stores/app-nunc";
    import { superChartStore } from "@t3b/lib/stores/data-superchart";
    import { onedigitalStore } from "@t3b/lib/stores/data-onedigital";

    import emitter from '@t3b/lib/vue/vue-emitter';
    import { newlogger } from '@t3b/lib/vue/vue-logger';

    import { toJson, paramsToObject, objectToParams } from '@t3b/lib/functions/func-general';

    const _name = "page-headerCntrl"
    const _logger = newlogger({ name: _name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    const router = useRouter();

    const insectumstore = insectumStore();
    const factstore = factStore();

    const superchartstore = superChartStore();
    const onedigitalstore = onedigitalStore();
    const nuncstore = nuncStore();
    const routerfunctions = routerFunctions();

    const { selectedChartId, selectedChartTimestamp, isSaved } = storeToRefs(nuncstore)

    const isloading = computed(() => factstore.isLoading || onedigitalstore.isLoading || superchartstore.isLoading)

    const activePageIndex = ref()

    const props = defineProps({
        index: {
            type: [String, Number],
            default: "superchart",
        }
    })

    const handleSelect = async (key, keyPath) => {
        activePageIndex.value = key;
    }

    onMounted(() => {

        _logger.debug('[onMounted] props:%s', toJson(props, true));

        router.isReady(

            activePageIndex.value = props.index

        )

    })

    onBeforeUnmount(() => {
        insectumstore.remove(_name)
    })

    const reloadEvent = (force = false) => {
        _logger.trace('[rebuildEvent] force:%s', force);
        reload(force)
        emitter.$emit('reload', force)
    }

    const reload = async (force = false) => {
        await factstore.initalise(force);
    }

    // insectumstore.add([
    //     //     { title: 'params', data: routerfunctions.params },
    //     { title: 'activePageIndex, props.index', data: () => ({ activePageIndex: activePageIndex.value, props: props.index }) },
    // ], __name)

    watch([activePageIndex], async () => {

        switch (activePageIndex.value) {
            case 'superchart':
                await routerfunctions.routerPush({ name: 'superchart', params: { index: activePageIndex.value } })
                break;
            default:
                await routerfunctions.routerPush({ name: 'index', params: { index: activePageIndex.value } })
        }

        _logger.trace('[watch|activePageIndex] activePageIndex:%s', activePageIndex.value);

    })

</script>

<style lang="scss">
.flex-grow {
    flex-grow: 1;
}
</style>