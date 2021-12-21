<script setup lang="ts">
import { computed } from "vue";
import cards from "../data/cards.json";

interface ImageUrl {
  jpg: string;
  webp: string;
}

interface Card {
  id: string;
  name: string;
  description: string;
  image: ImageUrl;
}

const props = defineProps<{ id: string; count: number }>();

const card = computed(() => (cards as Record<string, Card>)[props.id]);
const count = computed(() => Intl.NumberFormat().format(props.count));
</script>

<template>
  <div class="relative w-full min-h-80 aspect-card overflow-hidden">
    <picture>
      <source type="image/webp" :srcset="card.image.webp" />
      <source type="image/jpeg" :srcset="card.image.jpg" />
      <img
        class="w-full h-full object-center object-cover"
        :src="card.image.jpg"
        :alt="card.name"
        :title="card.name"
      />
    </picture>
    <div
      class="
        absolute
        bottom-0
        right-0
        px-2
        py-1
        mx-auto
        bg-black
        text-white
        rounded-tl-lg
        font-bold
        text-sm
      "
    >
      &times;{{ count }}
    </div>
  </div>
</template>
