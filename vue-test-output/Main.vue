<script setup lang="ts">
import Section from './Section.vue';
import Section from './Section.vue';
import Section from './Section.vue';
import Section from './Section.vue';
</script>
<template>
  <main>
    <section id="intro">
      <h2>Welcome to Our Platform</h2>
      <p>This fixture tests Vue SFC conversion with various HTML elements and attributes.</p>
    </section>

    <section id="contact-form">
      <h3>Contact Form</h3>
      <form @submit="handleSubmit(event)">
        <div>
          <label for="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Enter your name"
            @input="handleNameInput(event)"
            @blur="handleNameBlur(event)"
            :disabled=""
          />
        </div>

        <div>
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            @input="handleEmailInput(event)"
            @blur="validateEmail(event)"
          />
        </div>

        <div>
          <label for="message">Message</label>
          <textarea
            id="message"
            name="message"
            rows="4"
            placeholder="Your message..."
            @input="handleMessageInput(event)"
            @change="handleMessageChange(event)"
          />
        </div>

        <button type="submit" @click="submitForm(event)">Send Message</button>
      </form>
    </section>

    <section id="interactions">
      <h3>Interactive Elements</h3>
      <div>
        <button @click="toggleDarkMode(event)" class="mode-toggle">Toggle Dark Mode</button>

        <button @click="incrementCounter(event)" class="counter-btn">Increment</button>

        <button @click="decrementCounter(event)" class="counter-btn">Decrement</button>

        <select id="theme-select" @change="handleThemeChange(event)">
          <option value="light">Light Theme</option>
          <option value="dark">Dark Theme</option>
          <option value="auto">Auto</option>
        </select>
      </div>
    </section>

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
  </main>
</template>
<style scoped>
.main {
  padding: 0.5rem;
  margin: 0 auto;
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #ccc;
  background-color: #dc3545;
}
</style>
