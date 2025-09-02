<script setup lang="ts">
import type { DropdownMenuItem } from '#ui/types'

const { loggedIn, user, clear } = useUserSession()
const colorMode = useColorMode()

const isDarkMode = computed({
  get: () => colorMode.preference === 'dark',
  set: () =>
    (colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark')
})
const items = [
  [
    {
      label: 'Logout',
      icon: 'i-lucide-log-out',
      onSelect: clear
    }
  ]
] satisfies DropdownMenuItem[][]
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
          <UButton
            v-if="!loggedIn"
            to="/api/auth/github"
            icon="i-simple-icons-github"
            label="Login with GitHub"
            color="neutral"
            size="xs"
            external
          />
          <div
            v-else
            class="flex flex-wrap -mx-2 sm:mx-0"
          >
            <UButton
              :to="`/admin/years/${new Date().getFullYear()}`"
              icon="i-lucide-settings"
              label="Administration"
              :color="$route.path.includes('/admin/years') ? 'primary' : 'neutral'"
              variant="ghost"
            />
            <UDropdownMenu
              v-if="user"
              :items="items"
            >
              <UButton
                color="neutral"
                variant="ghost"
                trailing-icon="i-lucide-chevron-down"
              >
                <UAvatar
                  :src="`https://github.com/${user.login}.png`"
                  :alt="user.login"
                  size="3xs"
                />
                {{ user.login }}
              </UButton>
            </UDropdownMenu>
          </div>
        </template>
        <slot />
      </UCard>

      <footer class="text-center mt-6 mb-4">
        <UButton
          href="https://github.com/pauldiepold/praline-poll"
          target="_blank"
          icon="i-lucide-github"
          variant="ghost"
          class="hover:text-primary transition-colors"
        >
          zum GitHub-Repo
        </UButton>
      </footer>
    </UContainer>
  </div>
</template>
