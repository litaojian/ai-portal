"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Upload,
  X,
  File,
  FileText,
  Image as ImageIcon,
  FileVideo,
  FileAudio,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export interface FileUploadProps {
  maxSize?: number; // 单位：MB
  maxFiles?: number;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  onUpload?: (file: File) => Promise<void>;
  className?: string;
  showPreview?: boolean;
}

export function FileUpload({
  maxSize = 10,
  maxFiles = 5,
  accept,
  multiple = true,
  disabled = false,
  value = [],
  onChange,
  onUpload,
  className,
  showPreview = true,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(value);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 更新文件列表
  const updateFiles = useCallback(
    (newFiles: UploadedFile[]) => {
      setFiles(newFiles);
      onChange?.(newFiles);
    },
    [onChange]
  );

  // 生成唯一ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // 获取文件图标
  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/")) return ImageIcon;
    if (type.startsWith("video/")) return FileVideo;
    if (type.startsWith("audio/")) return FileAudio;
    if (type.includes("pdf") || type.includes("document")) return FileText;
    return File;
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // 验证文件
  const validateFile = (file: File): string | null => {
    // 验证文件大小
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `文件大小不能超过 ${maxSize}MB`;
    }

    // 验证文件类型
    if (accept) {
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      const isAccepted = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return fileExtension === type;
        }
        return file.type.match(type.replace("*", ".*"));
      });

      if (!isAccepted) {
        return `不支持的文件类型`;
      }
    }

    return null;
  };

  // 处理文件选择
  const handleFiles = useCallback(
    async (selectedFiles: FileList | null) => {
      if (!selectedFiles || disabled) return;

      const fileArray = Array.from(selectedFiles);

      // 检查文件数量限制
      if (files.length + fileArray.length > maxFiles) {
        alert(`最多只能上传 ${maxFiles} 个文件`);
        return;
      }

      // 创建新的上传文件对象
      const newFiles: UploadedFile[] = fileArray.map((file) => {
        const error = validateFile(file);
        const preview =
          file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;

        return {
          id: generateId(),
          file,
          preview,
          progress: 0,
          status: error ? "error" : "pending",
          error: error || undefined,
        } as UploadedFile;
      });

      const updatedFiles = [...files, ...newFiles];
      updateFiles(updatedFiles);

      // 开始上传（如果提供了上传函数）
      if (onUpload) {
        newFiles.forEach((uploadFile) => {
          if (uploadFile.status !== "error") {
            handleUpload(uploadFile);
          }
        });
      }
    },
    [files, disabled, maxFiles, onUpload]
  );

  // 模拟上传进度
  const simulateUpload = (uploadFile: UploadedFile) => {
    const interval = setInterval(() => {
      setFiles((prevFiles) =>
        prevFiles.map((f) => {
          if (f.id === uploadFile.id) {
            const newProgress = Math.min(f.progress + 10, 100);
            return {
              ...f,
              progress: newProgress,
              status: newProgress === 100 ? "success" : "uploading",
            };
          }
          return f;
        })
      );
    }, 200);

    // 2秒后完成
    setTimeout(() => {
      clearInterval(interval);
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === uploadFile.id
            ? { ...f, progress: 100, status: "success" }
            : f
        )
      );
    }, 2000);
  };

  // 处理上传
  const handleUpload = async (uploadFile: UploadedFile) => {
    try {
      // 更新状态为上传中
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "uploading", progress: 0 } : f
        )
      );

      if (onUpload) {
        // 调用实际上传函数
        await onUpload(uploadFile.file);

        // 上传成功
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "success", progress: 100 }
              : f
          )
        );
      } else {
        // 如果没有提供上传函数，模拟上传
        simulateUpload(uploadFile);
      }
    } catch (error) {
      // 上传失败
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "上传失败",
              }
            : f
        )
      );
    }
  };

  // 删除文件
  const removeFile = (id: string) => {
    const updatedFiles = files.filter((f) => {
      if (f.id === id && f.preview) {
        URL.revokeObjectURL(f.preview);
      }
      return f.id !== id;
    });
    updateFiles(updatedFiles);
  };

  // 重新上传
  const retryUpload = (uploadFile: UploadedFile) => {
    handleUpload(uploadFile);
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // 点击上传
  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* 上传区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer",
          "hover:border-primary hover:bg-primary/5",
          isDragging && "border-primary bg-primary/10 scale-[1.02]",
          disabled && "opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>

          <div>
            <p className="text-sm font-medium">
              拖拽文件到此处，或{" "}
              <span className="text-primary">点击选择文件</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {accept && `支持格式：${accept}`}
              {maxSize && ` · 最大 ${maxSize}MB`}
              {maxFiles && ` · 最多 ${maxFiles} 个文件`}
            </p>
          </div>
        </div>
      </div>

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadFile) => {
            const Icon = getFileIcon(uploadFile.file);
            const isImage = uploadFile.file.type.startsWith("image/");

            return (
              <div
                key={uploadFile.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* 文件图标/预览 */}
                {showPreview && isImage && uploadFile.preview ? (
                  <img
                    src={uploadFile.preview}
                    alt={uploadFile.file.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}

                {/* 文件信息 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadFile.file.size)}
                  </p>

                  {/* 上传进度 */}
                  {uploadFile.status === "uploading" && (
                    <div className="h-1 mt-2 w-full overflow-hidden rounded-full bg-primary/20">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadFile.progress}%` }}
                      />
                    </div>
                  )}

                  {/* 错误提示 */}
                  {uploadFile.status === "error" && uploadFile.error && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {uploadFile.error}
                    </p>
                  )}
                </div>

                {/* 状态图标 */}
                <div className="flex items-center gap-2">
                  {uploadFile.status === "success" && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}

                  {uploadFile.status === "uploading" && (
                    <span className="text-xs text-muted-foreground">
                      {uploadFile.progress}%
                    </span>
                  )}

                  {uploadFile.status === "error" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        retryUpload(uploadFile);
                      }}
                      className="h-8 text-xs"
                    >
                      重试
                    </Button>
                  )}

                  {/* 删除按钮 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(uploadFile.id);
                    }}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
