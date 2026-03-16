import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.md',
  }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.string(),
    heroImage: z.string(),
    pinTitle: z.string().optional(),
    pinDescription: z.string().optional(),
  }),
});

export const collections = { blog };