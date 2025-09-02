<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({
  name: 'years-management-page',
  middleware: 'auth'
})

// Route parameter
const route = useRoute()
const year = parseInt(route.params.year as string)

// Validierung: Jahr muss zwischen 2021 und 2050 liegen
if (isNaN(year) || year <= 2020 || year > 2050) {
  throw createError({
    statusCode: 400,
    statusMessage: 'Ungültiges Jahr. Das Jahr muss zwischen 2021 und 2050 liegen.'
  })
}

// Seitenspezifischer Titel
useHead({
  title: `Jahr ${year} - Verwaltung`
})
const { availableYearsQuery } = await import('~/queries/available-years')

// Verfügbare Jahre abrufen
const { data: availableYears } = useQuery(availableYearsQuery)

// Jahr-Dropdown-Items
const yearDropdownItems = computed(() => {
  if (!availableYears.value?.years) return []

  return availableYears.value.years.map(yearValue => ({
    label: yearValue.toString(),
    value: yearValue,
    trailingIcon: yearValue === year ? 'i-lucide-check' : undefined,
    active: yearValue === year,
    onSelect() {
      if (yearValue !== year) {
        navigateTo(`/admin/years/${yearValue}`)
      }
    }
  }))
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- Jahr-Auswahl-Karte -->
    <UCard>
      <template #header>
        <h2>
          Verwaltung von {{ year }}
        </h2>
        <UDropdownMenu
          :items="yearDropdownItems"
        >
          <UButton
            :label="`${year}`"
            color="primary"
            variant="outline"
            trailing-icon="i-lucide-chevron-down"
            description="Jahr auswählen"
            aria-label="Jahr auswählen"
          />
        </UDropdownMenu>
      </template>
    </UCard>

    <AdminPralineManagement :year="year" />

    <AdminPersonManagement :year="year" />
  </div>
</template>
