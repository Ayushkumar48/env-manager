<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.ico';
	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';
	import { Provider } from '$lib/components/ui/tooltip';
	import { page } from '$app/state';

	let { children } = $props();

	const siteName = 'Vaultsy';
	const siteDescription =
		'A modern environment & secret manager built for developers. Organize, version, and deploy your config securely across all environments.';
	const siteUrl = 'https://vaultsy.dev';

	const canonicalUrl = $derived(`${siteUrl}${page.url.pathname}`);
</script>

<svelte:head>
	<!-- Favicon -->
	<link rel="icon" href={favicon} />

	<!-- Default title & description (pages can override) -->
	<title>{siteName} — Secure Secret & Env Manager</title>
	<meta name="description" content={siteDescription} />

	<!-- Canonical URL -->
	<link rel="canonical" href={canonicalUrl} />

	<!-- Search engine directives -->
	<meta name="robots" content="index, follow" />

	<!-- Open Graph defaults -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:title" content="{siteName} — Secure Secret & Env Manager" />
	<meta property="og:description" content={siteDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content="{siteUrl}/logo.webp" />
	<meta property="og:image:alt" content="Vaultsy — Secure Secret & Env Manager" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<!-- Twitter / X Card defaults -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{siteName} — Secure Secret & Env Manager" />
	<meta name="twitter:description" content={siteDescription} />
	<meta name="twitter:image" content="{siteUrl}/logo.webp" />
	<meta name="twitter:image:alt" content="Vaultsy — Secure Secret & Env Manager" />
</svelte:head>

<Toaster richColors />
<ModeWatcher />
<Provider>
	{@render children()}
</Provider>
