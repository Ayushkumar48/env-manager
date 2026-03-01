<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import ForwardIcon from '@lucide/svelte/icons/forward';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { getProjectNames } from '../../routes/(main)/dashboard/data.remote';
	import { resolve } from '$app/paths';
	import { Spinner } from './ui/spinner';
	import { goto } from '$app/navigation';
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel class="group-data-[collapsible=icon]:hidden">Projects</Sidebar.GroupLabel>
	<Sidebar.Menu>
		<Sidebar.MenuItem>
			<Sidebar.MenuButton
				tooltipContent="Create Project"
				onclick={() => goto(resolve('/dashboard/projects/new'))}
			>
				<PlusIcon />
				<span class="group-data-[collapsible=icon]:hidden">Create Project</span>
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
		{#await getProjectNames()}
			<Sidebar.MenuItem class="flex items-center gap-4 px-4 py-2 text-sm text-muted-foreground">
				<Spinner />
				Loading...
			</Sidebar.MenuItem>
		{:then projects}
			{#each projects as item (item.title)}
				<Collapsible.Root class="group/collapsible">
					{#snippet child({ props })}
						<Sidebar.MenuItem {...props}>
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<Sidebar.MenuButton {...props} tooltipContent={item.title}>
										<span>{item.title}</span>
										<ChevronRightIcon
											class="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
										/>
									</Sidebar.MenuButton>
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									<Sidebar.MenuSubItem>
										<Sidebar.MenuSubButton>
											{#snippet child({ props })}
												<a href={resolve(`/dashboard/projects/${item.id}`)} {...props}>
													<FolderIcon class="text-muted-foreground" />
													<span>View Project</span>
												</a>
											{/snippet}
										</Sidebar.MenuSubButton>
									</Sidebar.MenuSubItem>
									<Sidebar.MenuSubItem>
										<Sidebar.MenuSubButton>
											{#snippet child({ props })}
												<a href={resolve(`/dashboard/projects/${item.id}`)} {...props}>
													<ForwardIcon class="text-muted-foreground" />
													<span>Share Project</span>
												</a>
											{/snippet}
										</Sidebar.MenuSubButton>
									</Sidebar.MenuSubItem>
									<Sidebar.MenuSubItem>
										<Sidebar.MenuSubButton>
											{#snippet child({ props })}
												<a href={resolve(`/dashboard/projects/${item.id}`)} {...props}>
													<Trash2Icon class="text-muted-foreground" />
													<span>Delete Project</span>
												</a>
											{/snippet}
										</Sidebar.MenuSubButton>
									</Sidebar.MenuSubItem>
								</Sidebar.MenuSub>
							</Collapsible.Content>
						</Sidebar.MenuItem>
					{/snippet}
				</Collapsible.Root>
			{:else}
				<Sidebar.MenuItem>
					<p class="text-sm px-4 py-2 text-muted-foreground group-data-[collapsible=icon]:hidden">
						No Projects yet.
					</p>
				</Sidebar.MenuItem>
			{/each}
		{:catch}
			<div class="px-4 py-2 text-sm text-red-500 group-data-[collapsible=icon]:hidden">
				An error occurred while fetching projects.
			</div>
		{/await}
	</Sidebar.Menu>
</Sidebar.Group>
