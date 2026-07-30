import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sorted = posts.sort(
    (a, b) => new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
  );

  return rss({
    title: 'Blog UmbraHub',
    description: 'Guias, tutoriais e estratégias para criar e monetizar canais faceless no YouTube com inteligência artificial.',
    site: context.site!,
    items: sorted.map(post => ({
      title:       post.data.title,
      description: post.data.description,
      pubDate:     post.data.pubDate,
      link:        `/blog/${post.slug}/`,
    })),
    customData: '<language>pt-BR</language>',
  });
}
