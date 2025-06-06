// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  devToolbar: {
      enabled: false
	},

  integrations: [svelte()]
});