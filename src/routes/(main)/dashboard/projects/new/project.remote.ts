import { error, redirect } from '@sveltejs/kit';
import { form, getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { projects, environments, secrets, secretVersions } from '$lib/server/db/schema';
import { auth } from '$lib/server/auth';
import { CreateProjectSchema } from '$lib/shared/schema';
import { generateId } from '$lib/server/utils';
import { EnvironmentType } from '$lib/shared/enums';

export const createProject = form(CreateProjectSchema, async (data) => {
	const { title } = data;
	const event = getRequestEvent();
	if (!event) {
		error(500, 'No request event');
	}

	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session?.user) {
		error(401, 'Unauthorized');
	}

	const projectId = generateId();

	const envRecords: (typeof environments.$inferInsert)[] = [];
	const secretRecords: (typeof secrets.$inferInsert)[] = [];
	const secretVersionRecords: (typeof secretVersions.$inferInsert)[] = [];

	for (const envName of EnvironmentType) {
		const envRows = data[envName];
		const envId = generateId();

		envRecords.push({
			id: envId,
			name: envName,
			projectId
		});

		if (envRows) {
			for (const row of envRows) {
				if (row.key && row.value) {
					const secretId = generateId();

					secretRecords.push({
						id: secretId,
						key: row.key,
						environmentId: envId
					});

					secretVersionRecords.push({
						id: generateId(),
						secretId,
						encryptedValue: row.value,
						version: 1
					});
				}
			}
		}
	}

	await db.transaction(async (tx) => {
		await tx.insert(projects).values({
			id: projectId,
			title: title.trim(),
			userId: session.user.id
		});

		if (envRecords.length > 0) {
			await tx.insert(environments).values(envRecords);
		}

		if (secretRecords.length > 0) {
			await tx.insert(secrets).values(secretRecords);
		}

		if (secretVersionRecords.length > 0) {
			await tx.insert(secretVersions).values(secretVersionRecords);
		}
	});

	redirect(303, `/dashboard/projects/${projectId}`);
});

export type RemoteCreateProjectType = typeof createProject;
