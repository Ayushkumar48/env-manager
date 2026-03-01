import { z } from 'zod';

const SecretRowSchema = z.object({
	key: z.string().min(1),
	value: z.string().min(1)
});

export const CreateProjectSchema = z.object({
	title: z.string().min(1),
	development: z.array(SecretRowSchema).optional().default([]),
	staging: z.array(SecretRowSchema).optional().default([]),
	preview: z.array(SecretRowSchema).optional().default([]),
	production: z.array(SecretRowSchema).optional().default([])
});
