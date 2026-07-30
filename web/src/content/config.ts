import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    pubDate:     z.date(),
    updatedDate: z.date().optional(),
    image:       z.string().optional(),
    tags:        z.array(z.string()).optional(),
    author:      z.string().default('Time UmbraHub'),
    readTime:    z.string().optional(),
    draft:       z.boolean().default(false),
    featured:    z.boolean().default(false),
    canonical:   z.string().url().optional(),
  }),
});

export const collections = { blog };
