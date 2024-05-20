<template>
    <section>

        <hr class="is-half" />

        <nav class="level">

            <div class="level-left">

                <el-space>

                    <el-radio-group v-model="selectedDivision" size="small" :disabled="isloading">
                        <el-radio-button v-for="division in divisions" :label="division.value">{{ division.name }}</el-radio-button>
                    </el-radio-group>

                    <el-radio-group v-model="selectedPurchaseType" size="small" v-if="activeIndex != 'membership'" :disabled="isloading" class="radio-group-warn">
                        <el-radio-button v-for="purchasetype in purchaseTypes" :label="purchasetype.value">{{ purchasetype.name }}</el-radio-button>
                    </el-radio-group>

                </el-space>

            </div>

            <div class="level-right">

                <el-space>

                    <el-radio-group v-model="selectedScale" class="radio-group-success" size="small">
                        <el-radio-button label="years">Years</el-radio-button>
                        <el-radio-button label="months">Months</el-radio-button>
                        <el-radio-button label="weeks">Weeks</el-radio-button>
                        <el-radio-button v-if="['onedigital', 'membership'].includes(activeIndex)" label="days">Days</el-radio-button>
                    </el-radio-group>

                    <el-button @click="detailed = !detailed" size="small">
                        <el-icon><i-carbon-column-insert :style="{ color: detailed ? 'red' : '' }" /></el-icon>
                    </el-button>

                    <el-button @click="refresh()" size="small">
                        <el-icon><i-carbon-renew /></el-icon>
                    </el-button>

                </el-space>

            </div>

        </nav>

    </section>

    <hr class="is-half" />

    <scorecardctrl v-if="activeIndex === 'scorecard'" :division="selectedDivision" :purchasetype="selectedPurchaseType" :scale="selectedScale" :detailed="detailed"></scorecardctrl>

    <membershipctrl v-if="activeIndex === 'membership'" :division="selectedDivision" :scale="selectedScale"></membershipctrl>

    <onedigitalctrl v-if="activeIndex === 'onedigital'" :division="selectedDivision" :purchasetype="selectedPurchaseType" :scale="selectedScale" :detailed="detailed"></onedigitalctrl>

    <measuresctrl v-if="activeIndex === 'analysis'" :division="selectedDivision" :purchasetype="selectedPurchaseType" :scale="selectedScale" :detailed="detailed"></measuresctrl>

    <hr class="is-spacer" />

    <insectum />
</template>

<script setup>

    import * as ENV from '@t3b/app.config';
    import { computed, ref, watch, nextTick, onMounted } from "vue";
    import { storeToRefs } from 'pinia'

    import routerFunctions from "@t3b/lib/vue/vue-router-functions";
    import * as functions from '@t3b//src/lib/functions/func-general';
    import * as common from '@t3b/pages/common';

    import emitter from '@t3b/lib/vue/vue-emitter';

    import { insectumStore } from "@t3b/lib/stores/app-insectum";
    import { nuncStore } from "@t3b/lib/stores/app-nunc";
    import { factStore } from "@t3b/lib/stores/data-fact";
    import { measuresStore } from "@t3b/lib/stores/data-measures";
    import { onedigitalStore } from "@t3b/lib/stores/data-onedigital";

    import { newlogger } from '@t3b/lib/vue/vue-logger';

    const __name = "indexCntrl"
    const logger = newlogger({ name: __name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    const insectumstore = insectumStore();
    const nuncstore = nuncStore();
    const factstore = factStore();
    const measuresstore = measuresStore();
    const onedigitalstore = onedigitalStore();

    import measuresctrl from "./measures/index.vue";
    import scorecardctrl from "./onepass/scorecard.vue";
    import onedigitalctrl from "./onedigital/onedigital.vue";
    import membershipctrl from "./membership/membership.vue";

    const isloading = computed(() => measuresstore.isLoading)

    const { divisions, purchaseTypes } = storeToRefs(factstore)
    const { activeIndex, selectedDivision, selectedPurchaseType, selectedScale } = storeToRefs(nuncstore)

    // const routerfunctions = routerFunctions();

    const props = defineProps({
        index: {
            type: [String, Number],
            default: "scorecard",
        },
        division: {
            type: [String, Number],
            default: 'onepass'
        },
        purchasetype: {
            type: [String, Number],
            default: 'all'
        },
        scale: {
            type: [String, Number],
            default: 'all'
        },
        measure: {
            type: [String, Number],
            default: null
        }
    })

    const detailed = ref(false)

    insectumstore.add([
        { title: 'isloading', data: isloading },
        { title: 'divisions', data: divisions },
        // { title: 'activeIndex, detailed, selectedDivision, selectedPurchaseType, selectedScale', data: () => ({ activeIndex: activeIndex.value, detailed: detailed.value, division: selectedDivision.value, selectedPurchaseType: selectedPurchaseType.value, selectedScale: selectedScale.value }) },
    ], __name)

    nextTick(async () => {
        // is run in the 'app-initialise.js'
        // await initalise();
    })

    const initalise = async (rebuild = false) => {

        logger.trace('[initalise] start');

        await Promise.all([
            factstore.initalise(),
            // measuresstore.initalise(),
            (rebuild) ? onedigitalstore.rebuild() : onedigitalstore.initalise()
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

    // emitter.$on('index_change', (e) => {

    //     logger.debug('[index_change] e:', e);

    //     activeIndex.value = e;

    // })

    // watch([activeIndex, selectedDivision, selectedPurchaseType, selectedScale], async () => {

    //     logger.trace('[watch] start');

    //     await routerfunctions.setParams({ index: activeIndex.value, division: selectedDivision.value, purchasetype: selectedPurchaseType.value, scale: selectedScale.value })

    //     logger.trace('[watch] end');

    // })

</script>

<style lang="scss">
@import './common.scss';

.flex-grow {
    flex-grow: 1;
}
</style>