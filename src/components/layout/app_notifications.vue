<template>

</template>

<script>
    import { defineComponent, watch } from "vue";
    import { newlogger } from '@t3b/lib/vue/vue-logger';
    import * as ENV from '@t3b/app.config';

    import { notificationStore } from "@t3b/lib/stores/app-notifications";

    const __name = 'notificationsCntrl'
    const __loglevel = ENV.LOGLEVEL;

    export default defineComponent({

        name: __name,

        logger: { level: __loglevel },

        watch:
        {

            '$notifications.messages': function (value) {

                this.$logger.debug("[watch:$notifications.messages] notifications.messages changed to:%s", JSON.stringify(value, null, 2))

                Object.values(value).forEach(event => {
                    this.$notify(event)
                    this.$notifications.notified(event)
                });

            },
        }
    });
</script>