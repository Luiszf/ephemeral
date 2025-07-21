// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
    devToolbar: {
        enabled: false
    },
    integrations: [svelte()],
    server: { port: 1234, host: true},
    adapter: node({
        mode: 'standalone',
    })
});
