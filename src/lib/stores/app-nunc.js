import * as ENV from '@t3b/app.config';
import { defineStore, storeToRefs } from 'pinia'
import { ref, computed, watch, readonly } from 'vue'
import { customAlphabet, urlAlphabet } from 'nanoid'
import { Mutex } from 'async-mutex';
import { DateTime } from "luxon";
import { until, computedAsync, watchDeep } from '@vueuse/core'

import { newlogger } from '@t3b/lib/vue/vue-logger';
import { factStore } from "@t3b/lib/stores/data-fact";
import { onedigitalStore } from "@t3b/lib/stores/data-onedigital";
import { superChartStore } from "@t3b/lib/stores/data-superchart";

import emitter from '@t3b/lib/vue/vue-emitter';

import * as dates from '@t3b/lib/functions/func-dates';
import { toJson } from '@t3b/lib/functions/func-general';

export const nuncStore = defineStore('app-nunc', () => {

    const _componentId = "app-nunc"
    const _logger = newlogger({ name: _componentId, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    const mutex = new Mutex();
    const nanoid = customAlphabet(urlAlphabet, 5)

    const factstore = factStore();
    const onedigitalstore = onedigitalStore();
    const superchartstore = superChartStore();

    const { defaultMeasure, displayDateMax, measures } = storeToRefs(factstore)
    const { defaultChart, initalised } = storeToRefs(superchartstore)

    const evaluating = ref(false)

    const isLoading = computed(() => factstore.isLoading || onedigitalstore.isLoading || evaluating.value)

    const initalise = async () => {
        // savedCharts.value = await superchartstore.getCharts()
    }

    const selectedChart = ref({})
    const savedChart = computedAsync(
        async () => {

            const id = selectedChart.value?.id ?? null

            if (!id || id === null)
                return {}

            _logger.trace('[savedChart] id:%s', id);

            return await superchartstore.getChart(id)
        },
        {},
        { lazy: true, evaluating }
    )

    const savedCharts = ref([])
    emitter.$on('charts-updated', async () => {
        savedCharts.value = await superchartstore.getCharts()
        _logger.debug('[charts-updated] event');
    })

    const generateId = () => nanoid()

    const getChart = async (id = null, raw = false) => {

        _logger.debug('[getChart] id:%s', toJson(id));

        selectedChart.value = await superchartstore.getChart(id)

        _logger.debug('[getChart] selectedChart:%s', toJson(selectedChart.value));

    }

    const getLatestChart = async (id = null) => {

        _logger.trace('[getLatestChart] id:%s', id);

        await until(initalised).toBe(true, { timeout: 1000, throwOnTimeout: true })

        selectedChart.value = (id != null) ? await superchartstore.getChart(id) ?? await superchartstore.getLatestChart() : await superchartstore.getLatestChart()

        _logger.trace('[getLatestChart] selectedChart:%s', toJson(selectedChart.value));

    }

    const saveChart = async () => {

        _logger.trace('[saveChart] input:%s', toJson(selectedChart.value));

        selectedChart.value = await superchartstore.upsertChart(selectedChart.value)

    }

    const newChart = async () => {

        const defaultchart = await superchartstore.getDefaultChart()

        _logger.trace('[newChart] defaultchart:%s', toJson(defaultchart));

        return { ...defaultchart, id: null, name: 'New Chart', timestamp: null }

    }

    const updateChart = async (input = {}) => {

        const defaultOutput = { id: null, name: null, timestamp: null, ...defaultChart }

        if (!input || input == null) {
            _logger.warn('[updateChart] input is null -> input:%s', toJson(input));
            return
        }

        _logger.trace('[updateChart] input:%s', toJson(input));

        // const currectChart = { ...selectedChart.value }

        selectedChart.value = { ...defaultOutput, id: selectedChart.id, name: input.name, ...input };

    }

    const deleteChart = async (id = selectedChart.value?.id) => {

        if (_.isNil(id)) {
            // id = selectedChart.value?.id
            _logger.warn('[deleteChart] id is null or blank id:%s', id);
            return { status: "id is null or blank", error: new error("id is null or blank") }
        }

        _logger.debug('[deleteChart] id:%s', id);

        return await superchartstore.deleteChart(id)

    }

    const selectedMeasures = computed(() => {

        const { measures } = selectedChart.value

        return (_.isArray(measures)) ? [...measures] : [];

    })

    const selectedMeasureDetail = computed(() => {

        const output = new Map()

        _logger.trace('[selectedMeasureDetail] selectedMeasures:%s', toJson(selectedMeasures.value));
        _logger.trace('[selectedMeasureDetail] selectedChart:%s', toJson(selectedChart.value));

        selectedMeasures.value.forEach(x => {

            const _measure = selectedChart.value[x]

            if (!_measure || _.isEmpty(_measure)) {
                _logger.warn('[selectedMeasureDetail] measure is empty', toJson(_measure));
                return;
            }

            const _definedMeasure = { ...defaultMeasure.value, ...factstore.measures.find(y => y.value === _measure.value) }

            _logger.trace('[selectedMeasureDetail] measure:%s', toJson(_measure));
            _logger.trace('[selectedMeasureDetail] measure(found):%s', toJson(_definedMeasure));

            // Prevent Null override from selectedOptions
            const _merged = _.mergeWith(_definedMeasure, _measure, (baseValue, inputValue) => { return (inputValue !== undefined && inputValue !== null) ? inputValue : baseValue; });

            _logger.trace('[selectedMeasureDetail] \n%s:%s', x, toJson(_merged));

            output.set(x, { ..._merged, key: x })

        })

        const _out = Array.from(output.values());

        _logger.trace('[selectedMeasureDetail] output:\n%s', toJson(_out));

        return _out

    })

    const selectedScale = computed(() => {
        const { scale } = selectedChart.value
        return (!scale || !['months', 'weeks', 'days'].includes(scale)) ? 'weeks' : scale;
    })

    const selectedDivisions = computed(() => {
        const { divisions } = selectedChart.value
        return _.intersection(factstore.divisions.map(x => x.value), (_.isEmpty(divisions)) ? ['all'] : divisions);
    })

    const selectedPurchaseTypes = computed(() => {
        const { purchasetypes } = selectedChart.value
        return _.intersection(factstore.purchaseTypes.map(x => x.value), (_.isEmpty(purchasetypes)) ? ['all'] : purchasetypes);
    })

    const selectedCohorts = computed(() => {
        const { cohorts } = selectedChart.value
        return _.intersection(factstore.cohorts.map(x => x.value), (_.isEmpty(cohorts)) ? ['all'] : cohorts);
    })

    const selectedDates = computed(() => {
        const format = 'dd-LLL-yyyy'

        return dates.generateScaledDates(selectedScale.value, displayDateMax.value).map(x =>
        ({
            date: x.toFormat(format),
            column: dates.dateToColumnName(selectedScale.value, x),
            segment: dates.getReportSegmentfromDate(selectedScale.value, x)
        }))
    })

    const selectedChartTimestamp = computed(() => {

        if (_.isNil(_selectedTimestamp.value)) return null;

        const output = DateTime.fromMillis(_selectedTimestamp.value)

        return output.toLocaleString(
            {
                weekday: 'short',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            }
        )
    })

    const _selectedTimestamp = ref()
    const isSaved = computed(() => {

        if (_.isEmpty(savedChart.value)) {
            _logger.debug('[isSaved] savedChart isEmpty -> return false');
            return true;
        }

        if (_.isEmpty(selectedChart.value)) {
            _logger.debug('[isSaved] selectedChart isEmpty -> return false');
            return true;
        }

        const _selectedChart = _.omit(selectedChart.value, 'timestamp');
        const _savedChart = _.omit(savedChart.value, 'timestamp');

        const _isEqual = _.isEqual(_selectedChart, _savedChart)

        // _logger.debug('[isSaved] selectedChart vs savedChart -> _isEqual:%s', _isEqual);
        return _isEqual

    })

    const selectedChartId = computed(() => {
        return selectedChart.value?.id ?? null
    })

    const selectedChartName = computed(() => {
        return selectedChart.value?.name ?? null

    })

    const selectedChartDates = computed(() => {

        const defaultValue = { startValue: null, startIndex: null, endValue: null, endIndex: null }

        if (!selectedChart.value) return defaultValue

        const { zoom } = selectedChart.value

        if (!zoom) return defaultValue

        const output = { startValue: null, startIndex: null, endValue: null, endIndex: null, ...zoom[selectedScale.value] }

        return output ?? defaultValue

    })

    const showChartDetail = computed(() => {
        const { detail } = selectedChart.value ?? { detail: true }

        //  const _detail = _.get(selectedChart.value, 'detail');

        return detail;
    })

    const _selectedChart = computed(() => {
        return _.cloneDeep(selectedChart.value)
    })

    const rawChart = computed(() => {

        const { id, name, ...rest } = selectedChart.value
        const _input = { ...superchartstore.defaultChart, ...rest }
        const _value = _.omit(_input, ['id', 'name', 'timestamp'])

        return {
            id: (!id) ? generateId() : id,
            name: (!name) ? DateTime.now().toMillis() : name,
            timestamp: DateTime.now().toMillis(),
            // value: JSON.stringify(_value)
            value: _value
        }

    })

    watchDeep(_selectedChart, (newValue, oldValue) => {

        const _isEmpty = _.isEmpty(newValue)
        if (_isEmpty) {
            _logger.warning('[watch|_selectedChart] Updated is Empty - > returning _isEmpty:%s', _isEmpty);
            return;
        }

        _logger.trace('[watch|_selectedChart] newValue:%s', toJson(newValue));
        _logger.trace('[watch|_selectedChart] oldValue:%s', toJson(oldValue));

        const _isEqual = _.isEqual(newValue, oldValue)
        _logger.trace('[watch|_selectedChart] _isEqual:%s', _isEqual);

        if (!_isEqual) {

            _selectedTimestamp.value = DateTime.now().toMillis()

            _logger.trace('[watch|_selectedChart] selectedTimestamp:%s', _selectedTimestamp.value);
            _logger.trace('[watch|_selectedChart] savedTimestamp:%s', savedChart.value?.timestamp ?? null);

            const _newValue = _.omit(newValue, ['zoom'])
            const _oldValue = _.omit(oldValue, ['zoom'])

            const _isEqual = _.isEqual(_newValue, _oldValue)
            _logger.trace('[watch|_selectedChart] _isEqual:%s', _isEqual);

            if (!_isEqual) {

                _logger.debug('[watch|_selectedChart] calling "chart-options-updated" event');
                emitter.$emit('chart-options-updated')

            }
        }

    })

    return {
        isLoading,
        evaluating,
        selectedChart,
        savedCharts,
        savedChart,
        selectedDates,
        selectedCohorts,
        selectedDivisions,
        selectedPurchaseTypes,
        selectedScale,
        selectedMeasures,
        selectedMeasureDetail,
        selectedChartId,
        selectedChartName,
        selectedChartTimestamp,
        selectedChartDates,
        showChartDetail,
        isSaved,
        rawChart,
        getChart,
        getLatestChart,
        updateChart,
        saveChart,
        newChart,
        deleteChart,
        generateId,
        initalise
    }

});