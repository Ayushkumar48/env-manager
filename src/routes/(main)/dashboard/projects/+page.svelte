<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	interface Project {
		id: string;
		title: string;
		createdAt: Date;
		updatedAt: Date;
		_count?: {
			environments: number;
		};
	}

	let projects: Project[] = $state([]);
	let searchQuery = $state('');
	let isLoading = $state(true);

	let filteredProjects = $derived(
		projects.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	function navigateToProject(id: string) {
		goto(resolve(`/dashboard/projects/${id}`));
	}

	function navigateToNewProject() {
		goto(resolve('/dashboard/projects/new'));
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Projects</h1>
			<p class="text-muted-foreground">Manage your environment variables across projects</p>
		</div>
		<Button onclick={navigateToNewProject}>New Project</Button>
	</div>

	<div class="flex items-center gap-2">
		<Input placeholder="Search projects..." bind:value={searchQuery} class="max-w-sm" />
	</div>

	{#if isLoading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(3) as _, index (index)}
				<Card.Root>
					<Card.Header>
						<Card.Title>
							<div class="h-6 w-32 animate-pulse rounded bg-muted"></div>
						</Card.Title>
						<Card.Description>
							<div class="h-4 w-24 animate-pulse rounded bg-muted"></div>
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="h-4 w-20 animate-pulse rounded bg-muted"></div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{:else if filteredProjects.length === 0}
		<div class="flex flex-col items-center justify-center py-12 text-center">
			<div class="mb-4 rounded-full bg-muted p-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-8 w-8 text-muted-foreground"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
					/>
				</svg>
			</div>
			<h3 class="mb-1 text-lg font-semibold">No projects found</h3>
			<p class="mb-4 text-sm text-muted-foreground">
				{searchQuery ? 'Try a different search term' : 'Get started by creating a new project'}
			</p>
			{#if !searchQuery}
				<Button onclick={navigateToNewProject}>Create Project</Button>
			{/if}
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredProjects as project (project.id)}
				<Card.Root
					class="cursor-pointer transition-all hover:shadow-md"
					onclick={() => navigateToProject(project.id)}
				>
					<Card.Header class="flex flex-row items-center justify-between pb-2">
						<Card.Title class="text-lg">{project.title}</Card.Title>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger onclick={(e) => e.stopPropagation()}>
								<Button variant="ghost" size="icon" class="h-8 w-8">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
										/>
									</svg>
								</Button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end">
								<DropdownMenu.Item
									onclick={(e) => {
										e.stopPropagation();
										navigateToProject(project.id);
									}}
								>
									View Details
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={(e) => e.stopPropagation()}>Rename</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item onclick={(e) => e.stopPropagation()} class="text-red-600">
									Delete
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</Card.Header>
					<Card.Content>
						<p class="text-sm text-muted-foreground">
							{project._count?.environments ?? 0} environment{project._count?.environments !== 1
								? 's'
								: ''}
						</p>
						<p class="mt-2 text-xs text-muted-foreground">
							Updated {new Date(project.updatedAt).toLocaleDateString()}
						</p>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
