<template>

    <div class="navbar-item">

        <table class="table is-fullwidth is-property-list">

            <tr>
                <td>Id</td>
                <td>{{$user.user_id}}</td>
            </tr>

            <tr>
                <td>Email</td>
                <td>{{$user.email}}</td>
            </tr>

            <tr>
                <td>Roles</td>
                <td>{{$user.roles}}</td>
            </tr>

            <tr>
                <td>Authorised</td>
                <td>{{$user.authorised}}</td>
            </tr>

            <tr>
                <td>Administrator</td>
                <td>{{$user.isAdministrator}}</td>
            </tr>

            <tr>
                <td>Expires</td>
                <td>{{expires}}</td>
            </tr>

            <tr>
                <td>Message</td>
                <td>{{$user.message}}</td>
            </tr>

        </table>

    </div>

</template>

<script>
    import { defineComponent, computed } from "vue";
    import { newlogger } from '@t3b/lib/vue/vue-logger';

    // import { authStore } from "@t3b/lib/stores/app-auth";

    const __name = "appUserCntrl"

    export default defineComponent({

        name: __name,

        setup() {
            const logger = newlogger({ name: __name, level: 'debug' });
            // const auth = authStore();

            return {
                expires: 0, //computed(() => auth.$state.expiresFrom),
            };
        }
    });

</script>