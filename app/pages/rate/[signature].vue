<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

// Layout für öffentliche Seite
definePageMeta({
  layout: 'public'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

const signature = route.params.signature as string

// Signatur-Validierung
if (!signature || signature.length !== 6 || !/^[a-z0-9]+$/.test(signature)) {
  throw createError({
    statusCode: 400,
    statusMessage: 'Ungültige Signatur'
  })
}

// Typen
type Praline = {
  id: number
  year: number
  name: string
  description: string | null
  isVegan: boolean
  imagePath: string
  createdAt: Date
  updatedAt: Date
}

type Person = {
  id: number
  firstName: string
  lastName: string
  createdAt: Date
  updatedAt: Date
}

type PersonYear = {
  id: number
  personId: number
  year: number
  signature: string
  isParticipating: boolean
  favoriteChocolateId: number | null
  generalFeedback: string | null
  allergies: string | null
  createdAt: Date
  updatedAt: Date
}

type Rating = {
  id: number
  personYearId: number
  pralineId: number
  rating: 1 | 2 | 3 | 4 | 5
  comment: string | null
  createdAt: Date
  updatedAt: Date
}

type RatingData = {
  personYear: PersonYear
  person: Person
  pralines: Praline[]
  ratings: Record<number, Rating>
  progress: {
    total: number
    rated: number
    percentage: number
  }
}

// State
const isLoading = ref(true)
const ratingData = ref<RatingData | null>(null)
const error = ref<string | null>(null)

// Modal state
const isRatingModalOpen = ref(false)
const selectedPraline = ref<Praline | null>(null)
const currentRating = ref<1 | 2 | 3 | 4 | 5 | null>(null)
const currentComment = ref('')

// Form state für generelle Angaben
const generalForm = reactive({
  favoriteChocolateId: null as number | null,
  generalFeedback: '',
  allergies: ''
})

// Computed
const ratedPralines = computed(() => {
  if (!ratingData.value) return []
  return ratingData.value.pralines.filter(p => ratingData.value!.ratings[p.id])
})

const availableForFavorite = computed(() => {
  if (!ratingData.value) return []
  return ratedPralines.value.map(p => ({
    value: p.id,
    label: p.name
  }))
})

const unratedPralines = computed(() => {
  if (!ratingData.value) return []
  return ratingData.value.pralines.filter(p => !ratingData.value!.ratings[p.id])
})

const ratedPralinesList = computed(() => {
  if (!ratingData.value) return []
  return ratingData.value.pralines.filter(p => ratingData.value!.ratings[p.id])
})

// Daten laden
const loadRatingData = async () => {
  try {
    isLoading.value = true
    error.value = null

    const data = await $fetch<RatingData>(`/api/rate/${signature}`)
    ratingData.value = data

    // Form mit bestehenden Daten füllen
    generalForm.favoriteChocolateId = data.personYear.favoriteChocolateId
    generalForm.generalFeedback = data.personYear.generalFeedback || ''
    generalForm.allergies = data.personYear.allergies || ''
  }
  catch (err: unknown) {
    console.error('Fehler beim Laden der Daten:', err)

    if (err && typeof err === 'object' && 'statusCode' in err) {
      const errorObj = err as { statusCode: number }
      if (errorObj.statusCode === 404) {
        error.value = 'Signatur nicht gefunden'
      }
      else if (errorObj.statusCode === 400) {
        error.value = 'Ungültige Signatur'
      }
      else {
        error.value = 'Fehler beim Laden der Daten'
      }
    }
    else {
      error.value = 'Fehler beim Laden der Daten'
    }

    // Weiterleitung zur Startseite nach 3 Sekunden
    setTimeout(() => {
      router.push('/')
    }, 3000)
  }
  finally {
    isLoading.value = false
  }
}

// Bewertung öffnen
const openRatingModal = (praline: Praline) => {
  selectedPraline.value = praline

  // Bestehende Bewertung laden falls vorhanden
  const existingRating = ratingData.value?.ratings[praline.id]
  if (existingRating) {
    currentRating.value = existingRating.rating
    currentComment.value = existingRating.comment || ''
  }
  else {
    currentRating.value = null
    currentComment.value = ''
  }

  isRatingModalOpen.value = true
}

// Bewertung speichern
const saveRating = async () => {
  if (!selectedPraline.value || !currentRating.value) return

  try {
    const result = await $fetch(`/api/rate/${signature}/ratings`, {
      method: 'POST',
      body: {
        pralineId: selectedPraline.value.id,
        rating: currentRating.value,
        comment: currentComment.value || undefined
      }
    })

    // Lokale Daten aktualisieren
    if (ratingData.value) {
      // Konvertiere die API-Antwort zu unserem Rating-Typ
      const rating: Rating = {
        ...result.rating,
        createdAt: new Date(result.rating.createdAt),
        updatedAt: new Date(result.rating.updatedAt)
      }
      ratingData.value.ratings[selectedPraline.value.id] = rating
      ratingData.value.progress.rated = Object.keys(ratingData.value.ratings).length
      ratingData.value.progress.percentage = Math.round(
        (ratingData.value.progress.rated / ratingData.value.progress.total) * 100
      )
    }

    toast.add({
      title: 'Bewertung gespeichert',
      color: 'success'
    })

    isRatingModalOpen.value = false
  }
  catch (err: unknown) {
    console.error('Fehler beim Speichern der Bewertung:', err)
    const errorMessage = err && typeof err === 'object' && 'data' in err
      ? (err as { data?: { statusMessage?: string } }).data?.statusMessage || 'Bitte versuche es erneut'
      : 'Bitte versuche es erneut'

    toast.add({
      title: 'Fehler beim Speichern',
      description: errorMessage,
      color: 'error'
    })
  }
}

// Generelle Angaben speichern
const saveGeneralData = async () => {
  try {
    isSavingGeneral.value = true
    await $fetch(`/api/rate/${signature}`, {
      method: 'PATCH',
      body: {
        favoriteChocolateId: generalForm.favoriteChocolateId || undefined,
        generalFeedback: generalForm.generalFeedback || undefined,
        allergies: generalForm.allergies || undefined
      }
    })

    toast.add({
      title: 'Daten gespeichert',
      color: 'success'
    })
  }
  catch (err: unknown) {
    console.error('Fehler beim Speichern der generellen Daten:', err)
    const errorMessage = err && typeof err === 'object' && 'data' in err
      ? (err as { data?: { statusMessage?: string } }).data?.statusMessage || 'Bitte versuche es erneut'
      : 'Bitte versuche es erneut'

    toast.add({
      title: 'Fehler beim Speichern',
      description: errorMessage,
      color: 'error'
    })
  }
  finally {
    isSavingGeneral.value = false
  }
}

// Loading state für generelle Angaben
const isSavingGeneral = ref(false)

// Initial load
onMounted(() => {
  loadRatingData()
})

// Meta
useHead({
  title: computed(() => ratingData.value
    ? `Pralinen bewerten - ${ratingData.value.person.firstName} ${ratingData.value.personYear.year}`
    : 'Pralinen bewerten'
  ),
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'description', content: 'Bewerte die Pralinen aus dem aktuellen Jahr.' }
  ]
})
</script>

<template>
  <NuxtLayout name="public">
    <div>
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex justify-center items-center min-h-[400px]"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="animate-spin size-8 text-primary"
        />
      </div>

      <!-- Main Content -->
      <div
        v-else-if="ratingData"
        class="space-y-8"
      >
        <!-- Header -->

        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Hallo {{ ratingData.person.firstName }}!
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Bewerte die Pralinen aus dem Jahr {{ ratingData.personYear.year }}.
          </p>
        </div>

        <!-- Progress -->
        <UCard class="mb-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="text-2xl font-bold text-primary whitespace-nowrap">
                {{ ratingData.progress.rated }} / {{ ratingData.progress.total }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Pralinen bewertet
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  class="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                  :style="{ width: `${ratingData.progress.percentage}%` }"
                />
              </div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ ratingData.progress.percentage }}%
              </div>
            </div>
          </div>
        </UCard>

        <!-- Unbewertete Pralinen (groß) -->
        <div
          v-if="unratedPralines.length > 0"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Noch zu bewerten
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PralineCard
              v-for="praline in unratedPralines"
              :key="praline.id"
              :praline="praline"
              :is-rated="!!ratingData.ratings[praline.id]"
              :rating="ratingData.ratings[praline.id]?.rating || 0"
              size="large"
              @click="openRatingModal"
            />
          </div>
        </div>

        <!-- Bewertete Pralinen (klein) -->
        <div
          v-if="ratedPralinesList.length > 0"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bereits bewertet
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PralineCard
              v-for="praline in ratedPralinesList"
              :key="praline.id"
              :praline="praline"
              :is-rated="true"
              :rating="ratingData.ratings[praline.id]?.rating || 0"
              size="small"
              @click="openRatingModal"
            />
          </div>
        </div>

        <!-- Generelle Angaben -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">
              Weitere Angaben
            </h2>
          </template>

          <div class="space-y-6">
            <!-- Lieblingspraline -->
            <UFormField
              label="Deine Lieblingspraline"
              description="Wähle deine Lieblingspraline aus den bewerteten Pralinen"
            >
              <USelect
                v-model="generalForm.favoriteChocolateId"
                :options="availableForFavorite"
                placeholder="Bitte wählen..."
                :disabled="availableForFavorite.length === 0"
                class="w-full"
              />
              <p
                v-if="availableForFavorite.length === 0"
                class="text-sm text-gray-500 mt-1"
              >
                Bewerte zuerst mindestens eine Praline
              </p>
            </UFormField>

            <!-- Generelles Feedback -->
            <UFormField
              label="Generelles Feedback"
              description="Hast du allgemeine Anmerkungen zu den Pralinen?"
            >
              <UTextarea
                v-model="generalForm.generalFeedback"
                placeholder="z.B. Besonders lecker waren..."
                :rows="3"
                class="w-full"
              />
            </UFormField>

            <!-- Allergien -->
            <UFormField
              label="Allergien / Unverträglichkeiten"
              description="Gibt es Zutaten, die du nicht verträgst?"
            >
              <UTextarea
                v-model="generalForm.allergies"
                placeholder="z.B. Nüsse, Laktose..."
                :rows="2"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end pt-4">
            <UButton
              color="primary"
              :loading="isSavingGeneral"
              :disabled="isSavingGeneral"
              @click="saveGeneralData"
            >
              <UIcon
                name="i-lucide-save"
                class="size-4 mr-2"
              />
              Angaben speichern
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Rating Modal -->
      <UModal
        v-model:open="isRatingModalOpen"
        :title="selectedPraline?.name"
        :description="selectedPraline?.description || 'Bewerte diese Praline'"
        :close="false"
      >
        <template #body>
          <div class="space-y-6">
            <!-- Bild -->
            <div
              v-if="selectedPraline?.imagePath"
              class="flex justify-center"
            >
              <img
                :src="`/api/images/${selectedPraline.imagePath}`"
                :alt="`Bild der Praline ${selectedPraline.name}`"
                class="object-cover aspect-3/2 rounded-lg"
                @error="(event) => { (event.target as HTMLImageElement).style.display = 'none' }"
              >
            </div>

            <!-- Sterne Rating -->
            <div class="text-center">
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Wie hat dir diese Praline geschmeckt?
              </div>
              <div class="flex justify-center gap-1">
                <button
                  v-for="i in 5"
                  :key="i"
                  type="button"
                  tabindex="0"
                  class="transition-all duration-200 hover:scale-110"
                  @click="currentRating = i as 1 | 2 | 3 | 4 | 5"
                >
                  <UIcon
                    name="i-lucide-star"
                    class="size-10"
                    :class="currentRating && i <= currentRating ? 'text-primary fill-current' : 'text-gray-300 hover:text-primary'"
                  />
                </button>
              </div>
              <div
                v-if="currentRating"
                class="text-sm text-gray-600 dark:text-gray-400 mt-2"
              >
                {{ currentRating }} von 5 Sternen
              </div>
            </div>

            <!-- Kommentar -->
            <UFormField
              label="Kommentar (optional)"
              description="Hast du spezielle Anmerkungen zu dieser Praline?"
            >
              <UTextarea
                v-model="currentComment"
                placeholder="z.B. Sehr cremig, könnte süßer sein..."
                :rows="3"
                class="w-full"
              />
            </UFormField>

            <PralineVeganBadge v-if="selectedPraline?.isVegan" />

            <div class="flex justify-end gap-3 pt-6">
              <UButton
                color="neutral"
                variant="soft"
                @click="isRatingModalOpen = false"
              >
                Abbrechen
              </UButton>
              <UButton
                color="primary"
                :disabled="!currentRating"
                @click="saveRating"
              >
                Bewertung speichern
              </UButton>
            </div>
          </div>
        </template>
      </UModal>
    </div>
  </NuxtLayout>
</template>
