<template>
    <section>

        <el-dialog v-model="_chartEditVisible" :title="_selectedName" width="800" @close="editCloseEvent()">

            <el-menu :default-active="_activeIndex" mode="horizontal" :ellipsis="false" @select="handleSelect">

                <el-menu-item v-for="measure in selectedMeasureDetail" :index="measure.key">
                    <el-icon><i-carbon-chart-column-floating /></el-icon>
                    {{ measure.name }}
                </el-menu-item>

            </el-menu>

            <pre class="max-h-150"><code class="language-json">{{ toJson(_selectedMeasure) }}</code></pre>

            <template #footer>
                <div class="dialog-footer">

                    <el-button @click="_chartEditVisible = false">Cancel</el-button>

                    <el-button type="primary" @click="saveChartEvent()">
                        Save
                    </el-button>
                </div>
            </template>

        </el-dialog>

    </section>

</template>

<script setup>
import * as ENV from '@t3b/app.config';
import { computed, ref, watch, nextTick, onMounted } from "vue";
import { storeToRefs } from 'pinia'
import { DateTime } from "luxon";

import emitter from '@t3b/lib/vue/vue-emitter';
import routerFunctions from "@t3b/lib/vue/vue-router-functions";
import { insectumStore } from "@t3b/lib/stores/app-insectum";
import { nuncStore } from "@t3b/lib/stores/app-nunc";

import { newlogger } from '@t3b/lib/vue/vue-logger';
import { toJson } from '@t3b/lib/functions/func-general';
import '@t3b/lib/functions/func-string';
import chartctrl from "./chart_ctrl.vue";

const _name = "page-superchart-chart-edit"
const _logger = newlogger({ name: _name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

const nuncstore = nuncStore();

const { selectedChart, selectedMeasureDetail } = storeToRefs(nuncstore)
// const { chartTypes, dataCalculations, chartScales } = storeToRefs(factstore)

const _chartEditVisible = ref()
const _editChart = ref()
const _activeIndex = ref()
const _selectedMeasure = ref()

const props = defineProps({
    visible: {
        type: [Boolean],
        default: false,
    },
})

emitter.$on('chart-edit-visible', (options = {}) => {

    const { visable, measure } = options

    _logger.debug('[event|chart-edit-visible] visable:%s measure:%s', visable, measure);

    _chartEditVisible.value = visable
    _editChart.value = selectedChart.value

    if (!_editChart.value.hasOwnProperty("measures") || !Array.isArray(_editChart.value.measures)) return;

    const _key = _.head(_editChart.value.measures)

    if (!_key || !_editChart.value.hasOwnProperty(_key)) return;

    _activeIndex.value = _key
    _selectedMeasure.value = _editChart.value[_key]
})

const handleSelect = async (key) => {
    // activePageIndex.value = key;

    _logger.debug('[handleSelect] key:%s', key);
    _logger.debug('[handleSelect] editChart:%s', toJson(_editChart.value));

}

const _selectedName = computed(() => {
    const { name, id } = _editChart?.value ?? {name :null, id:null}

    return `${name} (${id})`
})

_editChart.name + (_editChart.id)

const editCloseEvent = () => {

    _logger.debug('[editCloseEvent] closing');

}

const saveChartEvent = async () => {
    await nuncstore.saveChart()
}

</script>