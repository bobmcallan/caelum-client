<template>
    <router-view id="header" name="header"></router-view>

    <router-view name="default" v-slot="{ Component }" />

    <router-view id="footer" name="footer"></router-view>
</template>