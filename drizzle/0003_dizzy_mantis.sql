CREATE TABLE "environment_version_secrets" (
	"id" text PRIMARY KEY NOT NULL,
	"environment_version_id" text NOT NULL,
	"key" text NOT NULL,
	"encrypted_value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "environment_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"environment_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "environment_version_secrets" ADD CONSTRAINT "environment_version_secrets_environment_version_id_environment_versions_id_fk" FOREIGN KEY ("environment_version_id") REFERENCES "public"."environment_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environment_versions" ADD CONSTRAINT "environment_versions_environment_id_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."environments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environment_versions" ADD CONSTRAINT "environment_versions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "env_version_secrets_version_idx" ON "environment_version_secrets" USING btree ("environment_version_id");--> statement-breakpoint
CREATE INDEX "env_version_secrets_key_idx" ON "environment_version_secrets" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_env_version" ON "environment_versions" USING btree ("environment_id","version_number");--> statement-breakpoint
CREATE INDEX "env_versions_env_idx" ON "environment_versions" USING btree ("environment_id");--> statement-breakpoint
CREATE INDEX "env_versions_created_by_idx" ON "environment_versions" USING btree ("created_by");