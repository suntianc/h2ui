<script setup lang="ts"></script>
<template>
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
</template>
<style scoped>
.form {
  display: block;
  gap: 1rem;
  margin-bottom: 0.25rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background-color: #007bff;
}
</style>
