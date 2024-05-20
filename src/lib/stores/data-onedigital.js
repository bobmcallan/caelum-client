import * as ENV from '@t3b/app.config';

import { ref, computed, watch } from 'vue'

import { defineStore } from 'pinia'
import Dexie from 'dexie';
import { Mutex } from 'async-mutex';
import { storeToRefs } from 'pinia'

import emitter from '@t3b/lib/vue/vue-emitter';
import { nuncStore } from "@t3b/lib/stores/app-nunc";
import { configStore } from "@t3b/lib/stores/app-config";
import { newlogger } from '@t3b/lib/vue/vue-logger';

import { importCSV, toJson } from '@t3b/lib/functions/func-general';
import { convertStringToDate } from '@t3b/lib/functions/func-dates';
import '@t3b/lib/functions/func-array';
import '@t3b/lib/functions/func-string';

export const onedigitalStore = defineStore("data-onedigital", () => {

    const __componentId = "data-onedigital"
    const _logger = newlogger({ name: __componentId, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    const mutex = new Mutex();
    const configstore = configStore();
    const nuncstore = nuncStore();

    const _host = configstore.apiAddress
    const _loading = ref(false)
    const _db = ref(null)

    const _measures = ref(null)
    const _measure_names = ref([])

    const _selectedCohorts = computed(() => nuncstore.selectedCohorts)
    const _selectedDivisions = computed(() => nuncstore.selectedDivisions)
    const _selectedPurchaseTypes = computed(() => nuncstore.selectedPurchaseTypes)

    const _selectedMeasures = computed(() => nuncstore.selectedMeasureDetail.map(x => x.value))
    const _selectedMeasureDetail = computed(() => nuncstore.selectedMeasureDetail)

    const _selectedSegments = computed(() => nuncstore.selectedDates.map(x => x.segment))

    const isLoading = computed(() => _loading.value)
    const measureNames = computed(() => (_.isEmpty(_measure_names.value)) ? [] : _measure_names.value)
    const measureData = computed(() => (_.isEmpty(_measures.value)) ? null : _measures.value)
    const measuresSource = computed(() => (_.isEmpty(_measures.value)) ? null : _formatData(_measures.value))

    emitter.$on('chart-options-updated', () => {

        _logger.debug('[chart-options-updated] event called');

        getMeasures();

    })

    emitter.$on('refresh', async (e) => {

        _logger.debug('[refresh] event force:%s', e);

        getMeasures();

    })

    const getMeasures = async () => {

        if (!_selectedMeasureDetail.value || !_.isArray(_selectedMeasureDetail.value)) {
            _logger.warn('[getMeasures] NO selected measures is null -> %s', _selectedMeasureDetail.value);
            _measures.value = []
            return;
        }

        const input = _selectedMeasureDetail.value.filter(x => x.value !== 'none').map(x => {
            return { ...x, cohorts: _selectedCohorts.value, divisions: _selectedDivisions.value, purchasetypes: _selectedPurchaseTypes.value }
        })

        if (input.length <= 0) {
            _logger.warn('[getMeasures] Selected measures is null (filtered "none") -> %s', _selectedMeasures.value);
            _measures.value = []
            return;
        }

        // _logger.trace("[getMeasures] _selectedMeasureDetail:%s", toJson(_selectedMeasureDetail.value))
        // _logger.debug("[getMeasures] input:%s", toJson(input))

        const measures = input.map(x => {
            const configured = indexConfiguration.find(y => y.name === x.value)
            return { ...x, ...configured }
        })

        const queryTasks = measures.map(async m => await _getData(m))

        _measures.value = await Promise.all(queryTasks)
            .then((result) => {

                if (!result || !_.isArray(result)) {
                    _logger.warn('[getMeasures] Request returned null -> %s', _.isArray(result));
                    return []
                }

                return result.filter(x => !_.isEmpty(x)).flat()
            })
            .catch(err => {
                _logger.error(err)
            });

    }

    const indexConfiguration = [
        {
            name: 'membership',
            value: 'membership',
            cohorts: ['all', 'onepass', 'flybuys'],
            divisions: ["all", 'div-bunnings', 'div-catch', 'div-kmart', 'div-officeworks', 'div-target'],
            purchasetypes: ['all', 'online', 'instore', 'click_and_collect'],
        },
        {
            name: 'membership_total',
            value: 'membership_total',
            cohorts: ['all', 'onepass', 'flybuys'],
            divisions: ["all", 'div-bunnings', 'div-catch', 'div-kmart', 'div-officeworks', 'div-target'],
            purchasetypes: ['all', 'online', 'instore', 'click_and_collect'],
        },
        {
            name: 'membership_active',
            value: 'membership_active',
            cohorts: ['all', 'onepass', 'flybuys'],
            divisions: ['all', 'div-bunnings', 'div-catch', 'div-kmart', 'div-officeworks', 'div-target'],
            purchasetypes: ['all', 'online', 'instore', 'click_and_collect'],
        },
        {
            name: 'transactions_all',
            value: 'transaction_cnt',
            cohorts: ['onepass'],
        },
        {
            name: 'transactions_onepass',
            value: 'transaction_cnt',
            cohorts: ['onepass'],
        },
        {
            name: 'transactions_flybuys',
            value: 'transaction_cnt',
            cohorts: ['flybuys'],
        },
        {
            name: 'online_signups',
            value: 'online_signups',
            cohorts: ['onepass']
        },
        {
            name: 'signups_sum_online',
            value: 'signups_sum_online',
            cohorts: ['onepass'],
        },
        {
            name: 'signups_sum_instore',
            value: 'signups_sum_instore',
            cohorts: ['onepass']
        }
    ];

    const _getData = async (input = {}) => {

        const { key, value, cohorts, divisions, purchasetypes } = { key: null, value: null, cohorts: ['all'], divisions: ['all'], purchasetypes: ['all'], ...input }
        const defaultResponse = { key: key, measure_key: null, measure_name: null, measure_type: null, cohort: null, division: null, purchase_type: null, measures: null, data: null }

        // _logger.debug("[_getData] defaultResponse:%s", toJson(defaultResponse))

        if (!value || _.isNull(value)) {
            _logger.warn('[_getData] measure is null -> return');
            return null;
        }

        try {

            _loading.value = true;

            // _logger.trace("[_getData] start measure:%s loading:", measure, _loading.value)
            // _logger.trace("[_getData] input:%s", toJson({ measure: measure, cohorts: cohorts, divisions: divisions, purchasetypes: purchasetypes }))

            if (!_.head(divisions) || !_.head(purchasetypes)) {
                _logger.warn('[_getData] divisions and purchasetypes empty -> return');
                return;
            }

            const query = {
                measures: value,
                cohorts: cohorts,
                divisions: divisions,
                purchasetypes: purchasetypes
            }
            // _logger.debug("[_getData] query:%s", toJson(query))

            const queryString = new URLSearchParams(query).toString();

            // _logger.debug("[_getData] queryString:%s", queryString.toString())

            const request = new URL("api/measures", _host);
            request.search = queryString;

            // _logger.debug("[_getData] request:%s", request.toString())

            const result = await fetch(request.toString())
                .then(response => {
                    const contentType = response.headers.get("Content-Type")
                    if (!response.ok || !['application/json', 'text/csv', 'application/octet-stream'].includes(contentType)) {
                        _logger.warn('[_getData] contentType is not correct');
                        return null
                    }
                    else {
                        return response.json()
                    }
                })
                .then(response => {

                    const { result } = { result: null, ...response }

                    if (!result || _.isEmpty(result)) return [];

                    return result.map(x => ({ ...defaultResponse, ...x }))
                })

            // const report = result.map(x => _.pick(x, ['measure_key', 'measure_type', 'cohort', 'division', 'purchase_type']))
            // if (!result || _.isEmpty(result)) return [];

            const output = result.map(x => {

                const data = {};

                // Fill out the data
                for (const key of _selectedSegments.value) {
                    data[key] = (x.measure_type === 'set') ? { measure_value: 0 } : 0
                };

                // Load from source
                x.data = { ...data, ..._.pick(x.data, _selectedSegments.value) }

                // _logger.debug("[_getData] x:%s", toJson(x))
                return x
            })

            // const test = output.map(x => _.pick(x, ['key', 'measure_key', 'measure_type', 'cohort', 'division', 'purchase_type']))
            // _logger.debug("[_getData] test:%s", toJson(test))

            return output;
        }
        catch (err) {

            console.log(err)

            _logger.warn('[_getData] error %s', err);

        } finally {

            _loading.value = false;

            // _logger.debug("[_getData] complete measure:%s loading:", measure, _loading.value)

        }
    }

    const _formatData = (input = {}) => {

        if (!input || _.isEmpty(input)) {
            _logger.warn('[_formatData] input is null -> return');
            return {};
        }

        const output = new Map()

        const _formatColumn = (column) => {
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

            const measure_index = _.pick(x, ['cohort', 'division', 'purchase_type'])
            const measure_type = x.measure_type ?? 'scalar'

            // _logger.debug('[_formatData] measure_index:%s', toJson(measure_index));

            if (measure_type === 'set') {

                // Set Type

                for (const measure of x.measures) {

                    const measure_key = `${x.key}.${measure_index.cohort}.${measure_index.division}.${measure_index.purchase_type}.${measure.key}`
                    const field = measure.key

                    for (const column in x.data) {

                        const data = (output.has(measure_key)) ? output.get(measure_key).data : []
                        const value = x.data[column][field] ?? null

                        data.push({ ..._formatColumn(column), ...{ data: value } })

                        output.set(measure_key, { measure: { key: x.key, type: measure_type, value: x.measure_key, field: field, ...measure_index }, data: data })
                    }

                }

            } else {

                // Scalar Type
                const measure_key = `${x.key}.${measure_index.cohort}.${measure_index.division}.${measure_index.purchase_type}`

                for (let column in x.data) {

                    const data = (output.has(measure_key)) ? output.get(measure_key).data : []
                    const value = x.data[column]

                    data.push({ ..._formatColumn(column), ...{ name: measure_key, data: value } })

                    // output.set(measure_key, { measure: { measure_key: measure_key, value: x.measure_key, field: null, ...measureIndex }, data: data })
                    output.set(measure_key, { measure: { key: x.key, type: measure_type, value: x.measure_key, field: null, ...measure_index }, data: data })
                }

            }

            // Sort 
            // Calculate Difference 
            // Add Chart Definition
            // Add to Output
            // measureData.forEach((value, key) => {

            //     // Update with Ordered List
            //     const values = value?.data.sort((a, b) => a.order - b.order)
            //     const measure = value?.definition

            //     if (measureDefinition.datacalc === 'change') {

            //         // Add previousValue
            //         for (let i = 0; i < values.length; i++) {

            //             const currentValue = values[i]?.data ?? 0;
            //             const previousValue = (_.isArray(values[i - 1]?.data)) ? values[i - 1]?.data[1] : values[i - 1]?.data;
            //             const diff = _calculatePercentageDifference(currentValue, previousValue)

            //             values[i] = { ...values[i], prev: previousValue, diff: diff }

            //         }
            //     }

            //     _logger.trace('[_formatData] value:\n%s', toJson(values));

            //     outputData.set(key, { definition: definition, data: values });

            // });

        })

        return Array.from(output.values());

    }

    return { isLoading, measureNames, measureData, measuresSource }

});


