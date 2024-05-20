<template>
    <section>

        <el-table ref="_measuredetail" style="width: 100%" :data="measuredetail" stripe :header-row-class-name="measureClass" :row-class-name="utils.measureRowClassName" v-loading="isLoading" row-key="id">

            <el-table-column label="Channel">
                <template #default="scope">
                    {{ utils.purchaseTypeName(scope.row.purchase_type) }}
                </template>
            </el-table-column>
            <el-table-column label="Segment">
                <template #default="scope">
                    {{ utils.segmentName(scope.row.segment_name) }}
                    <scalectrl :data="scope.row" :column="scope.column.property" />
                </template>
            </el-table-column>

            <el-table-column v-for="column in columns" :prop="column" align="right" :label="utils.formatColumnName(column)" label-class-name="header-dimension">
                <template #default="scope">
                    <measurectrl :data="scope.row" :column="column" show_percentage />
                </template>
            </el-table-column>

        </el-table>

    </section>
</template>

<script setup>

    import * as ENV from '@t3b/app.config';
    import { onMounted, onBeforeUnmount, computed, ref, toRaw, watch } from "vue";
    import { storeToRefs } from 'pinia'

    import { newlogger } from '@t3b/lib/vue/vue-logger';

    import measurectrl from "@t3b/components/measure_ctrl.vue";
    import scalectrl from "@t3b/components/scale_ctrl.vue";

    import { measuresStore } from "@t3b/lib/stores/data-measures";
    import { insectumStore } from "@t3b/lib/stores/app-insectum";

    import * as utils from '@t3b/pages/common.js';
    import { } from '@t3b/lib/functions/func-string';

    const __name = "measureTableCntrl"
    const logger = newlogger({ name: __name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    const measuresstore = measuresStore();
    const insectumstore = insectumStore();

    const { isLoading, measureDetailData } = storeToRefs(measuresstore)

    const measuredetail = computed(() => {
        if (!measureDetailData.value) return null;

        return _(measureDetailData.value).filter(x => x.measure_name === props.measure).cloneDeepWith(x => {

            x.data = Object.assign({}, _.pick(x.data, columns.value))

            return x;

        })
    })

    const columns = computed(() => (!props.columns || !_.isArray(props.columns)) ? [] : props.columns)
    const measureClass = computed(() => `measure-header measure-header-${props.measure}`)

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
        }
    })

    insectumstore.add([
        { title: 'measuredetail', data: measuredetail }
    ], __name);

    onBeforeUnmount(() => {
        insectumstore.remove(__name)
    })

</script>

<style lang="scss"></style>