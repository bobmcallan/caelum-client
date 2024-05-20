<template>
    <section>

        <el-card class="footer box-card" shadow="never">

            <p class="pb-2"> OneDigital Pty Ltd </p>

            <sub class="text-gray font-100 pb-1">version: {{ version }} | client: {{ mode }} | vue: {{ vueversion }}</sub>

        </el-card>

        <hr class="is-spacer" />

    </section>
</template>

<script setup>
    import { computed } from "vue";
    import { newlogger } from '@t3b/lib/vue/vue-logger';
    import { configStore } from "@t3b/lib/stores/app-config";

    const logger = newlogger({ name: 'userCntrl', level: 'debug' });
    const config = configStore();
    const mode = computed(() => config.getVariable("clientmode"))
    const version = computed(() => config.getVariable("version"))
    const vueversion = computed(() => config.getVariable("vue"))
</script>