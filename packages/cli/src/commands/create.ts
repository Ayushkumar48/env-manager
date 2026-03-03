import * as p from '@clack/prompts';
import chalk from 'chalk';
import { createProject, ApiError } from '../lib/api.js';
import { writeProjectConfig } from '../lib/env.js';

export async function createCommand(opts: { title?: string }): Promise<void> {
	p.intro(chalk.bold.cyan('vaultsy create'));

	// ── Resolve project title ────────────────────────────────────────────────
	let title: string;

	if (opts.title) {
		title = opts.title;
	} else {
		const input = await p.text({
			message: 'Project title',
			placeholder: 'My Secret Project',
			validate(value) {
				if (!value.trim()) return 'Title is required.';
				if (value.trim().length > 100) return 'Title must be less than 100 characters.';
			}
		});

		if (p.isCancel(input)) {
			p.cancel('Project creation cancelled.');
			process.exit(0);
		}

		title = input.trim();
	}

	// ── Create project ───────────────────────────────────────────────────────
	const spinner = p.spinner();
	spinner.start('Creating project…');

	let projectId: string;
	let projectTitle: string;

	try {
		const result = await createProject(title);
		projectId = result.project.id;
		projectTitle = result.project.title;
		spinner.stop('Project created.');
	} catch (err) {
		spinner.stop('Project creation failed.');

		if (err instanceof ApiError) {
			if (err.status === 401) {
				p.log.error('Unauthorized. Run `vaultsy login` to authenticate first.');
			} else if (err.status === 400) {
				p.log.error(`Invalid input: ${err.message}`);
			} else {
				p.log.error(`Server responded with ${err.status}: ${err.message}`);
			}
		} else if (err instanceof Error) {
			p.log.error(err.message);
		} else {
			p.log.error('An unexpected error occurred.');
		}

		process.exit(1);
	}

	// ── Offer to save config ─────────────────────────────────────────────────
	const saveConfig = await p.confirm({
		message: `Save project config to ${chalk.dim('vaultsy.json')} in the current directory?`,
		initialValue: true
	});

	if (!p.isCancel(saveConfig) && saveConfig) {
		writeProjectConfig({ project: projectId, defaultEnv: 'development' });
		p.outro(
			`${chalk.green('✓')} Project ${chalk.bold(projectTitle)} created!\n` +
				`  Project ID: ${chalk.cyan(projectId)}\n` +
				`  Config saved to ${chalk.dim('vaultsy.json')}`
		);
	} else {
		p.outro(
			`${chalk.green('✓')} Project ${chalk.bold(projectTitle)} created!\n` +
				`  Project ID: ${chalk.cyan(projectId)}\n` +
				`  Run ${chalk.cyan('vaultsy init')} to create a config file.`
		);
	}
}
