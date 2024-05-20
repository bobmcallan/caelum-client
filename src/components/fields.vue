<template>

    <section class="container">

        <el-card class="box-card" shadow="never">

            <div class="field-content" :class="{ 'is-scrollable': scrollBars }" :style="calc_height">

                <div v-for="(value, name) in filteredData" :key="name" class="columns"
                    :class="{ 'is-compact': compact }">

                    <div class="column is-narrow is-one-quarter is-right">

                        <b>{{ name }}:</b>

                    </div>

                    <div class="column">

                        {{ value }}

                    </div>

                </div>

            </div>

        </el-card>

    </section>

</template>

<script>
    export default {
        name: 'Fields',

        logger: { level: 'debug' },

        props: {

            title: {
                type: String,
                required: false,
                default: null,
            },

            data: {
                type: [Array, Object, Map],
                default: () => [],
            },

            columns: {
                type: Array,
                default: () => [],
            },

            scrollBars: Boolean,

            compact: Boolean,

            height: null,

        },

        data() {
            return {
                compColumns: [...this.columns],
            };
        },

        computed: {

            calc_height: function () {

                if (this.height != null) {

                    return 'height:' + this.height + ';';

                } else return '';

            },

            filteredData: function () {

                if (_.isEmpty(this.data)) return [];

                if (!_.isEmpty(this.columns)) {

                    return _.pick(this.data, this.columns);

                } else {

                    return this.data;

                }

            },

        },

    };

</script>

<style lang="scss">
    div.field-content {
        width: inherit;
        height: inherit;
        overflow-y: visible;
        overflow-x: visible;

        &.is-scrollable {
            overflow-y: auto;
            overflow-x: auto;
        }

        .columns {
            .column:not(:first-child) {
                overflow-wrap: break-word;
                max-width: 800px;
            }

            &.is-compact {
                margin-bottom: 0px;

                .column {
                    padding-top: 0.05rem;
                    padding-right: 0.25rem;
                    padding-bottom: 0.05rem;
                    padding-left: 0.25rem;
                }
            }
        }
    }
</style>