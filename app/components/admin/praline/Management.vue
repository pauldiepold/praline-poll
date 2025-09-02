<script setup lang="ts">
import { resolveComponent, ref, reactive } from 'vue'
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

const props = defineProps<{ year: number }>()

const UButton = resolveComponent('UButton')

// Queries und Mutations
const { pralinesQuery } = await import('~/queries/pralines')

// Typen importieren
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

const { data: pralines, isLoading: isLoadingPralines } = useQuery(pralinesQuery(props.year))

const toast = useToast()
const queryCache = useQueryCache()

// Edit modal state
const isEditModalOpen = ref(false)
const pralineToEdit = ref<Praline | null>(null)

// Add modal state
const isAddModalOpen = ref(false)

// Zod schema for form validation
const pralineSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name kann maximal 100 Zeichen haben'),
  description: z.string().max(500, 'Beschreibung kann maximal 500 Zeichen haben').optional(),
  isVegan: z.boolean()
})

type PralineSchema = z.output<typeof pralineSchema>

// Form state
const editForm = reactive<Partial<PralineSchema>>({
  name: '',
  description: '',
  isVegan: false
})

// Add form state
const addForm = reactive<Partial<PralineSchema>>({
  name: '',
  description: '',
  isVegan: false
})

// Mutations
const { mutate: updatePraline, isLoading: isUpdating } = useMutation({
  mutation: ({ id, data }: { id: number, data: PralineSchema }) => {
    return $fetch(`/api/pralines/${id}`, {
      method: 'PATCH',
      body: data
    })
  },
  async onSuccess() {
    await queryCache.invalidateQueries({ key: ['pralines', props.year] })
    toast.add({
      title: 'Praline erfolgreich bearbeitet',
      color: 'success'
    })
    handleEditCancel()
  },
  onError(err) {
    console.error(err)
    toast.add({
      title: 'Fehler beim Bearbeiten der Praline',
      color: 'error'
    })
  }
})

const { mutate: addPraline, isLoading: isAdding } = useMutation({
  mutation: ({ data }: { data: PralineSchema }) => {
    return $fetch(`/api/years/${props.year}/pralines`, {
      method: 'POST',
      body: data
    })
  },
  async onSuccess() {
    await queryCache.invalidateQueries({ key: ['pralines', props.year] })
    toast.add({
      title: 'Praline erfolgreich hinzugefügt',
      color: 'success'
    })
    handleAddCancel()
  },
  onError(err) {
    console.error(err)
    toast.add({
      title: 'Fehler beim Hinzufügen der Praline',
      color: 'error'
    })
  }
})

// Form handlers
const handleEditSubmit = async (event: FormSubmitEvent<PralineSchema>) => {
  if (!pralineToEdit.value) return
  updatePraline({ id: pralineToEdit.value.id, data: event.data })
}

const handleEditCancel = () => {
  isEditModalOpen.value = false
  pralineToEdit.value = null
  Object.assign(editForm, { name: '', description: '', isVegan: false })
}

const handleAddSubmit = async (event: FormSubmitEvent<PralineSchema>) => {
  addPraline({ data: event.data })
}

const handleAddCancel = () => {
  isAddModalOpen.value = false
  Object.assign(addForm, { name: '', description: '', isVegan: false })
}

const handleEdit = (praline: Praline) => {
  pralineToEdit.value = praline
  Object.assign(editForm, {
    name: praline.name,
    description: praline.description || '',
    isVegan: praline.isVegan
  })
  isEditModalOpen.value = true
}
</script>

<template>
  <div>
    <UCard>
      <template #header>
        <div>
          <h2>
            Pralinen
          </h2>
        </div>
        <UButton
          icon="i-lucide-plus"
          label="Neue Praline hinzufügen"
          color="primary"
          @click="isAddModalOpen = true"
        />
      </template>

      <div class="flex flex-col gap-4">
        <!-- Statistiken -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <UCard>
            <div class="text-center">
              <div class="text-2xl font-bold text-primary">
                {{ pralines?.length || 0 }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Pralinen insgesamt
              </div>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">
                {{ pralines?.filter(p => p.isVegan).length || 0 }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Vegane Pralinen
              </div>
            </div>
          </UCard>
        </div>

        <!-- Pralinen-Liste -->
        <div
          v-if="isLoadingPralines"
          class="flex justify-center py-8"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="animate-spin size-8 text-primary"
          />
        </div>

        <div
          v-else-if="!pralines || pralines.length === 0"
          class="text-center py-8 text-gray-500"
        >
          <UIcon
            name="i-lucide-candy"
            class="size-12 mx-auto mb-4 text-gray-300"
          />
          <p class="text-lg font-medium">
            Keine Pralinen vorhanden
          </p>
          <p class="text-sm">
            Füge die erste Praline für dieses Jahr hinzu.
          </p>
        </div>

        <div
          v-else
          class="space-y-4"
        >
          <div
            v-for="praline in pralines"
            :key="praline.id"
            class="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <!-- Bild-Platzhalter -->
            <div class="flex-shrink-0 w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <UIcon
                name="i-lucide-image"
                class="size-8 text-gray-400"
              />
            </div>

            <!-- Pralinen-Informationen -->
            <div class="flex-grow min-w-0">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {{ praline.name }}
                </h3>
                <UBadge
                  v-if="praline.isVegan"
                  color="success"
                  variant="soft"
                  size="sm"
                >
                  Vegan
                </UBadge>
              </div>

              <p
                v-if="praline.description"
                class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2"
              >
                {{ praline.description }}
              </p>
              <p
                v-else
                class="text-gray-400 dark:text-gray-500 text-sm italic"
              >
                Keine Beschreibung vorhanden
              </p>
            </div>

            <!-- Edit-Button -->
            <div class="flex-shrink-0">
              <UButton
                icon="i-lucide-edit"
                color="primary"
                variant="ghost"
                size="sm"
                aria-label="Praline bearbeiten"
                @click="handleEdit(praline)"
              />
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Edit Modal -->
    <UModal
      v-model:open="isEditModalOpen"
      title="Praline bearbeiten"
      description="Bearbeite die Informationen der ausgewählten Praline."
      :close="false"
    >
      <template #body>
        <UForm
          :schema="pralineSchema"
          :state="editForm"
          class="space-y-6"
          @submit="handleEditSubmit"
        >
          <UFormField
            label="Name"
            name="name"
          >
            <UInput
              v-model="editForm.name"
              placeholder="z.B. Schokoladen-Trüffel"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Beschreibung"
            name="description"
          >
            <UTextarea
              v-model="editForm.description"
              placeholder="Beschreibung der Praline (optional)"
              size="lg"
              class="w-full"
              :rows="3"
            />
          </UFormField>

          <UFormField
            label="Vegan"
            name="isVegan"
          >
            <UCheckbox
              v-model="editForm.isVegan"
              label="Diese Praline ist vegan"
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
      title="Neue Praline hinzufügen"
      :description="`Füge eine neue Praline zum Jahr ${props.year} hinzu.`"
      :close="false"
    >
      <template #body>
        <UForm
          :schema="pralineSchema"
          :state="addForm"
          class="space-y-6"
          @submit="handleAddSubmit"
        >
          <UFormField
            label="Name"
            name="name"
          >
            <UInput
              v-model="addForm.name"
              placeholder="z.B. Schokoladen-Trüffel"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Beschreibung"
            name="description"
          >
            <UTextarea
              v-model="addForm.description"
              placeholder="Beschreibung der Praline (optional)"
              size="lg"
              class="w-full"
              :rows="3"
            />
          </UFormField>

          <UFormField
            label="Vegan"
            name="isVegan"
          >
            <UCheckbox
              v-model="addForm.isVegan"
              label="Diese Praline ist vegan"
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
