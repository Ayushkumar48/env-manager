import * as p from '@clack/prompts';
import chalk from 'chalk';
import { EnvironmentType } from '@vaultsy/shared';
import type { Environment } from '@vaultsy/shared';
import { listProjects, pushSecrets, pullSecrets, ApiError } from '../lib/api.js';
import { findProjectConfig } from '../lib/env.js';

type SecretRow = { key: string; value: string };

export async function setCommand(
	projectArg: string | undefined,
	envArg: string | undefined
): Promise<void> {
	p.intro(chalk.bold.cyan('vaultsy set'));

	// ── Resolve project ID ───────────────────────────────────────────────────
	let projectId: string;
	let projectTitle: string | undefined;

	if (projectArg) {
		projectId = projectArg;
	} else {
		const found = findProjectConfig();
		if (found) {
			projectId = found.config.project;
			p.log.info(`Using project ${chalk.cyan(projectId)} from ${chalk.dim('vaultsy.json')}`);
		} else {
			const spinner = p.spinner();
			spinner.start('Fetching projects…');

			let projects: Awaited<ReturnType<typeof listProjects>>;
			try {
				projects = await listProjects();
				spinner.stop(`Found ${projects.length} project${projects.length !== 1 ? 's' : ''}.`);
			} catch (err) {
				spinner.stop('Failed to fetch projects.');
				printApiError(err);
				process.exit(1);
			}

			if (projects.length === 0) {
				p.log.error(
					`No projects found. Run ${chalk.cyan('vaultsy create')} to create one first.`
				);
				process.exit(1);
			}

			const selected = await p.select({
				message: 'Select a project',
				options: projects.map((proj) => ({
					value: proj.id,
					label: proj.title,
					hint: proj.id
				}))
			});

			if (p.isCancel(selected)) {
				p.cancel('Set cancelled.');
				process.exit(0);
			}

			projectId = selected;
			projectTitle = projects.find((proj) => proj.id === selected)?.title;
		}
	}

	// ── Resolve environment ──────────────────────────────────────────────────
	let env: Environment;

	if (envArg) {
		if (!(EnvironmentType as readonly string[]).includes(envArg)) {
			p.log.error(
				`Invalid environment "${envArg}". Must be one of: ${EnvironmentType.join(', ')}.`
			);
			process.exit(1);
		}
		env = envArg as Environment;
	} else {
		const found = findProjectConfig();
		const defaultEnv = found?.config.defaultEnv;

		const selected = await p.select({
			message: 'Select an environment',
			options: EnvironmentType.map((e) => ({
				value: e,
				label: e,
				hint: e === defaultEnv ? 'default' : undefined
			})),
			initialValue: (defaultEnv as Environment | undefined) ?? 'development'
		});

		if (p.isCancel(selected)) {
			p.cancel('Set cancelled.');
			process.exit(0);
		}

		env = selected;
	}

	// ── Fetch existing remote secrets ────────────────────────────────────────
	const fetchSpinner = p.spinner();
	fetchSpinner.start('Fetching existing secrets…');

	let existingSecrets: SecretRow[];
	let resolvedTitle: string;

	try {
		const remote = await pullSecrets(projectId, env);
		existingSecrets = remote.secrets;
		resolvedTitle = projectTitle ?? remote.project.title;
		fetchSpinner.stop(
			`Loaded ${existingSecrets.length} existing secret${existingSecrets.length !== 1 ? 's' : ''}.`
		);
	} catch (err) {
		fetchSpinner.stop('Failed to fetch existing secrets.');
		printApiError(err);
		process.exit(1);
	}

	// ── Interactive key-value entry loop ─────────────────────────────────────
	p.log.info(
		`Adding secrets to ${chalk.bold(resolvedTitle)} / ${chalk.cyan(env)}.\n` +
			`  Existing keys will be ${chalk.yellow('overwritten')} if you re-enter them.`
	);

	const newSecrets: SecretRow[] = [];

	while (true) {
		// Key prompt
		const key = await p.text({
			message: 'Key',
			placeholder: 'DATABASE_URL',
			validate(value) {
				if (!value.trim()) return 'Key is required.';
				if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value.trim())) {
					return 'Key must start with a letter or underscore and contain only letters, numbers, or underscores.';
				}
			}
		});

		if (p.isCancel(key)) {
			p.cancel('Set cancelled.');
			process.exit(0);
		}

		const trimmedKey = key.trim();

		// Warn if key already exists remotely or was already entered this session
		const existsRemotely = existingSecrets.some((s) => s.key === trimmedKey);
		const existsInBatch = newSecrets.some((s) => s.key === trimmedKey);

		if (existsRemotely) {
			p.log.warn(
				`Key ${chalk.yellow(trimmedKey)} already exists remotely and will be ${chalk.yellow('overwritten')}.`
			);
		} else if (existsInBatch) {
			p.log.warn(
				`Key ${chalk.yellow(trimmedKey)} was already added in this session and will be ${chalk.yellow('overwritten')}.`
			);
		}

		// Value prompt
		const value = await p.password({
			message: `Value for ${chalk.cyan(trimmedKey)}`,
			validate(v) {
				if (!v.trim()) return 'Value is required.';
			}
		});

		if (p.isCancel(value)) {
			p.cancel('Set cancelled.');
			process.exit(0);
		}

		// Add or overwrite in the new batch
		const idx = newSecrets.findIndex((s) => s.key === trimmedKey);
		if (idx !== -1) {
			newSecrets[idx] = { key: trimmedKey, value: value.trim() };
		} else {
			newSecrets.push({ key: trimmedKey, value: value.trim() });
		}

		p.log.success(`  ${chalk.green('+')} ${trimmedKey}`);

		// Ask to continue
		const addMore = await p.confirm({
			message: 'Add another secret?',
			initialValue: true
		});

		if (p.isCancel(addMore) || !addMore) {
			break;
		}
	}

	if (newSecrets.length === 0) {
		p.outro(chalk.dim('No secrets entered. Nothing pushed.'));
		return;
	}

	// ── Merge new secrets with existing ones ─────────────────────────────────
	// New entries overwrite existing keys; untouched keys are preserved.
	const mergedMap = new Map<string, string>(existingSecrets.map((s) => [s.key, s.value]));
	for (const s of newSecrets) {
		mergedMap.set(s.key, s.value);
	}
	const mergedSecrets: SecretRow[] = Array.from(mergedMap.entries()).map(([key, value]) => ({
		key,
		value
	}));

	// ── Summary ──────────────────────────────────────────────────────────────
	const added = newSecrets.filter((s) => !existingSecrets.some((e) => e.key === s.key));
	const modified = newSecrets.filter((s) => existingSecrets.some((e) => e.key === s.key));

	const summaryLines = [
		...added.map((s) => `  ${chalk.green('+')} ${chalk.green(s.key)}`),
		...modified.map((s) => `  ${chalk.yellow('~')} ${chalk.yellow(s.key)}`)
	];
	p.log.message(summaryLines.join('\n'));
	p.log.info(
		[
			added.length > 0 ? chalk.green(`+${added.length} to add`) : null,
			modified.length > 0 ? chalk.yellow(`~${modified.length} to modify`) : null
		]
			.filter(Boolean)
			.join(chalk.dim(', '))
	);

	// ── Confirm before pushing ───────────────────────────────────────────────
	const confirmed = await p.confirm({
		message: `Push ${newSecrets.length} secret${newSecrets.length !== 1 ? 's' : ''} to ${chalk.bold(resolvedTitle)} / ${chalk.cyan(env)}?`,
		initialValue: true
	});

	if (p.isCancel(confirmed) || !confirmed) {
		p.cancel('Set cancelled. Nothing pushed.');
		process.exit(0);
	}

	// ── Push merged secrets ──────────────────────────────────────────────────
	const pushSpinner = p.spinner();
	pushSpinner.start(`Pushing to ${chalk.cyan(env)}…`);

	try {
		const result = await pushSecrets(projectId, env, mergedSecrets);
		const { added: a, modified: m, removed: r, unchanged: u } = result.changes;

		pushSpinner.stop(
			`Done. ${chalk.green(`+${a}`)} added, ` +
				`${chalk.yellow(`~${m}`)} modified, ` +
				`${chalk.red(`-${r}`)} removed, ` +
				`${chalk.dim(`${u} unchanged`)}.`
		);
	} catch (err) {
		pushSpinner.stop('Push failed.');
		printApiError(err);
		process.exit(1);
	}

	p.outro(
		`${chalk.green('✓')} ${chalk.bold(resolvedTitle)} / ${chalk.cyan(env)} updated successfully.`
	);
}

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------

function printApiError(err: unknown): void {
	if (err instanceof ApiError) {
		if (err.status === 401) {
			p.log.error('Unauthorized. Run `vaultsy login` to re-authenticate.');
		} else if (err.status === 404) {
			p.log.error('Project or environment not found. Check the project ID and environment name.');
		} else {
			p.log.error(`API error ${err.status}: ${err.message}`);
		}
	} else if (err instanceof Error) {
		p.log.error(err.message);
	} else {
		p.log.error('An unexpected error occurred.');
	}
}
