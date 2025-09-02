<script setup lang="ts">
import { h, resolveComponent, ref, computed, reactive } from 'vue'
import type { Ref } from 'vue'
import type { TableColumn, FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

const UButton = resolveComponent('UButton')

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
  title: `Jahr ${year} - Admin`
})

// Queries und Mutations
const { enrichedPersonsQuery } = await import('~/queries/enriched-persons')

// Typen importieren
type EnrichedPerson = {
  id: number
  firstName: string
  lastName: string
  createdAt: Date
  updatedAt: Date
  personYear: {
    id: number
    signature: string
    isParticipating: boolean
    favoriteChocolateId: number | null
    generalFeedback: string | null
    allergies: string | null
    createdAt: Date
    updatedAt: Date
  } | null
  hasPersonYear: boolean
}

const { data: enrichedPersons, isLoading: isLoadingPersons } = useQuery(enrichedPersonsQuery(year))

const toast = useToast()
const queryCache = useQueryCache()

// Edit modal state
const isEditModalOpen = ref(false)
const personToEdit = ref<EnrichedPerson | null>(null)

// Add modal state
const isAddModalOpen = ref(false)

// Zod schema for form validation
const personSchema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich').max(100, 'Vorname kann maximal 100 Zeichen haben'),
  lastName: z.string().min(1, 'Nachname ist erforderlich').max(100, 'Nachname kann maximal 100 Zeichen haben')
})

type PersonSchema = z.output<typeof personSchema>

// Form state
const editForm = reactive<Partial<PersonSchema>>({
  firstName: '',
  lastName: ''
})

// Add form state
const addForm = reactive<Partial<PersonSchema>>({
  firstName: '',
  lastName: ''
})

// Filter und Sortierung
const globalFilter = ref('')
const sortColumn: Ref<'firstName' | 'lastName' | 'signature' | 'isParticipating'> = ref('lastName')
const sortDirection: Ref<'asc' | 'desc'> = ref('asc')

const sortOptions = [
  { value: 'firstName', label: 'Vorname' },
  { value: 'lastName', label: 'Nachname' },
  { value: 'signature', label: 'Signatur' },
  { value: 'isParticipating', label: 'Teilnahme' }
]

const sortDropdownItems = computed(() => [
  ...sortOptions.map(option => ({
    label: option.label,
    value: option.value,
    slot: `sort-${option.value}`,
    onSelect() { sortColumn.value = option.value as typeof sortColumn.value }
  })),
  { type: 'separator' as const },
  {
    label: sortDirection.value === 'asc' ? 'Aufsteigend' : 'Absteigend',
    icon: sortDirection.value === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down',
    active: true,
    onSelect() { sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc' }
  }
])

// Berechnete Eigenschaften
const activePersonYears = computed(() => {
  return enrichedPersons.value?.filter(p => p.hasPersonYear && p.personYear?.isParticipating) || []
})

const allPersons = computed(() => {
  return enrichedPersons.value || []
})

const tableData = computed(() => {
  let data = allPersons.value

  if (globalFilter.value) {
    const searchTerm = globalFilter.value.toLowerCase()
    data = data.filter(person =>
      person.firstName.toLowerCase().includes(searchTerm)
      || person.lastName.toLowerCase().includes(searchTerm)
      || (person.personYear?.signature || '').toLowerCase().includes(searchTerm)
    )
  }

  // Sortierung anwenden
  const col = sortColumn.value
  const dir = sortDirection.value
  data = [...data].sort((a, b) => {
    let aVal: string | boolean = ''
    let bVal: string | boolean = ''

    if (col === 'firstName' || col === 'lastName') {
      aVal = a[col] || ''
      bVal = b[col] || ''
    }
    else if (col === 'signature') {
      // Für Sortierung: aktive Teilnehmer mit Signatur kommen zuerst, dann inaktive
      const aActive = a.personYear?.isParticipating && a.personYear?.signature
      const bActive = b.personYear?.isParticipating && b.personYear?.signature
      aVal = aActive ? (a.personYear?.signature || '') : ''
      bVal = bActive ? (b.personYear?.signature || '') : ''
    }
    else if (col === 'isParticipating') {
      aVal = a.personYear?.isParticipating || false
      bVal = b.personYear?.isParticipating || false
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (aVal === bVal) return 0
    if (dir === 'asc') return aVal > bVal ? 1 : -1
    return aVal < bVal ? 1 : -1
  })

  return data
})

// Mutations
const togglingId = ref<number | null>(null)

const { mutate: toggleParticipation, isLoading: isTogglingParticipation } = useMutation({
  mutation: ({ year, personId, isParticipating }: { year: number, personId: number, isParticipating: boolean }) => {
    togglingId.value = personId
    return $fetch(`/api/years/${year}/persons/${personId}/participation`, {
      method: 'PATCH',
      body: { isParticipating }
    })
  },
  async onSuccess() {
    await queryCache.invalidateQueries(enrichedPersonsQuery(year))
    toast.add({
      title: 'Teilnahme erfolgreich aktualisiert',
      color: 'success'
    })
  },
  onError(err) {
    console.error(err)
    toast.add({
      title: 'Fehler beim Aktualisieren der Teilnahme',
      color: 'error'
    })
  },
  onSettled() {
    togglingId.value = null
  }
})

const { mutate: updatePerson, isLoading: isUpdating } = useMutation({
  mutation: ({ id, data }: { id: number, data: PersonSchema }) => {
    return $fetch(`/api/persons/${id}`, {
      method: 'PATCH',
      body: data
    })
  },
  async onSuccess() {
    await queryCache.invalidateQueries(enrichedPersonsQuery(year))
    toast.add({
      title: 'Person erfolgreich bearbeitet',
      color: 'success'
    })
    handleEditCancel()
  },
  onError(err) {
    console.error(err)
    toast.add({
      title: 'Fehler beim Bearbeiten der Person',
      color: 'error'
    })
  }
})

const { mutate: addPerson, isLoading: isAdding } = useMutation({
  mutation: ({ data }: { data: PersonSchema }) => {
    return $fetch(`/api/years/${year}/persons`, {
      method: 'POST',
      body: data
    })
  },
  async onSuccess() {
    await queryCache.invalidateQueries(enrichedPersonsQuery(year))
    toast.add({
      title: 'Person erfolgreich hinzugefügt',
      color: 'success'
    })
    handleAddCancel()
  },
  onError(err) {
    console.error(err)
    toast.add({
      title: 'Fehler beim Hinzufügen der Person',
      color: 'error'
    })
  }
})

const columns: TableColumn<EnrichedPerson>[] = [
  {
    accessorKey: 'firstName',
    header: 'Vorname',
    enableHiding: true,
    enableSorting: true
  },
  {
    accessorKey: 'lastName',
    header: 'Nachname',
    enableHiding: true,
    enableSorting: true
  },
  {
    accessorKey: 'signature',
    header: 'Signatur',
    enableHiding: true,
    enableSorting: true,
    cell: ({ row }) => {
      const person = row.original
      const signature = person.personYear?.signature
      const isParticipating = person.personYear?.isParticipating || false

      // Signatur nur für aktive Teilnehmer anzeigen
      if (!isParticipating || !signature) {
        return h('span', { class: 'text-gray-400 italic' }, 'Nicht verfügbar')
      }
      return h('code', { class: 'bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono' }, signature)
    }
  },
  {
    accessorKey: 'isParticipating',
    header: 'Teilnahme',
    enableHiding: true,
    enableSorting: true,
    cell: ({ row }) => {
      const person = row.original
      const isParticipating = person.personYear?.isParticipating || false
      const hasPersonYear = person.hasPersonYear

      return h('div', { class: 'flex items-center gap-3' }, [
        h(resolveComponent('USwitch'), {
          'modelValue': isParticipating,
          'disabled': isTogglingParticipation && togglingId.value === person.id,
          'loading': isTogglingParticipation && togglingId.value === person.id,
          'uncheckedIcon': 'i-lucide-x',
          'checkedIcon': 'i-lucide-check',
          'size': 'sm',
          'color': isParticipating ? 'primary' : 'neutral',
          'onUpdate:modelValue': (value: boolean) => {
            toggleParticipation({
              year,
              personId: person.id,
              isParticipating: value
            })
          }
        }),
        h('span', {
          class: hasPersonYear
            ? (isParticipating ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')
            : 'text-gray-500'
        },
        hasPersonYear
          ? (isParticipating ? 'Aktiv' : 'Entfernt')
          : 'Nicht hinzugefügt'
        )
      ])
    }
  },
  {
    id: 'actions',
    header: 'Aktionen',
    enableHiding: false,
    cell: ({ row }) => {
      const person = row.original

      return h('div', { class: 'flex items-center gap-2' }, [
        h(UButton, {
          'icon': 'i-lucide-edit',
          'color': 'primary',
          'variant': 'ghost',
          'size': 'sm',
          'aria-label': 'Person bearbeiten',
          onClick() {
            personToEdit.value = person
            Object.assign(editForm, {
              firstName: person.firstName,
              lastName: person.lastName
            })
            isEditModalOpen.value = true
          }
        })
      ])
    }
  }
]

const table = useTemplateRef('table')

// Deutsche Labels für die Spalten
const getColumnLabel = (columnId: string): string => {
  const labels: Record<string, string> = {
    firstName: 'Vorname',
    lastName: 'Nachname',
    signature: 'Signatur',
    isParticipating: 'Teilnahme'
  }
  return labels[columnId] || columnId
}

// Standard-Sichtbarkeit der Spalten konfigurieren
const defaultColumnVisibility = {
  firstName: true,
  lastName: true,
  signature: false,
  isParticipating: true
}

// Form handlers
const handleEditSubmit = async (event: FormSubmitEvent<PersonSchema>) => {
  if (!personToEdit.value) return
  updatePerson({ id: personToEdit.value.id, data: event.data })
}

const handleEditCancel = () => {
  isEditModalOpen.value = false
  personToEdit.value = null
  Object.assign(editForm, { firstName: '', lastName: '' })
}

const handleAddSubmit = async (event: FormSubmitEvent<PersonSchema>) => {
  addPerson({ data: event.data })
}

const handleAddCancel = () => {
  isAddModalOpen.value = false
  Object.assign(addForm, { firstName: '', lastName: '' })
}
</script>

<template>
  <div>
    <UCard>
      <template #header>
        <div>
          <h2>
            Verwaltung der Personen für {{ year }}
          </h2>
        </div>
        <UButton
          icon="i-lucide-plus"
          label="Neue Person hinzufügen"
          color="primary"
          @click="isAddModalOpen = true"
        />
      </template>

      <div class="flex flex-col gap-8">
        <!-- Statistiken -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <UCard>
            <div class="text-center">
              <div class="text-2xl font-bold text-primary">
                {{ activePersonYears.length }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Aktive Teilnehmer
              </div>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-600">
                {{ allPersons.length }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Gesamt Personen
              </div>
            </div>
          </UCard>
        </div>

        <div>
          <!-- Filter und Sortierung -->
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:gap-4 md:justify-between pb-4">
            <UInput
              v-model="globalFilter"
              class="grow max-w-sm md:max-w-sm"
              placeholder="Personen durchsuchen..."
            />

            <div class="flex gap-2 w-full md:w-auto md:ml-auto">
              <UDropdownMenu
                :items="table?.tableApi?.getAllColumns().filter(column => column.getCanHide()).map(column => ({
                  label: getColumnLabel(column.id),
                  type: 'checkbox' as const,
                  checked: column.getIsVisible(),
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  }
                }))"
                :content="{ align: 'end' }"
                :ui="{ content: 'min-w-[12rem]' }"
              >
                <UButton
                  label="Spalten"
                  color="neutral"
                  variant="outline"
                  trailing-icon="i-lucide-chevron-down"
                  class="w-full md:w-auto"
                  aria-label="Spalten-Auswahl Dropdown"
                />
              </UDropdownMenu>

              <UDropdownMenu
                :items="sortDropdownItems"
                :content="{ align: 'end' }"
                :ui="{ content: 'min-w-[12rem]' }"
              >
                <UButton
                  label="Sortieren"
                  color="neutral"
                  variant="outline"
                  trailing-icon="i-lucide-chevron-down"
                  class="w-full md:w-auto"
                  aria-label="Sortier-Auswahl Dropdown"
                />
                <template
                  v-for="option in sortOptions"
                  #[`sort-${option.value}-trailing`]
                  :key="option.value"
                >
                  <UIcon
                    v-if="sortColumn === option.value"
                    name="i-lucide-check"
                    class="shrink-0 size-5 text-primary"
                  />
                </template>
              </UDropdownMenu>
            </div>
          </div>

          <!-- Tabelle -->
          <UTable
            ref="table"
            :data="tableData"
            :columns="columns"
            :loading="isLoadingPersons || isTogglingParticipation || isUpdating"
            :column-visibility="defaultColumnVisibility"
            sticky
            class="flex-1"
          >
            <template #empty-state>
              <div class="text-center py-8">
                <p class="text-gray-500">
                  Keine Personen gefunden
                </p>
              </div>
            </template>
          </UTable>

          <div class="px-4 py-3.5 text-sm text-muted">
            {{ tableData.length }} Person{{ tableData.length !== 1 ? 'en' : '' }} gefunden.
          </div>
        </div>
      </div>
    </UCard>

    <!-- Edit Modal -->
    <UModal
      v-model:open="isEditModalOpen"
      title="Person bearbeiten"
      description="Bearbeite die Informationen der ausgewählten Person."
      :close="false"
    >
      <template #body>
        <UForm
          :schema="personSchema"
          :state="editForm"
          class="space-y-6"
          @submit="handleEditSubmit"
        >
          <UFormField
            label="Vorname"
            name="firstName"
          >
            <UInput
              v-model="editForm.firstName"
              placeholder="z.B. Max"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Nachname"
            name="lastName"
          >
            <UInput
              v-model="editForm.lastName"
              placeholder="z.B. Mustermann"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-3 pt-4">
            <UButton
              color="neutral"
              variant="soft"
              @click="handleEditCancel"
            >
              Abbrechen
            </UButton>
            <UButton
              color="primary"
              type="submit"
              :loading="isUpdating"
              :disabled="isUpdating"
            >
              Speichern
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Add Modal -->
    <UModal
      v-model:open="isAddModalOpen"
      title="Neue Person hinzufügen"
      :description="`Füge eine neue Person zum Jahr ${year} hinzu. Die Person wird automatisch als aktiver Teilnehmer hinzugefügt.`"
      :close="false"
    >
      <template #body>
        <UForm
          :schema="personSchema"
          :state="addForm"
          class="space-y-6"
          @submit="handleAddSubmit"
        >
          <UFormField
            label="Vorname"
            name="firstName"
          >
            <UInput
              v-model="addForm.firstName"
              placeholder="z.B. Max"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Nachname"
            name="lastName"
          >
            <UInput
              v-model="addForm.lastName"
              placeholder="z.B. Mustermann"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-3 pt-4">
            <UButton
              color="neutral"
              variant="soft"
              @click="handleAddCancel"
            >
              Abbrechen
            </UButton>
            <UButton
              color="primary"
              type="submit"
              :loading="isAdding"
              :disabled="isAdding"
            >
              Hinzufügen
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
