
CREATE TABLE "users_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"questionnaire" jsonb DEFAULT '{}'::jsonb,
	"memory_L0" text,
    "memory_L1" text,
    "memory_L2" text,
	CONSTRAINT "users_table_email_unique" UNIQUE("email")
);

