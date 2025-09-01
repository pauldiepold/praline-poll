CREATE TABLE `person_years` (
	`id` integer PRIMARY KEY NOT NULL,
	`person_id` integer NOT NULL,
	`year` integer NOT NULL,
	`signature` text NOT NULL,
	`is_participating` integer DEFAULT false NOT NULL,
	`favorite_chocolate_id` integer,
	`general_feedback` text,
	`allergies` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`favorite_chocolate_id`) REFERENCES `pralines`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `person_year_unique` ON `person_years` (`person_id`,`year`);--> statement-breakpoint
CREATE UNIQUE INDEX `signature_year_unique` ON `person_years` (`signature`,`year`);--> statement-breakpoint
CREATE TABLE `persons` (
	`id` integer PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pralines` (
	`id` integer PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_vegan` integer DEFAULT false NOT NULL,
	`image_path` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` integer PRIMARY KEY NOT NULL,
	`person_year_id` integer NOT NULL,
	`praline_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`person_year_id`) REFERENCES `person_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`praline_id`) REFERENCES `pralines`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `person_year_praline_unique` ON `ratings` (`person_year_id`,`praline_id`);