<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { Separator } from '$lib/components/ui/separator';
	import { EnvironmentType } from '$lib/shared/enums';
	import {
		addSecret,
		cleanSecrets,
		createEnvironmentState,
		handleAutoRow,
		handleEnvPaste,
		isValidKey,
		removeSecret
	} from '$lib/features/env-manager';
	import { cn } from '$lib/utils';

	let title = $state('');

	let environments = $state(createEnvironmentState(EnvironmentType));

	function handlePaste(event: ClipboardEvent, env: string) {
		const updated = handleEnvPaste(event, environments[env]);
		if (updated) environments[env] = updated;
	}

	function onAdd(env: string) {
		environments[env] = addSecret(environments[env]);
	}

	function onRemove(env: string, index: number) {
		environments[env] = removeSecret(environments[env], index);
	}

	function onAutoRow(env: string) {
		environments[env] = handleAutoRow(environments[env]);
	}

	async function createProject() {
		const cleaned = Object.fromEntries(
			Object.entries(environments).map(([env, rows]) => [env, cleanSecrets(rows)])
		);

		console.log(cleaned);
	}
</script>

<div class="min-h-screen bg-muted/40 px-4 py-10">
	<div class="mx-auto max-w-4xl space-y-8">
		<div class="space-y-2">
			<h1 class="text-3xl font-bold">Create New Project</h1>
			<p class="text-muted-foreground">
				Add your environment variables before creating the project.
			</p>
		</div>

		<Card class="shadow-xl">
			<CardHeader>
				<CardTitle>Project Details</CardTitle>
			</CardHeader>

			<CardContent class="space-y-6">
				<div class="space-y-2">
					<Label>Project Name</Label>
					<Input placeholder="My Backend API" bind:value={title} />
				</div>

				<Separator />

				<Tabs value="development">
					<TabsList class="grid w-full grid-cols-4">
						{#each EnvironmentType as env (env)}
							<TabsTrigger value={env}>
								{env[0].toUpperCase() + env.slice(1)}
							</TabsTrigger>
						{/each}
					</TabsList>

					{#each EnvironmentType as env (env)}
						<TabsContent value={env}>
							<div class="mt-6 space-y-4" onpaste={(e) => handlePaste(e, env)}>
								{#each environments[env] as secret, index (index)}
									<div class="flex items-center gap-3">
										<Input
											placeholder="KEY"
											bind:value={secret.key}
											oninput={() => onAutoRow(env)}
											class={cn(secret.key && !isValidKey(secret.key) ? 'border-red-500' : '')}
										/>

										<Input
											placeholder="VALUE"
											type="password"
											bind:value={secret.value}
											oninput={() => onAutoRow(env)}
										/>

										<Button variant="destructive" size="sm" onclick={() => onRemove(env, index)}>
											X
										</Button>
									</div>
								{/each}

								<Button variant="outline" onclick={() => onAdd(env)}>+ Add Secret</Button>
							</div>
						</TabsContent>
					{/each}
				</Tabs>
			</CardContent>
		</Card>

		<div class="flex justify-end">
			<Button size="lg" onclick={createProject}>Create Project</Button>
		</div>
	</div>
</div>
