<script setup lang="ts">
// Props
interface Props {
  praline: {
    id: number
    year: number
    name: string
    description: string | null
    isVegan: boolean
    imagePath: string
    createdAt: Date
    updatedAt: Date
  }
  isRated?: boolean
  rating?: number
}

const props = withDefaults(defineProps<Props>(), {
  isRated: false,
  rating: 0
})

// Events
const emit = defineEmits<{
  click: [praline: Props['praline']]
}>()

const handleClick = () => {
  emit('click', props.praline)
}
</script>

<template>
  <UCard
    class="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:ring-2 hover:ring-primary"
    :ui="{ body: ' p-4 sm:p-4 flex flex-col gap-4' }"
    @click="handleClick"
  >
    <img
      v-if="praline.imagePath && praline.imagePath.trim() !== ''"
      :src="`/api/images/${praline.imagePath}`"
      :alt="`Bild der Praline ${praline.name}`"
      class="rounded-lg object-center object-cover"
      :class="isRated ? 'aspect-5/2' : 'aspect-3/2'"
      loading="lazy"
    >

    <div
      v-else
      :class="isRated ? 'aspect-5/2' : 'aspect-3/2'"
      class="rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
    >
      <UIcon
        name="i-lucide-candy"
        class="text-gray-400 size-10"
      />
    </div>

    <!-- Content -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-gray-900 dark:text-white truncate">
          {{ praline.name }}
        </h3>
        <PralineVeganBadge v-if="praline.isVegan" />
      </div>

      <p
        v-if="praline.description"
        class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
      >
        {{ praline.description }}
      </p>

      <BaseStars
        v-if="isRated && rating"
        :rating="rating"
      />
      <div
        v-else
        class="text-sm text-gray-500"
      >
        Noch nicht bewertet
      </div>
    </div>
  </UCard>
</template>
