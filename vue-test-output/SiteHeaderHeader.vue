<script setup lang="ts">
import H1 from './H1.vue';
import Navigation from './Navigation.vue';
</script>
<template>
  <header class="site-header">
    <h1 @click="handleTitleClick()">My Vue App</h1>
    <nav>
      <a href="/" @click="navigateHome(event)">Home</a>
      <a href="/about" @click="navigateAbout(event)">About</a>
      <a href="/contact" @click="navigateContact(event)">Contact</a>
    </nav>
  </header>
</template>
<style scoped>
.siteHeaderHeader {
  background-color: #333;
  padding: 1rem;
  margin-top: 0.5rem;
}
</style>
