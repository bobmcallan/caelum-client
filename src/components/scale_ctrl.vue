<template>
    <div v-if="measure != 'gtv'">
        <sub>({{ formatValue('measure_cnt_min') }} -> {{ formatValue('measure_cnt_max') }})</sub>
    </div>
</template>

<script setup>
    import { computed } from "@vue/reactivity"

    import * as ENV from '@t3b/app.config';
    import { newlogger } from '@t3b/lib/vue/vue-logger';
    import { toJson } from '@t3b/lib/functions/func-general';

    const __name = "scaleCntrl"
    const logger = newlogger({ name: __name, level: (ENV.DEBUG) ? 'debug' : 'warn' });
    const props = defineProps({ isloading: Boolean, column: String, data: {}, show_percentage: Boolean })

    const measure = computed(() => {
        // logger.debug("[measure] props.measure:%s", props.measure);
        return (!data.value || _.isEmpty(data.value.measure_name)) ? '' : _.toString(data.value.measure_name)
    })

    const data = computed(() => {
        return (!props.data || _.isEmpty(props.data)) ? [] : props.data
    })

    const column = computed(() => {
        // logger.debug("[_column] props.column:%s", props.column);
        return (_.isEmpty(props.column)) ? "fy23" : props.column.toLowerCase()
    })

    const formatValue = (field) => {

        const _row = data.value

        if (!_row || !_row.data) {
            logger.warn("[formatValue] row is empty _column:%s _row:\n%s", _column, toJson(_row))
            return ''
        }

        // logger.debug("[formatValue] field:%s", field)
        // logger.debug("[formatValue] row:\n%s", toJson(_row))
        // logger.debug("[formatValue] output:%s", _row[field])

        if (_.isNull(field)) return "";

        const _format = (_row.measure_type) ? _row.measure_type.toLowerCase() : ''

        switch (_format) {

            case 'number':
                return _.toNumber(_row[field]).formatNumber()
            case 'currency':
                return _.toNumber(_row[field] / 100).formatCurrency()
            default:
                return _row[field]
        }

    }

</script>