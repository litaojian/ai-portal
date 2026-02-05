-- Complete database initialization SQL
-- This will be executed automatically during first-time setup

-- 1. User table (NextAuth + custom fields)
CREATE TABLE IF NOT EXISTS `uc_user` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `emailVerified` datetime DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'USER',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_email_idx` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Account table (NextAuth)
CREATE TABLE IF NOT EXISTS `uc_account` (
  `userId` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `provider` varchar(255) NOT NULL,
  `providerAccountId` varchar(255) NOT NULL,
  `refresh_token` text,
  `access_token` text,
  `expires_at` int DEFAULT NULL,
  `token_type` varchar(255) DEFAULT NULL,
  `scope` varchar(255) DEFAULT NULL,
  `id_token` text,
  `session_state` varchar(255) DEFAULT NULL,
  UNIQUE KEY `account_provider_providerAccountId_key` (`provider`, `providerAccountId`),
  KEY `uc_account_userId_fk` (`userId`),
  CONSTRAINT `uc_account_userId_fk` FOREIGN KEY (`userId`) REFERENCES `uc_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Session table (NextAuth)
CREATE TABLE IF NOT EXISTS `uc_session` (
  `sessionToken` varchar(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `expires` datetime NOT NULL,
  PRIMARY KEY (`sessionToken`),
  KEY `uc_session_userId_fk` (`userId`),
  CONSTRAINT `uc_session_userId_fk` FOREIGN KEY (`userId`) REFERENCES `uc_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Verification Token table (NextAuth)
CREATE TABLE IF NOT EXISTS `uc_verificationtoken` (
  `identifier` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires` datetime NOT NULL,
  UNIQUE KEY `verificationToken_identifier_token_key` (`identifier`, `token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. Menu table
CREATE TABLE IF NOT EXISTS `uc_menu` (
  `id` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `url` varchar(255) DEFAULT '#',
  `icon` varchar(255) DEFAULT NULL,
  `group` varchar(50) DEFAULT 'main',
  `order` int DEFAULT 0,
  `parentId` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6. Application table
CREATE TABLE IF NOT EXISTS `uc_application` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `icon` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'internal',
  `status` varchar(50) NOT NULL DEFAULT 'draft',
  `version` varchar(50) NOT NULL DEFAULT '1.0.0',
  `developer` varchar(255) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7. OIDC Client table
CREATE TABLE IF NOT EXISTS `oidc_client` (
  `id` varchar(255) NOT NULL,
  `applicationId` varchar(255) DEFAULT NULL,
  `clientId` varchar(255) NOT NULL,
  `clientSecret` varchar(255) DEFAULT NULL,
  `clientName` varchar(255) DEFAULT NULL,
  `clientUri` varchar(255) DEFAULT NULL,
  `logoUri` varchar(255) DEFAULT NULL,
  `redirectUris` json NOT NULL,
  `grantTypes` json NOT NULL,
  `responseTypes` json NOT NULL,
  `scope` varchar(255) DEFAULT 'openid profile email',
  `tokenEndpointAuthMethod` varchar(50) DEFAULT 'client_secret_basic',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oidc_client_clientId_unique` (`clientId`),
  UNIQUE KEY `oidc_client_applicationId_idx` (`applicationId`),
  CONSTRAINT `oidc_client_applicationId_fk` FOREIGN KEY (`applicationId`) REFERENCES `uc_application` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8. OIDC Payload table
CREATE TABLE IF NOT EXISTS `oidc_payload` (
  `id` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `payload` json NOT NULL,
  `grantId` varchar(255) DEFAULT NULL,
  `userCode` varchar(255) DEFAULT NULL,
  `uid` varchar(255) DEFAULT NULL,
  `expiresAt` datetime DEFAULT NULL,
  `consumedAt` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `oidc_payload_type_idx` (`type`),
  KEY `oidc_payload_grantId_idx` (`grantId`),
  KEY `oidc_payload_expiresAt_idx` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 9. Role table
CREATE TABLE IF NOT EXISTS `uc_role` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text,
  `status` varchar(50) NOT NULL DEFAULT 'enabled',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_role_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
