<template>
    <section>

        <div ref="eChart" :class="measureChartClass" />

    </section>
</template>

<script setup>

    import * as ENV from '@t3b/app.config';
    import { onMounted, onBeforeUnmount, computed, ref, toRaw, watch } from "vue";
    import * as echarts from 'echarts';

    import { newlogger } from '@t3b/lib/vue/vue-logger';

    import { measuresStore } from "@t3b/lib/stores/data-measures";
    import { factStore } from "@t3b/lib/stores/data-fact";

    import * as utils from '@t3b/pages/common.js';
    import * as functions from '@t3b/lib/functions/func-general.js';
    import { } from '@t3b/lib/functions/func-string';

    const __name = "measureChartCntrl"
    const logger = newlogger({ name: __name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    const measuresstore = measuresStore();
    const factstore = factStore();

    const measuredetail = computed(() => measuresstore.measureDetailData)
    const isloading = computed(() => measuresstore.isLoading)

    const transactionDateMin = computed(() => factstore.transactionDateMin)
    const transactionDateMax = computed(() => factstore.transactionDateMax)

    const props = defineProps({
        measure: {
            type: [String],
            default: 'measure'
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
        }
    })

    const columns = computed(() => (!props.columns || !_.isArray(props.columns)) ? [] : props.columns)
    const scale = computed(() => (!props.scale) ? null : props.scale)
    const measureChartClass = computed(() => `measure-chart-container measure-chart-${props.measure}`)

    const chartColumnNames = computed(() => {
        return chartColumns.value.map((x) => utils.formatColumnName(x).toUpperCase())
    });

    const chartColumns = computed(() => {
        return columns.value.filter((x) => {
            switch (scale.value) {
                case 'months':
                case 'weeks':
                    return true

                case 'years':
                    return (x.includes('all')) ? false : true
            }
            return true;
        })
    });

    const eChart = ref(null)
    const refChart = ref(null)

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

        // logger.debug('[updateChart] updating chartseries:%s', chartSeries.value.length);

        if (chartSeries.value.length <= 0) {
            chart.clear()
            chart.setOption(blankChart)
        } else {
            chart.clear()
            if (scale.value == 'years')
                chart.setOption(yearly_chartOptions.value, { replaceMerge: ['xAxis', 'yAxis', 'series'] })
            else
                chart.setOption(chartOptions.value, { replaceMerge: ['xAxis', 'yAxis', 'series'] })

            // chart.setOption(chartOptions.value, { replaceMerge: ['xAxis', 'yAxis', 'series'] })
        }

    }

    onMounted(() => {

        initChart();

        updateChart();

    })

    onBeforeUnmount(() => {

        destroyChart()

    })

    const blankChart = {
        title: {
            show: true,
            textStyle: {
                color: 'grey',
                fontSize: 15,
                fontWeight: 'normal'
            },
            text: `Member ${props.measure.capitalize()} - ${utils.divisionName(props.division)} / ${utils.purchaseTypeName(props.purchasetype)}\n\n No Data`,
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

    const defaultChartOptions = computed(() => {
        return {
            title: {
                text: `${utils.divisionName(props.division)} / ${utils.purchaseTypeName(props.purchasetype)} - ${utils.measureName(props.measure)}`,
                subtext: `Transactions: ${transactionDateMin.value} -> ${transactionDateMax.value}`,
                show: true,
                left: 'center',
                top: 'auto'
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
                data: chartLegend.value,
                top: "92%"
            },
            color: ['#ee6666', '#fac858', '#91cc75', '#5470c6', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
            series: chartSeries.value,
        }
    });

    const yearly_chartOptions = computed(() => {
        return Object.assign({}, defaultChartOptions.value, {
            xAxis: [{
                type: 'category',
                data: chartColumnNames.value,
            }],
            yAxis: [
                {
                    name: 'Yearly Membership',
                    scale: 'value',
                    min: 0,
                    nameLocation: 'middle',
                    position: 'right',
                    nameGap: 70
                }]
        }
        )
    });

    const chartOptions = computed(() => {
        return Object.assign({}, defaultChartOptions.value, {
            xAxis: [{
                type: 'category',
                // gridIndex: 0,
                data: chartColumnNames.value,
                // data: chartColumnNames.value.filter((x) => {
                //     if (x.includes('FY')) return false
                //     return true
                // }),
            }
                // , {
                //     type: 'category',
                //     gridIndex: 1,
                //     data: chartColumnNames.value.filter((x) => {
                //         if (!x.includes('FY')) return false
                //         return true
                //     }),
                // }
            ],
            yAxis: [{
                name: 'Membership',
                min: 0,
                // max: 20000,
                // max: (value) => { return value.max + 20 },
                // gridIndex: 0,
                nameLocation: 'middle',
                nameGap: 70
            },
            {
                name: 'Yearly Membership',
                type: 'value',
                position: 'right',
                min: 0,
                // max: (value) => { return value.max + 20 },
                //scale: true,
                // gridIndex: 1,
                nameLocation: 'middle',
                nameGap: 70,
            }],
            // grid: [{ right: '25%' }, { left: '76%' }],
        })
    });

    const DEFAULTCHARTDATA = {
        name: '',
        type: '',
        data: []
    }

    const segments = ref(new Set())
    const chartLegend = computed(() => [...segments.value])

    const chartSeries = computed(() => {

        if (!measuredetail.value || _.isEmpty(measuredetail.value)) {
            logger.warn('[chartSeries] measuredetail not defined or empty -> return []');

            return [];

        }

        // logger.debug('[chartSeries] start measuredetail:%s', measuredetail.value.length);

        const measures = new Set();
        const measures_fy = new Set();

        segments.value.clear();

        measuredetail.value.forEach((x) => {

            if (x.segment_name.toLowerCase() == 'all')
                return;

            const segmentName = utils.segmentName(x.segment_name);
            const segmentIndex = x.segment_index;
            segments.value.add(segmentName);

            const _default = Object.assign({}, DEFAULTCHARTDATA, {
                name: segmentName,
                type: 'bar',
                stack: (segmentIndex <= 2) ? 'low_members' : 'high_members',
                tooltip: {
                    valueFormatter: (value) => (!value) ? value : (value).formatNumber(2)
                },
                label: {
                    show: true,
                    color: '#000',
                    opacity: 0.8,
                    formatter: (d) => {
                        return functions.formatPercentage(d.data.data.member_cnt_percentage) + '\n' + functions.formatNumber(d.data.data.member_cnt)
                    },
                },
            })

            // Yearly, Monthly & Weeky
            measures.add(Object.assign({}, _default, {

                data: chartColumns.value.filter(y => {

                    if (scale.value != 'years' && y.includes('fy')) return false

                    return true

                }).map((y) => {

                    if (!x.data || !x.data[y])
                        return null

                    const facts = x.data[y]['facts'];

                    return {
                        value: facts['member_cnt'],
                        data: { measure_value: facts['measure_value'], member_cnt: facts['member_cnt'], member_cnt_percentage: facts['member_cnt_percentage'] },
                    }
                }),
            }))

            // If Monthly & Weeky, then add FY YAxis 

            if (scale.value != 'years') {

                // Yearly, when added to Monthly & Weeky
                measures_fy.add(Object.assign({}, _default, {
                    yAxisIndex: 1,
                    // xAxisIndex: 1,
                    data: chartColumns.value.map((y) => {

                        if (!x.data || !x.data[y])
                            return null

                        if (!y.includes('fy'))
                            return null

                        const facts = x.data[y]['facts'];

                        return {
                            value: facts['member_cnt'],
                            data: { measure_value: facts['measure_value'], member_cnt: facts['member_cnt'], member_cnt_percentage: facts['member_cnt_percentage'] },
                            itemStyle: {
                                opacity: 0.5,
                            }
                        }
                    }),
                }))
            }

        })

        logger.debug('[chartSeries] complete measures:%s', measures.size);

        return [...measures, ...measures_fy]
        // return [...measures_fy]
    })

    watch(chartSeries, () => {

        logger.debug('[watch|chartSeries] ', chartSeries.value.length);

        updateChart();

    })


</script>

<style lang="scss">
.measure-chart-container {
    position: relative;
    height: 65vh;
    overflow: hidden;

    padding-top: 10px;
    padding-bottom: 10px;
    border-top-width: 1px;
    border-top-style: solid;
    border-bottom-width: 1px;
    border-bottom-style: solid;

    &.empty {
        display: block;
        height: 250px;
        width: 100%;
        display: flex;
        justify-content: center;
    }

    &.measure-chart-frequency {
        border-color: var(--el-color-success-light-5);
    }

    &.measure-chart-recency {
        border-color: var(--el-color-danger-light-5);
    }

    &.measure-chart-monetary {
        border-color: var(--el-color-info-light-5);
    }

    &.measure-chart-frequency {
        border-color: var(--el-color-warning-light-5);
    }

    &.measure-chart-aov {
        border-color: var(--el-color-success-light-5);
    }

    &.measure-chart-transactions {
        border-color: var(--el-color-info-light-5);
    }


}
</style>