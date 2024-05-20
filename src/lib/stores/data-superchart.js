import * as ENV from '@t3b/app.config';

import { ref, computed, watch } from 'vue'

import { defineStore, storeToRefs } from 'pinia'
import { DateTime } from "luxon";
import Dexie from 'dexie';
import { customAlphabet, urlAlphabet } from 'nanoid'
import { Mutex } from 'async-mutex';
import emitter from '@t3b/lib/vue/vue-emitter';

import { factStore } from "@t3b/lib/stores/data-fact";
import { configStore } from "@t3b/lib/stores/app-config";
import { newlogger } from '@t3b/lib/vue/vue-logger';

import { toJson } from '@t3b/lib/functions/func-general';
import '@t3b/lib/functions/func-array';
import '@t3b/lib/functions/func-string';

export const superChartStore = defineStore("data-superchart", () => {

    const mutex = new Mutex();
    const nanoid = customAlphabet(urlAlphabet, 5)

    const factstore = factStore();
    const configstore = configStore();

    const { defaultMeasure } = storeToRefs(factstore)

    const _componentId = "data-superchart"
    const _filenames = ["api/charts.json"]
    const _host = configstore.apiAddress

    const _logger = newlogger({ name: _componentId, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    const _dbName = 'superchart'
    const _dbStore = 'charts'
    const defaultChartId = 'defaultchart'

    const defaultzoom = { startValue: null, startIndex: null, endValue: null, endIndex: null }
    const defaultChart = {
        measures: null,
        cohorts: null,
        divisions: null,
        purchasetypes: null,
        scale: null,
        detail: true,
        zoom: {
            days: defaultzoom,
            weeks: defaultzoom,
            months: defaultzoom
        }
    }

    // const _defaultMeasureOptions = {
    //     value: null,
    //     charttype: null,
    //     stack: null,
    //     area: null,
    //     labels: null,
    //     yaxis: null,
    //     avg: null,
    //     position: null,
    //     datatype: null,
    //     datacalc: null,
    //     end: null,
    //     scale: null,
    //     filter: null
    // }

    const _loading = ref(false)
    const _db = ref(null)
    const initalised = ref(false)

    const isLoading = computed(() => _loading.value)
    const generateId = () => nanoid()

    const createdb = () => {
        const db = new Dexie(_dbName);
        db.version(1).stores({ [_dbStore]: '&id, name, timestamp' });
        return db;
    }

    const initalise = async (force = false) => {

        if (!_db.value) {
            _db.value = createdb();
        }

        await _loaddata(force);

        await _insertDefaultChart();

        emitter.$emit('charts-updated')

        _logger.debug('[initalise] complete');

    }

    const _loaddata = async (force = false) => {

        _logger.trace('[_loaddata] awaiting RELEASE');

        const release = await mutex.acquire();

        _logger.debug('[_loaddata] start force:%s', force);

        if (initalised.value && !force) {
            _logger.debug('[_loaddata] data IS loaded/initalised -> RETURN (initalised:%s force:%s)', initalised.value, force);
            release()
            return;
        }

        _logger.info('[_loaddata] loading data (RELEASED)');

        try {

            _loading.value = true;

            _logger.debug('[_loaddata] loading...');

            _logger.debug('[load_loaddatadata] _filenames:%s', _filenames.join(','));

            // Import Files
            const _tasks = _filenames.map(async filename => {

                const url = new URL(filename, _host);

                _logger.debug('[loaddata] url -> %s', url.toString());

                const response = await fetch(url.toString());

                const contentType = response.headers.get("Content-Type")

                // _logger.debug('[_loaddata] contentType:%s', contentType);

                if (!response.ok || contentType != 'application/json') {
                    _logger.warn('[_loaddata] source is empty');
                    return []
                }

                const data = await response.json()

                // _logger.debug('[_loaddata] data:%s', toJson(data));

                return data

            })

            const _data = await Promise.all(_tasks);

            // _logger.debug('[_loaddata] _output:%s', toJson(_data));

            const _source = [].concat(..._data);

            _logger.debug('[_loaddata] loaded %s charts from file -> updating datastore', _source.length);

            await _updateDataStore(_source);

            initalised.value = true;

        }
        catch (err) {

            _logger.error(err)

            console.error(err)

        } finally {

            _loading.value = false;

            release()

            _logger.info("[_loaddata] complete")

        }

    }

    const _insertDefaultChart = async () => {

        if (await chartExists(defaultChartId)) return;

        const _insert = {
            id: defaultChartId,
            name: 'Default Transaction Chart',
            timestamp: DateTime.now().toMillis(),
            value: JSON.stringify(_validateOptions({ ...defaultChart }))
        }

        const _id = await _db.value.table(_dbStore).put(_insert);

        _logger.debug('[_insertDefaultChart] upserted default charts id:%s', _id);

    }

    const _updateDataStore = async (source = null) => {

        if (_.isNil(source) || _.isEmpty(source)) {
            _logger.warn('[_updatedatastore] source is empty');
            return;
        }

        // _logger.debug('[_updatedatastore] source:%s', toJson(source));

        try {

            _logger.trace('[_updatedatastore] start');

            _loading.value = true;

            const input = source.map(x => {

                return {
                    id: (!x.id) ? generateId() : x.id,
                    name: (!x.name) ? DateTime.now().toMillis() : x.name,
                    timestamp: DateTime.now().toMillis(),
                    value: JSON.stringify(x.value)
                }

            })

            // _logger.trace('[_updatedatastore] input:%s', toJson(input));

            await _bulkPutWithoutOverride(_db.value.table(_dbStore), input)

            // await _db.value.table(_dbStore).bulkPut(input);

        }
        catch (err) {

            _logger.error(err)

            console.error(err)

        } finally {

            _loading.value = false;

            _logger.info("[_updatedatastore] complete")

        }

    }

    const _bulkPutWithoutOverride = async (store, objects) => {
        const existingIds = (await store.toArray()).map(x => x.id);
        const objectsToAdd = objects.filter(obj => !existingIds.includes(obj.id));
        await store.bulkPut(objectsToAdd);
    }

    const getDefaultChart = async () => {

        return await getChart(defaultChartId);

    }

    const getLatestChart = async () => {

        if (!_db.value || !_db.value.isOpen()) {
            _logger.warn('[getLatestChart] opening and loading database');
            await initalise();
        }

        const release = await mutex.acquire();

        _logger.trace("[getLatestChart] getting chart")

        try {

            _loading.value = true;

            let output = await _db.value.table(_dbStore).orderBy('timestamp').reverse().first();

            if (!output || _.isEmpty(output)) {
                output = await _db.value.table(_dbStore).get(defaultChartId);
            }

            _logger.trace("[getLatestChart] output:%s", toJson(output))

            return _transformChart(output)

        }
        catch (err) {

            _logger.error('[getLatestChart] error %s', err);

            console.error(err)

        } finally {

            _loading.value = false;

            release()

            _logger.trace("[getLatestChart] complete loading:", _loading.value)

        }

    }

    const getCharts = async () => {

        if (!_db.value || !_db.value.isOpen()) {
            _logger.warn('[getCharts] opening and loading database');
            await initalise();
        }

        const release = await mutex.acquire();

        try {

            _loading.value = true;

            const charts = await _db.value.table(_dbStore).orderBy('timestamp').reverse().toArray();

            if (_.isEmpty(charts)) {
                _logger.warn('[getCharts] not charts available');
            }

            return (_.isEmpty(charts)) ? [] : charts.map(x => _.pick(x, ['id', 'name', 'timestamp']))

        }
        catch (err) {

            _logger.error('[getChart] error %s', err);

            console.error(err)

        } finally {

            _loading.value = false;

            release()

            _logger.trace("[getCharts] complete loading:", _loading.value)

        }

    }

    const getChart = async (id = null) => {

        if (!id || id === null) {
            _logger.warn('[getChart] NO selected chart id -> %s', id);
            return null;
        }

        if (!_db.value || !_db.value.isOpen()) {
            _logger.warn('[getChart] opening and loading database');
            await initalise();
        }

        const release = await mutex.acquire();

        try {

            _loading.value = true;

            const chart = await _db.value.table(_dbStore).get(id)

            return (_.isEmpty(chart)) ? null : _transformChart(chart)

        }
        catch (err) {

            _logger.error('[getChart] error %s', err);

            console.error(err)

        } finally {

            _loading.value = false;

            release()

            _logger.trace("[getChart] complete loading:", _loading.value)

        }

    }

    const upsertChart = async (input = {}) => {

        if (!input || _.isEmpty(input)) {
            _logger.warn('[upsertChart] Input is Empty -> %s', input);
            return input;
        }

        if (!_db.value || !_db.value.isOpen()) {
            _logger.warn('[upsertChart] opening and loading database');
            await initalise();
        }

        const release = await mutex.acquire();

        try {

            _loading.value = true;

            const { id, name, ...rest } = input
            const _input = { ...defaultChart, ...rest }
            const _value = _.omit(_input, ['id', 'name', 'timestamp'])

            const _insert = {
                id: (!id) ? generateId() : id,
                name: (!name) ? DateTime.now().toMillis() : name,
                timestamp: DateTime.now().toMillis(),
                value: JSON.stringify(_value)
            }

            _logger.trace('[upsertChart] adding:\n%s', toJson(_insert));

            const _id = await _db.value.table(_dbStore).put(_insert);

            _logger.trace('[upsertChart] upserted id:%s', toJson(_id));

            const output = await _db.value.table(_dbStore).get(_id)

            _logger.trace('[upsertChart] store chart:\n%s', toJson(output));

            return _transformChart(output)
        }
        catch (err) {

            _logger.error('[upsertChart] error %s', err);

            console.error(err)

        } finally {

            _loading.value = false;

            emitter.$emit('charts-updated')

            release()

            _logger.trace("[upsertChart] complete loading:", _loading.value)

        }

    }

    const chartExists = async (id) => {
        try {
            const object = await _db.value.table(_dbStore).get(id);
            return object !== undefined && object !== null;
        } catch (error) {
            _logger.error('[upsertChart] error %s', err);
            return false;
        }
    }

    const deleteChart = async (id = null) => {

        if (_.isNil(id)) {
            _logger.warn('[deleteChart] NO selected chart id -> %s', id);
            return null;
        }

        if (!_db.value || !_db.value.isOpen()) {
            _logger.warn('[deleteChart] opening and loading database');
            await initalise();
        }

        const release = await mutex.acquire();

        try {

            _loading.value = true;

            const chart = await _db.value.table(_dbStore).delete(id)

            return { status: true, error: null }

        }
        catch (err) {

            _logger.error('[loadChart] error %s', err);

            console.error(err)

            return { status: false, error: err }

        } finally {

            _loading.value = false;

            emitter.$emit('charts-updated')

            release()

            _logger.trace("[loadChart] complete loading:", _loading.value)

        }

    }


    const _transformChart = (input) => {

        const defaultOutput = { id: null, name: null, timestamp: null, value: null, ...defaultChart }
        if (!input || input == null) {
            return defaultOutput
        }

        const _input = { ...defaultOutput, ...input }
        const _value = _.omit(JSON.parse(_input.value), ['id', 'name', 'timestamp'])

        const output = { id: _input.id, name: _input.name, timestamp: _input.timestamp, ..._value };

        _logger.trace('[_transformChart] input:\n%s', toJson(input));
        _logger.trace('[_transformChart] _input:\n%s', toJson(_input));
        _logger.trace('[_transformChart] output:\n%s', toJson(output));

        return output

    }

    const _validateOptions = (input) => {

        _logger.trace('[_validateOptions] VALIDATE and UPDATE');

        _logger.trace('[_validateOptions]\ninput:%s\nkeys:%s', toJson(input), toJson(Object.keys(input)));

        const seriesProperties = ['value', 'charttype', 'stack', 'area', 'labels', 'yaxis', 'avg', 'position', 'datatype', 'datacalc', 'end', 'scale']
        const output = {}

        // Note the sort order. 'measures' before 'series', to cover defaults
        // for (const key of sortbyOrder(Object.keys(input), sort)) {

        const _addDefaultMeasure = (output) => {
            const id = generateId()
            output['measures'] = (_.isArray(output['measure'])) ? [...output['measure'], id] : [id]
            output[id] = { ..._.pick({ ...defaultMeasure.value, ...factstore.measures.find(x => x.value === 'transaction_cnt') }, seriesProperties) }
            _logger.trace('[_validateOptions] added default\nmeasures:%s\nmeasure:%s', toJson(output['measures'], true), toJson(output[id]));
        }

        for (const key of Object.keys(input)) {

            if (key === 'measures') {

                const _measures = (Array.isArray(input[key])) ? input[key] : input[key]?.split(',') ?? []

                _logger.trace('[_validateOptions] measures:%s isempty:%s', toJson(_measures, true), _.isEmpty(_measures));

                // Validate, merge defaults and input
                _measures.forEach(x => {

                    _logger.trace('[_validateOptions]\nmeasure:%s\ninput:%s\nisempty:%s', x, toJson(input[x]), _.isEmpty(input[x]));

                    if (!input[x] || _.isEmpty(input[x])) {
                        _logger.warn('[_validateOptions] measure (%s) detail not found', toJson(x, true));
                        _.pull(_measures, x)
                        return;
                    }

                    const _input = { value: null, ...input[x] }

                    _logger.trace('[_validateOptions] merged input:%s', toJson(_input));

                    const _configMeasure = factstore.measures.find(x => x.value === _input.value)
                    _logger.trace('[_validateOptions] _configMeasure input:%s\nisempty:%s', toJson(_configMeasure), _.isEmpty(_configMeasure));

                    if (!_configMeasure || _.isEmpty(_configMeasure)) {
                        _logger.warn('[_validateOptions] measure (%s) detail not found', toJson(x, true));
                        return;
                    }

                    output[x] = _.pick({ ...defaultMeasure.value, ..._configMeasure, ..._input }, seriesProperties)
                    _logger.trace('[_validateOptions] output:%s', toJson(output[x]));
                })

                // Add default if Empty
                if (!_measures || _.isEmpty(_measures)) {
                    _logger.warn('[_validateOptions] adding default measure');
                    _addDefaultMeasure(output);

                } else {
                    output['measures'] = _measures

                }

                // _logger.trace('[_validateOptions] output:%s', toJson(output));

                continue;
            }

            if (key === 'divisions') {
                const divisions = (Array.isArray(input[key])) ? input[key] : input[key]?.split(',') ?? []
                output[key] = _.intersection(factstore.divisions.map(x => x.value), (_.isEmpty(divisions)) ? ['all'] : divisions)
                continue
            }

            if (key === 'cohorts') {
                const cohorts = (Array.isArray(input[key])) ? input[key] : input[key]?.split(',') ?? []
                output['cohorts'] = _.intersection(factstore.cohorts.map(x => x.value), (_.isEmpty(cohorts)) ? ['all'] : cohorts)
                continue
            }

            if (key === 'purchasetypes') {
                const purchasetypes = (Array.isArray(input[key])) ? input[key] : input[key]?.split(',') ?? []
                output['purchasetypes'] = _.intersection(factstore.purchaseTypes.map(x => x.value), (_.isEmpty(purchasetypes)) ? ['all'] : purchasetypes)
                continue
            }

            if (key === 'scale') {
                const scale = input[key]
                output['scale'] = (!scale || !['years', 'months', 'weeks', 'days'].includes(scale)) ? 'weeks' : scale
                continue
            }

        }

        // Final Check
        for (const key in defaultChart) {
            if (!output.hasOwnProperty(key) || output[key] === undefined) {
                output[key] = defaultChart[key];
            }
        }

        // _logger.debug('[_validateOptions] output:%s', toJson(output));

        return output;
    }

    return { isLoading, initalised, defaultChart, initalise, chartExists, getCharts, getChart, getLatestChart, getDefaultChart, upsertChart, deleteChart }

});