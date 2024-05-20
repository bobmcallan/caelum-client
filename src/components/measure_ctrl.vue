<template>
    <el-popover>

        <template #reference>

            <div v-if="measure_name === 'recency'">
                {{ formatData('measure_value', 'days') }}
            </div>
            <div v-else>
                {{ formatData('measure_value') }}
            </div>

        </template>

        <span class="font-size-smaller">
            <el-row>
                <el-col :span="12">Value:</el-col>
                <el-col :span="12">{{ getValue('measure_value') }}</el-col>
            </el-row>
            <el-row>
                <el-col :span="12">Average:</el-col>
                <el-col :span="12">{{ getValue('measure_avg') }}</el-col>
            </el-row>
            <el-row>
                <el-col :span="12">Median:</el-col>
                <el-col :span="12">{{ getValue('measure_med') }}</el-col>
            </el-row>
            <el-row>
                <el-col :span="12">Min:</el-col>
                <el-col :span="12">{{ getValue('measure_min') }}</el-col>
            </el-row>
            <el-row>
                <el-col :span="12">Max:</el-col>
                <el-col :span="12">{{ getValue('measure_max') }}</el-col>
            </el-row>
            <el-row>
                <el-col :span="12">Format:</el-col>
                <el-col :span="12">{{ measure_type }}</el-col>
            </el-row>
            <el-row>
                <el-col :span="12">Column:</el-col>
                <el-col :span="12">{{ column }}</el-col>
            </el-row>
            <el-row>
                <el-col :span="12">Measure:</el-col>
                <el-col :span="12">{{ measure_name }}</el-col>
            </el-row>
        </span>

    </el-popover>
</template>

<script setup>
    import { onBeforeUnmount, computed } from "vue";
    import chroma from 'chroma-js';

    import * as ENV from '@t3b/app.config';
    import { newlogger } from '@t3b/lib/vue/vue-logger';
    import { toJson } from '@t3b/lib/functions/func-general.js';

    import { insectumStore } from "@t3b/lib/stores/app-insectum";

    const insectumstore = insectumStore();

    const defaultMeasure = {
        value: 0,
        data: {
            measure_value: 0,
            measure_avg: 0,
            measure_max: 0,
            measure_med: 0,
            measure_min: 0,
            measure_percentage: 0,
            measure_precision: 0,
            measure_type: "number",
        },
        facts: {
            member_cnt: 0,
            member_cnt_percentage: 0,
            revenue_cnt: 0,
            revenue_percentage: 0,
            transaction_cnt: 0,
            transaction_cnt_percentage: 0
        }
    }

    const f = chroma.scale(['red', 'green', 'orange']);
    const __name = "measureCntrl"
    const logger = newlogger({ name: __name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    const props = defineProps({
        isloading: Boolean,
        column: String,
        data: {},
        show_percentage: Boolean
    })

    const data = computed(() => {
        return (!props.data || _.isEmpty(props.data)) ? [] : props.data
    })

    const column = computed(() => {
        // logger.debug("[_column] props.column:%s", props.column);
        return (_.isEmpty(props.column)) ? "fy23" : props.column.toLowerCase()
    })

    const measure_name = (data.value.measure_name) ? data.value.measure_name.toLowerCase() : '';
    const measure_column = computed(() => (data.value && data.value.data[column.value]) ? Object.assign({}, defaultMeasure, data.value.data[column.value]) : defaultMeasure);
    const measure_type = computed(() => (measure_column && measure_column['data']) ? measure_column['data'].measure_type : null);

    const getValue = (field) => {

        const measure_data = measure_column.value.data;

        return (!measure_data[field]) ? "NA" : measure_data[field]
    }

    const formatData = (field, format = null, precision = 0) => {

        const measure_data = measure_column.value.data;

        const _format = (!format) ? measure_data['measure_type'] : format

        if (!measure_data || !measure_data[field]) return "NA"

        // if (['month-nov-2023', 'week-48-2023'].includes(column.value)) {
        //     logger.debug('[formatData] column:%s field:%s data:%s', column.value, field, measure_data[field]);
        //     // logger.debug('[formatData] measure_data:\n%s', toJson(measure_data));
        //     // logger.debug('[formatData] measure_data:\n%s', toJson(props.data));
        // }

        switch (_format) {
            case "currency":
                return _(measure_data[field]).toNumber().divide(100).formatCurrency({ significantDigits: precision })
            case "percentage":
                return _(measure_data[field]).toNumber().formatPercentage()
            case "percentage_css":
                return percentageToColor(measure_data[field])
            case "days":
                return `${_(measure_data[field]).toNumber().formatNumber({ significantDigits: precision })} days`
            default:
                return _(measure_data[field]).toNumber().formatNumber({ significantDigits: precision })
        }
    }

    const formatFact = (field, format = null, precision = 0) => {

        const measure_facts = measure_column.value.facts;

        switch (format) {
            case "currency":
                return (!measure_facts[field]) ? "-" : _(measure_facts[field]).toNumber().divide(100).formatCurrency({ significantDigits: precision })
            case "percentage":
                return (!measure_facts[field]) ? "-" : _(measure_facts[field]).toNumber().formatPercentage()
            case "percentage_css":
                return percentageToColor(measure_facts[field])
            default:
                return (!measure_facts[field]) ? "-" : _(measure_facts[field]).toNumber().formatNumber({ significantDigits: precision })
        }
    }

    const percentageToColor = (data) => {

        const _percentage = (!data) ? 0 : _(data).toNumber()

        // No color for 100%
        if (_percentage == 1)
            return null

        return f(_percentage).css('hsl')
    }

    onBeforeUnmount(() => {
        insectumstore.remove(__name)
    })

</script>