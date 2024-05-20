<template>
    <section>

        <div ref="eChart" class="onedigital-headline-chart-container" />

    </section>
</template>

<script setup>

    import * as ENV from '@t3b/app.config';
    import { nextTick, onMounted, onBeforeUnmount, computed, ref, toRaw, watch } from "vue";
    import { storeToRefs } from 'pinia'
    import * as echarts from 'echarts';

    import { newlogger } from '@t3b/lib/vue/vue-logger';
    import { toJson, getDistinct, delay } from '@t3b/lib/functions/func-general';
    import * as functions from '@t3b/lib/functions/func-general.js';
    import * as common from '@t3b/pages/common.js';

    import { insectumStore } from "@t3b/lib/stores/app-insectum";
    import { measuresStore } from "@t3b/lib/stores/data-measures";
    import { factStore } from "@t3b/lib/stores/data-fact";

    const insectumstore = insectumStore();
    const measuresstore = measuresStore();
    const factstore = factStore();

    const __name = "transactionChartCtrl"
    const logger = newlogger({ name: __name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    const { measureDetailData } = storeToRefs(measuresstore)

    const { transactionDateMin, transactionDateMax } = storeToRefs(factstore)

    const props = defineProps({
        measure: {
            type: [String],
            default: null
        },
        division: {
            type: [String],
            default: null
        },
        purchasetype: {
            type: [String],
            default: null
        },
        columns: {
            type: [Array],
            default: null
        },
        scale: {
            type: [String],
            default: null
        },
        value: {
            type: [String],
            default: null
        }
    })

    // memberTypes
    const eChart = ref(null)
    const refChart = ref(null)
    const measures = ref([])
    const segments = ref([])
    const dimensions = ref([])
    const series = ref([])

    insectumstore.add([
        { title: 'columns', data: () => props.columns },
        { title: 'dimensions', data: () => dimensions.value },
        { title: 'series', data: () => series.value },
        { title: 'measures', data: () => measures.value },
        // { title: 'measureDetailData', data: () => measureDetailData.value },
    ], __name)

    const initChart = async () => {

        if (!eChart.value) return

        refChart.value = echarts.init(eChart.value);

    }

    const destroyChart = () => {
        const chart = toRaw(refChart.value)

        if (chart) {
            chart.dispose()
            refChart.value = null
        }
    }

    const updateChart = () => {

        const chart = toRaw(refChart.value)

        if (!chart) {
            logger.warn('[updateChart] chart not defined -> return');
            return;
        }

        logger.debug('[updateChart] updating series:%s', series.value.length);

        if (!series.value || series.value.length <= 0) {
            logger.warn('[updateChart] series is blank cnt:%s', series.value.length);
            chart.clear()
            chart.setOption(blankChart)
        } else {
            chart.clear()
            chart.setOption((props.scale === 'years') ? chartOptionsYearly.value : chartOptions.value, { replaceMerge: ['xAxis', 'yAxis', 'series'] })
        }

        chartResize()

    }

    const chartResize = () => {

        const chart = toRaw(refChart.value)

        if (!chart) {
            logger.warn('[chartResize] chart not defined -> return');
            return;
        }

        chart.resize({ animation: { duration: 500 } })

    };

    nextTick(() => {

        initChart();

        builddata()

        // Await screen layout...
        // await delay(50)

        updateChart();

    })

    onMounted(() => {
        window.addEventListener('resize', chartResize);
    });

    onBeforeUnmount(() => {

        destroyChart();

        insectumstore.remove(__name)

    })

    const blankChart = {
        title: {
            show: true,
            textStyle: {
                color: 'grey',
                fontSize: 15,
                fontWeight: 'normal'
            },
            text: `${common.divisionName(props.division)} / ${common.purchaseTypeName(props.purchasetype)}\n\n No Data`,
            left: 'center',
            top: 'center'
        },
        xAxis: {
            show: false
        },
        yAxis: {
            show: false
        },
        series: []
    };

    const dimensionsNames = computed(() => {
        return (!dimensions.value) ? [] : dimensions.value.map((x) => common.formatColumnName(x).toUpperCase())
    });

    const defaultChartOptions = computed(() => {
        return {
            title: {
                text: `${common.measureName(props.measure)} - ${common.divisionName(props.division)} / ${common.purchaseTypeName(props.purchasetype)} by ${selectedValue.value}`.toUpperCase(),
                fontSize: 18,
                subtext: `Source : OnePass (${transactionDateMin.value} to ${transactionDateMax.value})`,
                fonFamily: 'Ubuntu, RobotoDraft, Helvetica, Arial, sans-serif',
                show: true,
                left: 'center',
                top: "auto"
            },
            toolbox: {
                feature: {
                    dataView: { show: true, readOnly: true },
                    saveAsImage: { show: true },
                    restore: {},
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    crossStyle: {
                        color: '#999'
                    }
                },

            },
            legend: {
                data: segments.value,
                top: "93%"
            },
            // color: ['#91cc75', '#fac858', '#5470c6', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
            color: ['#ee6666', '#fac858', '#91cc75', '#5470c6', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
            series: series.value,
        }
    });

    const chartOptions = computed(() => {
        return Object.assign({}, defaultChartOptions.value, {
            xAxis: [{
                type: 'category',
                gridIndex: 0,
                boundaryGap: false,
                data: dimensionsNames.value.filter((x) => {
                    if (x.includes('FY')) return false
                    return true
                }),

            }, {
                type: 'category',
                gridIndex: 1,
                data: dimensionsNames.value.filter((x) => {
                    if (!x.includes('FY')) return false
                    return true
                }),
            }],
            yAxis: [{
                name: 'Transaction Count',
                scale: 'value',
                min: 0,
                gridIndex: 0,
                nameLocation: 'middle',
                nameGap: 70
            },
            {
                name: 'Transaction Count (FY)',
                scale: 'value',
                position: 'right',
                min: 0,
                gridIndex: 1,
                nameLocation: 'middle',
                nameGap: 70
            }],
            grid: [{ right: '26%' }, { left: '78%' }],
        })
    });

    const chartOptionsYearly = computed(() => {
        return Object.assign({}, defaultChartOptions.value, {
            xAxis: [{
                type: 'category',
                data: dimensionsNames.value,
            }],
            yAxis: [
                {
                    name: 'Yearly Membership',
                    scale: 'value',
                    min: 0,
                    nameLocation: 'middle',
                    nameGap: 70
                }]
        }
        )
    });

    const defaultSeries = {
        type: 'line',
        smooth: true,
        label: {
            show: true,
            align: 'center',
            fontSize: 9,
            formatter: (d) => {
                return common.formatNumber(d.value);
            },
        },
        emphasis: {
            focus: 'series'
        },
        tooltip: {
            valueFormatter: (value) => (!value) ? value : (value).formatNumber(2)
        },

        data: []
    }

    const defaultBarSeries = {
        type: 'bar',
        label: {
            show: true,
            rotate: 90,
            align: 'left',
            verticalAlign: 'middle',
            position: 'insideBottom',
            fontSize: 12,
            color: "#000",
            fontWeight: 'normal',
            formatter: (d) => {
                return common.formatNumber(d.value);
            },
        }
    }

    const defaultData = {
        measure_type: "number",
        measure_precision: 2,
        measure_value: 0
    }

    const selectedScale = computed(() => (props.scale) ? props.scale : 'months')
    const selectedValue = computed(() => (props.value) ? props.value : 'value')
    watch([selectedScale, selectedValue, measureDetailData], () => {
        builddata();
    })

    watch([series], () => {

        nextTick(() => {

            updateChart();

        })
    })

    const builddata = () => {

        if (!measureDetailData.value) {
            series.value = []
            dimensions.value = []
            return;
        }

        measures.value = _(measureDetailData.value).filter(x => x.segment_index != 0).cloneDeep().map(x => {

            x.data = _.pick(x.data, props.columns)

            return x;

        })

        logger.debug('[builddata] start');

        const input = Object.assign({}, defaultData, measures.value)

        const output_dimensions = new Set()
        const output_segments = new Set()
        const output_data = new Map()
        const output_series = new Set()

        measures.value.forEach(x => {

            const segment_name = x.segment_name
            output_segments.add(segment_name)

            for (let key in x.data) {

                output_dimensions.add(key)

                const data = (output_data.has(segment_name)) ? output_data.get(segment_name) : []

                const value = getSelectedValue(x.data[key])

                // const value = (x.data[key].data['measure_value'] <= 0) ? null : x.data[key].data['measure_value']
                // const precision = x.data[key]['measure_precision']

                data.push({
                    value: value,
                    data: { column: key },
                })

                output_data.set(segment_name, data)
            }

        })

        // Create Series
        if (props.scale != 'years') {

            output_data.forEach((value, key) => {

                // logger.debug('[builddata] -> output_data value:%s', toJson(value));

                const linestyle = lineStyleByName(key);

                logger.debug('[builddata] -> output_data key:%s color:%s', key, toJson(linestyle, true));

                const leftdata = _.filter(value, x => !x['data']['column'].includes('fy'))

                output_series.add(Object.assign({}, defaultSeries, { name: key, stack: key, data: leftdata, symbol: 'circle', symbolSize: 10, itemStyle: { color: linestyle.color }, lineStyle: linestyle }))

                const rightdata = _.filter(value, x => x['data']['column'].includes('fy'))

                output_series.add(Object.assign({}, defaultSeries, defaultBarSeries, { name: key, yAxisIndex: 1, xAxisIndex: 1, data: rightdata, itemStyle: { opacity: 0.7, color: linestyle.color } }))

            })

        } else {

            output_data.forEach((value, key) => {

                // logger.debug('[builddata] -> output_data value:%s', toJson(value));

                const linestyle = lineStyleByName(key);

                output_series.add(Object.assign({}, defaultSeries, defaultBarSeries, { type: 'bar', name: key, stack: key, data: value, itemStyle: { opacity: 0.7, color: linestyle['color'] } }))

            })


        }

        dimensions.value = [...output_dimensions]
        series.value = [...output_series.values()]
        segments.value = [...output_segments]

        // logger.debug('[builddata] -> dimensions.value:%s', toJson(dimensions.value));
        // logger.debug('[builddata] -> series.value:%s', toJson(series.value));

        logger.debug('[builddata] end');


    }

    const getSelectedValue = (input) => {

        if (!input) return null

        const _input = Object.assign({}, { data: { measure_value: '-' }, facts: { member_cnt: '-', transaction_cnt: '-', revenue: '-' } }, input)

        switch (selectedValue.value) {
            case "members": return _input.facts['member_cnt'];
            case "transactions": return _input.facts['transaction_cnt'];
            case "revenue": return _input.facts['revenue'] / 100;
            default:
                return _input.data['measure_value']

        }
    }

    // color: ['#ee6666', '#fac858', '#91cc75', '#5470c6', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],

    const lineStyleByName = (name) => {
        switch (name) {
            case "low":
            case "trial":
                return { color: '#fac858', type: 'dashed', opacity: 0.7, width: 1 };

            case "member":
                return { color: '#9900f1' };

            case "non-member":
            case "below average":
                return { color: '#ee6666' };

            case "above average":
                return { color: '#91cc75' };

            case "95%":
                return { color: '#5470c6', type: 'dashed', opacity: 0.7, width: 1 };

            default: return { color: null }
        }
    }

</script>

<style lang="scss">
.onedigital-headline-chart-container {
    position: relative;
    height: 60vh;
    // width: 100%;

    margin-left: 15px;
    // border-top-width: 1px;
    // border-top-style: solid;

    &.empty {
        display: block;
        height: 75px;
        width: 100%;
        display: flex;
        justify-content: center;
    }

}
</style>