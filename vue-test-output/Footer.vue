<script setup lang="ts">
import Div from './Div.vue';
</script>
<template>
  <footer>
    <div>
      <div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/privacy" @click="navigatePrivacy(event)">Privacy Policy</a></li>
            <li><a href="/terms" @click="navigateTerms(event)">Terms of Service</a></li>
            <li><a href="/faq" @click="navigateFAQ(event)">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4>Connect</h4>
          <ul>
            <li><a href="https://twitter.com" @click="openTwitter(event)">Twitter</a></li>
            <li><a href="https://github.com" @click="openGitHub(event)">GitHub</a></li>
            <li><a href="https://linkedin.com" @click="openLinkedIn(event)">LinkedIn</a></li>
          </ul>
        </div>
      </div>
      <div>
        <p @click="handleCopyrightClick()">© 2024 My Vue App. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>
<style scoped>
.footer {
  background-color: #f5f5f5;
  padding: 0;
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
}
</style>
