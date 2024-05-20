<template>
    <section>

        <el-drawer v-model="_measureDrawer" :show-close="false" size="40%">

            <template #header="{ close, titleId, titleClass }">
                <h4 :id="titleId" :class="titleClass">{{ _measure.name }} ({{ _measure.key }})</h4>
                <el-button @click="close" :icon="Close" size="small"></el-button>
            </template>

            <hr class="h-px my-1 bg-gray-200 border-0 dark:bg-gray-700">

            <el-form :model="_measure" label-width="auto" label-position="left" class="pt-2" size="small">

                <el-form-item label="Filter">

                    <!-- <el-input v-model="_measure.filter" :placeholder="_measure.filter" v-on:keyup.enter="measureOptionsEvent({ key: _measure.key, filter: _measureFilter[measure.key] })" /> -->

                    <el-input v-model="_measure.filter" :placeholder="_measure.filter" clearable />

                </el-form-item>

                <el-form-item label="Chart Type" class="pt-1">

                    <el-select v-model="_measure.charttype" placement="bottom" :placeholder="_measure.charttype">
                        <el-option v-for="item in chartTypes" :key="item.value" :label="item.name" :value="item.value" class="select_item" />
                    </el-select>

                </el-form-item>

                <el-form-item label="Stacked" class="pt-1">

                    <el-switch v-model="_measure.stack" />

                </el-form-item>

                <el-form-item label="Area" class="pt-1">

                    <el-switch v-model="_measure.area" />

                </el-form-item>

                <el-form-item label="Calculation" class="pt-1">

                    <el-select v-model="_measure.datacalc" clearable placement="bottom" :placeholder="_measure.datacalc">
                        <el-option v-for="item in _dataCalculations" :key="item.value" :label="item.label" :value="item.value" class="select_item" />
                    </el-select>

                </el-form-item>

                <el-form-item label="Y-Axis" class="pt-1">

                    <el-select v-model="_measure.position" placement="bottom" :placeholder="_measure.position" class="mb-3">
                        <el-option v-for="item in _chartPositions" :key="item" :label="item.capitalize()" :value="item" class="select_item" />
                    </el-select>

                    <el-select v-model="_measure.yaxis" placement="bottom" :placeholder="_measure.yaxis">
                        <el-option v-for="item in _yAxisTypes" :key="item" :label="item.capitalize()" :value="item" class="select_item" />
                    </el-select>

                </el-form-item>

                <el-form-item label="Labels" class="pt-1">

                    <el-switch v-model="_measure.labels" />

                </el-form-item>

                <el-form-item label="End Labels" class="pt-1">

                    <el-switch v-model="_measure.end" />

                </el-form-item>

                <el-form-item label="Show Average" class="pt-1">

                    <el-switch v-model="_measure.avg" />

                </el-form-item>

                <hr class="h-px my-1 mb-2 bg-gray-200 border-0 dark:bg-gray-700">

                <pre class="max-h-50"><code class="language-json">{{ _rawChart }}</code></pre>

            </el-form>

        </el-drawer>

        <el-dialog v-model="_chartEditVisible" title="Edit Chart" width="800" @close="editCloseEvent()">

            <el-row :gutter="20" class="py-1">
                <el-col :span="4" class="text-right uppercase">Id</el-col>
                <el-col :span="20">
                    <div class="color-red-8">{{ _editChart.id }}</div>
                </el-col>
            </el-row>

            <el-row :gutter="20" class="py-1">
                <el-col :span="4" class="text-right uppercase">TimeStamp</el-col>
                <el-col :span="20">
                    <div class="color-red-8">{{ convertTimestamp(_editChart.timestamp) }}</div>
                </el-col>
            </el-row>

            <el-row :gutter="20" class="py-1 ">
                <el-col :span="4" class="text-right uppercase">Name</el-col>
                <el-col :span="20">
                    <el-input v-model="_editChart.name" autocomplete="off" @keyup.enter="saveChartEvent();" />
                </el-col>
            </el-row>

            <el-row :gutter="20" class="py-1 ">
                <el-col :span="4" class="text-right uppercase">Json</el-col>
                <el-col :span="20">
                    <pre class="max-h-50"><code class="language-json">{{ _rawChart }}</code></pre>
                </el-col>
            </el-row>

            <el-row :gutter="20" class="py-1 " v-if="_message != null">
                <el-col :span="4" class="text-right uppercase">Name</el-col>
                <el-col :span="20">
                    <div class="color-red-5">{{ _message }}</div>
                </el-col>
            </el-row>

            <template #footer>
                <div class="dialog-footer">

                    <el-button @click="chartDownload();">
                        Download Configuration
                    </el-button>

                    <el-button @click="_chartEditVisible = false">Cancel</el-button>

                    <el-button type="danger" @click="deleteChartEvent(); chartEditVisible = false">
                        Delete
                    </el-button>

                    <el-button type="primary" @click="saveChartEvent()">
                        Save
                    </el-button>
                </div>
            </template>
        </el-dialog>

    </section>

    <section>

        <hr class="is-half" />

        <nav class="level">

            <div class="level-left">

                <el-space spacer="|" class="top-menu-spacer">

                    <el-dropdown size="small" split-button @click="saveChartEvent(true)">
                        <i-carbon-dot-mark v-if="!isSaved" class="pl-0px ml-0px mr-5px" style="color:var(--color-primary)" />
                        <span style="overflow: hidden;  text-overflow: ellipsis;">{{ selectedChart.name }}</span>

                        <template #dropdown>

                            <el-dropdown-menu>

                                <p :class='dropdownHeading'>Chart Configuration</p>

                                <el-dropdown-item @click="editChartEvent()">
                                    <i-carbon-edit class="pl-0px ml-0px mr-10px color-blue-8" />
                                    Edit Configuration
                                </el-dropdown-item>
                                <el-dropdown-item @click="copyChartEvent();">
                                    <i-carbon-copy class="pl-0px ml-0px mr-10px color-red-8" />
                                    Copy Configuration
                                </el-dropdown-item>
                                <el-dropdown-item @click="newChartEvent();">
                                    <i-carbon-add-large class="pl-0px ml-0px mr-10px color-purple-8" />
                                    New Configuration
                                </el-dropdown-item>

                                <p :class='dropdownHeading'>Recent Chart Configurations</p>

                                <el-dropdown-item class="menu-with-icon" v-for="chart in savedCharts.slice(0, 20)" @click="selectChartEvent(chart.id)">
                                    <i-carbon-arrow-right class="pl-0px ml-0px mr-5px" :style='(chart.id === selectedChartId) ? "color:var(--color-primary)" : "color:var(--color-transparent)"' />
                                    <span>{{ chart.name }}</span>
                                </el-dropdown-item>

                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>

                    <el-dropdown size="small" :disabled="isLoading" @command="scaleEvent">

                        <el-button size="small">
                            Interval : {{ _scaleDetail.name }}
                        </el-button>

                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item v-for="scale in chartScales" :command="scale.value" class="menu-with-icon">
                                    <i-carbon-checkmark class="pl-0px ml-0px mr-5px" :class="(scale.value === _selectedScale) ? null : 'hide-icon'" />
                                    {{ scale.name }}
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>

                    </el-dropdown>

                    <el-dropdown size="small" :disabled="isLoading" @command="measureAddEvent" :hide-on-click="false">

                        <el-button size="small" class="pl-1">
                            <i-carbon-add class="mr-2px" />
                            Measure
                        </el-button>

                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item v-for="measure in _measuresList" :command="measure.value" class="menu-with-icon">
                                    <i-carbon-add-filled class="pl-0px ml-0px mr-5px" v-if="(selectedMeasureDetail.map(x => x.value).includes(measure.value))" />
                                    <i-carbon-add class="pl-0px ml-0px mr-5px" v-else />
                                    {{ measure.name }}
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>

                    </el-dropdown>

                </el-space>

            </div>

            <div class="level-right">

                <el-space>

                    <span v-for="measure in selectedMeasureDetail">
                        <el-button-group size="small">
                            <el-button @click="measureOpenEvent(measure.key)">{{ measure.name }}</el-button>
                            <el-button :icon="Close" @click="measureRemoveEvent(measure.key)" />
                        </el-button-group>
                    </span>

                </el-space>

            </div>

        </nav>

        <nav class="level">

            <div class="level-left">

                <el-space>

                    <el-dropdown size="small" :disabled="isLoading" :hide-on-click="false" @command="cohortEvent">

                        <el-button size="small">
                            Cohorts :<span :class="(_selectedCohorts.length > 0) ? 'text-red-500' : null" class="pl-1">{{ _selectedCohorts.length }}</span>
                        </el-button>

                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item v-for="cohort in _cohortList" :command="cohort.value" class="menu-with-icon">
                                    <i-carbon-checkmark class="pl-0px ml-0px mr-5px" :class="(_selectedCohorts.includes(cohort.value)) ? null : 'hide-icon'" />
                                    {{ cohort.name }}
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>

                    </el-dropdown>

                    <el-checkbox-group v-model="_divisions" size="small" class="checkbox-group-blue" @change="divisionEvent">
                        <el-checkbox-button v-for="division in _divisionList" :key="division.value" :value="division.value">{{ division.name }}</el-checkbox-button>
                    </el-checkbox-group>

                    <el-checkbox-group v-model="_purchasetypes" size="small" class="checkbox-group-red" @change="purchasetypeEvent">
                        <el-checkbox-button v-for="purchasetype in _purchaseTypesList" :key="purchasetype.value" :value="purchasetype.value">{{ purchasetype.name }}</el-checkbox-button>
                    </el-checkbox-group>

                </el-space>

            </div>

            <div class="level-right">

                <el-space>

                    <el-button @click="toggleChartDetailEvent" size="small" Paperclip>
                        <el-icon :class="showChartDetail ? 'text-green-500' : ''" :disabled="isLoading">
                            <i-carbon-align-box-top-left />
                        </el-icon>
                    </el-button>

                    <el-button @click="downloadChartEvent" size="small" :icon="Download"></el-button>

                    <el-button @click="downloadDataEvent" size="small" :icon="Document"></el-button>

                    <el-button @click="refreshEvent()" size="small">
                        <el-icon :class="isLoading ? 'is-loading is-loading-red' : ''" :disabled="isLoading">
                            <i-carbon-renew />
                        </el-icon>
                    </el-button>

                </el-space>

            </div>

        </nav>

    </section>

    <hr class="h-px mt-4 mb-4 bg-gray-200 border-0 dark:bg-gray-700">

    <chartctrl />

    <hr class="is-spacer" />

    <insectum />
</template>

<script setup>
import * as ENV from '@t3b/app.config';
import { Check, Download, Document, CirclePlus, Close, Paperclip } from '@element-plus/icons-vue'
import { computed, ref, watch, nextTick, onMounted } from "vue";
import { storeToRefs } from 'pinia'
import { DateTime } from "luxon";

import emitter from '@t3b/lib/vue/vue-emitter';
import routerFunctions from "@t3b/lib/vue/vue-router-functions";
import { insectumStore } from "@t3b/lib/stores/app-insectum";
import { nuncStore } from "@t3b/lib/stores/app-nunc";
import { superChartStore } from "@t3b/lib/stores/data-superchart";
import { factStore } from "@t3b/lib/stores/data-fact";

import { newlogger } from '@t3b/lib/vue/vue-logger';
import { toJson } from '@t3b/lib/functions/func-general';
import { convertTimestamp } from '@t3b/lib/functions/func-dates';
import { downloadUrl } from '@t3b/pages/common.js';
import '@t3b/lib/functions/func-string';

import chartctrl from "./chart_ctrl.vue";
import editctrl from "./chart_edit.vue";

const _name = "page-superchart-index"
const _logger = newlogger({ name: _name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

const insectumstore = insectumStore();
const factstore = factStore();
const nuncstore = nuncStore();
const superchartstore = superChartStore();
const routerfunctions = routerFunctions();

const isLoading = computed(() => factstore.isLoading || superchartstore.isLoading || nuncstore.isLoading)
const props = defineProps({
    index: {
        type: [String, Number],
        default: "superchart",
    },
    id: {
        type: [String, Number],
        default: null
    }
})

const { savedCharts, selectedChart, selectedChartId, selectedMeasures, selectedMeasureDetail, showChartDetail, isSaved } = storeToRefs(nuncstore)
const { chartTypes, dataCalculations, chartScales } = storeToRefs(factstore)

// UI
const _divisions = ref([])
const _purchasetypes = ref([])

const _chartEditVisible = ref()
const _editChart = ref({})
const _measureFilter = ref({})

const _measureDrawer = ref(false)
const _measure = ref({})

const _message = ref()
const _error = ref()

const dropdownHeading = "pr-5 py-2 text-xs text-slate-400 uppercase"

// const _selectedChartName = computed(() => {
//     const { name } = selectedChart.value ?? { name: '' }
//     return name ?? ''
// })

const _selectedCohorts = computed(() => {
    const { cohorts } = selectedChart.value ?? { cohorts: ['all'] }
    return cohorts ?? ['all']
})

const _selectedScale = computed(() => {
    const { scale } = selectedChart.value ?? { scale: ['weeks'] }
    return scale ?? 'weeks'
})

const _rawChart = computed(() => {
    return nuncstore.rawChart
})

const _chartPositions = ['right', 'left', 'none']
const _yAxisTypes = ['value', 'scaled', 'log']
const _dataCalculations = [
    { value: 'none', label: 'None' },
    { value: 'change', label: '% Change' },
    { value: 'normalised', label: 'Normalised' }
]

const value = ref('')

const _measuresList = computed(() => factstore.measures)
const _cohortList = computed(() => factstore.cohorts)
const _divisionList = computed(() => factstore.divisions)
const _purchaseTypesList = computed(() => factstore.purchaseTypes)
const _scaleDetail = computed(() => {

    if (!chartScales.value) return { name: '', value: '' }
    if (!_selectedScale.value) return _.head(chartScales.value)

    return chartScales.value.find(x => x.value === _selectedScale.value)
})

onMounted(async () => {

    _logger.debug('[onMounted] props:%s', toJson(props, true));

    await nuncstore.getLatestChart(props.id)

    selectedMeasureDetail.value.forEach(measure => {

        const { key, filter } = measure ?? { key: null, filter: null }

        _measureFilter.value[key] = _.isNil(filter) ? null : filter

        //_logger.debug('[onMounted] key:%s filter:%s', key, _measureFilter.value[key]);
    })

    //_logger.debug('[onMounted] _measureFilter:%s', toJson(_measureFilter.value, true));

});

const chartDownload = async () => {

    const { name } = selectedChart.value ?? { name: 'vide-chart' }

    const output = JSON.stringify([nuncstore.rawChart])

    _logger.debug('[chartDownload] output:%s', toJson(nuncstore.rawChart));

    if (_.isEmpty(output)) {
        _logger.warn('[chartDownload] Nothing comming back?? rawChart:%s', nuncstore.rawChart);
        return
    }

    const blob = new Blob([output], { type: 'application/json;charset=utf-8' });

    const downloadableUrl = URL.createObjectURL(blob);

    const datetime = DateTime.local().toFormat('yy-MMM-dd-HHmm');

    const downloadName = `${name}_${datetime}.json`

    await downloadUrl(downloadableUrl, downloadName)

}
const measureOpenEvent = (key) => {

    _logger.trace('[measureOpenEvent] key:%s', key);

    if (_.isNil(key)) return;

    _measure.value = selectedChart.value[key]

    _measureDrawer.value = true;

}

const measureAddEvent = (input) => {

    _logger.trace('[measureEvent] input:%s selectedMeasures:%s', input, toJson(selectedMeasures.value));

    if (!input || input === 'none') {
        return;
    }

    const _measure = _measuresList.value.find(x => x.value === input)

    if (!_measure) {
        _logger.warn('[measureEvent] measure not found ?? input:%s', input);
        return
    }

    const _measureId = nuncstore.generateId()

    // Add Measure to Index
    const { measures } = selectedChart.value ?? { measures: [] }
    _(measures).push(_measureId).uniq().value()

    // Add Measure to selectedChart
    selectedChart.value[_measureId] = { ..._measure, key: _measureId }

}

const measureRemoveEvent = (input) => {

    if (!input) {
        return;
    }

    // Remove from Measure Index
    const { measures } = selectedChart.value ?? { measures: [] }
    _(measures).pull(input).uniq().value()

    // Remove Measure to selectedChart && selectedMeasureDetail
    delete selectedChart.value[input]

}

const measureOptionsEvent = (input) => {

    _logger.trace('[measureOptionsEvent] input:%s', toJson(input));

    if (_.isNil(input.key)) return;

    const key = input.key
    const measure = selectedChart.value[key]

    _logger.trace('[measureOptionsEvent] measure:%s', toJson(measure));

    const update = _.omit(input, 'key')

    for (const [key, value] of Object.entries(update)) {
        measure[key] = value
    }

}

const scaleEvent = (input) => {
    selectedChart.value.scale = (!input || !['months', 'weeks', 'days'].includes(input)) ? 'weeks' : input;
}

const cohortEvent = (input) => {

    const { cohorts } = selectedChart.value ?? { cohorts: ['all'] }

    if (cohorts.includes(input)) {
        _.pull(cohorts, input)
    } else {
        _(cohorts).push(input).uniq().value();
    }

    // default 
    if (cohorts.length === 0) {
        cohorts.push('all')
    }

}

const divisionEvent = (input) => {

    const { divisions } = selectedChart.value ?? { divisions: ['all'] }

    divisions.splice(0, divisions.length, ...input);

    // default 
    if (divisions.length === 0) {
        divisions.push('all')
    }

}

const purchasetypeEvent = (input) => {

    const { purchasetypes } = selectedChart.value ?? { purchasetypes: ['all'] }

    purchasetypes.splice(0, purchasetypes.length, ...input);

    // default 
    if (purchasetypes.length === 0) {
        purchasetypes.push('all')
    }

}

const refreshEvent = () => {
    emitter.$emit('refresh', false)
}

const downloadChartEvent = () => {
    emitter.$emit('downloadChart', true)
}

const downloadDataEvent = () => {
    emitter.$emit('downloadData', true)
}

const toggleChartDetailEvent = () => {

    selectedChart.value['detail'] = (!selectedChart.value.hasOwnProperty("detail")) ? true : !selectedChart.value['detail']
    _logger.debug('[toggleChartDetailEvent] selectedChart.value:%s', selectedChart.value['title']);
}

const selectChartEvent = async (id = null) => {

    if (!id || id === null) {
        return;
    }

    if (id === selectedChartId.value) {
        return;
    }

    await nuncstore.getLatestChart(id)

}

const saveChartEvent = async (immeditate = false) => {

    // _logger.debug('[saveChartEvent] immeditate:%s', immeditate);
    // _logger.debug('[saveChartEvent] _editChart\n:%s', toJson(_editChart.value));
    // _logger.debug('[saveChartEvent] selectedChart\n:%s', toJson(selectedChart.value));

    // if (!_editChart.value || !_.isEqual(_editChart.value, selectedChart.value)) {
    //     _logger.warn('[saveChartEvent] No updated, but saving anyway');
    // }

    // immeditate/instant save, saves the current chart (not the edited).
    selectedChart.value = (immeditate) ? selectedChart.value : { ..._editChart.value }

    await nuncstore.saveChart()

    _chartEditVisible.value = false;

}

const editChartEvent = () => {
    _editChart.value = { ...selectedChart.value }
    _chartEditVisible.value = true;
}

const editCloseEvent = () => {
    _editChart.value = { id: null, name: null, timestamp: null }
}

const copyChartEvent = async () => {
    _editChart.value = { ...selectedChart.value, id: null, name: selectedChart.value.name.concat(" (copy)") }
    _chartEditVisible.value = true;
}

const newChartEvent = async () => {
    _editChart.value = { ...await nuncstore.newChart() }
    _chartEditVisible.value = true;
}

const deleteChartEvent = async () => {

    const result = await nuncstore.deleteChart()

    if (result.status) {

        await nuncstore.getLatestChart()

        _chartEditVisible.value = false;

        return

    }

    _message.value = "Delete Not Successfull"
    _error.value = result.error

}

watch(selectedChart, (newValue, oldValue) => {

    if (_.isNil(newValue)) return;

    const { id: newId } = newValue ?? { id: null }
    const { id: oldId } = oldValue ?? { id: null }

    const { divisions, purchasetypes } = newValue

    // Update UI Models
    _divisions.value = divisions ?? ['all']
    _purchasetypes.value = purchasetypes ?? ['all']

    if (!_.isEqual(newId, oldId)) {

        _logger.trace('[watch|selectedChart] Id Update old:%s new:%s', oldId), newId;

        routerfunctions.setParams({ index: props.index, id: selectedChartId.value })

    }
},
    // Required for page load & watch changes (also vite refresh)
    { immediate: true }
)

insectumstore.add([
    // { title: 'selectedChart', data: () => selectedChart.value },
    // { title: 'savedCharts', data: () => savedCharts.value },
    // { title: 'selectedMeasures', data: () => selectedMeasures.value },
], _name)

</script>

<style lang="scss">
@import '../common.scss';

.el-drawer__header {
    margin-bottom: 5px;
}

.el-drawer__body {
    padding-top: 5px;
}

.el-form-item__label {
    text-transform: uppercase;
    color: slateblue;
}

.el-dropdown-menu__item {
    padding-left: 8px !important;
}

.select_item {
    padding-left: 10px;
    font-size: 1em;
    height: 20px;
    line-height: 20px;
}

.menu-with-icon {

    .hide-icon {
        color: transparent;

        i.el-icon {
            color: transparent;
        }
    }
}

.input-button-warning {
    span {
        color: var(--color-primary);
    }
}

.top-menu-spacer {
    color: var(--color-ltgrey);
    font-size: 20px;
    padding-left: 1px;
    padding-right: 1px;
    margin-left: 1px;
    margin-right: 1px;

}
</style>