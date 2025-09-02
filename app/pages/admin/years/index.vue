<script setup lang="ts">
// Automatische Weiterleitung auf das aktuelle Jahr
const currentYear = new Date().getFullYear()

// Weiterleitung auf die Jahre-Verwaltung mit dem aktuellen Jahr
await navigateTo(`/admin/years/${currentYear}`)
</script>

<template>
  <div>
    Weiterleitung...
  </div>
</template>
