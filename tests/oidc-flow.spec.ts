import { test, expect } from '@playwright/test';

test('OIDC 完整生命周期自动化测试', async ({ page }) => {
    // 1. 访问 OIDC 客户端模拟器
    console.log('正在访问模拟器首页...');
    await page.goto('http://localhost:3001');

    // 验证页面标题
    await expect(page.locator('h1')).toContainText('OIDC 客户端模拟器');

    // 2. 点击登录按钮
    console.log('点击登录按钮，跳转至 AI Portal...');
    await page.click('text=Login with AI Portal');

    // 3. 执行登录
    console.log('正在输入凭据...');
    await page.waitForSelector('input[id="email"]', { timeout: 10000 });
    await page.fill('input[id="email"]', 'admin@example.com');
    await page.fill('input[id="password"]', '123456');
    await page.click('button[type="submit"]');

    // 4. 处理可能的授权页面 (Consent)
    try {
        console.log('正在检查授权页面...');
        const consentButton = page.locator('button:has-text("确认授权")');
        await consentButton.waitFor({ state: 'visible', timeout: 5000 });
        await consentButton.click();
        console.log('点击了“确认授权”');
    } catch (e) {
        console.log('未检测到授权页面或已授权过，跳过。');
    }

    // 5. 验证登录成功并显示用户信息
    console.log('验证回调结果...');
    await page.waitForURL(/.*callback/, { timeout: 10000 });
    await page.waitForSelector('text=✅ 登录成功!', { timeout: 10000 });

    // 检查表格中是否显示了正确的邮箱
    const userInfoTable = page.locator('table');
    await expect(userInfoTable).toContainText('admin@example.com');
    console.log('✅ 登录成功，用户信息展示正确');

    // 6. 执行全链路登出
    console.log('测试登出流程...');
    const logoutButton = page.locator('text=安全登出');
    await logoutButton.click();

    // 7. 验证是否成功返回并清除会话
    await page.waitForURL('http://localhost:3001/', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('OIDC 客户端模拟器');
    console.log('✅ 全链路登出成功，已返回模拟器首页');
});
