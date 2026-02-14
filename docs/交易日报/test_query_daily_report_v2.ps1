# db-api-go 日报查询测试用例
# 测试 Go 后端的日报查询 API

param(
    [string]$ApiUrl = "http://localhost:9601",
    [string]$ApiSecret = "16361a36-397e-4028-9844-325df2008779"
)

# 生成随机nonce
function Get-RandomNonce {
    $bytes = New-Object byte[] 16
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $hex = ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
    return "nonce-$hex"
}

# 生成签名: SHA256(nonce + secret + timestamp)
function Get-Signature {
    param([string]$nonce, [string]$secret, [string]$timestamp)
    $message = "${nonce}${secret}${timestamp}"
    $stream = [System.IO.MemoryStream]::new([System.Text.Encoding]::UTF8.GetBytes($message))
    $hash = Get-FileHash -InputStream $stream -Algorithm SHA256
    return $hash.Hash.ToLower()
}

# 创建认证头
function Get-AuthHeaders {
    $nonce = Get-RandomNonce
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds().ToString()
    $signature = Get-Signature -nonce $nonce -secret $ApiSecret -timestamp $timestamp

    return @{
        "X-Nonce" = $nonce
        "X-Timestamp" = $timestamp
        "X-Signature" = $signature
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "db-api-go 日报查询测试用例" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API 地址: $ApiUrl" -ForegroundColor Gray
Write-Host ""

# ========================================
# 测试用例 0: 列出所有数据源
# ========================================
Write-Host "测试用例 0: 列出所有数据源" -ForegroundColor Yellow
Write-Host "------------------------------------------" -ForegroundColor Yellow

try {
    $headers = Get-AuthHeaders
    $response = Invoke-RestMethod -Uri "$ApiUrl/api/logs/sources" -Method Get -Headers $headers

    if ($response.success) {
        Write-Host "√ 查询成功!" -ForegroundColor Green
        Write-Host "可用数据源:" -ForegroundColor Cyan
        $response.data | ForEach-Object {
            Write-Host "  - $_" -ForegroundColor Green
        }

        # 保存第一个数据源用于后续测试
        if ($response.data -and $response.data.Count -gt 0) {
            $script:dataSource = $response.data[0]
            Write-Host ""
            Write-Host "使用数据源: $script:dataSource" -ForegroundColor Magenta
        } else {
            Write-Host "警告: 没有可用的数据源" -ForegroundColor Yellow
            exit
        }
    } else {
        Write-Host "× 查询失败: $($response.error)" -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "× 请求失败!" -ForegroundColor Red
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host ""

# ========================================
# 测试用例 1: 查询单日日报
# ========================================
Write-Host "测试用例 1: 查询单日日报" -ForegroundColor Yellow
Write-Host "------------------------------------------" -ForegroundColor Yellow
$yesterday = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")
Write-Host "查询日期: $yesterday" -ForegroundColor Cyan

try {
    $headers = Get-AuthHeaders
    $url = "$ApiUrl/api/logs/$dataSource/dailyReport"
    $params = @{
        beginDate = $yesterday
        endDate = $yesterday
    }
    $queryString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '&'
    $fullUrl = "${url}?${queryString}"

    $response = Invoke-RestMethod -Uri $fullUrl -Method Get -Headers $headers

    if ($response.success) {
        Write-Host "√ 查询成功!" -ForegroundColor Green
        Write-Host "返回记录数: $($response.data.Count)" -ForegroundColor Cyan

        if ($response.data.Count -gt 0) {
            # 计算汇总数据
            $totalQuota = ($response.data | Measure-Object -Property total_quotas -Sum).Sum
            $totalRequests = ($response.data | Measure-Object -Property total_count -Sum).Sum

            Write-Host ""
            Write-Host "汇总数据:" -ForegroundColor Yellow
            Write-Host "  总配额: $totalQuota" -ForegroundColor Green
            Write-Host "  总请求数: $totalRequests" -ForegroundColor Green

            Write-Host ""
            Write-Host "前3条记录示例:" -ForegroundColor Yellow
            $response.data | Select-Object -First 3 | ForEach-Object {
                Write-Host "  用户: $($_.username) | 渠道: $($_.channel_name) | 配额: $($_.total_quotas) | 请求数: $($_.total_count)" -ForegroundColor Gray
            }
        } else {
            Write-Host "该日期没有数据" -ForegroundColor Yellow
        }
    } else {
        Write-Host "× 查询失败: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "× 请求失败!" -ForegroundColor Red
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

# ========================================
# 测试用例 2: 查询最近7天日报
# ========================================
Write-Host "测试用例 2: 查询最近7天日报" -ForegroundColor Yellow
Write-Host "------------------------------------------" -ForegroundColor Yellow
$endDate = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")
$startDate = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
Write-Host "查询时间范围: $startDate 至 $endDate" -ForegroundColor Cyan

try {
    $headers = Get-AuthHeaders
    $url = "$ApiUrl/api/logs/$dataSource/dailyReport"
    $params = @{
        beginDate = $startDate
        endDate = $endDate
    }
    $queryString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '&'
    $fullUrl = "${url}?${queryString}"

    $response = Invoke-RestMethod -Uri $fullUrl -Method Get -Headers $headers

    if ($response.success) {
        Write-Host "√ 查询成功!" -ForegroundColor Green
        Write-Host "返回记录数: $($response.data.Count)" -ForegroundColor Cyan

        if ($response.data.Count -gt 0) {
            # 计算汇总数据
            $totalQuota = ($response.data | Measure-Object -Property total_quotas -Sum).Sum
            $totalRequests = ($response.data | Measure-Object -Property total_count -Sum).Sum
            $totalPromptTokens = ($response.data | Measure-Object -Property total_prompt_tokens -Sum).Sum
            $totalCompTokens = ($response.data | Measure-Object -Property total_completion_tokens -Sum).Sum

            Write-Host ""
            Write-Host "7天汇总数据:" -ForegroundColor Yellow
            Write-Host "  总配额: $totalQuota" -ForegroundColor Green
            Write-Host "  总请求数: $totalRequests" -ForegroundColor Green
            Write-Host "  总Prompt Tokens: $totalPromptTokens" -ForegroundColor Cyan
            Write-Host "  总Completion Tokens: $totalCompTokens" -ForegroundColor Cyan
        } else {
            Write-Host "该时间段没有数据" -ForegroundColor Yellow
        }
    } else {
        Write-Host "× 查询失败: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "× 请求失败!" -ForegroundColor Red
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "测试完成!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
