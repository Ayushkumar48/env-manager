import type { RequestHandler } from '@sveltejs/kit';

const SITE_URL = 'https://vaultsy.dev';

export const GET: RequestHandler = async () => {
	const pages = [
		{
			loc: `${SITE_URL}/`,
			lastmod: new Date().toISOString().split('T')[0],
			changefreq: 'weekly',
			priority: '1.0'
		}
	];

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
	xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
	xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${pages
	.map(
		(page) => `	<url>
		<loc>${page.loc}</loc>
		<lastmod>${page.lastmod}</lastmod>
		<changefreq>${page.changefreq}</changefreq>
		<priority>${page.priority}</priority>
	</url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(sitemap.trim(), {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
