CREATE TABLE `uc_account` (
	`userId` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`providerAccountId` varchar(255) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` text,
	`session_state` varchar(255),
	CONSTRAINT `account_provider_providerAccountId_key` UNIQUE(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `uc_application` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(255),
	`url` varchar(255),
	`type` varchar(50) NOT NULL DEFAULT 'internal',
	`status` varchar(50) NOT NULL DEFAULT 'draft',
	`version` varchar(50) NOT NULL DEFAULT '1.0.0',
	`developer` varchar(255),
	`category` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uc_application_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uc_menu` (
	`id` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`url` varchar(255) DEFAULT '#',
	`icon` varchar(255),
	`group` varchar(50) DEFAULT 'main',
	`order` int DEFAULT 0,
	`parentId` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uc_menu_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `oidc_client` (
	`id` varchar(255) NOT NULL,
	`applicationId` varchar(255),
	`clientId` varchar(255) NOT NULL,
	`clientSecret` varchar(255),
	`clientName` varchar(255),
	`clientUri` varchar(255),
	`logoUri` varchar(255),
	`redirectUris` json NOT NULL,
	`grantTypes` json NOT NULL,
	`responseTypes` json NOT NULL,
	`scope` varchar(255) DEFAULT 'openid profile email',
	`tokenEndpointAuthMethod` varchar(50) DEFAULT 'client_secret_basic',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `oidc_client_id` PRIMARY KEY(`id`),
	CONSTRAINT `oidc_client_clientId_unique` UNIQUE(`clientId`),
	CONSTRAINT `oidc_client_applicationId_idx` UNIQUE(`applicationId`)
);
--> statement-breakpoint
CREATE TABLE `oidc_payload` (
	`id` varchar(255) NOT NULL,
	`type` varchar(50) NOT NULL,
	`payload` json NOT NULL,
	`grantId` varchar(255),
	`userCode` varchar(255),
	`uid` varchar(255),
	`expiresAt` timestamp,
	`consumedAt` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `oidc_payload_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`leader` varchar(255),
	`budget` real DEFAULT 0,
	`status` varchar(50) NOT NULL DEFAULT '进行中',
	`priority` varchar(50) NOT NULL DEFAULT '中',
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uc_session` (
	`sessionToken` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `uc_session_sessionToken` PRIMARY KEY(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `uc_user` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`emailVerified` timestamp,
	`image` varchar(255),
	`password` varchar(255),
	`role` varchar(50) NOT NULL DEFAULT 'USER',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uc_user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_idx` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `uc_verificationToken` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `verificationToken_identifier_token_key` UNIQUE(`identifier`,`token`)
);
--> statement-breakpoint
ALTER TABLE `uc_account` ADD CONSTRAINT `uc_account_userId_uc_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `uc_user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `oidc_client` ADD CONSTRAINT `oidc_client_applicationId_uc_application_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `uc_application`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uc_session` ADD CONSTRAINT `uc_session_userId_uc_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `uc_user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `oidc_payload_type_idx` ON `oidc_payload` (`type`);--> statement-breakpoint
CREATE INDEX `oidc_payload_grantId_idx` ON `oidc_payload` (`grantId`);--> statement-breakpoint
CREATE INDEX `oidc_payload_expiresAt_idx` ON `oidc_payload` (`expiresAt`);