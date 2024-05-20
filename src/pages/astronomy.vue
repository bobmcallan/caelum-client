<template>
    <section>

        <hr class="is-half" />

        <nav class="level">

            <div class="level-left">

                <el-space>

                Menu

                </el-space>

            </div>

            <div class="level-right">

                <el-space>

                    <el-button @click="refresh()" size="small">
                        <el-icon><i-carbon-renew /></el-icon>
                    </el-button>

                </el-space>

            </div>

        </nav>

    </section>

    <hr class="is-half" />

Goes HERE!!

    <hr class="is-spacer" />

    <insectum />
</template>

<script setup>

    import * as ENV from '@t3b/app.config';
    import { computed, ref, watch, nextTick, onMounted } from "vue";
    import { storeToRefs } from 'pinia'

    import routerFunctions from "@t3b/lib/vue/vue-router-functions";
    import * as functions from '@t3b/lib/functions/func-general';
    import * as common from '@t3b/pages/common';

    import emitter from '@t3b/lib/vue/vue-emitter';

    import { insectumStore } from "@t3b/lib/stores/app-insectum";
    import { nuncStore } from "@t3b/lib/stores/app-nunc";

    import { newlogger } from '@t3b/lib/vue/vue-logger';

    const __name = "indexCntrl"
    const logger = newlogger({ name: __name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    const insectumstore = insectumStore();
    const nuncstore = nuncStore();

    const { activeIndex  } = storeToRefs(nuncstore)

    const props = defineProps({
        index: {
            type: [String, Number],
            default: "astronomy",
        }
    })

    // insectumstore.add([], __name)

    const initalise = async (rebuild = false) => {

        logger.trace('[initalise] start');

        await Promise.all([
            // factstore.initalise(),
        ])

        logger.trace('[initalise] end');

    }

    const refresh = async () => {

        await initalise(true);

        emitter.$emit('refresh', true)

    }

    emitter.$on('refresh', () => {

        refresh();

    })

</script>

<style lang="scss">
@import './common.scss';

.flex-grow {
    flex-grow: 1;
}
</style>