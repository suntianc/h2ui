<script setup lang="ts">
import './global.css';
import SiteHeaderHeader from './SiteHeaderHeader.vue';
import Main from './Main.vue';
import Footer from './Footer.vue';
</script>
<template>
  <body>
    <header class="site-header">
      <h1 @click="handleTitleClick()">My Vue App</h1>
      <nav>
        <a href="/" @click="navigateHome(event)">Home</a>
        <a href="/about" @click="navigateAbout(event)">About</a>
        <a href="/contact" @click="navigateContact(event)">Contact</a>
      </nav>
    </header>

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
  </body>
</template>
<style scoped>
.index {
  display: flex;
  margin-bottom: 0.5rem;
  padding: 0;
  border: 1px solid #ccc;
  background-color: #dc3545;
  gap: 1rem;
  margin-top: 1.5rem;
}
</style>
