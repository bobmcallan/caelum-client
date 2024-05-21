import * as ENV from '@t3b/app.config';

import { ref, computed, watch } from 'vue'

import { defineStore, storeToRefs } from 'pinia'
import { DateTime } from "luxon";
import Dexie from 'dexie';
import { customAlphabet, urlAlphabet } from 'nanoid'
import { Mutex } from 'async-mutex';
import emitter from '@t3b/lib/vue/vue-emitter';

import { configStore } from "@t3b/lib/stores/app-config";
import { newlogger } from '@t3b/lib/vue/vue-logger';

import '@t3b/lib/functions/func-array';
import '@t3b/lib/functions/func-string';

export const apodStore = defineStore("data-apodstore", () => {

    const _componentId = "data-apodstore"

    const mutex = new Mutex();
    const nanoid = customAlphabet(urlAlphabet, 5)

    const configstore = configStore();
    const _host = configstore.apiAddress
    const _path = "apod"

    const _logger = newlogger({ name: _componentId, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    const defaultApod = {
        id: null,
        date: null,
        explanation: null,
        hdUrl: null,
        mediaType: null,
        serviceVersion: null,
        title: null,
        url: null
    }

    const _loading = ref(false)
    const _db = ref(null)
    const _dbName = 'nasa'
    const _dbStore = 'apod'

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

        emitter.$emit('apod-updated')

        _logger.debug('[initalise] complete');

    }

    // const initalise = async (force = false) => {

    //     await _getAPOD(force);

    //     emitter.$emit('apod-updated')

    //     _logger.debug('[initalise] complete');

    // }

    const _loaddata = async (force = false) => {

        _logger.trace('[_getAPOD] awaiting RELEASE');

        const release = await mutex.acquire();

        _logger.debug('[_getAPOD] start force:%s', force);

        if (initalised.value && !force) {

            _logger.debug('[_loaddata] data IS loaded/initalised -> RETURN (initalised:%s force:%s)', initalised.value, force);

            release()

            return;
        }

        try {

            _loading.value = true;

            _logger.debug('[_getAPOD] loading...');

            _logger.debug('[_getAPOD] _filenames:%s', _filenames.join(','));

            const url = new URL(_path, _host);

            _logger.debug('[_getAPOD] url -> %s', url.toString());

            const response = await fetch(url.toString());

            const contentType = response.headers.get("Content-Type")

            if (!response.ok || contentType != 'application/json') {
                _logger.warn('[_getAPOD] source is empty');
                return []
            }

            const data = await response.json()

            _logger.debug('[_loaddata] data:%s', toJson(data));

            await _updateDataStore(data);

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
                    name: (!x.title) ? DateTime.now().toMillis() : x.title,
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

    const getLatest = async () => {

        if (!_db.value || !_db.value.isOpen()) {
            _logger.warn('[getLatest] opening and loading database');
            await initalise();
        }

        const release = await mutex.acquire();

        _logger.trace("[getLatest] getting chart")

        try {

            _loading.value = true;

            let output = await _db.value.table(_dbStore).orderBy('timestamp').reverse().first();

            if (!output || _.isEmpty(output)) {
                throw "No Data"
            }

            _logger.trace("[getLatest] output:%s", toJson(output))

            return _transform(output)

        }
        catch (err) {

            _logger.error('[getLatest] error %s', err);

            console.error(err)

        } finally {

            _loading.value = false;

            release()

            _logger.trace("[getLatest] complete loading:", _loading.value)

        }

    }

    const _transform = (input) => {

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

    return { isLoading, initalised, initalise, getLatest }

});