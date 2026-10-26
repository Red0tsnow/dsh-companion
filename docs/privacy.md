# 隐私与数据 / Privacy and data

插件**不上传任何数据**。它没有账号服务器，没有遥测，没有崩溃上报。除了下面列出的官方下载和你自己配置的通道，插件不主动对外发起请求。

The plugin uploads nothing. There is no account server, no telemetry and no crash reporting. Apart from the official downloads listed below and the channels you configure yourself, it makes no outbound requests on its own.

## 数据存在哪

默认数据根：`$DSH_HOME/companion`；未设置 `DSH_HOME` 时是 `~/.dsh/companion`。可以用 `DSH_COMPANION_HOME` 或宿主插件配置 `dataDir` 换位置。

| 内容 | 位置 | 说明 |
|---|---|---|
| 人设 | `workspace/AGENTS.md` | 原件；`persona.md` 是插件管理的镜像 |
| 日记、私人日记、手札、长期记忆、印象、便签、睡前一句 | `workspace/` | 纯文本，你自己可读可改 |
| 配置 | `config.json` | 端口、路径、开关；不含凭据 |
| **凭据** | `secrets.json` | QQ token、B站 Cookie、小黑盒 Cookie 等 |
| 世界与身体 | `runtime/` | 世界状态、事件日志、身体脚本、`bot.log` |
| 定时任务 | `schedules/` | `*.schedule.json` |
| 媒体库 | `workspace/media/` | 你上传的图片与音频 |
| 迁移副本 | 由你指定的目标目录 | 只在运行 `migrate.mjs` 时产生 |

**凭据不会出现在任何接口响应里。** 读取配置只返回"是否已设置"，不返回值本身。前端不会拿到 Cookie 或 token。

## 会不会传出去

| 情况 | 数据去向 |
|---|---|
| 你和角色聊天 | 发给你 DSH 里配置的那个模型服务方（由 DSH 和你的模型配置决定，**本插件不参与、不记录**） |
| 日记、记忆、人设 | **只在本机**。插件不会把它们发给任何第三方 |
| QQ 通道 | 消息经你本机运行的 NapCat 走 QQ 官方服务器 |
| B站通道 | 请求经 B站官方接口，用你扫码得到的登录态 |
| 小黑盒通道 | 走**你自己准备的** CLI，插件只负责调用 |
| 可选媒体 | 上传的图片和音频**只存在本机**；不会仅因上传就发到任何平台 |

**关于模型**：生成内容由你使用的模型与平台负责。插件不生成、不审核、不代为转发内容。

## 插件会主动连哪些地址

只在这些**官方来源**，且都需要你明确确认：

```
piston-meta.mojang.com      Mojang 版本清单
launchermeta.mojang.com     Mojang 版本元数据
piston-data.mojang.com      Minecraft 服务端 jar
launcher.mojang.com         Mojang 官方资源
api.adoptium.net            Temurin Java
github.com / api.github.com NapCat 便携版发行信息
release-assets.githubusercontent.com / objects.githubusercontent.com  发行资产
fill-data.papermc.io        Paper 服务端（仅在你选 Paper 时）
cdn.modrinth.com            SkinsRestorer（仅在你选 Paper 时）
```

这份白名单是**硬编码**的：来源不在名单里直接拒绝下载，不做任何"任意 URL 下载"。`check.mjs` 会验证这条限制还在。

## 你自己的责任

- 数据目录里是**你的聊天记录、日记和凭据**。请自己备份，并限制目录访问权限；不要把它提交到公开仓库。
- 凭据以**本机文件**形式保存，不是系统钥匙串。共用电脑请自行考虑。
- 使用 QQ、B站、小黑盒通道时，把对应账号的凭据交给本插件并由插件调用平台接口，属于你对自己账号的处置；请遵守各平台的用户协议。

## 删除数据

删掉整个数据目录即可，插件不在别处留副本。卸载插件**不会**删数据目录——这是有意的，避免误删你的日记。Minecraft 世界请先在面板里显式关闭再删。

---

**English summary.** Everything lives under the data root (`$DSH_HOME/companion` by default): persona, diary and memory as plain text in `workspace/`, credentials isolated in `secrets.json` and never returned by any API, world state and the editable body under `runtime/`. The plugin uploads nothing and has no telemetry. Chat messages go to whichever model your DSH is configured with — that is DSH's doing, not the plugin's. Outbound requests are restricted to a hard-coded allowlist of official download hosts, each requiring explicit confirmation. Generated content is the responsibility of your model and platform. Credentials are plain files, not a system keychain. Deleting the data directory removes everything; uninstalling the plugin intentionally leaves it in place.
