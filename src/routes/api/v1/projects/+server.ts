import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { eq, isNull, desc, and } from 'drizzle-orm';
import { generateId } from '$lib/server/utils';

export async function GET({ locals }) {
	if (!locals.user) {
		error(401, { message: 'Unauthorized — provide a valid Bearer token.' });
	}

	const rows = await db
		.select({
			id: projects.id,
			title: projects.title,
			createdAt: projects.createdAt,
			updatedAt: projects.updatedAt
		})
		.from(projects)
		.where(and(eq(projects.userId, locals.user.id), isNull(projects.deletedAt)))
		.orderBy(desc(projects.updatedAt));

	return json({ projects: rows });
}

export async function POST({ locals, request }) {
	if (!locals.user) {
		error(401, { message: 'Unauthorized — provide a valid Bearer token.' });
	}

	const data = await request.json();
	const { title } = data;

	if (!title || typeof title !== 'string' || !title.trim()) {
		error(400, { message: 'Project title is required.' });
	}

	if (title.trim().length > 100) {
		error(400, { message: 'Title must be less than 100 characters.' });
	}

	const projectId = generateId();

	const newProject = await db
		.insert(projects)
		.values({
			id: projectId,
			title: title.trim(),
			userId: locals.user.id
		})
		.returning({
			id: projects.id,
			title: projects.title,
			createdAt: projects.createdAt,
			updatedAt: projects.updatedAt
		});

	return json(
		{
			ok: true,
			project: newProject[0]
		},
		{ status: 201 }
	);
}
