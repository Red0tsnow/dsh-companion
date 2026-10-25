# 0.3.0 验证记录

2026-10-25，Windows x64，Node 24.21、DSH 0.2.1-rc.3、Java 25（26.1 世界）及 Java 21（旧版生命周期回归）。所有世界、组件、宿主 profile 和截图均位于开发隔离目录，未切换现有部署。源码和插件包已准备供测试；真实账号及跨机器验收未全部完成。

| 需求 | 验证结果与证据 | 边界 |
|---|---|---|
| R1 安装信任锚 | 固定 v4.18.41 / 46c3ec15；变更版本、asset、digest 均在下载前拒绝；无效签名和错误发布者不执行；浏览器显示版本与哈希、确认后发送准确值，失败仅提供手动路径 | 真实安装助手为 NotSigned，因此自动执行禁用，未虚构发布者；真实账号安装登录待人工 |
| R2 动态版本 | 实际 minecraft-data 3.117.0 与 Mojang 正式版交集默认 26.1；26.3 标为只可建世界。真实下载校验、Java 25、起服、身体进入、观察、正常关闭通过 | 26.3 身体暂不支持，不声称能一起玩 |
| R3 A 自建 | 5 项真实世界检查通过；`artifacts/030-world-verification.json`、`030-managed-actual.png` | 本地离线世界 |
| R3 C 已有服务端 | 真实 26.1 jar 与身体连接通过，协议文件逐字节保留；`030-source-verification.json`、`030-existing-actual.png` | 只对隔离目录操作，无原部署存档写入 |
| R3 B 局域网 | 真实 UDP 接收、真实 26.1 服务端与身体连接、退出只停身体、房主关闭后正常降级通过；`030-source-verification.json`、`030-lan-actual.png` | 公告由协议测试脚本发送；游戏客户端实际点击“对局域网开放”待实测 |
| R3 异常 | 无公告、公告端口不可达、缺 jar、端口占用、Java 太旧、无效端口均有测试，面板显示逐项检查与模组警告 | 模组注册表兼容性待实际客户端验收 |
| R4 宿主模型 | 无证据显示未知；缺模型/登录被拦截；每次打开前复检；实际 DSH 的本地 fixture 回复后识别为可用。只读取配置和凭据元信息，不读取密钥或付费探测 | fixture 证明公开 API 调用；用户 workbuddy-cn 真实登录态仍待实测 |
| R5 防回归 | `check.mjs` 校验锚格式、下载/签名守卫、禁止固定版本名，含破坏守卫的反例测试；发布检查比对受保护文件及实际安装副本 | 静态检查是回归约束，不代替运行时校验 |

65 项单元测试、11 个基础面板场景及 11 个新向导场景通过。完整结果保存在 `artifacts/unit-tests.tap`、`browser-panel.json`、`browser-onboarding.json`、`host-verification.json`、`host-panel-browser.json`、`lifecycle-verification.json` 和 `release-verification.json`。宿主 API 为 15 项、原生浏览器 5 项、安装/卸载/重装 11 项。宿主模型和 OneBot 回环分别使用明确标识的本地 fixture 与协议模拟端点。

受保护的下载管线、人设模板、54 条来源记录、QQ/B站/小黑盒适配器保持基线内容。安装包不含运行组件、jar、外部软件、个人路径、账号凭据、日志或存档。依赖仍有 8 项 moderate、0 high、0 critical，详情见已知问题。

## 重现

```powershell
npm run build
npm test
npm run check
node tests/browser-panel.mjs
node tests/browser-onboarding.mjs
node scripts/verify030-worlds.mjs --download
node scripts/verify030-sources.mjs
node scripts/verify-lifecycle.mjs
node scripts/verify-release.mjs
```

世界脚本只使用隔离数据；`--download` 明确允许官方组件下载。源路径、宿主提取及发行包安装须先在开发环境准备。生命周期脚本加载真实 DSH 和实际安装包，再验证卸载与重装。证据和截图留在本地，不进入插件包。

仍待：全新 Windows 用户/机器、真实宿主账号、游戏客户端 LAN、QQ 私聊/群聊、B站扫码确认及权限、自备小黑盒 CLI、Microsoft 游戏账号和模组兼容性。这些不以模拟测试替代。
