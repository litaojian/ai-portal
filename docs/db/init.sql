-- 初始化数据库 - 创建 User 表
-- 该脚本根据 'prisma/schema.prisma' 文件中的 User 模型生成。
-- 您可以在您的 MySQL 客户端（如 MySQL Workbench, DBeaver, or command line）中执行此脚本来创建表结构。

-- 创建 User 表
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
