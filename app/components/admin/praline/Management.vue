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

// Delete modal state
const isDeleteModalOpen = ref(false)
const pralineToDelete = ref<Praline | null>(null)

// Zod schema for form validation
const pralineSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name kann maximal 100 Zeichen haben'),
  description: z.string().max(500, 'Beschreibung kann maximal 500 Zeichen haben').optional(),
  isVegan: z.boolean(),
  imagePath: z.string().optional()
})

type PralineSchema = z.output<typeof pralineSchema>

// Form state
const editForm = reactive<Partial<PralineSchema>>({
  name: '',
  description: '',
  isVegan: false,
  imagePath: ''
})

// Add form state
const addForm = reactive<Partial<PralineSchema>>({
  name: '',
  description: '',
  isVegan: false,
  imagePath: ''
})

// Mutations
const { mutate: updatePraline, isLoading: isUpdating } = useMutation({
  mutation: ({ id, data }: { id: number, data: PralineSchema }) => {
    return $fetch(`/api/admin/pralines/${id}`, {
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
    return $fetch(`/api/admin/years/${props.year}/pralines`, {
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

// Delete mutation
const { mutate: deletePraline, isLoading: isDeleting } = useMutation({
  mutation: ({ id }: { id: number }) => {
    return $fetch(`/api/admin/pralines/${id}`, {
      method: 'DELETE'
    })
  },
  async onSuccess() {
    await queryCache.invalidateQueries({ key: ['pralines', props.year] })
    toast.add({
      title: 'Praline erfolgreich gelöscht',
      color: 'success'
    })
    handleDeleteCancel()
  },
  onError(err: unknown) {
    console.error(err)
    let errorMessage = 'Fehler beim Löschen der Praline'

    if (err && typeof err === 'object' && 'data' in err) {
      const errorData = (err as { data?: { statusMessage?: string } }).data
      if (errorData?.statusMessage) {
        errorMessage = errorData.statusMessage
      }
    }

    toast.add({
      title: 'Fehler beim Löschen der Praline',
      description: errorMessage,
      color: 'error'
    })
  }
})

// Form handlers
const handleEditSubmit = async (event: FormSubmitEvent<PralineSchema>) => {
  if (!pralineToEdit.value) return

  // Stelle sicher, dass imagePath mitgesendet wird
  const dataToSend = {
    ...event.data,
    imagePath: editForm.imagePath || event.data.imagePath
  }

  updatePraline({ id: pralineToEdit.value.id, data: dataToSend })
}

const handleEditCancel = () => {
  isEditModalOpen.value = false
  pralineToEdit.value = null
  Object.assign(editForm, { name: '', description: '', isVegan: false, imagePath: '' })
}

const handleAddSubmit = async (event: FormSubmitEvent<PralineSchema>) => {
  addPraline({ data: event.data })
}

const handleAddCancel = () => {
  isAddModalOpen.value = false
  Object.assign(addForm, { name: '', description: '', isVegan: false, imagePath: '' })
}

const handleEdit = (praline: Praline) => {
  pralineToEdit.value = praline
  Object.assign(editForm, {
    name: praline.name,
    description: praline.description || '',
    isVegan: praline.isVegan,
    imagePath: praline.imagePath || ''
  })
  isEditModalOpen.value = true
}

// Delete handlers
const handleDelete = (praline: Praline) => {
  pralineToDelete.value = praline
  isDeleteModalOpen.value = true
}

const handleDeleteCancel = () => {
  isDeleteModalOpen.value = false
  pralineToDelete.value = null
}

const handleDeleteConfirm = () => {
  if (!pralineToDelete.value) return
  deletePraline({ id: pralineToDelete.value.id })
}

// Upload functionality

const _handleImageUpload = async (event: Event, form: 'edit' | 'add') => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Dateivalidierung
  const maxSize = 8 * 1024 * 1024 // 8MB
  if (file.size > maxSize) {
    toast.add({
      title: 'Datei zu groß',
      description: 'Das Bild darf maximal 8MB groß sein',
      color: 'error'
    })
    return
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({
      title: 'Ungültiger Dateityp',
      description: 'Nur JPG, PNG und WebP Dateien sind erlaubt',
      color: 'error'
    })
    return
  }

  try {
    // Loading-Status anzeigen
    const loadingToast = toast.add({
      title: 'Bild wird hochgeladen...',
      description: 'Bitte warten',
      color: 'primary'
    })

    const formData = new FormData()
    formData.append('image', file)

    const result = await $fetch('/api/admin/pralines/upload', {
      method: 'POST',
      body: formData
    })

    // Loading-Toast entfernen
    toast.remove(loadingToast.id)

    if (result && Array.isArray(result) && result[0] && result[0].pathname) {
      const imagePath = result[0].pathname

      if (form === 'edit') {
        editForm.imagePath = imagePath
      }
      else {
        addForm.imagePath = imagePath
      }

      toast.add({
        title: 'Bild erfolgreich hochgeladen',
        color: 'success'
      })
    }
    else {
      toast.add({
        title: 'Upload fehlgeschlagen',
        description: 'Unerwartetes Ergebnis vom Server',
        color: 'error'
      })
    }
  }
  catch (error) {
    console.error('Upload error:', error)

    let errorMessage = 'Bitte versuche es erneut'
    if (error && typeof error === 'object' && 'data' in error) {
      const errorData = (error as { data?: { statusMessage?: string } }).data
      if (errorData?.statusMessage) {
        errorMessage = errorData.statusMessage
      }
    }

    toast.add({
      title: 'Fehler beim Hochladen des Bildes',
      description: errorMessage,
      color: 'error'
    })
  }

  // Input zurücksetzen
  target.value = ''
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = '/api/admin/images/placeholder.jpg' // Fallback to a placeholder image
  target.alt = 'Fehler beim Laden des Bildes'
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
            class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <div class="flex flex-col md:flex-row md:items-start gap-4">
              <div class="flex items-center gap-3 md:flex-col md:items-start">
                <div class="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    v-if="praline.imagePath && praline.imagePath.trim() !== ''"
                    :src="`/api/admin/images/${praline.imagePath}`"
                    :alt="`Bild der Praline ${praline.name}`"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    @error="handleImageError"
                  >
                  <div
                    v-else
                    class="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
                  >
                    <UIcon
                      name="i-lucide-image"
                      class="size-6 md:size-8 text-gray-400"
                    />
                  </div>
                </div>

                <div class="md:hidden flex-grow min-w-0">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate mb-1">
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
              </div>

              <div class="flex-grow min-w-0">
                <div class="hidden md:flex items-center gap-3 mb-2">
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
                  class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed md:line-clamp-2"
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

              <div class="flex gap-2 pt-2 md:pt-0 md:flex-shrink-0">
                <UButton
                  icon="i-lucide-edit"
                  color="primary"
                  variant="subtle"
                  size="sm"
                  class="flex-1 md:flex-none"
                  aria-label="Praline bearbeiten"
                  @click="handleEdit(praline)"
                >
                  Bearbeiten
                </UButton>
                <UButton
                  icon="i-lucide-trash-2"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  class="flex-1 md:flex-none"
                  aria-label="Praline löschen"
                  @click="handleDelete(praline)"
                >
                  Löschen
                </UButton>
              </div>
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

          <UFormField
            label="Bild"
            name="imagePath"
          >
            <div class="space-y-4">
              <!-- Aktuelles Bild anzeigen -->
              <div
                v-if="editForm.imagePath"
                class="flex items-center gap-3"
              >
                <img
                  v-if="editForm.imagePath && editForm.imagePath.trim() !== ''"
                  :src="`/api/admin/images/${editForm.imagePath}`"
                  :alt="`Bild der Praline ${editForm.name || 'Praline'}`"
                  width="80"
                  height="80"
                  class="rounded-lg object-cover"
                  loading="lazy"
                  @error="handleImageError"
                >
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="sm"
                  @click="editForm.imagePath = ''"
                >
                  Bild entfernen
                </UButton>
              </div>

              <!-- Datei-Upload -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Neues Bild hochladen
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80"
                  @change="(event: Event) => _handleImageUpload(event, 'edit')"
                >
                <p class="text-xs text-gray-500">
                  JPG, PNG oder WebP (max. 8MB)
                </p>
              </div>
            </div>
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

          <UFormField
            label="Bild"
            name="imagePath"
          >
            <div class="space-y-4">
              <!-- Aktuelles Bild anzeigen -->
              <div
                v-if="addForm.imagePath"
                class="flex items-center gap-3"
              >
                <img
                  v-if="addForm.imagePath && addForm.imagePath.trim() !== ''"
                  :src="`/api/admin/images/${addForm.imagePath}`"
                  :alt="`Bild der Praline ${addForm.name || 'Praline'}`"
                  width="80"
                  height="80"
                  class="rounded-lg object-cover"
                  loading="lazy"
                  @error="handleImageError"
                >
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="sm"
                  @click="addForm.imagePath = ''"
                >
                  Bild entfernen
                </UButton>
              </div>

              <!-- Datei-Upload -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bild hochladen
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80"
                  @change="(event: Event) => _handleImageUpload(event, 'add')"
                >
                <p class="text-xs text-gray-500">
                  JPG, PNG oder WebP (max. 8MB)
                </p>
              </div>
            </div>
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

    <!-- Delete Modal -->
    <UModal
      v-model:open="isDeleteModalOpen"
      title="Praline löschen"
      description="Bist du sicher, dass du diese Praline löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden."
      :close="false"
    >
      <template #body>
        <div class="space-y-4">
          <div class="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <!-- Bild -->
            <div class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
              <img
                v-if="pralineToDelete?.imagePath && pralineToDelete.imagePath.trim() !== ''"
                :src="`/api/admin/images/${pralineToDelete.imagePath}`"
                :alt="`Bild der Praline ${pralineToDelete?.name}`"
                width="64"
                height="64"
                class="w-full h-full object-cover"
                loading="lazy"
                @error="handleImageError"
              >
              <div
                v-else
                class="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
              >
                <UIcon
                  name="i-lucide-image"
                  class="size-6 text-gray-400"
                />
              </div>
            </div>

            <!-- Pralinen-Informationen -->
            <div class="flex-grow">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ pralineToDelete?.name }}
              </h3>
              <p
                v-if="pralineToDelete?.description"
                class="text-gray-600 dark:text-gray-400 text-sm"
              >
                {{ pralineToDelete.description }}
              </p>
              <div class="flex items-center gap-2 mt-2">
                <UBadge
                  v-if="pralineToDelete?.isVegan"
                  color="success"
                  variant="soft"
                  size="sm"
                >
                  Vegan
                </UBadge>
                <span class="text-sm text-gray-500">
                  Jahr {{ pralineToDelete?.year }}
                </span>
              </div>
            </div>
          </div>

          <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-alert-triangle"
                class="size-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
              />
              <div class="text-sm text-amber-800 dark:text-amber-200">
                <p class="font-medium mb-1">
                  Wichtiger Hinweis:
                </p>
                <p>Pralinen können nur gelöscht werden, wenn noch keine Bewertungen abgegeben wurden. Sobald Teilnehmer eine Praline bewertet haben, ist das Löschen nicht mehr möglich.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <UButton
            color="neutral"
            variant="soft"
            @click="handleDeleteCancel"
          >
            Abbrechen
          </UButton>
          <UButton
            color="red"
            type="button"
            :loading="isDeleting"
            :disabled="isDeleting"
            @click="handleDeleteConfirm"
          >
            Praline löschen
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
