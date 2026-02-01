CREATE TABLE "health_markers" (
	"id" serial PRIMARY KEY NOT NULL,
	"lab_result_id" integer,
	"name" text NOT NULL,
	"value" numeric(10, 3),
	"unit" text,
	"normal_min" numeric(10, 3),
	"normal_max" numeric(10, 3),
	"status" text NOT NULL,
	"category" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"medication_id" integer,
	"supplement_id" integer,
	"severity" text NOT NULL,
	"description" text NOT NULL,
	"recommendation" text NOT NULL,
	"separation_minutes" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"upload_date" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"raw_text" text,
	"status" text DEFAULT 'processing' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"dosage" text NOT NULL,
	"frequency" text NOT NULL,
	"time_of_day" text,
	"time_block" text DEFAULT 'morning',
	"scheduled_time" text,
	"food_rule" text DEFAULT 'either',
	"with_food" boolean DEFAULT false,
	"separation_rules" jsonb DEFAULT '[]'::jsonb,
	"allowed_together_with" jsonb DEFAULT '[]'::jsonb,
	"user_override" boolean DEFAULT false,
	"stack_id" integer,
	"notes" text,
	"why_taking" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pill_doses" (
	"id" serial PRIMARY KEY NOT NULL,
	"pill_type" text NOT NULL,
	"pill_id" integer NOT NULL,
	"scheduled_date" date NOT NULL,
	"scheduled_time_block" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"taken_at" timestamp,
	"snoozed_until" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pill_stacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"time_block" text NOT NULL,
	"scheduled_time" text,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"lab_result_id" integer,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text NOT NULL,
	"related_marker" text,
	"action_items" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"time" text NOT NULL,
	"days" jsonb DEFAULT '[]'::jsonb,
	"type" text NOT NULL,
	"related_id" integer,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplements" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"dosage" text NOT NULL,
	"frequency" text NOT NULL,
	"time_of_day" text,
	"time_block" text DEFAULT 'morning',
	"scheduled_time" text,
	"food_rule" text DEFAULT 'either',
	"with_food" boolean DEFAULT false,
	"separation_rules" jsonb DEFAULT '[]'::jsonb,
	"allowed_together_with" jsonb DEFAULT '[]'::jsonb,
	"user_override" boolean DEFAULT false,
	"stack_id" integer,
	"reason" text,
	"why_taking" text,
	"source" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"health_profile" jsonb DEFAULT '{}'::jsonb,
	"health_profile_status" jsonb DEFAULT '{"isComplete":false}'::jsonb,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "health_markers" ADD CONSTRAINT "health_markers_lab_result_id_lab_results_id_fk" FOREIGN KEY ("lab_result_id") REFERENCES "public"."lab_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_supplement_id_supplements_id_fk" FOREIGN KEY ("supplement_id") REFERENCES "public"."supplements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_lab_result_id_lab_results_id_fk" FOREIGN KEY ("lab_result_id") REFERENCES "public"."lab_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;