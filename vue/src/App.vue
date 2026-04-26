<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { Icon } from '@iconify/vue';
</script>

<template>
  <header>
    <div class="wrapper">

      <nav>
        <RouterLink :to="{ name: 'home' }">
          <Icon icon="mdi:home" class="nav-icon" /> 
          <span>Home</span>
        </RouterLink>

        <RouterLink :to="{ name: 'profile' }">
          <Icon icon="mdi:account" class="nav-icon" /> 
          <span>Profile</span>
        </RouterLink>

        <RouterLink :to="{ name: 'friends' }">
          <Icon icon="mdi:account-group" class="nav-icon" /> 
          <span>Friends</span>
        </RouterLink>
      </nav>
    </div>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
  margin: 0 auto;

}

nav {
  /* background-color: green; */
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem; /* Space between icon and text */
  padding: 0 1rem;
  text-decoration: none;
  color: rgb(228, 228, 228);

}

.nav-icon {
  font-size: 1.25rem; /* Adjust icon size here */
}
nav a:first-of-type {
  border: 0;
}

main {
  width: 60%;
  margin: 0 auto
}
</style>
