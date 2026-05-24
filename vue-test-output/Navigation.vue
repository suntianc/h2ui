<script setup lang="ts">
import A from './A.vue';
import A from './A.vue';
import A from './A.vue';
</script>
<template>
  <nav>
    <a href="/" @click="navigateHome(event)">Home</a>
    <a href="/about" @click="navigateAbout(event)">About</a>
    <a href="/contact" @click="navigateContact(event)">Contact</a>
  </nav>
</template>
<style scoped>
.navigation {
  margin-top: 0.5rem;
}
</style>
