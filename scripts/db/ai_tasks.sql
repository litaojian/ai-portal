CREATE TABLE `ai_tasks` (
  `id` varchar(255) NOT NULL,
  `task_id` varchar(255) DEFAULT NULL COMMENT '第三方服务的任务流水号',
  `userId` varchar(255) NOT NULL COMMENT '提交该任务的用户ID',
  `model` varchar(255) NOT NULL COMMENT '使用的模型标识',
  `prompt` text NOT NULL COMMENT '用户的完整提示词',
  `size` varchar(50) DEFAULT NULL COMMENT '分辨率设定 (例如16:9)',
  `duration` int DEFAULT NULL COMMENT '设定生成的时长',
  `status` varchar(50) NOT NULL DEFAULT 'queued' COMMENT '当前任务进度状态',
  `progress` int DEFAULT '0' COMMENT '实时百分比进度',
  `result_url` varchar(500) DEFAULT NULL COMMENT '最终能够获取到的资源或文件URL',
  `fail_reason` text COMMENT '失败的报错内容',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ai_task_user_idx` (`userId`),
  KEY `ai_task_status_idx` (`status`),
  CONSTRAINT `ai_task_user_fk` FOREIGN KEY (`userId`) REFERENCES `uc_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
