<template>
    <el-footer>

        <el-card class="footer box-card text-gray font-100 text-center" shadow="never">

            <el-space spacer="|">
                <sub>version: {{ version }}</sub>
                <sub>client: {{ mode }} </sub>
                <sub>vue: {{ vueversion }}</sub>
                <sub>api: {{ apiurl }}</sub>
            </el-space>

        </el-card>

        <hr class="is-spacer" />

    </el-footer>

</template>

<script setup>
import { computed } from "vue";
import { configStore } from "@t3b/lib/stores/app-config";

const config = configStore();
const mode = computed(() => config.getVariable("clientmode"))
const version = computed(() => config.getVariable("version"))
const vueversion = computed(() => config.getVariable("vue"))
const apiurl = computed(() => config.getVariable("apiurl"))
</script>