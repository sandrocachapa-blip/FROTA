CREATE TYPE "public"."fuel_type" AS ENUM('diesel', 'gasoline', 'electric', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('scheduled', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('active', 'maintenance', 'inactive');--> statement-breakpoint
CREATE TABLE "fuel_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"date" date NOT NULL,
	"liters" numeric(10, 2) NOT NULL,
	"total_cost" numeric(14, 2) NOT NULL,
	"mileage" integer NOT NULL,
	"supplier" varchar(140),
	"invoice_number" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"date" date NOT NULL,
	"next_date" date,
	"description" varchar(240) NOT NULL,
	"supplier" varchar(140),
	"cost" numeric(14, 2) DEFAULT '0' NOT NULL,
	"mileage" integer,
	"status" "maintenance_status" DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"type" varchar(80) NOT NULL,
	"reference" varchar(120),
	"valid_until" date NOT NULL,
	"file_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration" varchar(32) NOT NULL,
	"brand" varchar(80) NOT NULL,
	"model" varchar(100) NOT NULL,
	"year" integer NOT NULL,
	"type" varchar(60) NOT NULL,
	"fuel_type" "fuel_type" DEFAULT 'diesel' NOT NULL,
	"status" "vehicle_status" DEFAULT 'active' NOT NULL,
	"driver" varchar(140),
	"cost_center" varchar(40) DEFAULT 'CC 10' NOT NULL,
	"mileage" integer DEFAULT 0 NOT NULL,
	"acquisition_date" date,
	"acquisition_value" numeric(14, 2),
	"insurance_valid_until" date,
	"inspection_valid_until" date,
	"color" varchar(40),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_registration_unique" UNIQUE("registration")
);
--> statement-breakpoint
ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_entries" ADD CONSTRAINT "maintenance_entries_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;