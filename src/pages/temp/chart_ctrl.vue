<template>
    <section>

        <div ref="eChart" class="chart-container"></div>

    </section>
</template>

<script setup>
    import * as ENV from '@t3b/app.config';

    import { nextTick, onMounted, onBeforeUnmount, computed, ref, toRaw, watch } from "vue";
    import { DateTime } from "luxon";
    import { storeToRefs } from 'pinia'
    import * as echarts from 'echarts';
    import chroma from 'chroma-js';

    import { newlogger } from '@t3b/lib/vue/vue-logger';
    import { toJson } from '@t3b/lib/functions/func-general';
    import { convertStringToDate, dateToColumnName } from '@t3b/lib/functions/func-dates';
    import { randomColor, defaultColors } from '@t3b/lib/functions/func-colors';

    import { downloadUrl } from '@t3b/pages/common.js';
    import * as common from '@t3b/pages/common.js';

    import emitter from '@t3b/lib/vue/vue-emitter';

    import { insectumStore } from "@t3b/lib/stores/app-insectum";
    import { nuncStore } from "@t3b/lib/stores/app-nunc";
    import { onedigitalStore } from "@t3b/lib/stores/data-onedigital";
    import { factStore } from "@t3b/lib/stores/data-fact";

    const insectumstore = insectumStore();
    const nuncstore = nuncStore();
    const onedigitalstore = onedigitalStore();
    const factstore = factStore();

    const __name = "superchart-chart"
    const logger = newlogger({ name: __name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    const { measureData, attributionData } = storeToRefs(onedigitalstore)

    const { selectedIndexCohorts, selectedIndexMeasure, selectedIndexMeasureDetail, selectedAttributions, selectedDivisions, selectedPurchaseTypes, selectedScale, selectedChartOptions, yAxisType, chartType, chartLabels, chartScaled, chartAverage, attChartType, attScaled } = storeToRefs(nuncstore)

    const _indexMeasures = computed(() => factstore.indexMeasures)
    const _indexMeasureDetail = computed(() => {

        if (!_indexMeasures.value) return { name: '', value: '' }
        if (!selectedIndexMeasure.value) return _.head(_indexMeasures.value)

        return _indexMeasures.value.find(x => x.value === selectedIndexMeasure.value)
    })

    const eChart = ref(null)
    const refChart = ref(null)

    // xAxis Dimensions/Data (raw)
    // const dimensions = ref([])
    const dimensions = computed(() => nuncstore.selectedDates)
    const dimensionsNames = computed(() => {
        return (!dimensions.value) ? [] : dimensions.value.map((x) => ({ value: x.column.toUpperCase(), data: x.date }))
    });

    // Measures data (series) 
    const indexSeries = ref([])
    const attributionSeries = ref([])
    const series = computed(() => [...indexSeries.value, ...attributionSeries.value])

    // Chart Data - Type, Min / Max (series) 
    const indexSeriesMin = ref(0)
    const indexSeriesMax = ref(0)
    const attributionSeriesMin = ref(0)
    const attributionSeriesMax = ref(0)
    const chartDates = ref({})

    // for Debugging
    const _monitor = ref(null)
    const _monitor_cnt = ref(0)

    insectumstore.add([
        { title: 'selectedChartOptions', data: () => ({ selectedChartOptions: selectedChartOptions.value, chartAverage: chartAverage.value, chartDates: chartDates.value }) },
        // {
        //     title: 'dataZoom', data: () => {
        //         const { dataZoom } = chartOptions.value
        //         return { dataZoom: dataZoom }
        //     }
        // },
        // { title: 'dimensions', data: () => ({ dimensions: dimensions.value }) },
        // { title: 'dimensionsNames', data: () => ({ dimensionsNames: dimensionsNames.value }) },
        { title: 'indexSeries', data: () => indexSeries.value },
        // { title: 'measureNames', data: () => ({ measureNames: measureNames.value }) },
        // { title: 'attributionSeriesMax', data: () => attributionSeriesMax.value },
        // { title: 'dimensions count', data: () => dimensions.value.length },
        // { title: '_monitor count', data: () => _monitor_cnt.value },
        // { title: '_monitor', data: () => _monitor.value },
        // { title: 'attributionSeries', data: () => attributionSeries.value },
    ], __name)

    const initChart = async () => {

        if (!eChart.value) return

        refChart.value = echarts.init(eChart.value);

        refChart.value.on('datazoom', (event) => {
            calculateChartDates()
        })

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

        if (series.value) {

            logger.debug('[updateChart] updating chart');

            chart.setOption(chartOptions.value, { replaceMerge: ['xAxis', 'yAxis', 'series'] })

            // chart.setOption(chartOptions.value)


        } else {

            logger.warn('[updateChart] series is blank length:%s', series.value.length);

            chart.clear()

            chart.setOption(chartOptions.value)
        }

        chartResize()

        calculateChartDates()

        logger.trace('[updateChart] finished');

    }

    const chartResize = (input = null) => {

        const chart = toRaw(refChart.value)

        if (!chart) {
            logger.warn('[chartResize] chart not defined -> return');
            return;
        }

        chart.resize({ animation: { duration: 500 } })
    };

    // const defaultDimension = { value: null, data: null }
    const calculateChartDates = () => {
        const chart = toRaw(refChart.value)

        if (!chart) {
            logger.warn('[chartStartandEnd] chart not defined -> return');
            chartDates.value = { startValue: null, startIndex: null, endValue: null, endIndex: null }
        }

        const options = chart.getOption().dataZoom[0]

        // logger.debug('[calculateChartDates] options:%s', toJson(options));

        const startValue = dimensions.value[options.startValue] ?? { date: null };
        const endValue = dimensions.value[options.endValue] ?? { date: null };

        logger.trace('[calculateChartDates]startValue:\n%s', toJson(startValue));
        logger.trace('[calculateChartDates]endValue:\n%s', toJson(endValue));

        chartDates.value = { startValue: startValue.date, startIndex: options.startValue, endValue: endValue.date, endIndex: options.endValue }

        chart.setOption({ title: { subtext: chartSubTitle.value } })
    }

    const chartDownload = async () => {

        const chart = toRaw(refChart.value)

        if (!chart) {
            logger.warn('[chartDownload] chart not defined -> return');
            return;
        }

        const url = chart.getConnectedDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#fff',
            excludeComponents: ['toolbox', 'dataZoom']
        });

        const datetime = DateTime.local().toFormat('yy-MMM-dd-HHmm');

        const downloadName = `${common.measureName(selectedIndexMeasure.value)}.${selectedDivisions.value.map(x => common.divisionName(x)).join('.')}_${selectedPurchaseTypes.value.map(x => common.purchaseTypeName(x)).join('.')}_${datetime}.png`

        // logger.debug('[chartDownload] downloadName:%s', downloadName);

        await downloadUrl(url, downloadName)
    };

    emitter.$on('downloadChart', async () => {

        await chartDownload();

    })

    // NOTE: Mounted is prefered, to prevent multiple calls view NextTick
    // & Vite will reload the page if changed are applied.

    onMounted(() => {

        logger.trace('[onMounted] CALLED');

        initChart();

        window.addEventListener('resize', chartResize);

    });

    nextTick(() => {

        logger.trace('[nextTick] CALLED');

        createSeriesData();

        createAttributionData();

    })

    onBeforeUnmount(() => {

        logger.trace('[onBeforeUnmount] CALLED');

        destroyChart();

        insectumstore.remove(__name)

    })

    // selectedIndexCohorts, selectedIndexMeasures
    const chartTitle = computed(() => {
        return [
            // `{title|${common.measureName(selectedIndexMeasure.value)}}`,
            `{title|${_indexMeasureDetail.value.name}}`,
            // `${selectedDivisions.value.map(x => common.divisionName(x)).join(', ')}`
            (_indexMeasureDetail.value.description) ? `{subtitle|${_indexMeasureDetail.value.description}}` : null,
        ].join('\n\n')
    })

    const chartSubTitle = computed(() => {
        if (!series.value || series.value.length <= 0)
            return "No Data"
        else
            return [
                `{hr|}`,
                `{heading|Cohorts}: {content|${selectedIndexCohorts.value.map(x => common.cohortName(x)).join(', ')}}`,
                `{heading|Divisions}: {content|${selectedDivisions.value.map(x => common.divisionName(x)).join(', ')}}`,
                `{heading|Channels}: {content|${selectedPurchaseTypes.value.map(x => common.purchaseTypeName(x)).join(', ')}}`,
                `{heading|Scale}: {content|${common.scaleName(selectedScale.value)}}`,
                `{heading|Dates}: {content|${chartDates.value.startValue} -> ${chartDates.value.endValue}}`,
                `{heading|Chart}: {content|${chartType.value.capitalize()}}`,
            ].join('\n')
    })

    const chartOptions = computed(() => {

        const { startIndex, endIndex } = chartDates?.value

        logger.trace('[chartOptions] startIndex:%s endIndex:%s', startIndex, endIndex);

        return {
            title: {
                show: true,
                textAlign: 'left',
                text: chartTitle.value,
                textStyle: {
                    // lineHeight: 25,
                    overflow: 'break',
                    width: 300,
                    rich: {
                        hr: {
                            // lineHeight: 10,
                            borderColor: '#DC143C',
                            width: 300,
                            borderWidth: 1,
                            height: 0.1
                        },
                        title: {
                            fontWeight: 'bolder',
                            lineHeight: 25,
                            color: '#DC143C',
                            fontSize: 18,
                        },
                        subtitle: {
                            lineHeight: 20,
                            fontSize: 14,
                        },
                    }
                },
                subtext: chartSubTitle.value,
                subtextStyle: {
                    lineHeight: 22,
                    fontSize: 14,
                    overflow: 'break',
                    rich: {
                        heading: {
                            fontSize: 14,
                            fontWeight: 'lighter',
                            width: 65,
                        },
                        content: {
                            fontSize: 14,
                            fontWeight: 'lighter',
                            width: 235,
                            overflow: 'break',
                        },
                        hr: {
                            lineHeight: 10,
                            borderColor: '#DC143C',
                            width: 300,
                            borderWidth: 1,
                            height: 0.1
                        },
                    }
                },
                itemGap: 5,
                top: 1,
                left: 0,
                right: '70%',
                padding: [10, 10, 10, 5],
            },
            toolbox: {
                show: true,
                left: 0,
                bottom: 0,
                feature: {
                    // magicType: { show: true, type: ['stack', 'tiled'] },
                    dataView: { readOnly: false },
                }
            },
            legend: {
                type: 'scroll',
                orient: 'vertical',
                left: 0,
                bottom: 60,
                height: '60%',
                textStyle: {
                    lineHeight: 20,
                    fontSize: 11,
                },
                padding: [10, 10, 10, 5],
            },
            grid:
            {
                left: 350,
                right: 50,
                top: 25,
                bottom: 80,
                containLabel: false,
                boundaryGap: false,
                axisLine: { onZero: false },
                splitLine: { show: false },
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'line',
                },
            },
            color: defaultColors,
            animation: false,
            dataZoom: [
                {
                    type: 'slider',
                    xAxisIndex: [0],
                    show: true,
                    filterMode: 'filter',
                    start: (!startIndex) ? 50 : null,
                    startValue: (startIndex && startIndex > 0) ? startIndex : null,
                    endValue: (endIndex && endIndex > 0) ? endIndex : null
                },
                {
                    type: 'inside',
                    xAxisIndex: [0],
                },
            ],
            xAxis: [
                {
                    type: 'category',
                    show: (series.value) ? true : false,
                    data: dimensionsNames.value,
                    axisTick: { alignWithLabel: true },
                    axisPointer: { snap: true },
                    axisLabel: { showMinLabel: true, showMaxLabel: true },
                    boundaryGap: ['bar', 'stacked'].includes(chartType.value) || ['bar', 'stacked'].includes(attChartType.value),
                }
            ],
            yAxis: [
                {
                    show: (series.value) ? true : false,
                    type: yAxisType.value,
                    scale: chartScaled.value,
                    axisLabel: {
                        formatter: (d) => {
                            return axisLabel(d)
                        }
                    },
                    alignTicks: false
                },
                {
                    show: (series.value) ? true : false,
                    type: 'value',
                    scale: attScaled.value,
                    axisLabel: {
                        show: true,
                        formatter: (d) => axisLabel(d, 'attribution')
                    },
                    axisLine: {
                        show: false,
                        onZero: false
                    },
                    alignTicks: false,
                    splitLine: { show: false }
                }
            ],
            series: (series.value) ? series.value : []
        }
    })

    const axisLabel = (d, category = 'index') => {
        if (category != 'index')
            return common.formatNumber(d);

        if (chartType.value === 'change' || _indexMeasureDetail.value.datatype === 'percentage') {
            if (d < 0.01 && d != 0 && d > -0.01)
                return common.formatPercentage(d, 2);
            else
                return common.formatPercentage(d, 0);
        }

        return common.formatNumber(d);
    }


    const DEFAULTSERIES = {
        type: 'line',
        smooth: false,
        label: {
            show: true,
            fontSize: 9,
            formatter: (d) => {
                return (d.value).formatNumber(2);
            },
        },
        emphasis: {
            focus: 'series'
        },
        tooltip: {
            valueFormatter: (value) => {
                return (!value) ? value : (value).formatNumber(2)
            }
        },
        data: [],
    };

    const seriesMarkers = () => {

        if (selectedScale.value === 'months')
            return null;

        const markArea = {
            itemStyle: {
                color: 'rgba(0, 0, 0, 0.1)',
                opacity: 0.3,
            },
            label: {
                opacity: 0.7,
                fontSize: 10,
            },
            data: [
                [
                    {
                        name: 'Easter',
                        xAxis: dateToColumnName(selectedScale.value, DateTime.fromObject({ year: 2023, month: 4, day: 10 })).toUpperCase()
                    },
                    {
                        xAxis: dateToColumnName(selectedScale.value, DateTime.fromObject({ year: 2023, month: 4, day: 17 })).toUpperCase()
                    },
                ],
                [
                    {
                        name: 'CVP Launch',
                        xAxis: dateToColumnName(selectedScale.value, DateTime.fromObject({ year: 2023, month: 9, day: 1 })).toUpperCase()
                    },
                    {
                        xAxis: dateToColumnName(selectedScale.value, DateTime.fromObject({ year: 2023, month: 9, day: 15 })).toUpperCase()
                    },
                ],
                [
                    {
                        name: 'Black Friday',
                        xAxis: dateToColumnName(selectedScale.value, DateTime.fromObject({ year: 2023, month: 11, day: 20 })).toUpperCase()
                    },
                    {
                        xAxis: dateToColumnName(selectedScale.value, DateTime.fromObject({ year: 2023, month: 12, day: 4 })).toUpperCase()
                    }
                ],
                // [
                //     {
                //         name: 'Data 90%\nComplete',
                //         itemStyle: {
                //             color: chroma('red').brighten(3).hex(),
                //             opacity: 0.1,
                //         },
                //         label: {
                //             color: 'red',
                //         },
                //         xAxis: dimensionsNames.value[dimensionsNames.value.length - scaleFactor()]?.value
                //     },
                //     {
                //         xAxis: dimensionsNames.value[dimensionsNames.value.length - 1]?.value
                //     }
                // ],
                [
                    {
                        name: 'Christmas',
                        xAxis: dateToColumnName(selectedScale.value, DateTime.fromObject({ year: 2023, month: 12, day: 25 })).toUpperCase()
                    },
                    {
                        xAxis: dateToColumnName(selectedScale.value, DateTime.fromObject({ year: 2024, month: 1, day: 1 })).toUpperCase()
                    }
                ]
            ]
        }

        return { markArea: markArea }
    }

    const averagesMarkLine = () => {

        const averagesMarkLine = {
            name: 'average line',
            type: 'average',
            symbol: 'none',
            label: {
                position: 'end',
                distance: 10,
                formatter: (d) => {
                    return (d.value).formatNumber(2);
                }
            }
        }

        return { markLine: { data: [averagesMarkLine] } }

    }

    const defaultAttributionSeries = () => { return DEFAULTSERIES }

    const createSeriesData = () => {

        if (!measureData.value) {
            indexSeries.value = []
            logger.warn('[createSeriesData] measureData is null -> return');
            return;
        }

        logger.debug('[createSeriesData] start');

        logger.trace('[createSeriesData] measures:%s cohorts:%s division:%s purchasetype:%s', selectedIndexMeasure.value, selectedIndexCohorts.value, selectedDivisions.value, selectedPurchaseTypes.value);

        logger.trace('[createSeriesData] _indexMeasureDetail\n%s', toJson(_indexMeasureDetail.value));

        const output_series = new Set()

        const source = formatData(measureData.value, 'indexMeasure')

        // TEMP
        // _monitor.value = source;

        let index = 0
        source.forEach((measure) => {

            const data = []

            for (const element of measure.data) {
                logger.trace('[createSeriesData] element:\n%s', toJson(element));
                logger.trace('[createSeriesData] diff:\n%s', element.diff);

                if (chartType.value === 'change') {
                    data.push((element.diff === 0) ? null : element.diff)
                } else {
                    data.push((element.data === 0) ? null : element.data)
                }
            }

            // logger.trace('[createSeriesData] data:\n%s', toJson(data));
            // logger.debug('[createSeriesData] stack:\n%s', toJson(stack));

            indexSeriesMin.value = Math.min(...data)
            indexSeriesMax.value = Math.max(...data)

            _monitor_cnt.value = data.length;

            const _stack = []
            if (chartType.value === 'stacked') {

                if (selectedIndexCohorts.value.length <= 1) {
                    _stack.push(...selectedIndexCohorts.value)
                }

                if (selectedDivisions.value.length <= 1) {
                    _stack.push(...selectedDivisions.value)
                }

                if (selectedPurchaseTypes.value.length <= 1) {
                    _stack.push(...selectedPurchaseTypes.value)
                }
            }

            const _chartType = () => {

                if (chartType.value === 'change') return 'line'

                if (chartType.value === 'stacked') return 'bar'

                return chartType.value
            }

            logger.trace('[createSeriesData] stack:\n%s', toJson(_stack));

            const output = Object.assign(
                {},
                DEFAULTSERIES,
                (index === 0) ? seriesMarkers() : null,
                (chartAverage.value) ? averagesMarkLine() : null,
                {
                    type: _chartType(),
                    name: measure.definition.name,
                    key: measure.key,
                    stack: (chartType.value === 'stacked') ? _stack.join('.') : null,
                    label: {
                        show: chartLabels.value,
                        fontSize: 9,
                        formatter: (d) => axisLabel(d, 'index')
                    },
                    tooltip: {
                        valueFormatter: (d) => axisLabel(d, 'index')
                    },
                    symbol: measure.definition.symbol,
                    symbolSize: 4,
                    itemStyle: {
                        color: measure.definition.color,
                        borderColor: null,
                        borderColor0: null,
                    },
                    smooth: 0.2,
                    data: data,
                }
            )

            output_series.add(output)

            index++
        })

        indexSeries.value = [...output_series]

        logger.debug('[createSeriesData] end');

    }

    const createAttributionData = () => {

        if (!attributionData.value) {
            attributionSeries.value = []
            logger.warn('[createAttributionData] attributionData is null -> return');
            return;
        }

        logger.trace('[createAttributionData] start processing %s records', attributionData.value?.length);

        logger.trace('[createAttributionData] measures:%s cohorts:%s division:%s purchasetype:%s', selectedAttributions.value, selectedIndexCohorts.value, selectedDivisions.value, selectedPurchaseTypes.value);

        const output_series = new Set()

        const source = formatData(attributionData.value, 'attributionMeasure')

        // TEMP
        _monitor.value = source;

        //attributionSeriesMax.value = source.reduce((max, obj) => Math.max(max, obj.data), -Infinity);
        //attributionSeriesMin.value = source.reduce((min, obj) => Math.min(min, obj.data), Infinity);
        attributionSeriesMin.value = null;
        attributionSeriesMax.value = null;

        const _chartType = () => {

            if (attChartType.value === 'change') return 'line'

            if (attChartType.value === 'stacked') return 'bar'

            return attChartType.value
        }



        source.forEach((measure) => {

            const data = []
            const stack = measure.definition?.measure ?? null

            for (const element of measure.data) {
                data.push((!element.data || element.data === 0) ? null : element.data)
            }

            const _data = data.filter(x => x !== null)
            attributionSeriesMin.value = (attributionSeriesMin.value === null) ? Math.min(..._data) : Math.min(..._data, attributionSeriesMin.value)
            attributionSeriesMax.value = (attributionSeriesMax.value === null) ? Math.max(..._data) : Math.max(..._data, attributionSeriesMax.value)

            output_series.add(
                Object.assign(
                    {},
                    defaultAttributionSeries(),
                    {
                        name: measure.definition.name,
                        yAxisIndex: 1,
                        type: _chartType(),
                        stack: attChartType.value === 'stacked' ? stack : null,
                        data: data,
                        label: {
                            show: false,
                        },
                        symbol: measure.definition.symbol,
                        itemStyle: {
                            color: measure.definition.color,
                            opacity: 0.5
                        },

                    }
                )
            )

        })

        attributionSeries.value = [...output_series]

        logger.trace('[createAttributionData] end');

    }

    const formatData = (input = {}, category = null) => {

        if (!input || _.isEmpty(input)) {
            logger.warn('[formatData] input is null -> return');
            return {};
        }

        const outputData = new Map()

        const _formatData = (column) => {
            const date = convertStringToDate(column)
            return {
                column: column,
                date: date,
                order: date.toUnixInteger()
            }
        }

        const _calculatePercentageDifference = (number1, number2) => {
            if (number1 !== 0 && number2 !== 0) {
                // return ((number1 - number2) / Math.abs(number2) * 100);
                return ((number1 - number2) / Math.abs(number2));
            } else {
                return 0;
            }
        };

        input.forEach(x => {

            const measure_type = x.measure_type ?? 'scalar'

            logger.trace('[formatData] measure_type:%s', x.measure_type);

            if (measure_type === 'set') {

                for (const measure of x.measures) {

                    // division / purchase_type / cohort / measure / field
                    const measure_key = `${x.division}.${x.purchase_type}.${x.cohort}.${x.measure_key}.${measure.key}`

                    for (const column in x.data) {

                        const data = (outputData.has(measure_key)) ? outputData.get(measure_key) : []
                        const value = x.data[column][measure.key]

                        data.push({ ..._formatData(column), ...{ name: measure_key, data: value } })

                        outputData.set(measure_key, data)
                    }

                }

            } else {

                // Scalar Type

                const measure_key = `${x.division}.${x.purchase_type}.${x.cohort}.${x.measure_key}`

                for (let column in x.data) {

                    const data = (outputData.has(measure_key)) ? outputData.get(measure_key) : []
                    const value = x.data[column]

                    data.push({ ..._formatData(column), ...{ name: measure_key, data: value } })

                    outputData.set(measure_key, data)

                }

            }

        })

        outputData.forEach((value, key) => {

            // Update with Ordered List
            outputData.set(key, value.sort((a, b) => a.order - b.order));

            if (chartType.value === 'change') {

                // Add previousValue

                for (let i = 0; i < value.length; i++) {

                    const currentValue = value[i]?.data ?? 0;
                    const previousValue = (_.isArray(value[i - 1]?.data)) ? value[i - 1]?.data[1] : value[i - 1]?.data;
                    const diff = _calculatePercentageDifference(currentValue, previousValue)

                    value[i] = { ...value[i], prev: previousValue, diff: diff }

                }
            }

            logger.trace('[formatData] value:\n%s', toJson(value));

            outputData.set(key, value);

        });

        return Array.from(outputData.entries(), ([key, value]) => ({ key: key, data: value, definition: measureDefinition(key, category) }));

    }

    // division / purchase_type / cohort / measure / field
    const measureDefinition = (input, category = null) => {

        if (!input || !_.isString(input) || _.isEmpty(input)) return input

        const _input = input.split('.')
        const _output = {
            division: _input[0],
            purchase_type: _input[1],
            cohort: _input[2],
            measure: _input[3],
            field: (_input.length > 3) ? _input[4] : null,
            divisionCount: selectedDivisions.value.length,
            cohortCount: selectedIndexCohorts.value.length,
            purchaseTypeCount: selectedPurchaseTypes.value.length,
        }

        const outputPart1 = []
        const outputPart2 = []

        logger.trace('[measureName] output:%s', toJson(_output));

        // Measure
        // _output.measure = common.measureName(_output.measure)
        _output.measure_name = common.measureName(_output.measure)

        // Field
        _output.field = common.measureName(_output.field)

        // Divisions
        _output.division = common.divisionName(_output.division)

        // Purchase Types
        _output.purchase_type = common.purchaseTypeName(_output.purchase_type)

        // Cohorts
        _output.cohort = common.cohortName(_output.cohort)

        // Assemble
        outputPart1.push(_output.measure_name)
        if (_output.field) outputPart1.push(_output.field)

        outputPart2.push(_output.division)
        outputPart2.push(_output.purchase_type)
        if (_output.cohort && _output.cohort.toLowerCase() != 'all') outputPart2.push(_output.cohort)

        const measureColor = () => {
            if (_output.field != null) return common.measureColor(_output.field)

            const dColor = common.divisionColor(_output.division) ?? randomColor();
            const pColor = common.purchaseTypeColor(_output.purchase_type) ?? randomColor();
            const cColor = common.cohortColor(_output.cohort) ?? randomColor();
            const mColor = common.measureColor(_output.measure) ?? randomColor();

            logger.debug('[measureColor] color inputs:%s', toJson({ division: _output.division, purchase_type: _output.purchase_type, cohort: _output.cohort, measure: _output.measure }));
            logger.debug('[measureColor] outputs colors:%s', toJson({ dColor: dColor, pColor: pColor, cColor: cColor, mColor: mColor }));

            // Single Division
            // category === 'indexMeasure' && 
            if (_output.divisionCount <= 1) {

                // Single Cohort && Single Purchase Type
                if (_output.cohortCount <= 1 && _output.purchaseTypeCount <= 1) return mColor

                // Single Cohort && Multiple PurchaseType
                if (_output.cohortCount <= 1 && _output.purchaseTypeCount > 1) return chroma.average([mColor, pColor], 'rgb', [10, 5, 1]).hex();

                // Mulitple Cohort
                if (_output.cohortCount > 1) return chroma.average([cColor, pColor, mColor], 'rgb', [10, 5, 1]).hex();

                // Weighted Cohort Color
                return chroma.average([cColor, pColor, dColor], 'rgb', [10, 5, 1]).hex();

            }

            // Multiple Division
            // category === 'indexMeasure' &&
            if (_output.divisionCount > 1) {

                logger.trace('[measureColor] output:%s', toJson(_output));

                // Go by Division color
                if (_output.cohortCount <= 1 && _output.purchaseTypeCount <= 1) return dColor;

                // Weighted Division Color
                if (_output.cohortCount <= 1 && _output.purchaseTypeCount > 1) return chroma.average([dColor, pColor], 'rgb', [10, 5]).hex();

                // Weighted Division Color
                return chroma.average([dColor, cColor, pColor], 'rgb', [10, 5, 1]).hex();
            }

            // if (category === 'attributionMeasure') {
            //     return common.measureColor(_output.measure)
            // }

            // Should not get here, but!
            return chroma.random().hex();

        }

        const measureSymbol = () => {

            if (!_output.purchase_type || _.isNull(_output.purchase_type)) return null

            switch (_output.purchase_type.toLowerCase()) {
                case 'instore':
                    return 'triangle'
                case 'c&c':
                    return 'rect'
                default:
                    return null
            }

        }

        return {
            key: input,
            measure: _output.measure,
            name: `${outputPart1.join('/')} - ${outputPart2.join('/')}`,
            color: measureColor(),
            symbol: measureSymbol()
        }
    }

    watch([measureData, attributionData], () => {

        createSeriesData();

        createAttributionData();

    })

    emitter.$on('chart-options-updated', () => {

        createSeriesData();

        createAttributionData();

    })

    watch([series], (oldValue, newValue) => {

        if (!_.isEqual(oldValue, newValue)) {

            logger.debug('[watch|series] series data updated -> calling updateChart');

            updateChart();

        }

    })

    // reset chartDates if timescale changes
    watch([selectedScale], (oldValue, newValue) => {

        logger.trace('[watch|selectedScale] isEqual:%s selectedScale:%s', _.isEqual(oldValue, newValue), selectedScale.value);

        if (!_.isEqual(oldValue, newValue)) {
            chartDates.value = {}
        }

    })

    // watch([chartDates], () => {

    //     logger.debug('[watch|chartDates] selectedChartOptions:%s', toJson(chartDates.value));

    //     const { startValue, endValue } = chartDates.value
    //     const input = {
    //         view: { start: startValue, end: endValue }
    //     }

    //     logger.debug('[watch|chartDates] input:%s', toJson(input));

    //     // nuncstore.setOptions(input)

    // })

</script>

<style lang="scss">
.chart-container {
    position: relative;
    height: 73vh;
}
</style>