<template>
    <section>

        <hr class="is-half" />

        <nav class="level">

            <div class="level-left">

                <el-space spacer="|">

                    <el-dropdown size="small" :disabled="isLoading" v-model="_indexMeasure" @command="indexMeasureEvent">

                        <el-button size="small">
                            Index : {{ _indexMeasureDetail.name }}
                        </el-button>

                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item v-for="measure in indexMeasures" :command="measure.value" :icon="Check" :class="(measure.value === _indexMeasure) ? null : 'hide-icon'">
                                    {{ measure.name }}
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>

                    </el-dropdown>

                    <el-dropdown size="small" :disabled="isLoading" v-model="_indexScale" @command="indexScaleEvent">

                        <el-button size="small">
                            Interval : {{ _indexScaleDetail.name }}
                        </el-button>

                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item v-for="scale in indexScales" :command="scale.value" :icon="Check" :class="(scale.value === _indexScale) ? null : 'hide-icon'">
                                    {{ scale.name }}
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>

                    </el-dropdown>

                    <el-dropdown size="small" :disabled="isLoading" :hide-on-click="false" @command="chartOptionsEvent">

                        <el-button size="small">
                            Chart Options {{ (chartOptionSummary) ? `: ${chartOptionSummary}` : null }}
                        </el-button>

                        <template #dropdown>

                            <el-dropdown-menu class="w-60">
                                <p class="pl-2 py-2 my-0 text-blue-800 bg-gray-100 font-normal">Index Measures</p>
                                <hr class="h-px my-0 bg-gray-200 border-0 dark:bg-gray-700">

                                <el-dropdown-item v-for="type in chartTypes" :command="{ type: type.value }" :icon="Check" :class="(type.value === chartType) ? null : 'hide-icon'">
                                    <span :class="(type.value === chartType) ? 'font-bold' : null">{{ type.name }}</span>
                                </el-dropdown-item>

                                <hr class="h-px my-0 mb-1 bg-gray-100 border-0 dark:bg-gray-700">

                                <el-dropdown-item v-for="scale in yAxisScales" :command="{ yaxis: scale.value }" :icon="Check" :class="(scale.value === yAxisType) ? null : 'hide-icon'">
                                    {{ scale.name }}
                                </el-dropdown-item>

                                <el-dropdown-item :icon="Check" :command="{ scaled: !_chartScaled }" :class="(_chartScaled) ? null : 'hide-icon'" divided>
                                    <span :class="(_chartScaled) ? 'font-bold' : null">Scaled</span>
                                </el-dropdown-item>

                                <el-dropdown-item :icon="Check" :command="{ labels: !_chartLabels }" :class="(_chartLabels) ? null : 'hide-icon'" divided>
                                    <span :class="(_chartLabels) ? 'font-bold' : null">Labels</span>
                                </el-dropdown-item>

                                <el-dropdown-item :icon="Check" :command="{ avg: !_chartAverage }" :class="(_chartAverage) ? null : 'hide-icon'" divided>
                                    <span :class="(_chartAverage) ? 'font-bold' : null">Show Average</span>
                                </el-dropdown-item>

                                <hr class="h-px my-0 bg-gray-200 border-0 dark:bg-gray-700">
                                <p class="pl-2 py-2 my-0 text-blue-800 bg-gray-100 font-normal">Attribution Measures</p>
                                <hr class="h-px my-0 bg-gray-200 border-0 dark:bg-gray-700">

                                <el-dropdown-item v-for="type in _attChartTypes" :command="{ alttype: type.value }" :icon="Check" :class="(type.value === attChartType) ? null : 'hide-icon'">
                                    <span :class="(type.value === attChartType) ? 'font-bold' : null">{{ type.name }}</span>
                                </el-dropdown-item>

                                <el-dropdown-item :icon="Check" :command="{ attscaled: !_attScaled }" :class="(_attScaled) ? null : 'hide-icon'" divided>
                                    <span :class="(_attScaled) ? 'font-bold' : null">Scaled</span>
                                </el-dropdown-item>

                            </el-dropdown-menu>

                        </template>

                    </el-dropdown>

                </el-space>

            </div>

            <div class="level-right">

                <el-space>

                    <el-dropdown size="small" :disabled="isLoading" @command="attributionMeasureEvent">

                        <el-button size="small">
                            Attributions :<span :class="(_selectedAttributions.filter(x => x != 'none').length > 0) ? 'text-red-500' : null" class="pl-1">{{ _selectedAttributions.filter(x => x != 'none').length }}</span>
                        </el-button>

                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item v-for="measure in attributionMeasures" :command="measure.value" :icon="Check" :class="((_selectedAttributions.includes(measure.value))) ? null : 'hide-icon'">
                                    {{ measure.name }}
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>

                    </el-dropdown>

                </el-space>

            </div>

        </nav>
        <nav class="level">

            <div class="level-left">

                <el-space>

                    <el-dropdown size="small" :disabled="isLoading" @command="cohortEvent">

                        <el-button size="small">
                            Cohorts :<span :class="(_selectedCohorts.length > 0) ? 'text-red-500' : null" class="pl-1">{{ _selectedCohorts.length }}</span>
                        </el-button>

                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item v-for="cohort in indexCohorts" :command="cohort.value" :icon="Check" :class="((_selectedCohorts.includes(cohort.value))) ? null : 'hide-icon'">
                                    {{ cohort.name }}
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>

                    </el-dropdown>

                    <!-- <el-checkbox-group v-model="_indexCohort" size="small" class="checkbox-group-dark">
                        <el-checkbox-button v-for="index in indexCohorts" :key="index.value" :value="index.value">{{ index.name }}</el-checkbox-button>
                    </el-checkbox-group> -->

                    <el-checkbox-group v-model="_selectedDivisions" size="small" class="checkbox-group-blue">
                        <el-checkbox-button v-for="division in _divisionList" :key="division.value" :value="division.value">{{ division.name }}</el-checkbox-button>
                    </el-checkbox-group>

                    <el-checkbox-group v-model="_selectedPurchaseTypes" size="small" class="checkbox-group-red">
                        <el-checkbox-button v-for="purchasetype in _purchaseTypesList" :key="purchasetype.value" :value="purchasetype.value">{{ purchasetype.name }}</el-checkbox-button>
                    </el-checkbox-group>

                </el-space>

            </div>

            <div class="level-right">

                <el-space>

                    <el-button @click="downloadChartEvent" size="small" :icon="Download"></el-button>

                    <el-button @click="refreshEvent()" size="small">
                        <el-icon :class="isLoading ? 'is-loading is-loading-red' : ''" :disabled="isLoading">
                            <i-carbon-renew />
                        </el-icon>
                    </el-button>

                </el-space>

            </div>

        </nav>

    </section>

    <hr class="is-half" />

    <chartctrl />

    <hr class="is-spacer" />

    <insectum />
</template>

<script setup>
import * as ENV from '@t3b/app.config';
import { Check, Download, SortDown } from '@element-plus/icons-vue'
import { computed, ref, watch, nextTick, onMounted } from "vue";

import { storeToRefs } from 'pinia'

import emitter from '@t3b/lib/vue/vue-emitter';
import { insectumStore } from "@t3b/lib/stores/app-insectum";
import { nuncStore } from "@t3b/lib/stores/app-nunc";
import { factStore } from "@t3b/lib/stores/data-fact";

import { newlogger } from '@t3b/lib/vue/vue-logger';
import { toJson } from '@t3b/lib/functions/func-general';
import chartctrl from "./chart_ctrl.vue";

const __name = "superchart-index"
const logger = newlogger({ name: __name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

const insectumstore = insectumStore();
const nuncstore = nuncStore();
const factstore = factStore();

const { indexScales, yAxisScales, chartTypes, indexMeasures, indexCohorts, attributionMeasures } = storeToRefs(factstore)
const { isLoading, selectedOptions, selectedIndexCohorts, selectedAttributions, selectedDivisions, selectedPurchaseTypes, selectedIndexMeasure, selectedChartOptions, selectedScale, yAxisType, chartType, attChartType, chartOptionSummary } = storeToRefs(nuncstore)

const _indexScale = ref()
const _yAxisScale = ref()
const _selectedChartOptions = ref()

const _chartAverage = computed(() => nuncstore.chartAverage)
const _chartLabels = computed(() => nuncstore.chartLabels)
const _chartScaled = computed(() => nuncstore.chartScaled)
const _attScaled = computed(() => nuncstore.attScaled)

const _indexMeasure = ref()
const _indexCohorts = ref()
const _attributionMeasures = ref()

const _selectedDivisions = ref()
const _selectedPurchaseTypes = ref()

const _divisionList = computed(() => factstore.divisions)
const _purchaseTypesList = computed(() => factstore.purchaseTypes)
const _attChartTypes = computed(() => chartTypes.value.filter(x => x.value != 'change'))

const _indexMeasureDetail = computed(() => {

    if (!indexMeasures.value) return { name: '', value: '' }
    if (!_indexMeasure.value) return _.head(indexMeasures.value)

    return indexMeasures.value.find(x => x.value === _indexMeasure.value)
})

const _indexScaleDetail = computed(() => {

    if (!indexScales.value) return { name: '', value: '' }
    if (!_indexScale.value) return _.head(indexScales.value)

    return indexScales.value.find(x => x.value === _indexScale.value)
})

const _selectedCohorts = computed(() => {
    const _valid = indexCohorts.value.map(x => x.value)
    return _.intersection(_valid, _.toArray(_indexCohorts.value))
})

const _selectedAttributions = computed(() => {
    const _valid = attributionMeasures.value.map(x => x.value)
    return _.intersection(_valid, _.toArray(_attributionMeasures.value))
})

const indexMeasureEvent = (command) => {
    _indexMeasure.value = command
}

const indexScaleEvent = (command) => {
    _indexScale.value = command
}

const chartOptionsEvent = (input) => {

    logger.trace('[chartOptionsEvent]\ninput:%s\n_chartOptions.value:%s', toJson(input), toJson(_selectedChartOptions.value));

    _selectedChartOptions.value = { ..._selectedChartOptions.value, ...input }

    logger.trace('[chartOptionsEvent]\ninput:%s\n_chartOptions.value:%s', toJson(input), toJson(_selectedChartOptions.value));

}

const cohortEvent = (input) => {

    logger.trace('[cohortEvent] input:%s _indexCohorts.value:%s', input, _indexCohorts.value);

    if (_indexCohorts.value.includes(input)) {
        // Remove
        _indexCohorts.value = _.pull(_indexCohorts.value, input)

    } else {
        // Add
        _indexCohorts.value = _.union(_indexCohorts.value, [input]);

    }

    if (_indexCohorts.value.length === 0) {
        _indexCohorts.value = ['all']
    }

    logger.trace('[cohortEvent] output:%s', _indexCohorts.value);

}


const attributionMeasureEvent = (input) => {

    logger.trace('[attributionMeasureEvent] input:%s _attributionMeasures.value:%s', input, _attributionMeasures.value);

    if (input === 'none') {
        _attributionMeasures.value = ['none']
        return;
    }

    if (_attributionMeasures.value.includes(input)) {
        // Remove
        _attributionMeasures.value = _.pull(_attributionMeasures.value, input)

    } else {
        // Add
        _attributionMeasures.value = _.union(_attributionMeasures.value, [input]).filter(x => x != 'none');

    }

    if (_attributionMeasures.value.length === 0) {
        _attributionMeasures.value = ['none']
    }

    logger.trace('[attributionMeasureEvent] output:%s', _attributionMeasures.value);

}

const refreshEvent = () => {
    emitter.$emit('refresh', false)
}

const downloadChartEvent = () => {
    emitter.$emit('downloadChart', true)
}

nextTick(() => {

    logger.trace('[nextTick] start selectedOptions:\n%s', toJson(selectedOptions.value));

    _indexCohorts.value = selectedIndexCohorts.value
    _selectedDivisions.value = selectedDivisions.value
    _selectedPurchaseTypes.value = selectedPurchaseTypes.value
    _indexScale.value = selectedScale.value
    _indexMeasure.value = selectedIndexMeasure.value
    _attributionMeasures.value = selectedAttributions.value
    _selectedChartOptions.value = selectedChartOptions.value

    logger.trace('[nextTick] end selectedOptions:\n%s', toJson(selectedOptions.value));

})

insectumstore.add([
    { title: 'selectedOptions', data: () => ({ selectedOptions: selectedOptions.value }) },
    // { title: 'chartOptions', data: () => ({ _selectedChartOptions: _selectedChartOptions.value }) },
    // { title: 'chartAverage', data: () => ({ _chartAverage: _chartAverage.value }) },
], __name)

watch([_indexMeasure, _indexCohorts, _indexScale, _yAxisScale, _selectedDivisions, _selectedPurchaseTypes, _attributionMeasures, _selectedChartOptions],
    () => {

        logger.trace('[watch|localvariables] START');

        const input = {
            cohorts: _indexCohorts.value.join(','),
            measure: _indexMeasure.value,
            divisions: _selectedDivisions.value.join(','),
            purchasetypes: _selectedPurchaseTypes.value.join(','),
            scale: _indexScale.value,
            attrib: _attributionMeasures.value.join(','),
            chart: _selectedChartOptions.value,
        }

        logger.debug('[watch|localvariables] calling setOptions -> input:%s', toJson(input));

        nuncstore.setOptions(input)

        logger.trace('[watch|*] COMPLETE selectedOptions:%s', toJson(selectedOptions.value));


    },
    { deep: true }
)

</script>

<style lang="scss">
@import '../common.scss';

.el-dropdown-menu--small {
    .el-dropdown-menu__item {
        padding-left: 10px;
        padding-right: 20px;

        &.hide-icon {
            i.el-icon {
                color: transparent;
            }
        }
    }
}
</style>