<template>
    <el-avatar :shape="shape" :size="size" :style="avatar.style">
        <span style="font-size: large;">{{ avatar.letter }}</span>
    </el-avatar>
</template>

<script setup>
    import * as CMM from './common';
    import * as ENV from '@t3b/app.config';
    import { newlogger } from '@t3b/lib/vue/vue-logger';
    import { computed, ref } from "@vue/reactivity"
    import { firstChar, avatarStyle } from '@t3b/lib/functions/func-general';

    const __name = "avatarCntrl"
    const logger = newlogger({ name: __name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

    const props = defineProps(['isloading', 'shape', 'size', 'name'])

    const shape = computed(() => _.isEmpty(props.shape) ? "square" : props.shape)
    const size = computed(() => _.isEmpty(props.size) ? "default" : props.size)

    const avatar = computed(() => {
        if (_.isEmpty(props.name)) {
            return CMM.AVATAR
        }

        return Object.assign({}, CMM.AVATAR, {
            letter: firstChar(props.name),
            style: avatarStyle(props.name)
        })
    })

    const emit = defineEmits(['refresh'])

    const search = ref(null)

    const refresh = function () {
        logger.debug("[refresh] emit");
        emit('refresh', search.value)
    }

</script>