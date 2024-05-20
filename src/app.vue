<template>
    <router-view id="header" name="header"></router-view>

    <router-view name="default" v-slot="{ Component }" />

    <router-view id="footer" name="footer"></router-view>
</template>

<script>
    // import * as ENV from '@t3b/app.config';

    // import { getCurrentInstance, defineComponent, computed, onBeforeMount, onMounted, ref, watch, watchEffect } from "vue";

    // import { useRouter, useRoute } from 'vue-router'

</script>