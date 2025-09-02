<script setup lang="ts">
const colorMode = useColorMode()

const { loggedIn } = useUserSession()
const isDarkMode = computed({
  get: () => colorMode.preference === 'dark',
  set: () =>
    (colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark')
})
</script>

<template>
  <div>
    <div class="hidden print:block text-black bg-white">
      <slot name="header" />
    </div>
    <div class="hidden print:visible">
      Hallo Welt
    </div>
    <UContainer class="min-h-screen flex flex-col my-4 print:hidden">
      <div class="mb-2 text-right">
        <UButton
          square
          variant="ghost"
          color="neutral"
          :icon="
            $colorMode.preference === 'dark' || $colorMode.preference === 'system'
              ? 'i-lucide-moon'
              : 'i-lucide-sun'
          "
          @click="isDarkMode = !isDarkMode"
        />
      </div>

      <UCard variant="subtle">
        <template #header>
          <h3 class="text-lg font-semibold leading-6">
            <NuxtLink to="/">
              Pralinen
            </NuxtLink>
          </h3>
        </template>
        <slot />
      </UCard>

      <footer class="flex flex-col gap-4 items-center mt-10">
        <UButton
          href="https://github.com/pauldiepold/praline-poll"
          target="_blank"
          icon="i-lucide-github"
          variant="ghost"
          class="hover:text-primary transition-colors"
        >
          zum GitHub-Repo
        </UButton>
        <UButton
          v-if="!loggedIn"
          to="/api/auth/github"
          label="Admin Login"
          color="neutral"
          variant="outline"
          external
        />
        <UButton
          v-else
          to="/admin"
          icon="i-lucide-settings"
          color="neutral"
          variant="outline"
        >
          Administration
        </UButton>
      </footer>
    </UContainer>
  </div>
</template>
