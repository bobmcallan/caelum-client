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

import { newlogger } from '@t3b/lib/vue/vue-logger';
import { toJson } from '@t3b/lib/functions/func-general';
import { dateToColumnName } from '@t3b/lib/functions/func-dates';
import { defaultColors } from '@t3b/lib/functions/func-colors';
import { wrapText, truncateText, isEmpty } from '@t3b/lib/functions/func-string';

import { downloadUrl, getStats } from '@t3b/pages/common.js';
import * as common from '@t3b/pages/common.js';

import emitter from '@t3b/lib/vue/vue-emitter';

import { insectumStore } from "@t3b/lib/stores/app-insectum";
import { nuncStore } from "@t3b/lib/stores/app-nunc";
import { onedigitalStore } from "@t3b/lib/stores/data-onedigital";

const insectumstore = insectumStore();
const nuncstore = nuncStore();
const onedigitalstore = onedigitalStore();

const __name = "page-superchart-chart"
const _logger = newlogger({ name: __name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

const { measuresSource } = storeToRefs(onedigitalstore)
const { selectedChart, selectedChartName, selectedChartDates, selectedMeasures, selectedMeasureDetail, selectedScale, selectedCohorts, selectedDivisions, selectedPurchaseTypes, showChartDetail } = storeToRefs(nuncstore)

const eChart = ref(null)
const refChart = ref(null)
const generatedChartOptions = ref(null)
const chartTop = 65
const chartBottom = 80
const chartDetailSplit = 360

const rightIndex = ref(1)
const leftIndex = ref(0)

// xAxis Dimensions/Data (raw)
const dimensions = computed(() => nuncstore.selectedDates)
const dimensionsNames = computed(() => {
    return (!nuncstore.selectedDates) ? [] : nuncstore.selectedDates.map((x) => ({ value: x.column.toUpperCase(), data: x.date }))
});

// Measures data (series) 
const measureData = ref([])
const measureTotals = ref(new Map())
const measureSeries = ref([])
const summarySeries = ref([])
const series = computed(() => [markerSeries.value, ...measureSeries.value])

// for Debugging
const _monitor = ref(null)
const _monitor_cnt = ref(0)

const initChart = () => {

    if (!eChart.value) return

    refChart.value = connectToChart()

}

const connectToChart = () => {

    const chart = echarts.init(eChart.value);

    chart.on('datazoom', (event) => {

        updateChartSummary();

    })

    return chart

}


const destroyChart = () => {

    refChart.value = refChart.value ?? connectToChart()

    const chart = toRaw(refChart.value)

    if (chart) {
        chart.dispose()
        refChart.value = null
    }
}

const updateChart = () => {

    refChart.value = refChart.value ?? connectToChart()

    const chart = toRaw(refChart.value)

    if (_.isEmpty(chart)) {
        _logger.warn('[updateChart] chart not defined -> return');
        return;
    }

    if (series.value) {

        _logger.debug('[updateChart] updating chart');

        chart.setOption(chartOptions.value, { replaceMerge: ['xAxis', 'yAxis', 'series', 'graphic'] })

    } else {

        _logger.warn('[updateChart] series is blank length:%s', series.value.length);

        chart.clear()

        chart.setOption(chartOptions.value)
    }

    chartResize()

    // Get generated Options
    generatedChartOptions.value = chart.getOption();

}

const chartResize = () => {

    refChart.value = refChart.value ?? connectToChart()

    const chart = toRaw(refChart.value)

    if (!chart) {
        _logger.warn('[chartResize] chart not defined -> return');
        return;
    }

    chart.resize({ animation: { duration: 500 } })
};

const updateChartSummary = () => {

    refChart.value = refChart.value ?? connectToChart()

    const chart = toRaw(refChart.value)

    if (!chart) {
        _logger.warn('[updateChartSummary] chart not defined -> return');
        return;
    }

    const { dataZoom } = chart.getOption() ?? { dataZoom: null }

    if (!dataZoom || !dataZoom[0]) {
        _logger.warn('[updateChartSummary] dataZoom not defined -> return');
        return;
    }

    const startIndex = dataZoom[0].startValue;
    const endIndex = dataZoom[0].endValue;

    const startValue = dimensions.value[startIndex] ?? { column: null };
    const endValue = dimensions.value[endIndex] ?? { column: null };

    const chartOptions = { startValue: startValue.column, startIndex: startIndex, endValue: endValue.column, endIndex: endIndex }

    const { zoom } = selectedChart.value

    if (!zoom) {
        selectedChart.value['zoom'] = { [selectedScale.value]: chartOptions }
    } else {
        zoom[selectedScale.value] = chartOptions
    }

    // Update Chart Sub-Heading
    chart.setOption({ title: { text: chartTitle.value, subtext: chartSubTitle.value } })

}

const updateChartTitle = () => {

    refChart.value = refChart.value ?? connectToChart()

    const chart = toRaw(refChart.value)

    if (!chart) {
        _logger.warn('[updateChartTitle] chart not defined -> return');
        return;
    }

    // _logger.debug('[updateChartTitle] title:%s', showChartDetail.value);

    chart.setOption({
        title: {
            show: showChartDetail.value
        },
        grid: {
            left: chartLeft(), //(showChartDetail.value) ? chartDetailSplit : 15,
        },
        legend: {
            left: chartLeft() + 10, //(showChartDetail.value) ? chartDetailSplit : 15,
        }
    })

}

const chartDownload = async () => {

    // refChart.value = refChart.value ?? connectToChart()

    const chart = toRaw(refChart.value)

    if (!chart) {
        _logger.warn('[chartDownload] chart not defined -> return');
        return;
    }

    nextTick(async () => {

        const url = chart.getConnectedDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#fff',
            excludeComponents: ['toolbox', 'dataZoom']
        });

        const datetime = DateTime.local().toFormat('yy-MMM-dd-HHmm');

        const downloadName = `${selectedMeasureDetail.value.map(x => x.value).join('.')}.${selectedDivisions.value.map(x => common.divisionName(x)).join('.')}_${selectedPurchaseTypes.value.map(x => common.purchaseTypeName(x)).join('.')}_${datetime}.png`

        await downloadUrl(url, downloadName)

    })


};

const dataDownload = async () => {

    _logger.trace('[dataDownload] series:%s', toJson(series.value));

    var _dimensions = dimensionsNames.value
    var _series = series.value.filter(x => (!x.silent || x.silent === false)).map(x => x)

    // _logger.debug('[dataDownload] series:%s', toJson(_series));

    var _data = _series.map(x => x.data)
    // _logger.trace('[dataDownload] _dimensions:%s', toJson(_dimensions));

    var output = 'date,' + _series.map(x => x.name).join(',') + '\n'

    let index = 0
    _dimensions.forEach(x => {
        output += x.data + ','
        for (var i = 0, l = _data.length; i < l; i++) {
            output += (i < (_data.length - 1)) ? _data[i][index] + ',' : _data[i][index] + '\n'
        }
        index++
    })

    _logger.trace('[dataDownload] output:%s', toJson(output));

    const blob = new Blob([output], { type: 'text/csv;charset=utf-8' });

    const downloadableUrl = URL.createObjectURL(blob);

    const datetime = DateTime.local().toFormat('yy-MMM-dd-HHmm');

    const downloadName = `${selectedMeasureDetail.value.map(x => x.value).join('.')}.${selectedDivisions.value.map(x => common.divisionName(x)).join('.')}_${selectedPurchaseTypes.value.map(x => common.purchaseTypeName(x)).join('.')}_${datetime}.csv`

    await downloadUrl(downloadableUrl, downloadName)

};

emitter.$on('downloadChart', () => {

    chartDownload();

})

emitter.$on('downloadData', () => {

    dataDownload();

})

emitter.$on('refresh', () => {

    createMeasureData();

})

// NOTE: Mounted is prefered, to prevent multiple calls view NextTick
// & Vite will reload the page if changed are applied.

onMounted(() => {

    // _logger.trace('[onMounted] CALLED');

    initChart();

    window.addEventListener('resize', chartResize);

});

nextTick(() => {

    // !! Important for first load and code refresh

    // _logger.debug('[nextTick] CALLED');

    createMeasureData();

})

onBeforeUnmount(() => {

    // _logger.debug('[onBeforeUnmount] CALLED');

    destroyChart();

    insectumstore.remove(__name)

})

const chartTitle = computed(() => {

    // if (!summarySeries.value || _.isEmpty(summarySeries.value)) {
    //     createSummaryData();
    // }

    createSummaryData();

    return [
        ...selectedMeasureDetail.value.map(x => {
            const output = [`{title|${wrapText(x.name, 35)}}`, `{subtitle|${wrapText(x.description, 50)}}`]

            if (x.stack) output.push("{subtitle|(Stacked)}")

            if (x.datacalc === 'change') output.push("{subtitle|(% Change)}")

            if (x.filter) output.push(`{subtitle|Filter: '${x.filter}'}`)

            if (!_.isEmpty(summarySeries.value)) {

                summarySeries.value.filter(y => y.key === x.key).map(y => {
                    const color = (y.change.abs < 0) ? 'red' : 'green'
                    const label = truncateText(y.sub, 25)
                    output.push(`{measure|${label}}{black|O:}{${color}|${y.open ?? 0}}{black|C:}{${color}|${y.close ?? 0}}{black|AVG:}{${color}|${y.avg ?? 0}}{black|CHG:}{${color}|${y.chg ?? 0}}`)
                })
            }
            return output.join('\n') + "\n{space|}"
        }),
    ].join('\n')
})

const chartSubTitle = computed(() => {

    if (!series.value || series.value.length <= 0)
        return "No Data"

    const selectedDates = selectedChartDates.value

    if (!selectedDates || !selectedDates.startValue || !selectedDates.endValue) {
        selectedDates.startValue = selectedDates.startValue ?? _.get(dimensions.value, Math.floor(dimensions.value.length / 2)).column;
        selectedDates.endValue = selectedDates.endValue ?? _.last(dimensions.value).column;
    }

    return [
        `{heading|Cohorts}: ${selectedCohorts.value.map((item, index) => ((index === 0) ? "{content|" : "{listcontent|") + common.cohortName(item) + "}").join('\n')}`,
        `{heading|Divisions}: ${selectedDivisions.value.map(item => "{content|" + common.divisionName(item) + "}").join(', ')}`,
        `{heading|Channels}: ${selectedPurchaseTypes.value.map(item => "{content|" + common.purchaseTypeName(item) + "}").join(', ')}`,
        `{heading|Scale}: {content|${common.scaleName(selectedScale.value)}}`,
        `{heading|Dates}: {content|${selectedDates.startValue} -> ${selectedDates.endValue}}`,
        // `{heading|Min/Max}: {content|${measureSeriesMin.value} -> ${measureSeriesMax.value}}`,
        // `{heading|Chart}: {content|${chartType.value.capitalize()}}`,
    ].join('\n')
})

const chartLeft = (defaultGutter = 15) => {
    const leftGutter = 30;

    if (leftIndex.value > 0) {
        return (showChartDetail.value) ? chartDetailSplit + leftGutter : defaultGutter + leftGutter
    } else {
        return (showChartDetail.value) ? chartDetailSplit : defaultGutter
    }

};

const chartOptions = computed(() => {

    const { startIndex, endIndex } = selectedChartDates.value ?? { startIndex: null, endIndex: null }

    return {
        title: {
            show: showChartDetail.value,
            textAlign: 'left',
            text: chartTitle.value,
            itemGap: 1,
            top: chartTop,
            bottom: chartBottom,
            left: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderColor: 'rgba(104, 0, 165, 0.2)',
            borderWidth: 1,
            borderRadius: 3,
            padding: [10, 10, 10, 10],
            textStyle: {
                lineHeight: 18,
                rich: {
                    space: {
                        height: 1,
                        width: "99%",
                        backgroundColor: 'rgba(104, 0, 165, 0.2)',
                    },
                    title: {
                        width: chartDetailSplit - 33,
                        fontSize: 12,
                    },
                    subtitle: {
                        fontSize: 11,
                        color: 'rgba(30, 30, 30, 0.5)',
                    },
                    measure: {
                        fontSize: 11,
                        // color: 'rgba(0, 0, 0, 0.8)',
                        width: 140,
                    },
                    black: {
                        fontSize: 11,
                        color: 'rgba(0, 0, 0, 0.5)',
                    },
                    green: {
                        fontSize: 11,
                        color: 'rgba(0, 150, 0, 0.5)',
                        width: 28,
                    },
                    red: {
                        fontSize: 11,
                        color: 'rgba(150, 0, 0, 0.5)',
                        width: 28,
                    },

                }
            },
            subtext: chartSubTitle.value,
            subtextStyle: {
                lineHeight: 18,
                rich: {
                    heading: {
                        fontSize: 12,
                        width: 70,
                    },
                    content: {
                        fontSize: 12,
                        color: 'rgba(30, 30, 30, 0.5)',
                    },
                    listcontent: {
                        fontSize: 12,
                        padding: [0, 0, 0, 77],
                        color: 'rgba(30, 30, 30, 0.5)',
                    },
                }
            },

        },
        legend: {
            orient: 'vertical',
            left: chartLeft() + 10, //(showChartDetail.value) ? chartDetailSplit : 15,
            top: 75,
            height: 120,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderColor: 'rgba(104, 0, 165, 0.2)',
            borderWidth: 1,
            borderRadius: 3,
            textStyle: {
                lineHeight: 20,
                fontSize: 11,
            },
            padding: [10, 10, 10, 5],
        },
        graphic: [
            {
                type: 'group',
                left: 0,
                right: 0,
                top: 0,
                z: 100,
                children: [
                    {
                        type: 'text',
                        left: 5,
                        top: 0,
                        style: {
                            text: selectedChartName.value,
                            fontSize: 24,
                            fill: 'rgba(104, 0, 165, 255)',
                        },
                    },
                    {
                        type: 'rect',
                        top: 35,
                        shape: {
                            width: 2000,
                            height: 1
                        },
                        style: {
                            fill: 'rgba(104, 0, 165, 0.2)',
                        }
                    },

                ]
            },
        ],
        grid: [
            {
                left: chartLeft(),
                right: 40,
                top: chartTop,
                bottom: chartBottom,
                containLabel: false,
                boundaryGap: false,
                axisLine: { onZero: false },
                splitLine: { show: false },
            }
        ],
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'line'
            }
        },
        // brush: {
        //     toolbox: ['rect', 'polygon', 'lineX', 'lineY', 'keep', 'clear'],
        //     xAxisIndex: 0
        // },
        color: ['#000', ...defaultColors],
        animation: false,
        dataZoom: [
            {
                type: 'slider',
                xAxisIndex: [0],
                show: true,
                filterMode: 'filter',
                start: (_.isNil(startIndex)) ? 50 : null,
                startValue: startIndex,
                endValue: endIndex
            },
            {
                type: 'inside',
                xAxisIndex: [0],
            },
        ],
        xAxis: {
            type: 'category',
            show: (series.value) ? true : false,
            data: dimensionsNames.value,
            axisTick: { alignWithLabel: true },
            axisPointer: { snap: true },
            axisLabel: { showMinLabel: true, showMaxLabel: true },
            boundaryGap: (series.value.find(x => x.type === 'bar') != null),
            axisLine: {
                lineStyle: {
                    color: 'rgba(100, 100, 100, 0.7)'
                }
            }
        },
        yAxis: yAxis.value,
        series: (series.value) ? series.value : []
    }
})

const yAxis = computed(() => {

    const RIGHTYAXIS = {
        show: true,
        alignTicks: false,
        position: 'right',
        axisLine: {
            show: true,
            lineStyle: {
                color: 'rgba(100, 100, 100, 0.7)'
            }
        },
        nameTextStyle: {
            align: 'center',
            // fontWeight: 'bolder',
            fontSize: 10
        },
        nameTruncate: {
            maxWidth: 100
        },
        boundaryGap: ['0%', '2%'],
        axisLabel: {
            show: true,
            formatter: (d) => dataLabel(d)
        }

    }

    const LEFTYAXIS = {
        ...RIGHTYAXIS,
        position: 'left',
        nameTextStyle: {
            align: 'center',
            // fontWeight: 'bolder',
            fontSize: 10
        },
        nameTruncate: {
            maxWidth: 150
        },
        splitLine: { show: false },
        offset: 0
    }

    const output = new Map()
    leftIndex.value = 0;
    rightIndex.value = 0;

    // Empty Data
    if (!measuresSource.value || _.isEmpty(measuresSource.value)) return [RIGHTYAXIS]

    // Auto Add new Axis to the right
    // if (selectedMeasureDetail.value.length < 1) {
    //     output.set('right', { ...RIGHTYAXIS, show: true })
    // }

    selectedMeasureDetail.value.forEach(x => {

        // _logger.debug('[yAxis] selectedMeasureDetail:%s', toJson(x));

        const axisDefinition = (x.position === 'right') ? { ...RIGHTYAXIS, ...x, name: null } : { ...LEFTYAXIS, ...x, name: null }

        let datatype = ['number', 'percentage', 'currency'].includes(x.datatype) ? x.datatype : null
        if (x.datacalc === 'normalised') {
            datatype = 'percentage'
        }

        axisDefinition.axisLabel = { ...axisDefinition.axisLabel, formatter: (d) => dataLabel(d, datatype) }

        if (datatype === 'percentage') {
            axisDefinition.max = (value) => { return value.max; }
        }

        switch (x.yaxis) {

            case 'scaled':
                axisDefinition['type'] = 'value'
                axisDefinition['scale'] = true
                break;

            case 'log':
                axisDefinition['type'] = 'log'
                axisDefinition['scale'] = false
                break;

            case 'value':
            default:
                axisDefinition['type'] = 'value'
                axisDefinition['scale'] = false
                break;

        }

        // _logger.debug('[yAxis] x:%s', toJson(x));

        switch (x.position) {

            case 'right':
                // Note Only adding 1 axis to the right
                output.set('right', axisDefinition)
                rightIndex.value++
                break;

            case 'left':
                if (leftIndex > 0) {
                    axisDefinition.offset = (leftIndex * 60)
                    axisDefinition.name = x.shortname
                    axisDefinition.show = true;
                }
                output.set(x.key, axisDefinition)
                leftIndex.value++
                break;

            case 'none':
                axisDefinition.show = false
                output.set('none', axisDefinition)
                break;
        }

        // _logger.trace('[yAxis] axisDefinition:%s', toJson(axisDefinition));
    })


    return [...output.values()]
})

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

const markerSeries = computed(() => {

    return Object.assign(
        {},
        seriesMarkers(),
        {
            type: 'line',
            // name: 'series_markers',
            label: { show: false },
            tooltip: { show: false },
            silent: true,
            data: dimensionsNames.value.map(x => null)
        }
    )
})

const averagesMarkLine = (datatype = 'number') => {

    _logger.trace('[averagesMarkLine] datatype:%s', datatype);

    const averagesMarkLine = {
        name: 'average line',
        type: 'average',
        symbol: 'none',
        label: {
            position: 'end',
            distance: 10,
            fontSize: 9,
            formatter: (d) => {
                if (datatype === 'percentage')
                    return (d.value).formatPercentage(2);
                else
                    return (d.value).formatNumber(2);
            }
        }
    }

    return { markLine: { data: [averagesMarkLine] } }

}

const dataLabel = (d, datatype = 'number', opts = {}) => {

    if (!d) return d;

    const value = (d.value) ? d.value : d

    switch (datatype) {
        case 'percentage':
        case 'percent':
            opts = { ...{ minimumFractionDigits: 0, maximumFractionDigits: 0 }, ...opts }
            return common.formatPercentage(value, opts);
        default:
            opts = { ...{ minimumFractionDigits: 0 }, ...opts }
            return common.formatNumber(value, opts);
    }
}

const createMeasureData = () => {

    if (_.isNil(measuresSource.value) || _.isEmpty(measuresSource.value)) {
        measureData.value = []
        _logger.warn('[createMeasureData] measuresSource is null -> return');
        return;
    }

    const output = new Array()

    const extractTerms = (text) => {

        if (!text || !_.isString(text) || isEmpty(text)) return new Map();

        const termsMap = new Map();
        // _logger.debug('[extractTerms] input:%s', text);

        const regex = /\w+\s+(\w+):\s*([^,]+(?:,[^,]+)*)/g;
        // const matches = text.match(regex);
        let match;

        const matches = text.matchAll(regex);
        for (const match of matches) {

            const key = match[1];
            const value = match[2];

            const values = value.split(',')

            if (termsMap.has(key)) {
                termsMap.get(key).push(values);
            } else {
                termsMap.set(key, values);
            }

        }

        // Extracting generic terms
        const genericTerms = text
            .split(/\s+/)
            .filter(term => !term.includes(':') && term.trim() !== "");

        if (genericTerms.length > 0) {
            termsMap.set('generic', genericTerms);
        }

        // termsMap.forEach((value, key) => {
        //     _logger.debug('[extractTerms] key:%s value:%s', key, toJson(value, true));
        // });

        return termsMap;
    }

    selectedMeasureDetail.value.forEach((measure) => {

        const filter = extractTerms(measure.filter)

        // Filter measure data 
        measuresSource.value.filter(x => {

            if (measure.key != x.measure.key) return false;

            const definition = { ...x.measure }

            for (const item of ['cohort', 'division', 'purchase_type']) {

                if (!filter.has(item)) continue;

                const terms = filter.get(item) ?? null
                const source = definition[item] ?? null

                if (_.isEmpty(terms) || _.isNil(source)) continue

                // Include (OR)
                let include = false;
                const includeTerms = terms.filter(term => term.charAt(0) != '-')
                for (const str of includeTerms) {
                    if (source.contains(str)) include = true;
                }
                if (includeTerms.length > 0 && !include) return false;

                // Not include (AND)
                for (const str of terms.filter(term => term.charAt(0) === '-')) {
                    if (source.contains(str.slice(1))) return false;
                }

            }

            if (filter.has("generic")) {

                const source = `${definition.value} ${definition.field}`
                const terms = filter.get('generic')

                for (const term of terms) {

                    switch (term.charAt(0)) {
                        case '-':
                            if (source.contains(term.slice(1))) return false;
                            break;

                        default:
                            if (!source.contains(term)) return false;
                    }

                }

            }

            return true;

        }).forEach(y => {
            output.push({ key: y.key, measure: { ...y.measure, ...measure }, data: y.data })
        })

    })

    const totals = new Map()

    // Post Process
    output.forEach((x) => {

        switch (x.measure.datacalc) {

            case 'normalised':

                for (const element of x.data) {

                    if (totals.has(element.column)) {
                        totals.set(element.column, totals.get(element.column) + element.data)
                    } else {
                        totals.set(element.column, element.data)
                    }

                }

                break;

        }

    })

    // for (const [key, value] of totals.entries()) {
    //     _logger.debug('[createMeasureData] %s:%s', key, value);
    // }

    measureTotals.value = totals ?? new Map();
    measureData.value = output ?? [];

}

const createMeasureSeries = () => {

    if (!measureData.value || _.isEmpty(measureData.value)) {
        measureSeries.value = []
        _logger.warn('[createMeasureSeries] measuresSource is null -> return');
        return;
    }

    const output = new Array()

    measureData.value.forEach((x) => {

        const data = [];

        for (const element of x.data) {

            switch (x.measure.datacalc) {

                case 'change':
                    data.push((element.diff === 0) ? null : element.diff)
                    break;

                case 'normalised':
                    let value = 0
                    if (measureTotals.value.has(element.column) && element.data > 0) {
                        value = (element.data / measureTotals.value.get(element.column));
                    }
                    data.push(value)
                    break;

                default:
                    data.push((element.data === 0) ? null : element.data)
            }

        }

        const yAxisIndex = yAxis.value.findIndex(y => y.key === x.measure.key)
        const definition = getChartDefinition(x.measure)

        const _stack = []
        if (definition.stack) {
            _stack.push(x.measure.key)
        }

        // _logger.debug('[createMeasureSeries] data:%s', toJson(data));
        // _logger.debug('[createMeasureSeries] definition:%s', toJson(definition));

        const series = Object.assign(
            {},
            DEFAULTSERIES,
            (definition.avg) ? averagesMarkLine(definition.datatype) : null,
            {
                type: definition.charttype,
                name: definition.label.value,
                filter: definition.filter,
                key: definition.key,
                stack: (definition.stack) ? _stack.join('.') : null,
                areaStyle: (definition.area) ? { opacity: 0.4 } : null,
                yAxisIndex: (yAxisIndex < 0) ? null : yAxisIndex,
                endLabel: (definition.end) ? {
                    show: true,
                    fontSize: 9,
                    lineHeight: 12,
                    borderColor: 'inherit',
                    borderWidth: 1,
                    padding: 2
                } : null,
                label: {
                    show: definition.labels,
                    fontSize: 9,
                    formatter: (d) => dataLabel(d, definition.datatype)
                },
                tooltip: {
                    valueFormatter: (d) => dataLabel(d, definition.datatype, { notation: 'standard' })
                },
                // symbol: measure.definition.symbol,
                symbolSize: 3,
                itemStyle: {
                    // borderColor: null,
                    // borderColor0: null,
                    opacity: (definition.charttype === 'bar') ? 0.6 : null,
                },
                smooth: 0.2,
                data: data,
            }
        )

        output.push(series)

    })

    measureSeries.value = output

}

const createSummaryData = () => {

    if (!measureData.value || _.isEmpty(measureData.value)) {
        measureSeries.value = []
        _logger.warn('[createMeasureSeries] measuresSource is null -> return');
        return;
    }

    const { startIndex, endIndex } = selectedChartDates.value ?? { startIndex: 0, endIndex: null }
    const output = new Array()

    measureData.value.forEach((x) => {

        const definition = getChartDefinition(x.measure)

        const data = new Array()

        if (definition.datacalc === 'normalised') {

            for (const element of x.data.map(x => x).slice(startIndex, endIndex ?? x.data.length)) {

                let value = 0

                if (measureTotals.value.has(element.column) && element.data > 0) {
                    value = (element.data / measureTotals.value.get(element.column));
                }

                data.push(value)
            }


        } else {

            x.data.map(x => x.data ?? 0).slice(startIndex, endIndex ?? x.data.length).forEach(x => data.push(x))

        }

        const stats = getStats(data)

        const opts = (definition.datatype === 'percentage') ? {} : { maximumSignificantDigits: 2 }

        const series = {
            key: definition.key,
            measure_value: definition.value,
            measure_name: definition.name,
            label: definition.label.value,
            sub: definition.label.sub,
            low: dataLabel(stats.low, definition.datatype, opts) ?? 0,
            high: dataLabel(stats.high, definition.datatype, opts) ?? 0,
            avg: dataLabel(stats.avg, definition.datatype, opts) ?? 0,
            open: dataLabel(stats.open, definition.datatype, opts) ?? 0,
            close: dataLabel(stats.close, definition.datatype, opts) ?? 0,
            diff: dataLabel(stats.diff, 'percentage') ?? 0,
            chg: dataLabel(stats.chg.per, 'percentage') ?? 0,
            change: stats.chg
        }

        output.push(series)

    })

    summarySeries.value = output

}

const getChartDefinition = (input = null) => {

    if (!input || _.isEmpty(input)) return { ...input }

    const override = {}
    const output = {

        // Divisions
        division: common.divisionName(input.division),

        // Purchase Types
        purchase_type: common.purchaseTypeName(input.purchase_type),

        // Cohorts
        cohort: common.cohortName(input.cohort),

        // Measure
        measure: input.name,

        // Field 
        field: common.measureName(input.field),

        // Field / (if Set)
        type: input.type ?? 'scalar',

        // Filter
        filter: input.filter

    }

    let label = null
    let sub = null

    if (selectedDivisions.value && selectedDivisions.value.length > 1 && !selectedDivisions.value.Same()) {
        label = (!label) ? `${output.division}` : `${label}/${output.division}`
        sub = label
    }

    if (selectedPurchaseTypes.value && selectedPurchaseTypes.value.length > 1 && !selectedPurchaseTypes.value.Same()) {
        label = (!label) ? `${output.purchase_type}` : `${label}/${output.purchase_type}`
        sub = label
    }

    if (selectedCohorts.value && selectedCohorts.value.length > 1 && !selectedCohorts.value.Same()) {
        label = (!label) ? `${output.cohort}` : `${label}/${output.cohort}`
        sub = label
    }

    // _logger.debug('[getChartDefinition] selectedMeasures:%s', toJson(selectedMeasures.value));
    if (selectedMeasures.value && selectedMeasures.value.length > 1) {
        label = (!label) ? `${output.measure}` : `${label} - ${output.measure}`
    }

    if (output.type === 'set' && !_.isNil(output.field)) {
        label = (!label) ? `${output.field}` : `${label} - ${output.field}`
        sub = (!sub) ? `${output.field}` : `${sub} - ${output.field}`
    }

    // if (!isEmpty(input.filter)) {

    //     _logger.debug('[getChartDefinition] input.filter:"%s" _.isNil(input.filter):%s', input.filter, _.isNil(input.filter));

    //     if (!isEqualCaseInsensitive(input.filter, input.value)) {
    //         label = (!label) ? `${output.measure}` : `${label} - (filter:${input.filter})`
    //     }
    // }

    if (!label || _.isNil(label)) {
        label = output.measure
    }

    if (!sub || _.isNil(sub)) {
        sub = output.measure
    }

    output['value'] = label
    output['sub'] = sub

    if (input.stack || input.datacalc === 'normalised') {
        override['stack'] = true;
    }

    if (input.datacalc === 'normalised') {
        override['datatype'] = 'percentage';
    }

    return { ...input, label: output, ...override }

}


watch(measuresSource, () => {

    _logger.debug('[watch|measuresSource] -> createMeasureData()');

    createMeasureData();
    createSummaryData();

})

watch(measureData, (newValue, oldValue) => {

    if (!_.isEqual(oldValue, newValue)) {

        _logger.debug('[watch|measureData] -> createMeasureSeries()');

        createMeasureSeries();

    } else {

        _logger.debug('[watch|measureData] no change');

        // nextTick(() => { updateChart(); })

    }

})

watch(series, () => {

    _logger.trace('[watch|series] series data updated -> calling updateChart');

    updateChart();

})

watch(showChartDetail, () => {

    _logger.trace('[watch|showChartDetail] showChartDetail updated -> calling updateChartTitle');

    updateChartTitle()

})

// watchDebounced(selectedChart, (newValue, oldValue) => {
watch(selectedChart, (newValue, oldValue) => {

    const _newValue = _.omit(newValue, ['zoom', 'title'])
    const _oldValue = _.omit(oldValue, ['zoom', 'title'])

    if (_.isNil(_newValue) || _.isNil(_oldValue) || !_.isEqual(_newValue, _oldValue)) {

        nextTick(() => {

            _logger.trace('[watch|selectedChart] !isEqual calling updateChart');

            updateChart();

        })

    } else {

        _logger.debug('[watch|selectedChart] selectedChart -> no change');

    }

},
    // { deep: true, debounce: 500, maxWait: 1000 },
    { deep: true },
)

insectumstore.add([
    { title: 'measureData', data: () => (measureData.value) ? measureData.value.map(x => x.measure) : [] },
    { title: 'measureTotals', data: () => Array.from(measureTotals.value.entries()) },
    // { title: 'measureData', data: () => (measureData.value) ? measureData.value.map(x => x.data) : [] },
    // { title: 'measuresSource', data: () => (measuresSource.value) ? measuresSource.value.map(x => x.measure) : [] },
    // { title: 'selectedMeasureDetail', data: () => selectedMeasureDetail.value },
    // { title: 'yaxis', data: () => yAxis.value },
], __name)

</script>

<style lang="scss">
.chart-container {
    position: relative;
    height: 73vh;
}
</style>