<script setup lang="ts">
import H2 from './H2.vue';
import P from './P.vue';
</script>
<template>
  <section id="preferences">
    <h3>Preferences</h3>
    <div>
      <label>
        <input
          type="checkbox"
          id="notifications"
          @change="handleNotificationChange(event)"
          :checked=""
        />
        <span>Enable notifications</span>
      </label>

      <label>
        <input type="checkbox" id="newsletter" @change="handleNewsletterChange(event)" />
        <span>Subscribe to newsletter</span>
      </label>
    </div>

    <div>
      <p>Preferred Contact Method:</p>
      <label>
        <input
          type="radio"
          name="contact-method"
          value="email"
          :checked=""
          @change="handleContactMethodChange(event)"
        />
        <span>Email</span>
      </label>
      <label>
        <input
          type="radio"
          name="contact-method"
          value="phone"
          @change="handleContactMethodChange(event)"
        />
        <span>Phone</span>
      </label>
      <label>
        <input
          type="radio"
          name="contact-method"
          value="sms"
          @change="handleContactMethodChange(event)"
        />
        <span>SMS</span>
      </label>
    </div>
  </section>
</template>
<style scoped>
.section {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
