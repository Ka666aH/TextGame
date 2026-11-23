<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { FLATICON_AUTHORS, GAME_ICONS_AUTHORS } from '../lib/credits'

/**
 * Авторы иконок. Отдельная страница, а не сноска на экране: обе лицензии
 * требуют, чтобы подпись была доступна, но не требуют держать её на виду
 * в каждой карточке предмета. Ссылки в подвале — достаточный уровень
 * доступности, а формулировки здесь дословные, как просят источники.
 */
</script>

<template>
  <section class="mx-auto w-full max-w-2xl space-y-6 text-sm">
    <header>
      <h1 class="text-xl font-semibold">Иконки</h1>
      <p class="mt-2 text-muted">
        Иконки предметов, комнат и врагов нарисованы не нами. Здесь авторы и лицензии — без
        сокращений, чтобы подпись оставалась корректной.
      </p>
    </header>

    <section class="space-y-2">
      <h2 class="text-base font-semibold">game-icons.net</h2>
      <p class="text-muted">
        Часть иконок взята с
        <a class="underline" href="https://game-icons.net">game-icons.net</a>
        под лицензией
        <a class="underline" href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>.
        Авторы:
      </p>

      <ul class="flex flex-wrap gap-x-4 gap-y-1 text-ink-soft">
        <li v-for="author in GAME_ICONS_AUTHORS" :key="author.name">
          <a class="underline" :href="author.url">{{ author.name }}</a>
        </li>
      </ul>

      <p class="text-muted">
        Icons made by Delapouite, Lorc and Willdabeast from
        <a class="underline" href="https://game-icons.net">game-icons.net</a>, licensed under
        <a class="underline" href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>.
      </p>

      <p class="text-muted">
        Иконки используются в двух вариантах: чёрном для светлой темы и белом для тёмной.
      </p>
    </section>

    <section class="space-y-2">
      <h2 class="text-base font-semibold">Flaticon</h2>
      <p class="text-muted">
        Остальные иконки — с
        <a class="underline" href="https://www.flaticon.com">Flaticon</a>.
      </p>

      <ul class="space-y-1 text-muted">
        <li v-for="author in FLATICON_AUTHORS" :key="author.name">
          Icons made by
          <a class="underline" :href="author.url">{{ author.name }}</a>
          from
          <a class="underline" href="https://www.flaticon.com">www.flaticon.com</a>
        </li>
      </ul>
    </section>

    <section class="space-y-2">
      <h2 class="text-base font-semibold">Если ты автор</h2>
      <p class="text-muted">
        Иконку уберём, переименуем или подпишем иначе — скажи, и поправим без споров.
      </p>
    </section>

    <RouterLink
      to="/login"
      class="inline-block rounded border border-line-strong px-4 py-2 text-ink-soft hover:border-line-hover hover:text-strong"
    >
      Вернуться
    </RouterLink>
  </section>
</template>
