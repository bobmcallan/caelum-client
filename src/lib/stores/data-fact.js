import * as ENV from '@t3b/app.config';

import { defineStore, storeToRefs } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import { DateTime } from "luxon";
import { Mutex } from 'async-mutex';

import { configStore } from "@t3b/lib/stores/app-config";

import { importCSV, toJson } from '@t3b/lib/functions/func-general';
import { newlogger } from '@t3b/lib/vue/vue-logger';

export const factStore = defineStore("data-factstores", () => {

    const DEFAULT_FACT = { name: null, value: null }
    const DEFAULT_MEASURE = {
        key: null,
        value: null,
        title: false,
        datatype: 'number',
        datacalc: null, // change ,
        position: 'right',
        charttype: 'line',
        stack: false,
        area: false,
        yaxis: 'value', // value, log, scaled
        labels: false,
        end: false,
        avg: null
    }

    const configstore = configStore();

    const divisionOrder = ["all", 'div-bunnings', 'div-catch', 'div-kmart', 'div-officeworks', 'div-target'];
    const purchaseTypeOrder = ["all", "online", "instore", "click_and_collect"];

    const _componentId = "data-factstores"
    const _filenames = ["api/facts_onedigital.csv", "api/facts_onepass.csv"]
    const _host = configstore.apiAddress

    const _logger = newlogger({ name: _componentId, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    const mutex = new Mutex();

    const _loading = ref(false)
    const _initalised = ref(false)
    const _source = ref([])

    const isLoading = computed(() => _loading.value)
    const isInitalised = computed(() => _initalised.value)

    const initalise = async () => {

        _logger.trace('[initalise] start');

        await loaddata();

        _logger.trace('[initalise] end');

    }

    const loaddata = async (force = false) => {

        const release = await mutex.acquire();

        if (_initalised.value && !force) {
            _logger.debug('[loaddata] data is loaded/initalised');
            release();
            return;
        }

        try {

            _logger.trace('[loaddata] start');

            _loading.value = true;
            _initalised.value = false;

            for (const filename of _filenames) {

                _logger.trace('[loaddata] loading:%s', filename);

                const url = new URL(filename, _host);
                _logger.debug('[loaddata] url -> %s', url.toString());

                await fetch(url.toString())
                    .then(response => response.text())
                    .then(data => importCSV(data))
                    .then(data => data.map(x => {
                        const source = (x.source) ? x.source : 'onepass'
                        const id = `${source}.${x.category}.${x.name}`

                        if (!x || !x.category || _.isNil(x.category))
                            return;

                        // _logger.debug('[loaddata] x:%s', toJson(x));

                        const data = { id: id, source: source, ...x }

                        _source.value.push(data)
                    }));

            }

            _initalised.value = true;

        }
        catch (err) {

            console.log(err)

            _logger.warn('[loaddata] error %s', JSON.stringify(err, null, 2));

        } finally {

            _loading.value = false;

            release()

            _logger.info("[loaddata] complete")

        }

    }

    const measures = computed(() => {

        const output = [
            { name: 'Transactions', value: 'transaction_cnt', description: 'Unique Transaction Count', shortname: 'TXN' },
            { name: 'Signups per Transactions', value: 'signups_per_transaction', description: 'Attributed Signups per\nUnique Transactions (* 0.0001)', shortname: 'Signups Per TXN' },
            { name: 'Signups per Member', value: 'signups_per_transacting_members', description: 'Attributed Signups per\nUnique Transacting Member (* 0.0001)', shortname: 'Signups Per MBR' },
            { name: 'Member Count', value: 'member_cnt', description: 'Unique transacting member count', shortname: 'MBR' },
            { name: 'Member Frequency', value: 'frequency', description: 'Member Transaction Frequency (per scale)', shortname: 'FREQ' },
            { name: 'Gross Transaction Value (GTV)', value: 'gtv', description: 'Gross Transaction Value (per scale, incl. GST)', shortname: 'GTV' },
            { name: 'Recency, Frequency, Monetary (RFM)', value: 'rfm', description: 'Recency, Frequency, Monetary (per scale)', shortname: 'RFM' },
            { name: 'RFM - Frequency (RFM)', value: 'rfm_frequency', description: 'RFM - Frequency  (per scale)', shortname: 'RFM' },
            { name: 'RFM - Spend (RFM)', value: 'rfm_spend', description: 'RFM - Spend  (per scale)', shortname: 'RFM' },
            { name: 'RFM - Monetary (RFM)', value: 'rfm_monetary', description: 'RFM - Monetary  (per scale)', shortname: 'RFM' },
            { name: 'RFM - Recency (RFM)', value: 'rfm_recency', description: 'RFM - Recency  (per scale)', shortname: 'RFM' },
            { name: 'Average Order Value (AOV)', value: 'aov', description: 'Total Transaction Value (incl. GST) / Total Transacting Members', shortname: 'AOV' },
            { name: 'Online Signup Attribution - Summary', value: 'signups_online', description: 'Attributed Online Signups Total (Customer Insights)', shortname: 'Online Signups' },
            { name: 'Instore Signup Attribution - Summary', value: 'signups_instore', description: 'Attributed Instore Signups\nBased upon instore Flybuys identification', shortname: 'Instore Signups' },
            { name: 'Signup Attribution - Totals', value: 'signups_instore_online', description: 'Attributed Instore and Online Signups', shortname: 'Signups' },
            { name: 'Signup Attribution - Detail', value: 'signups_detail', description: 'Attributed Instore and Online Signups', shortname: 'Signups' },
            { name: 'OnePass Membership', value: 'membership', description: 'Member by Category\n(Monthly, Yearly, Trial, Bundle)', shortname: 'MBR' },
            { name: 'OnePass Membership Active', value: 'membership_active', description: 'Total Active Membership\n(Monthly, Yearly, Bundle)', shortname: 'MBR' },
            { name: 'OnePass Membership Total', value: 'membership_total', description: 'Total Membership\n(Paid and UnPaid)', shortname: 'OP MBR' },
            { name: 'OnePass Transactions', value: 'onepass_transaction_cnt', description: 'OnePass Transaciton Count (Source:OnePass)', shortname: 'OP TXN' },
            { name: 'OnePass Member Count', value: 'onepass_member_cnt', description: 'Unique OnePass transacting member count (Source:OnePass)', shortname: 'OP MBR' },
            { name: 'OnePass Transactions by Membership', value: 'transactions_by_cohort', description: 'Unique OnePass transacting count by membership status (Source:OnePass)', shortname: 'OP TXN' },
            { name: 'OnePass RFM', value: 'onepass_rfm', description: 'Recency, Frequency, Monetary (per scale) (Source:OnePass)', shortname: 'OP MBR' },
            { name: 'OnePass Members (Transacting) by Membership', value: 'transacting_members_by_cohort', description: 'Unique OnePass (transacting) member count by membership status (Source:OnePass)', shortname: 'OP MBR' },
            { name: 'OnePass Revenue by Membership', value: 'revenue_by_cohort', description: 'OnePass member revenue by membership status (Source:OnePass)', shortname: 'OP $' },
        ]
        return output.map((x) => ({ ...DEFAULT_MEASURE, ...x }))
    })

    const cohorts = computed(() => {

        return [
            { name: 'All', value: 'all' },
            { name: 'OnePass', value: 'onepass' },
            { name: 'OnePass w/ Flybuys Linked', value: 'onepass_flybuys_linked' },
            { name: 'Flybuys', value: 'flybuys' },
            { name: 'Flybuys Less OnePass Linked', value: 'flybuys_less_onepass' },
            { name: 'OnePass - Members', value: 'member' },
            { name: 'OnePass - Members Monthly', value: 'member_monthly' },
            { name: 'OnePass - Members Yearly', value: 'member_yearly' },
            { name: 'OnePass - Members Bundle', value: 'member_bundle' },
            { name: 'OnePass - Members Trial', value: 'member_trial' },
            { name: 'OnePass - Non-Members', value: 'non-member' },
            { name: 'OnePass - Switching', value: 'member_switching' },

            // { name: 'Non OnePass & Flybuys', value: 'non_op_fb' },
            // { name: 'Email Only', value: 'email_only' },
            // { name: 'Email Only ( - $60 )', value: 'email_only_below_mov' },
            // { name: 'Flybuys & Email ( - $60 )', value: 'flybuys_email_only_below_mov' },
            // { name: 'OnePass - CVP', value: 'onepass_cvp' },
            // { name: 'OnePass - Black Friday', value: 'onepass_black_friday' },
        ]

    })

    const divisions = computed(() => {

        if (!_source.value) {
            _logger.debug('[divisions] empty');
            return [];
        }

        const _output = _source.value.filter(x => x.source.toLowerCase() === 'onedigital' && x.category.toLowerCase() === "division").map(x => ({ name: x.name, value: x.value }))

        return _(_output).uniqBy('name').sortBy((x) => _.indexOf(divisionOrder, x.value)).value();
        // return _.sortBy(_output, (x) => _.indexOf(divisionOrder, x.value))
    })

    const purchaseTypes = computed(() => {

        if (!_source.value) {
            _logger.debug('[purchaseTypes] empty');
            return [];
        }

        let _output = _source.value.filter(x => x.category.toLowerCase() == "purchase-type").map(x => ({ name: x.name, value: x.value }))

        return _(_output).uniqBy('name').sortBy((x) => _.indexOf(purchaseTypeOrder, x.value)).value();
    })

    const transactionDateMin = computed(() => {
        if (!_source.value) return DEFAULT_FACT.value;

        return Object.assign({}, DEFAULT_FACT, _source.value.find(x => x.source.toLowerCase() === 'onedigital' && x.category.toLowerCase() == "transaction-date-min")).value

    })

    const transactionDateMax = computed(() => {

        if (!_source.value) return DEFAULT_FACT.value;

        return Object.assign({}, DEFAULT_FACT, _source.value.find(x => x.source.toLowerCase() === 'onedigital' && x.category.toLowerCase() == "transaction-date-max")).value
    })

    const displayDateMax = computed(() => {

        if (!_source.value) return DEFAULT_FACT.value;

        const WEEK_LIMIT = 2

        const output = (!transactionDateMax.value) ? DateTime.local().minus({ week: WEEK_LIMIT }).endOf('week') : DateTime.fromISO(transactionDateMax.value).minus({ week: WEEK_LIMIT }).endOf('week')

        _logger.debug('[displayDateMax] maxTransactionDate:%s', DateTime.fromISO(transactionDateMax.value));
        _logger.debug('[displayDateMax] output:%s', output);

        return output;

    })

    const chartTypes = computed(() => {
        return [
            { name: 'Line', value: 'line' },
            { name: 'Bar', value: 'bar' },
        ]
    })

    const chartOptions = computed(() => {

        return [
            { name: 'Labels', value: 'labels' },
        ]
    })

    const chartScales = computed(() => {

        return [
            { name: 'Days', value: 'days', description: 'Days' },
            { name: 'Weeks', value: 'weeks', description: 'Weeks (Mon-Sun)' },
            { name: 'Months', value: 'months', description: 'Months' }
            // { name: 'Years', value: 'years' },
        ]

    })

    const dataCalculations = computed(() => {
        return [
            { name: '% Change', value: 'change' },
        ]
    })

    const defaultMeasure = computed(() => DEFAULT_MEASURE)

    return { initalise, isInitalised, isLoading, measures, cohorts, divisions, purchaseTypes, transactionDateMin, transactionDateMax, displayDateMax, chartOptions, chartTypes, chartScales, dataCalculations, defaultMeasure }

});