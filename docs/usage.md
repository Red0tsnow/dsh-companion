# 使用与依赖

不熟悉目录、端口和连接协议时，先使用 [新手连接向导](onboarding.md)。下面是保留给已有部署与排查问题的高级配置。

## Windows 依赖

| 组件 | 需要它的能力 | 准备方式 |
|---|---|---|
| DSH 与可用模型 | 角色会话及唤醒 | 先确认 DSH 自己能正常聊天，复用宿主已有模型，无需另填 key |
| Node 22+ | 插件工具进程 | 优先检测真实 Node，支持 `runtime.nodePath` 与 `DSH_NODE` |
| Java | 本地 Minecraft 服务端 | 按所选版本检测或准备对应运行环境；26.1 要求 Java 25，1.21.8 使用 Java 21；高级配置可指定路径 |
| Minecraft jar | 开世界 | 向导确认下载与协议后从 Minecraft 官方准备；高级配置可使用已有服务端 |
| mineflayer 及配套模块 | 角色身体 | 由插件的 npm 依赖安装 |
| NapCat 和 QQ | QQ 通道 | 在向导确认固定版本与哈希后准备官方便携版，扫码由用户完成；也可在高级设置接入已有部署 |
| Python/Pillow | 可选媒体处理 | 缺失只影响对应能力，插件不自动安装 |
| FFmpeg | B站工具中的视频抽帧 | 用户准备并放入 PATH 或设置 `FFMPEG`；普通登录检测不需要 |

向导在用户确认后可下载 Java、Minecraft 服务端与 NapCat 官方便携版，账号登录与 Minecraft 协议由用户完成。Node、游戏客户端及可选媒体处理工具需在宿主环境可用。可用链接：[Node](https://nodejs.org/)、[Java](https://adoptium.net/)、[Minecraft 服务端](https://www.minecraft.net/download/server)、[NapCat](https://napneko.github.io/)、[Python](https://www.python.org/)、[FFmpeg](https://ffmpeg.org/)。

## Minecraft

填写 `mc.serverDir`、jar 文件名、游戏端口、身体命令端口和用户名。服务端 `server.properties` 的端口必须与面板一致。默认游戏端口为 25565，身体命令端口为 19772，身体试用端口为 19773；三者必须不同。

本地管理模式只启动配置的服务端。所有启动入口统一调用 `world.mjs up`；开关过程中持有跨进程锁。状态来自端口、端口所属 PID、jar 路径和进程创建时间，状态文件是可校正记录。模糊匹配不到归属的 Java 进程不会被接管。

“世界在线”与“角色已进入”分别显示。由外部启动的世界可以被识别，但关闭需回到原控制台。插件自己启动的世界关闭时发送 `save-all flush` 和 `stop`，超时会显示失败，不强制结束未知进程。

角色身体第一次从包内模板复制到 `runtime/mc/mc-daemon.mjs`。`body edit` 创建候选，`body test` 做语法和独立端口试用，`body apply` 备份并应用，失败恢复，`body rollback` 返回备份。手动修改身体前也应备份该目录。

## QQ

NapCat 需作为 OneBot WS 服务端运行，插件填写其 `ws://` 或 `wss://` 地址。地址中不写 token、用户名或密码；token 在凭据输入中单独保存。插件使用正向连接，不监听旧部署的反向 WS 端口。

填写主人 QQ 号后可接收该账号私聊。群聊仅处理允许群列表中的 @ 角色消息；启用前请确认这是期望行为。机器人自己的消息会被忽略。重连后不自动重发结果不明的外发消息，以减少重复发送。

QQ 使用公开 [OneBot v11](https://github.com/botuniverse/onebot-11) 协议。插件不读取、导入、修改其他 QQ 插件或接管宿主全局消息钩子。

## B站

保存自己的 `SESSDATA`、`bili_jct`，`buvid3` 可选。登录检测只读取账号状态；写操作是否可用还取决于字段一致性与平台返回。账号过期与网络不可达分别显示。

自有 CLI 提供 feed、comments、fav 等能力。操作前先用 `bili session` 确认当前账号；工具里的写操作继续使用原来的显式参数。凭据不返回前端、不随插件发布。

## 小黑盒：用户自备工具

v1 不分发小黑盒签名代码及平台内部签名常量。`xhh.toolPath` 指向用户自行准备的 Node CLI，插件使用真实 Node 调用它；外部工具自身的数据与访问权限由用户管理。

测试连接的契约为：

```text
node <toolPath> whoami --json
```

stdout 应只输出一个 JSON 对象：

```json
{"state":"online","account":"角色账号","id":"12345"}
```

`state` 支持 `online`、`expired`、`offline`、`error`、`unconfigured`。进程应在约 6 秒内返回，stderr 不应包含 Cookie。若使用插件凭据视图，文件路径由 `DSH_COMPANION_CREDENTIALS` 提供；工具必须明确支持这个环境变量。旧工具可能自行读取旧目录，单独填写 Cookie 不会让它自动适配新数据位置。

其他手动命令从工作区使用 `node companion.mjs xhh <命令>` 调用，保留用户自备工具原有行为。插件不会替用户下载工具或签名材料。

## 文字与定时任务

七份文字都位于 `workspace`。文本显示为空表示尚未生成；插件不会捏造角色日记。长文件的面板刷新读取最近部分，原文件保持完整。

定时唤醒默认停用，需要启用 `schedule.enabled` 并在 `schedules` 放入 `*.schedule.json` 文件。示例：

```json
{
  "version": 1,
  "target": {"mode": "resume", "channel": "dsh"},
  "entries": [
    {
      "id": "daily-journal",
      "enabled": true,
      "cron": "0 21 * * *",
      "time_zone": "Asia/Shanghai",
      "prompt": "回顾今天确实发生的事；有想写的内容再写入日记，不补造经历。"
    }
  ]
}
```

每条任务必须有唯一 `id`、`enabled: true`、非空 `prompt`，并且提供 `cron` 或 `at: "HH:mm"` 其中一项。cron 为 5 个数字字段，支持星号、范围、列表和步长；可设置 IANA `time_zone`。目标可以在文件顶层配置，再由条目 `target` 覆盖；模式为 `resume`、`fork` 或 `new`，通道为 `dsh`、`mc` 或 `qq`。QQ 目标由 `id`、`group` 标识，仍受当前账号与允许群配置约束。

迁移闹钟先检查路径、时区、目标和是否需要外发。缺通道、静默时段、未满足空闲时间或执行失败时记录本次结果，恢复后不补发旧任务。`min_idle_seconds` 控制空闲要求，文件可设 `quiet_hours: {"start":"23:00","end":"08:00"}`，条目使用 `respect_quiet_hours` 选择是否遵守。

## 可选媒体

本地媒体库支持图片 PNG、JPEG、GIF、WebP，以及音频 MP3、OGG、WAV、M4A；每个文件最多 8 MiB，按实际文件头检查格式，不接收 SVG。核心的本地上传、列表和播放不需要 Python；Python/Pillow 只用于额外处理能力的检测。

媒体库不生成语音，也不会仅因上传文件就自动向 QQ 或其他平台发送。启用前检查文件内容与保存位置。

## 常见故障

| 现象 | 检查与处理 |
|---|---|
| 插件装上但没有入口 | 包名、bundle patch 名称均需为 `dsh-companion`；确认构建生成 `lib/client.js` 并重启正确 profile |
| 预览能打开但不能聊天 | 独立开发预览没有 DSH 模型；在真正 DSH 面板中打开角色会话 |
| 人设保存失败 | 查看 4000 上限和数据目录权限；镜像失败会单独提示 |
| 启动世界显示端口冲突 | 核对该端口所属进程；不要把任意端口被占认作世界在线 |
| 世界在线但角色不在 | 查看 `runtime/mc/bot.log`、用户名、认证方式、服务端允许的客户端和协议版本 |
| 关世界失败 | 外部世界用原控制台关闭；插件世界查看 `runtime/world.log`，保留存档后再处理 |
| QQ 离线 | 检查 NapCat 登录态、正向 WS 地址、token 和账号是否一致 |
| Cookie 已保存但仍失败 | 运行测试连接；网络故障不等于过期，B站写操作还需要匹配的 CSRF 字段 |
| 配置文件损坏 | 保留损坏文件供排查，恢复备份；插件不会用默认值静默覆盖它 |

反馈问题时提供插件版本、DSH 版本、通道状态、最后检测时间与脱敏日志。不要附原始 Cookie 或整个凭据文件。
