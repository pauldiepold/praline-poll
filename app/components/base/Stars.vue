<script lang="ts" setup>
defineProps<{
  rating: number
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="flex">
      <UIcon
        v-for="i in 5"
        :key="i"
        name="i-lucide-star"
        :class="['size-5', i <= rating ? 'text-primary fill-current' : 'text-gray-300']"
      />
    </div>
    <span class="text-sm text-gray-600 dark:text-gray-400">
      {{ rating }}/5
    </span>
  </div>
</template>
