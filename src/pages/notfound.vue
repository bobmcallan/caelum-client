<template>
    <section class="hero">

        <div class="hero-body">

            <div class="container">

                <div class="columns is-centered">

                    <h1>NOTFOUND</h1>

                </div>

            </div>

        </div>

    </section>

    <div class="container" v-if="isDebug">

    </div>
</template>

<script setup>
    import * as ENV from '@t3b/app.config';
    import { onMounted, computed, ref } from "vue";
    import { newlogger } from '@t3b/lib/vue/vue-logger';

    const __name = "notfound"
    const __loglevel = "debug" // ENV.LOGLEVEL

</script>