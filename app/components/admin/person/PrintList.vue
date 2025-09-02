<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ year: number }>()

// Queries importieren
const { enrichedPersonsQuery } = await import('~/queries/enriched-persons')

// Daten abrufen
const { data: enrichedPersons, isLoading } = useQuery(() => enrichedPersonsQuery(props.year))

// Aktive Personen filtern (nur die, die teilnehmen und eine Signatur haben)
const activePersons = computed(() => {
  if (!enrichedPersons.value) return []

  return enrichedPersons.value
    .filter(person => person.hasPersonYear && person.personYear?.isParticipating && person.personYear?.signature)
    .sort((a, b) => {
      // Nach Nachname, dann Vorname sortieren
      const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '')
      if (lastNameCompare !== 0) return lastNameCompare
      return (a.firstName || '').localeCompare(b.firstName || '')
    })
})

// Bewertungsseiten-URL generieren
const getRatingUrl = (signature: string) => {
  return `${window.location.origin}/rate/${signature}`
}

// Drucken der Liste
const printList = () => {
  window.print()
}
</script>

<template>
  <div class="print-list">
    <!-- Header mit Druck-Button (nur im Screen-Modus sichtbar) -->
    <div class="print:hidden mb-6">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">
              Druckliste für {{ year }}
            </h2>
            <UButton
              icon="i-lucide-printer"
              label="Drucken"
              color="primary"
              @click="printList"
            />
          </div>
        </template>
        <p>
          Diese Liste enthält alle aktiven Teilnehmer des Jahres {{ year }} mit Links zu ihren Bewertungsseiten.
        </p>
      </UCard>
    </div>

    <!-- Druckbereich -->
    <div class="print-content">
      <!-- Titel für den Druck -->
      <div class="print:block hidden text-center mb-8">
        <h1 class="text-2xl font-bold mb-2">
          Teilnehmerliste {{ year }}
        </h1>
        <p>
          Generiert am {{ new Date().toLocaleDateString('de-DE') }}
        </p>
      </div>

      <!-- Personenliste -->
      <div
        v-if="isLoading"
        class="text-center py-8"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="animate-spin size-8 mx-auto mb-4"
        />
        <p>Lade Teilnehmer...</p>
      </div>

      <div
        v-else-if="activePersons.length === 0"
        class="text-center py-8"
      >
        <p>
          Keine aktiven Teilnehmer für {{ year }} gefunden.
        </p>
      </div>

      <div
        v-else
        class="space-y-6"
      >
        <div
          v-for="person in activePersons"
          :key="person.id"
          class="person-entry print:break-inside-avoid"
        >
          <!-- Name -->
          <div class="name-section mb-2">
            <h3 class="text-lg font-semibold">
              {{ person.firstName }} {{ person.lastName }}
            </h3>
          </div>

          <!-- Signatur und Link -->
          <div class="link-section">
            <div class="flex items-center gap-3">
              <span class="text-sm">
                Signatur:
              </span>
              <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                {{ person.personYear?.signature }}
              </code>
            </div>

            <div class="mt-2">
              <span class="text-sm">
                Bewertungsseite:
              </span>
              <div class="mt-1">
                <a
                  :href="getRatingUrl(person.personYear?.signature || '')"
                  target="_blank"
                  class="text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {{ getRatingUrl(person.personYear?.signature || '') }}
                </a>
              </div>
            </div>
          </div>

          <!-- Trennlinie (nur im Druck sichtbar) -->
          <div class="print:block hidden border-t border-gray-200 mt-4 pt-4" />
        </div>
      </div>

      <!-- Zusammenfassung -->
      <div class="print:block hidden mt-8 pt-6 border-t border-gray-200">
        <p class="text-sm">
          Insgesamt {{ activePersons.length }} aktive Teilnehmer im Jahr {{ year }}.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Print-spezifische Styles */
@media print {
  .print-content {
    font-size: 12pt;
    line-height: 1.4;
  }

  .person-entry {
    page-break-inside: avoid;
    margin-bottom: 1.5em;
  }

  .name-section h3 {
    font-size: 14pt;
    font-weight: bold;
    margin-bottom: 0.5em;
  }

  .link-section {
    font-size: 11pt;
  }

  .link-section code {
    background-color: #f3f4f6;
    padding: 0.25em 0.5em;
    border-radius: 0.25em;
    font-family: monospace;
  }

  .link-section a {
    color: #2563eb;
    text-decoration: underline;
    word-break: break-all;
  }
}
</style>
