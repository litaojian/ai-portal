# OpenClaw 安装手册

## 目录

- [环境要求](#环境要求)
- [Windows 安装指南](#windows-安装指南)
- [macOS 安装指南](#macos-安装指南)
- [Linux 安装指南](#linux-安装指南)
- [快速开始](#快速开始)
- [常见问题解决](#常见问题解决)
- [进阶使用](#进阶使用)
- [故障排除](#故障排除)

---

## 环境要求

### 系统要求
- **Node.js** ≥ 22.0.0
- **npm** ≥ 9.0.0 或 **pnpm** ≥ 8.0.0
- **操作系统**：
  - Windows 10/11
  - macOS 10.15+ (Catalina 或更高版本)
  - Linux (主流发行版：Ubuntu 20.04+, Debian 11+, Fedora 35+, CentOS 8+)

### 硬件要求
- **CPU**：2核心或更高
- **内存**：4GB RAM 最低，推荐 8GB
- **磁盘空间**：500MB 可用空间

---

## Windows 安装指南

### 步骤 1：安装 Node.js

1. 访问 [Node.js 官方网站](https://nodejs.org/)
2. 下载并安装 LTS 版本 (建议 v22.x 或更高)
3. 在安装过程中，确保勾选 "Automatically install the necessary tools" 选项
4. 验证安装：
   ```powershell
   node --version
   npm --version
   ```

### 步骤 2：安装包管理器（可选但推荐）

**使用 Chocolatey：**
```powershell
# 以管理员身份运行 PowerShell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装 pnpm
choco install pnpm
```

### 步骤 3：全局安装 OpenClaw

**使用 npm：**
```powershell
npm install -g openclaw@latest
```

**使用 pnpm：**
```powershell
pnpm add -g openclaw@latest
```

### 步骤 4：运行安装向导

```powershell
openclaw onboard --install-daemon
```

向导会引导您完成以下配置：
- 网关设置
- 工作区配置
- 通道设置
- 技能配置
- 系统服务安装

### 步骤 5：验证安装

```powershell
openclaw --version
```

---

## macOS 安装指南

### 步骤 1：安装 Homebrew（如果没有安装）

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 步骤 2：安装 Node.js

**使用 Homebrew：**
```bash
brew install node
```

**使用 Node Version Manager (nvm)：**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc
nvm install 22
nvm use 22
```

### 步骤 3：安装 pnpm（推荐）

```bash
npm install -g pnpm
```

### 步骤 4：全局安装 OpenClaw

**使用 npm：**
```bash
npm install -g openclaw@latest
```

**使用 pnpm：**
```bash
pnpm add -g openclaw@latest
```

### 步骤 5：运行安装向导

```bash
openclaw onboard --install-daemon
```

系统将自动配置 `launchd` 服务，使 OpenClaw 在后台运行。

### 步骤 6：验证安装

```bash
openclaw --version
```

---

## Linux 安装指南

### Ubuntu/Debian 系统

#### 步骤 1：安装 Node.js

**使用 NodeSource 仓库：**
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### 步骤 2：安装 pnpm（推荐）

```bash
sudo npm install -g pnpm
```

#### 步骤 3：全局安装 OpenClaw

**使用 npm：**
```bash
sudo npm install -g openclaw@latest
```

**使用 pnpm：**
```bash
sudo pnpm add -g openclaw@latest
```

#### 步骤 4：运行安装向导

```bash
openclaw onboard --install-daemon
```

系统将自动配置 `systemd` 用户服务。

#### 步骤 5：验证安装

```bash
openclaw --version
```

### Fedora/CentOS/RHEL 系统

#### 步骤 1：安装 Node.js

```bash
# Fedora
sudo dnf install nodejs npm

# CentOS/RHEL 8+
sudo dnf module list nodejs
sudo dnf module enable nodejs:22
sudo dnf install nodejs npm
```

#### 步骤 2：安装 pnpm

```bash
sudo npm install -g pnpm
```

#### 步骤 3：全局安装 OpenClaw

```bash
sudo npm install -g openclaw@latest
# 或
sudo pnpm add -g openclaw@latest
```

#### 步骤 4：运行安装向导

```bash
openclaw onboard --install-daemon
```

---

## 快速开始

### 1. 登录通道（例如 WhatsApp）

```bash
openclaw channels login
```

按照提示完成扫码或登录操作，凭证会保存在 `~/.openclaw/credentials`。

### 2. 启动网关

如果向导完成后网关没有自动运行，可以手动启动：

```bash
openclaw gateway --port 18789
```

### 3. 访问控制台

在浏览器中打开：
- http://127.0.0.1:18789/
- http://localhost:18789/

您可以在控制台中进行对话、查看会话和配置。

### 4. 发送测试消息（可选）

```bash
openclaw message send --target +15555550123 --message "Hello from OpenClaw"
```

将 `+15555550123` 替换为您要发送的目标号码。

---

## 常见问题解决

### 1. Node.js 版本过低

**问题：**
```
Error: OpenClaw requires Node.js version >= 22
```

**解决方案：**

**Windows：**
- 重新安装最新版本的 Node.js LTS

**macOS（使用 nvm）：**
```bash
nvm install 22
nvm use 22
```

**Linux：**
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 权限不足

**问题：**
```
Error: EACCES: permission denied
```

**解决方案：**

**Linux/macOS：**
```bash
sudo npm install -g openclaw@latest
```

或者配置 npm 全局目录：
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g openclaw@latest
```

**Windows：**
以管理员身份运行 PowerShell 或命令提示符。

### 3. 端口冲突

**问题：**
```
Error: Port 18789 is already in use
```

**解决方案：**

**Windows：**
```powershell
netstat -ano | findstr :18789
# 找到 PID 后
taskkill /PID <PID> /F
```

**macOS/Linux：**
```bash
lsof -i :18789
# 找到 PID 后
kill -9 <PID>
```

或者使用其他端口：
```bash
openclaw gateway --port 18790
```

### 4. 服务安装失败

**macOS：**
```bash
# 手动安装 launchd 服务
brew services start openclaw
```

**Linux：**
```bash
# 手动启用 systemd 服务
systemctl --user enable openclaw
systemctl --user start openclaw
```

### 5. 凭证保存问题

**问题：** 登录凭证丢失或无法读取

**解决方案：**
```bash
# 检查凭证目录
ls -la ~/.openclaw/credentials

# 如果权限问题
chmod 600 ~/.openclaw/credentials/*
```

### 6. 网络连接问题

**问题：** 无法连接到 WhatsApp 等服务

**解决方案：**
1. 检查网络连接
2. 确认防火墙设置
3. 如果使用代理，配置环境变量：
```bash
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
```

---

## 进阶使用

### 从源码运行（开发模式）

如果想要从 GitHub 克隆源码进行开发：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build  # 首次会安装 UI 依赖
pnpm build
openclaw onboard --install-daemon
```

如果未全局安装，可以使用 `pnpm openclaw ...` 从仓库运行命令。

### 自定义配置

配置文件位置：`~/.openclaw/config.json`

```json
{
  "gateway": {
    "port": 18789,
    "host": "0.0.0.0"
  },
  "workspace": {
    "name": "my-workspace"
  }
}
```

### 服务管理

**macOS (launchd)：**
```bash
launchctl list | grep openclaw
launchctl start openclaw
launchctl stop openclaw
```

**Linux (systemd)：**
```bash
systemctl --user status openclaw
systemctl --user start openclaw
systemctl --user stop openclaw
systemctl --user restart openclaw
```

**Windows：**
```powershell
# 使用任务管理器或 sc 命令
sc query openclaw
sc start openclaw
sc stop openclaw
```

---

## 故障排除

### 诊断命令

```bash
# 查看版本信息
openclaw --version

# 查看详细日志
openclaw gateway --debug --port 18789

# 检查配置
openclaw config show

# 重置配置
openclaw config reset
```

### 日志位置

- **macOS/Linux**: `~/.openclaw/logs/`
- **Windows**: `%APPDATA%\openclaw\logs\`

### 卸载

**macOS/Linux：**
```bash
# 卸载全局包
npm uninstall -g openclaw

# 删除配置文件
rm -rf ~/.openclaw

# 停止并删除服务
systemctl --user disable openclaw  # Linux
brew services uninstall openclaw   # macOS
```

**Windows：**
```powershell
# 卸载全局包
npm uninstall -g openclaw

# 删除配置文件
Remove-Item -Recurse -Force $env:APPDATA\openclaw

# 删除服务
sc delete openclaw
```

---

## 下一步

完成安装后，您可以：

- 📖 **安装向导** - 详细了解向导各步骤
- 🔗 **配对** - 学习 DM 与设备节点配对
- ⚙️ **配置** - 深入了解网关与通道配置
- 📚 **官方文档** - 查看完整英文文档

## 技术支持

如果您在安装过程中遇到问题：

1. 检查本文档的"常见问题解决"部分
2. 查看日志文件获取详细错误信息
3. 访问 [OpenClaw 官方网站](https://openclaw.cc)
4. 查看 [GitHub Issues](https://github.com/openclaw/openclaw/issues)

---

**最后更新：** 2026年3月9日
**OpenClaw 版本：** Latest
**文档版本：** 1.0
