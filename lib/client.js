window.__ModuleLoader__.load({id:"dsh-companion",factory:(require)=>{const module={exports:{}};const exports=module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ui/client.jsx
var client_exports = {};
__export(client_exports, {
  Panel: () => Panel,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);
var import_react4 = __toESM(require("react"), 1);

// ui/panel.jsx
var import_react3 = __toESM(require("react"), 1);

// ui/messages.js
var messages = {
  zh: {
    hostModel: "\u5BBF\u4E3B\u6A21\u578B",
    model_available: "\u53EF\u7528",
    model_unconfigured: "\u672A\u914D\u7F6E",
    model_unknown: "\u672A\u77E5",
    modelCheck: "\u91CD\u65B0\u68C0\u67E5",
    modelHelp: "\u5148\u786E\u8BA4 DSH \u81EA\u5DF1\u80FD\u6B63\u5E38\u804A\u5929\uFF08\u968F\u4FBF\u53D1\u4E00\u53E5\uFF0C\u6709\u56DE\u590D\u5C31\u884C\uFF09\u3002\u63D2\u4EF6\u7528\u5BBF\u4E3B\u5DF2\u6709\u7684\u6A21\u578B\uFF0C\u4E0D\u9700\u8981\u53E6\u5916\u586B key\u3002",
    leave: "\u9000\u51FA\u4E16\u754C",
    enter: "\u8FDB\u5165\u4E16\u754C",
    title: "\u540C\u5C45\u8005",
    subtitle: "\u4E00\u4E2A\u89D2\u8272\uFF0C\u6162\u6162\u8FC7\u81EA\u5DF1\u7684\u65E5\u5B50\u3002",
    first: "\u5148\u8BA4\u8BC6\u5F7C\u6B64",
    firstHint: "\u5199\u597D\u4EBA\u8BBE\uFF0C\u5C31\u80FD\u5F00\u59CB\u5BF9\u8BDD\u3002\u5176\u4ED6\u901A\u9053\u53EF\u4EE5\u4EE5\u540E\u518D\u63A5\u3002",
    persona: "\u4EBA\u8BBE",
    personaHint: "\u6BCF\u8F6E\u5BF9\u8BDD\u90FD\u4F1A\u8BFB\u53D6\uFF1B\u5199\u5979\u662F\u8C01\u3001\u600E\u4E48\u8BF4\u8BDD\u3001\u4F60\u4EEC\u662F\u4EC0\u4E48\u5173\u7CFB\u3002",
    name: "\u89D2\u8272\u540D\u5B57",
    relationship: "\u4F60\u4EEC\u7684\u5173\u7CFB",
    tone: "\u8BF4\u8BDD\u8BED\u6C14",
    owner: "\u5979\u600E\u4E48\u79F0\u547C\u4F60",
    ownerId: "\u4F60\u7684 QQ \u53F7",
    fullPersona: "\u5B8C\u6574\u4EBA\u8BBE",
    savePersona: "\u4FDD\u5B58\u4EBA\u8BBE",
    saved: "\u5DF2\u4FDD\u5B58",
    save: "\u4FDD\u5B58\u914D\u7F6E",
    saving: "\u4FDD\u5B58\u4E2D\u2026",
    template: "\u8F7D\u5165\u7A7A\u767D\u6A21\u677F",
    example: "\u8F7D\u5165\u793A\u4F8B",
    generate: "\u6839\u636E\u4E0A\u9762\u7684\u4FE1\u606F\u751F\u6210\u9AA8\u67B6",
    open: "\u6253\u5F00\u89D2\u8272\u5BF9\u8BDD",
    chat: "\u5728\u8FD9\u91CC\u804A\u4E00\u53E5",
    send: "\u53D1\u9001",
    input: "\u60F3\u8BF4\u7684\u8BDD",
    nativeHint: "\u5BF9\u8BDD\u4FDD\u5B58\u5728 DSH \u7684\u89D2\u8272\u4F1A\u8BDD\u91CC\u3002",
    previewHint: "\u5F53\u524D\u4E3A\u72EC\u7ACB\u9762\u677F\u9884\u89C8\uFF1B\u89D2\u8272\u5BF9\u8BDD\u9700\u5728 DSH \u4E2D\u6253\u5F00\u3002",
    channels: "\u5979\u53EF\u4EE5\u53BB\u7684\u5730\u65B9",
    channelsHint: "\u9009\u62E9\u60F3\u4E00\u8D77\u505A\u7684\u4E8B\uFF0C\u8DDF\u7740\u5411\u5BFC\u8FDE\u63A5\u3002\u4E5F\u53EF\u4EE5\u4EE5\u540E\u518D\u6765\u3002",
    advanced: "\u9AD8\u7EA7\u8BBE\u7F6E",
    test: "\u6D4B\u8BD5\u8FDE\u63A5",
    testing: "\u68C0\u6D4B\u4E2D\u2026",
    enable: "\u542F\u7528\u6B64\u901A\u9053",
    enabled: "\u5DF2\u542F\u7528",
    channelSaved: "\u901A\u9053\u914D\u7F6E\u5DF2\u4FDD\u5B58",
    lastCheck: "\u6700\u540E\u68C0\u6D4B",
    lastSuccess: "\u6700\u540E\u6210\u529F",
    never: "\u5C1A\u672A\u68C0\u6D4B",
    unconfigured: "\u672A\u63A5\u5165",
    disabled: "\u5DF2\u7981\u7528",
    online: "\u5728\u7EBF",
    offline: "\u79BB\u7EBF",
    expired: "\u767B\u5F55\u5DF2\u8FC7\u671F",
    error: "\u9700\u8981\u68C0\u67E5",
    checking: "\u68C0\u6D4B\u4E2D",
    mcHint: "\u9009\u62E9\u65B0\u4E16\u754C\u6216\u5DF2\u6709\u4E16\u754C\uFF0C\u4E00\u8D77\u8D70\u8D70\u3001\u804A\u5929\u3002",
    qqHint: "\u8BA9\u89D2\u8272\u5728 QQ \u4E0A\u966A\u4F60\u804A\u5929\u3002\u6309\u5411\u5BFC\u51C6\u5907\u8FDE\u63A5\uFF0C\u7528\u624B\u673A\u626B\u7801\u767B\u5F55\u3002",
    xhhHint: "\u4F7F\u7528\u989D\u5916\u5DE5\u5177\u8FDE\u63A5\u5C0F\u9ED1\u76D2\u3002\u5F53\u524D\u9700\u8981\u5DF2\u6709\u7684\u517C\u5BB9\u5DE5\u5177\u3002",
    biliHint: "\u7528 B\u7AD9 App \u626B\u7801\u8FDE\u63A5\u89D2\u8272\u8D26\u53F7\uFF0C\u4E00\u8D77\u770B\u611F\u5174\u8DA3\u7684\u5185\u5BB9\u3002",
    credentials: "\u51ED\u636E",
    credentialsHint: "\u7559\u7A7A\u4FDD\u7559\u5DF2\u4FDD\u5B58\u7684\u503C\u3002\u8F93\u5165\u6846\u4E0D\u4F1A\u56DE\u663E\u65E7\u51ED\u636E\u3002",
    credentialsSaved: "\u51ED\u636E\u5DF2\u4FDD\u5B58",
    saveCredentials: "\u4FDD\u5B58\u51ED\u636E",
    present: "\u5DF2\u8BBE\u7F6E",
    absent: "\u672A\u8BBE\u7F6E",
    token: "NapCat access token",
    pkey: "pkey",
    x_xhh_tokenid: "x_xhh_tokenid",
    sessdata: "SESSDATA",
    bili_jct: "bili_jct",
    buvid3: "buvid3\uFF08\u53EF\u9009\uFF09",
    up: "\u5F00\u4E16\u754C",
    down: "\u5173\u4E16\u754C",
    around: "\u770B\u770B\u5468\u56F4",
    map: "\u67E5\u770B\u5730\u56FE",
    say: "\u5728\u6E38\u620F\u91CC\u8BF4",
    connect: "\u8FDE\u63A5",
    disconnect: "\u65AD\u5F00",
    channelMessage: "\u53D1\u9001\u5230\u901A\u9053\u7684\u6587\u5B57",
    qqSay: "\u53D1\u7ED9\u4F60\u7684 QQ",
    actionRunning: "\u64CD\u4F5C\u8FDB\u884C\u4E2D\u2026",
    writings: "\u5979\u5199\u7684",
    writingsHint: "\u6BCF\u5341\u79D2\u8BFB\u4E00\u6B21\uFF0C\u5207\u5230\u540E\u53F0\u65F6\u6682\u505C\u3002\u5185\u5BB9\u6765\u81EA\u89D2\u8272\u5DE5\u4F5C\u533A\u3002",
    emptyWriting: "\u8FD9\u91CC\u8FD8\u6CA1\u6709\u6587\u5B57\u3002\u65E5\u5B50\u5F00\u59CB\u540E\uFF0C\u8BB0\u5F55\u4F1A\u6162\u6162\u7559\u4E0B\u6765\u3002",
    updated: "\u66F4\u65B0\u4E8E",
    recentOnly: "\u6587\u4EF6\u8F83\u957F\uFF0C\u4EC5\u663E\u793A\u6700\u8FD1\u90E8\u5206\u3002",
    diary: "\u516C\u5171\u65E5\u8BB0",
    private: "\u79C1\u4EBA\u65E5\u8BB0",
    journal: "\u624B\u672D",
    memory: "\u957F\u671F\u8BB0\u5FC6",
    impression: "\u5370\u8C61",
    notes: "\u4FBF\u7B7E",
    bedtime: "\u7761\u524D\u4E00\u53E5",
    deps: "\u4F9D\u8D56\u81EA\u68C0",
    depsHint: "\u53EA\u505A\u68C0\u6D4B\u3002\u7F3A\u5C11\u53EF\u9009\u4F9D\u8D56\u65F6\uFF0C\u5BF9\u5E94\u529F\u80FD\u4F1A\u4FDD\u6301\u5173\u95ED\u3002",
    runDeps: "\u5F00\u59CB\u81EA\u68C0",
    available: "\u53EF\u7528",
    notDetected: "\u672A\u68C0\u6D4B\u5230",
    optional: "\u53EF\u9009",
    nodePath: "Node \u8DEF\u5F84\uFF08\u7559\u7A7A\u81EA\u52A8\u68C0\u6D4B\uFF09",
    pythonPath: "Python \u8DEF\u5F84\uFF08\u53EF\u9009\uFF09",
    theme: "\u5916\u89C2",
    system: "\u8DDF\u968F\u7CFB\u7EDF",
    light: "\u6D45\u8272",
    dark: "\u6DF1\u8272",
    language: "\u8BED\u8A00",
    refresh: "\u5237\u65B0",
    loading: "\u6B63\u5728\u6253\u5F00\u2026",
    retry: "\u91CD\u65B0\u8BFB\u53D6",
    overflow: "\u8D85\u8FC7 4000 \u4E0A\u9650\uFF0C\u8BF7\u7F29\u77ED\u540E\u4FDD\u5B58\u3002\u5F53\u524D\u5185\u5BB9\u4ECD\u4FDD\u7559\u5728\u7F16\u8F91\u5668\u4E2D\u3002",
    unsaved: "\u6709\u672A\u4FDD\u5B58\u7684\u4FEE\u6539",
    invalidNumber: "\u8BF7\u8F93\u5165\u6709\u6548\u6570\u5B57",
    operationDone: "\u64CD\u4F5C\u5DF2\u5B8C\u6210",
    depsSaved: "\u8FD0\u884C\u65F6\u914D\u7F6E\u5DF2\u4FDD\u5B58",
    noHost: "\u8BF7\u5728 DSH \u5185\u6253\u5F00\u89D2\u8272\u5BF9\u8BDD",
    taskError: "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u63D0\u793A\u540E\u91CD\u8BD5\u3002",
    runtime: "\u8FD0\u884C\u73AF\u5883",
    configError: "\u914D\u7F6E\u8BFB\u53D6\u5931\u8D25",
    errorLog: "\u6700\u8FD1\u7684\u95EE\u9898",
    schedule: "\u4E3B\u52A8\u4EFB\u52A1",
    scheduleHint: "\u53EA\u6709\u663E\u5F0F\u542F\u7528\u7684\u4EFB\u52A1\u624D\u4F1A\u5524\u9192\u89D2\u8272\u3002\u4EFB\u52A1\u6587\u4EF6\u4FDD\u5B58\u5728\u4E13\u5C5E schedules \u76EE\u5F55\u3002",
    scheduleEnable: "\u542F\u7528\u5DF2\u914D\u7F6E\u7684\u5B9A\u65F6\u4EFB\u52A1",
    media: "\u53EF\u9009\u5A92\u4F53",
    mediaEnable: "\u542F\u7528\u8868\u60C5\u5305\u4E0E\u8BED\u97F3\u80FD\u529B",
    mediaHint: "\u4E0A\u4F20\u81EA\u5DF1\u7684\u56FE\u7247\u6216\u97F3\u9891\u3002\u7F29\u7565\u56FE\u9700\u8981 Python/Pillow\u3002",
    editSchedules: "\u7F16\u8F91\u4EFB\u52A1\u6587\u4EF6",
    scheduleFile: "\u4EFB\u52A1\u6587\u4EF6\u540D",
    scheduleDocument: "\u4EFB\u52A1\u914D\u7F6E JSON",
    newSchedule: "\u65B0\u5EFA\u6BCF\u65E5\u4EFB\u52A1",
    saveSchedule: "\u4FDD\u5B58\u4EFB\u52A1\u6587\u4EF6",
    loadSchedules: "\u8BFB\u53D6\u4EFB\u52A1\u6587\u4EF6",
    mediaLibrary: "\u5A92\u4F53\u5E93",
    loadMedia: "\u8BFB\u53D6\u5A92\u4F53\u5E93",
    uploadMedia: "\u4E0A\u4F20\u5A92\u4F53",
    removeMedia: "\u79FB\u9664",
    noMedia: "\u8FD8\u6CA1\u6709\u5A92\u4F53\u6587\u4EF6\u3002",
    uploadHint: "\u652F\u6301 PNG\u3001JPEG\u3001GIF\u3001WebP\u3001MP3\u3001OGG\u3001WAV\u3001M4A\uFF0C\u5355\u4E2A\u6587\u4EF6\u4E0D\u8D85\u8FC7 8 MiB\u3002",
    scheduleSaved: "\u4EFB\u52A1\u6587\u4EF6\u5DF2\u4FDD\u5B58",
    mediaSaved: "\u5A92\u4F53\u5DF2\u4FDD\u5B58",
    mediaRemoved: "\u5A92\u4F53\u5DF2\u79FB\u9664",
    noSchedules: "\u8FD8\u6CA1\u6709\u4EFB\u52A1\u6587\u4EF6\u3002\u53EF\u4EE5\u65B0\u5EFA\u4E00\u4E2A\u6BCF\u65E5\u4EFB\u52A1\uFF0C\u518D\u68C0\u67E5\u5185\u5BB9\u548C\u76EE\u6807\u3002",
    selectFile: "\u9009\u62E9\u6587\u4EF6"
  },
  en: {
    hostModel: "Host model",
    model_available: "Available",
    model_unconfigured: "Not configured",
    model_unknown: "Unknown",
    modelCheck: "Check again",
    modelHelp: "First send a message in DSH and confirm it replies. This plugin uses the existing host model; no additional key is needed.",
    leave: "Leave world",
    enter: "Enter world",
    title: "Companion",
    subtitle: "One character, a life that carries on.",
    first: "Get to know each other",
    firstHint: "Save a persona to start talking. Add the other channels whenever you are ready.",
    persona: "Persona",
    personaHint: "Read on every turn: who they are, how they speak, and your relationship.",
    name: "Character name",
    relationship: "Your relationship",
    tone: "Voice and tone",
    owner: "What they call you",
    ownerId: "Your QQ number",
    fullPersona: "Full persona",
    savePersona: "Save persona",
    saved: "Saved",
    save: "Save settings",
    saving: "Saving\u2026",
    template: "Load blank template",
    example: "Load example",
    generate: "Create a draft from these details",
    open: "Open character conversation",
    chat: "Say something here",
    send: "Send",
    input: "Your message",
    nativeHint: "The conversation lives in the character\u2019s DSH session.",
    previewHint: "This is the standalone panel preview. Open it in DSH to talk to the character.",
    channels: "Places they can be",
    channelsHint: "Choose what to do together and follow the connection guide. You can also come back later.",
    advanced: "Advanced settings",
    test: "Test connection",
    testing: "Checking\u2026",
    enable: "Enable this channel",
    enabled: "Enabled",
    channelSaved: "Channel settings saved",
    lastCheck: "Last checked",
    lastSuccess: "Last successful",
    never: "Not checked yet",
    unconfigured: "Not configured",
    disabled: "Disabled",
    online: "Online",
    offline: "Offline",
    expired: "Login expired",
    error: "Needs attention",
    checking: "Checking",
    mcHint: "Prepare a world of your own to explore and chat together.",
    qqHint: "Talk to your character on QQ. Set up the helper, then scan to log in.",
    xhhHint: "Connect through a compatible external Heybox tool you already have.",
    biliHint: "Scan with the Bilibili app to connect the character account.",
    credentials: "Credentials",
    credentialsHint: "Empty fields keep saved values. Existing credentials are never shown.",
    credentialsSaved: "Credentials saved",
    saveCredentials: "Save credentials",
    present: "Set",
    absent: "Not set",
    token: "NapCat access token",
    pkey: "pkey",
    x_xhh_tokenid: "x_xhh_tokenid",
    sessdata: "SESSDATA",
    bili_jct: "bili_jct",
    buvid3: "buvid3 (optional)",
    up: "Open world",
    down: "Close world",
    around: "Look around",
    map: "View map",
    say: "Say in game",
    connect: "Connect",
    disconnect: "Disconnect",
    channelMessage: "Message for this channel",
    qqSay: "Send to your QQ",
    actionRunning: "Working\u2026",
    writings: "Their words",
    writingsHint: "Refreshes every ten seconds, pausing in the background. Read from the character\u2019s workspace.",
    emptyWriting: "No words here yet. As life unfolds, their notes will find a place here.",
    updated: "Updated",
    recentOnly: "Showing the most recent part of this long file.",
    diary: "Public diary",
    private: "Private diary",
    journal: "Journal",
    memory: "Long-term memory",
    impression: "Impressions",
    notes: "Notes",
    bedtime: "A bedtime line",
    deps: "Dependency check",
    depsHint: "Detection only. Missing optional dependencies keep their features unavailable.",
    runDeps: "Run checks",
    available: "Available",
    notDetected: "Not detected",
    optional: "Optional",
    nodePath: "Node path (automatic when empty)",
    pythonPath: "Python path (optional)",
    theme: "Appearance",
    system: "System",
    light: "Light",
    dark: "Dark",
    language: "Language",
    refresh: "Refresh",
    loading: "Opening\u2026",
    retry: "Reload",
    overflow: "Over the 4000 limit. Shorten it before saving; your current text stays in the editor.",
    unsaved: "Unsaved changes",
    invalidNumber: "Enter a valid number",
    operationDone: "Operation completed",
    depsSaved: "Runtime settings saved",
    noHost: "Open the character conversation in DSH",
    taskError: "The operation failed. Read the message and try again.",
    runtime: "Runtime",
    configError: "Could not read settings",
    errorLog: "Recent issues",
    schedule: "Proactive tasks",
    scheduleHint: "Only explicitly enabled tasks wake the character. Task files live in the dedicated schedules directory.",
    scheduleEnable: "Enable configured schedules",
    media: "Optional media",
    mediaEnable: "Enable stickers and voice",
    mediaHint: "Upload your own images or audio. Thumbnails need Python/Pillow.",
    editSchedules: "Edit task files",
    scheduleFile: "Task file name",
    scheduleDocument: "Task configuration JSON",
    newSchedule: "New daily task",
    saveSchedule: "Save task file",
    loadSchedules: "Load task files",
    mediaLibrary: "Media library",
    loadMedia: "Load media library",
    uploadMedia: "Upload media",
    removeMedia: "Remove",
    noMedia: "No media files yet.",
    uploadHint: "PNG, JPEG, GIF, WebP, MP3, OGG, WAV and M4A, up to 8 MiB per file.",
    scheduleSaved: "Task file saved",
    mediaSaved: "Media saved",
    mediaRemoved: "Media removed",
    noSchedules: "No task files yet. Create a daily task, then review its content and target.",
    selectFile: "Choose a file"
  }
};
var writingIds = ["diary", "private", "journal", "memory", "impression", "notes", "bedtime"];

// ui/styles.css
var styles_default = ".dsc{--paper:#f6f8fb;--surface:#fff;--ink:#22354b;--muted:#66798e;--line:#dbe3ed;--accent:#315f92;--accentSoft:#e8eff8;--danger:#ac3541;--good:#2f745d;--input:#fff;color:var(--ink);background:var(--paper);font-family:'Segoe UI','Microsoft YaHei',sans-serif;line-height:1.55;padding:28px 30px 40px;border-radius:12px;max-width:1150px;margin:auto;box-sizing:border-box;font-size:14px;color-scheme:light}\n.dsc[data-theme=dark]{--paper:#172333;--surface:#1d2d40;--ink:#e4edf7;--muted:#a7b7cb;--line:#34485e;--accent:#a3c7f1;--accentSoft:#293f58;--danger:#ffa7ad;--good:#8bd0b2;--input:#1a293b;color-scheme:dark}\n.dsc *{box-sizing:border-box}.dsc button,.dsc input,.dsc select,.dsc textarea{font:inherit}.dsc button,.dsc select{cursor:pointer}.dsc button{border:1px solid var(--line);border-radius:6px;padding:7px 12px;color:var(--ink);background:var(--surface);line-height:1.4}.dsc button:hover:not(:disabled){border-color:var(--accent);background:var(--accentSoft)}.dsc button:disabled{opacity:.5;cursor:default}.dsc :focus-visible{outline:2px solid var(--accent);outline-offset:3px}.dsc button.primary{background:var(--accent);border-color:var(--accent);color:var(--surface)}.dsc[data-theme=dark] button.primary{color:#172333}.dsc h1,.dsc h2,.dsc h3,.dsc p{margin:0}.dsc h1{font-size:29px;letter-spacing:-.7px;line-height:1.2;font-weight:650}.dsc h2{font-size:19px;letter-spacing:-.35px;font-weight:620}.dsc h3{font-size:16px;font-weight:650}.dsc-header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:25px}.dsc-subtitle{margin-top:8px!important;color:var(--muted);font-size:13px}.dsc-header-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.dsc-header-controls select{border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:5px;border-radius:5px;font-size:12px}.dsc-intro{padding:14px 17px;border-left:3px solid var(--accent);background:var(--accentSoft);margin-bottom:22px}.dsc-intro strong{font-size:14px}.dsc-intro p{font-size:13px;margin-top:3px;color:var(--muted)}.dsc-section{margin-top:30px}.dsc-section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:13px}.dsc-hint{font-size:12px;color:var(--muted);line-height:1.65}.dsc-section-head .dsc-hint{margin-top:4px}.dsc-persona{background:var(--surface);border:1px solid var(--line);border-radius:9px;padding:21px}.dsc-persona-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 18px;margin-bottom:16px}.dsc label.field{display:flex;flex-direction:column;gap:5px;min-width:0;font-size:12px;font-weight:550}.dsc input:not([type=checkbox]),.dsc select,.dsc textarea{border:1px solid var(--line);border-radius:5px;background:var(--input);color:var(--ink);padding:7px 9px;width:100%;min-width:0}.dsc input:not([type=checkbox]){height:35px}.dsc input::placeholder,.dsc textarea::placeholder{color:var(--muted);opacity:.8}.dsc textarea{resize:vertical;line-height:1.65}.dsc textarea.persona-text{height:240px;min-height:150px;font-family:'Segoe UI','Microsoft YaHei',sans-serif;font-weight:400;font-size:13px}.dsc-label-row{display:flex;justify-content:space-between;gap:12px;align-items:center;font-size:12px;margin-bottom:6px}.dsc-count{color:var(--muted);font-variant-numeric:tabular-nums}.dsc-overflow{color:var(--danger)}.dsc-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px}.dsc-toolbar .small{padding:5px 9px;font-size:12px}.dsc-message{color:var(--good);font-size:12px;margin-top:8px;white-space:pre-wrap;overflow-wrap:anywhere}.dsc-error{color:var(--danger);font-size:12px;padding:10px 12px;border:1px solid var(--danger);border-radius:6px;margin:10px 0;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--surface)}.dsc-note{font-size:12px;color:var(--muted);margin-top:8px!important}.dsc-pair{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:15px}.dsc-channel{background:var(--surface);border:1px solid var(--line);border-radius:9px;padding:18px;min-width:0;display:flex;flex-direction:column}.dsc-channel-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}.dsc-status{font-size:11px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;font-weight:500}.dsc-status:before{content:'';width:7px;height:7px;border-radius:50%;background:#92a0af}.dsc-status[data-state=online]:before{background:var(--good)}.dsc-status[data-state=error]:before,.dsc-status[data-state=expired]:before{background:var(--danger)}.dsc-status[data-state=checking]:before{background:var(--accent)}.dsc-status-lines{font-size:11px;color:var(--muted);margin-top:10px;line-height:1.8}.dsc-status-detail{margin-top:7px!important;font-size:12px;color:var(--muted);overflow-wrap:anywhere}.dsc-check{display:flex;align-items:center;gap:7px;font-size:12px;margin:15px 0 11px}.dsc-check input{accent-color:var(--accent)}.dsc-card-fields{display:grid;grid-template-columns:1fr;gap:10px}.dsc-card-fields .short-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}.dsc-credentials{border-top:1px solid var(--line);margin-top:16px;padding-top:12px}.dsc-credentials summary{font-size:12px;font-weight:600;cursor:pointer}.dsc-credentials .dsc-hint{margin:6px 0 9px}.dsc-credentials .field{margin-top:9px}.dsc-credential-label{display:flex;justify-content:space-between;gap:8px}.dsc-credential-label small{font-weight:400;color:var(--muted)}.dsc-card-actions{margin-top:auto;padding-top:15px}.dsc-action-row{display:flex;gap:7px;flex-wrap:wrap}.dsc-action-row button{font-size:12px;padding:6px 10px}.dsc-output{white-space:pre-wrap;overflow:auto;max-height:240px;font-size:11px;background:var(--paper);border:1px solid var(--line);border-radius:5px;padding:9px;overflow-wrap:anywhere;margin-top:10px}.dsc-writing{background:var(--surface);border:1px solid var(--line);border-radius:9px;overflow:hidden}.dsc-tabs{display:flex;gap:2px;overflow-x:auto;border-bottom:1px solid var(--line);padding:8px 10px 0}.dsc-tabs button{border:0;background:transparent;border-radius:0;padding:8px 11px;white-space:nowrap;font-size:12px;border-bottom:2px solid transparent}.dsc-tabs button[aria-selected=true]{border-bottom-color:var(--accent);color:var(--accent);font-weight:650}.dsc-writing-body{padding:21px;min-height:170px}.dsc-writing-meta{font-size:11px;color:var(--muted);margin-bottom:10px}.dsc-writing-text{white-space:pre-wrap;overflow-wrap:anywhere;font-family:'Segoe UI','Microsoft YaHei',sans-serif;font-size:13px;line-height:1.85;margin:0;max-width:75ch}.dsc-empty{color:var(--muted);font-size:13px;padding:20px 0}.dsc-footer-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.dsc-runtime{border-top:1px solid var(--line);padding-top:17px}.dsc-runtime .field{margin-top:10px}.dsc-deps{list-style:none;margin:10px 0 0;padding:0}.dsc-deps li{display:flex;justify-content:space-between;gap:10px;font-size:12px;padding:7px 0;border-bottom:1px solid var(--line)}.dsc-deps span{overflow-wrap:anywhere;max-width:65%;text-align:right;color:var(--muted)}.dsc-conversation{border-top:1px solid var(--line);padding-top:13px;margin-top:16px}.dsc-conversation summary{cursor:pointer;font-size:12px}.dsc-conversation textarea{margin-top:9px;min-height:70px}.dsc-chat-log{max-height:230px;overflow:auto;margin-top:10px}.dsc-chat-line{padding:8px 0;font-size:13px;white-space:pre-wrap;overflow-wrap:anywhere}.dsc-chat-line.user{color:var(--muted)}.dsc-version{color:var(--muted);font-size:11px;margin-top:24px;text-align:right}.dsc-busy{display:inline-block;color:var(--muted);font-size:12px}.dsc-loading{padding:25px;color:var(--muted)}\n@media(max-width:700px){.dsc{padding:19px 15px 28px}.dsc-header{flex-direction:column;gap:14px}.dsc-header-controls{justify-content:flex-start}.dsc-pair,.dsc-footer-grid{grid-template-columns:1fr}.dsc-persona-grid{grid-template-columns:1fr}.dsc-persona{padding:16px}.dsc h1{font-size:26px}.dsc-section{margin-top:23px}.dsc-tabs{padding-left:4px}.dsc-tabs button{padding:8px 9px}.dsc-writing-body{padding:16px}}\n.dsc-schedule-editor{margin-top:14px}.dsc-schedule-editor summary{cursor:pointer;font-size:12px;font-weight:600}.dsc-schedule-editor textarea{margin-top:9px;min-height:230px;font-family:Consolas,monospace;font-size:12px}.dsc-schedule-files{display:flex;flex-wrap:wrap;gap:5px;margin:10px 0}.dsc-schedule-files button{font-size:11px;padding:4px 7px}.dsc-media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:15px}.dsc-media-item{border:1px solid var(--line);padding:9px;border-radius:6px;background:var(--surface);min-width:0}.dsc-media-item img{width:100%;height:110px;object-fit:contain;background:var(--paper)}.dsc-media-item audio{width:100%;height:35px}.dsc-media-name{font-size:11px;overflow-wrap:anywhere;margin:7px 0!important}.dsc-media-item button{font-size:11px;padding:4px 7px}.dsc-media-file{max-width:350px;font-size:12px}.dsc-media-file input{padding:5px!important;height:auto!important}\n.dsc-advanced{border-top:1px solid var(--line);margin-top:18px;padding-top:12px}.dsc-advanced>summary{cursor:pointer;color:var(--muted);font-size:12px}.dsc-advanced[open]>summary{margin-bottom:14px;color:var(--ink)}.dsc-setup{margin-top:18px}.dsc-start{min-height:40px}.dsc-guide-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:9px}.dsc-guide-head h4{margin:0;font-size:15px;line-height:1.5}.dsc-guide-head button{font-size:11px;padding:3px 7px}.dsc-guide-copy{font-size:13px;line-height:1.75;color:var(--ink)}.dsc-setup .field{margin-top:13px}.dsc-setup .dsc-check{align-items:flex-start;margin:13px 0;line-height:1.65}.dsc-setup .dsc-check input{margin-top:4px;flex-shrink:0}.dsc a{color:var(--accent);text-underline-offset:3px}.dsc-setup-progress{margin-top:14px;font-size:12px;color:var(--muted)}.dsc-setup-progress progress{width:calc(100% - 45px);height:9px;margin:10px 8px 7px 0;accent-color:var(--accent)}.dsc-qr{margin:18px 0;text-align:center}.dsc-qr img{display:block;margin:0 auto 10px;max-width:100%;height:auto;background:#fff;padding:6px}.dsc-qr figcaption{font-size:13px}.dsc-join{margin-top:14px;font-size:12px;display:flex;flex-wrap:wrap;align-items:center;gap:8px}.dsc-join p{width:100%;color:var(--muted)}.dsc-join strong{font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.dsc-main-actions{margin-top:16px}.dsc-channel:has(.dsc-advanced:not([open])){justify-content:flex-start}.dsc ::selection{background:var(--accentSoft);color:var(--ink)}.dsc input,.dsc textarea{caret-color:var(--accent)}\n.dsc-identity-advanced{grid-column:1/-1;margin:0;padding:0;border:0}.dsc-runtime-advanced{margin-top:12px}\n.dsc-world-source{margin:16px 0 0;padding:0;border:0;min-width:0}.dsc-world-source legend{font-size:13px;font-weight:600}.dsc input[type=radio]{width:16px;height:16px;padding:0;flex-shrink:0;accent-color:var(--accent)}.dsc-warning,.dsc-manual{font-size:12px;line-height:1.7;border-left:3px solid var(--accent);background:var(--accentSoft);padding:10px 12px;margin:12px 0;overflow-wrap:anywhere}.dsc-trust{font-size:12px;margin-top:12px!important;overflow-wrap:anywhere}.dsc-trust strong{font-variant-numeric:tabular-nums}.dsc-checks{font-size:12px;padding-left:18px;white-space:pre-wrap}.dsc-checks [data-ok=false]{color:var(--danger)}.dsc-host-model{border-top:1px solid var(--line);margin-top:16px;padding-top:12px;font-size:12px}.dsc-host-model button{margin-left:10px}\n.dsc-life-setting { margin-bottom: 1.5rem; }\n.dsc-life-setting .dsc-note { margin-top: .35rem; }\n";

// ui/setup.jsx
var import_react = __toESM(require("react"), 1);
var copy = {
  zh: {
    mcStart: "\u5F00\u59CB\u4E00\u8D77\u73A9",
    qqStart: "\u8FDE\u63A5 QQ",
    biliStart: "\u626B\u7801\u8FDE\u63A5 B\u7AD9",
    xhhStart: "\u67E5\u770B\u63A5\u5165\u65B9\u5F0F",
    guide: "\u8FDE\u63A5\u5411\u5BFC",
    mcTitle: "\u4E00\u8D77\u8FDB\u5165\u4E16\u754C",
    mcIntro: "\u4F60\u5DF2\u7ECF\u6709\u4E16\u754C\u4E86\u5417\uFF1F\u9009\u62E9\u9002\u5408\u4F60\u7684\u65B9\u5F0F\u3002",
    managed: "\u6CA1\u6709\uFF0C\u5E2E\u6211\u51C6\u5907\u4E00\u4E2A\uFF08\u63A8\u8350\uFF09",
    lan: "\u6211\u81EA\u5DF1\u5F00\u4E00\u4E2A\uFF0C\u5BF9\u5C40\u57DF\u7F51\u5F00\u653E",
    existing: "\u6211\u5DF2\u7ECF\u6709\u670D\u52A1\u7AEF\u76EE\u5F55",
    version: "\u4F60\u9009\u62E9\u7684\u7248\u672C",
    supported: "\u8EAB\u4F53\u652F\u6301\uFF0C\u53EF\u4EE5\u4E00\u8D77\u73A9",
    serverOnly: "\u53EA\u53EF\u5EFA\u4E16\u754C\uFF0C\u8EAB\u4F53\u6682\u4E0D\u652F\u6301",
    unavailable: "\u4E0D\u53EF\u9009",
    versionsLoading: "\u6B63\u5728\u8BFB\u53D6\u5B98\u65B9\u7248\u672C\u6E05\u5355\u2026",
    mcVersion: "\u51C6\u5907\u4F60\u9009\u62E9\u7684\u7248\u672C\uFF0C\u4E0B\u8F7D\u548C\u9996\u6B21\u5F00\u4E16\u754C\u53EF\u80FD\u9700\u8981\u51E0\u5206\u949F\u3002\u6362\u7248\u672C\u5C06\u65B0\u5EFA\u4E16\u754C\uFF0C\u65E7\u4E16\u754C\u4FDD\u7559\u5728\u539F\u76EE\u5F55\u3002",
    serverOnlyConfirm: "\u6211\u77E5\u9053\u8BE5\u7248\u672C\u8EAB\u4F53\u6682\u4E0D\u652F\u6301\uFF0C\u53EA\u521B\u5EFA\u4E16\u754C",
    lanHelp: "\u5148\u5728\u6E38\u620F\u91CC\uFF1A\u8FDB\u5165\u5355\u4EBA\u4E16\u754C \u2192 Esc \u2192 \u5BF9\u5C40\u57DF\u7F51\u5F00\u653E \u2192 \u518D\u56DE\u6765\u70B9\u91CD\u8BD5\u3002",
    modWarning: "\u88C5\u4E86\u6A21\u7EC4\u7684\u5BA2\u6237\u7AEF\uFF0C\u5979\u7684\u8EAB\u4F53\u53EF\u80FD\u56E0\u6CE8\u518C\u8868\u4E0D\u4E00\u81F4\u88AB\u8E22\uFF1B\u5EFA\u8BAE\u7528\u539F\u7248\u5BA2\u6237\u7AEF\u3002",
    findLan: "\u67E5\u627E\u5E76\u8FDB\u5165\u4E16\u754C",
    directory: "\u5DF2\u6709\u670D\u52A1\u7AEF\u76EE\u5F55",
    java: "Java \u8DEF\u5F84\uFF08\u7559\u7A7A\u81EA\u52A8\u68C0\u6D4B\uFF09",
    inspect: "\u68C0\u67E5\u5E76\u8FDB\u5165\u4E16\u754C",
    "discovering-lan": "\u6B63\u5728\u67E5\u627E\u5C40\u57DF\u7F51\u4E16\u754C\uFF08\u6700\u591A 4 \u79D2\uFF09\u2026",
    "checking-existing": "\u6B63\u5728\u9010\u9879\u68C0\u67E5\u5DF2\u6709\u670D\u52A1\u7AEF\u2026",
    "server-only-ready": "\u4E16\u754C\u5DF2\u5F00\u542F\uFF1B\u8BE5\u7248\u672C\u8EAB\u4F53\u6682\u4E0D\u652F\u6301\u3002",
    manual: "\u8BF7\u81EA\u884C\u5B89\u88C5 NapCat\uFF0C\u7136\u540E\u5728\u4E0B\u65B9\u9AD8\u7EA7\u8BBE\u7F6E\u586B\u5199\u8FDE\u63A5\u5730\u5740\u3002",
    manualLink: "\u6253\u5F00 NapCat \u624B\u52A8\u5B89\u88C5\u8BF4\u660E",
    trust: "\u5B89\u88C5\u52A9\u624B\u7248\u672C / SHA-256 \u524D 8 \u4F4D",
    portableConsent: "\u5C06\u8FD0\u884C NapCat \u4FBF\u643A\u7248\uFF08\u975E\u5B98\u65B9 QQ \u5BA2\u6237\u7AEF\uFF09",
    portablePrepare: "\u51C6\u5907\u5E76\u542F\u52A8 QQ \u8FDE\u63A5",
    portableScan: "\u53EA\u9700\u7528\u89D2\u8272 QQ \u626B\u7801\uFF0C\u5E76\u5728\u624B\u673A\u4E0A\u786E\u8BA4\u767B\u5F55\u3002\u63D2\u4EF6\u4F1A\u81EA\u52A8\u68C0\u67E5\u8FDE\u63A5\u3002",
    portableQr: "QQ \u767B\u5F55\u4E8C\u7EF4\u7801",
    resumeQQ: "\u91CD\u65B0\u542F\u52A8 QQ \u8FDE\u63A5",
    "reconnect-required": "\u8FDE\u63A5\u52A9\u624B\u5DF2\u505C\u6B62\u3002\u786E\u8BA4\u4E0B\u65B9\u7248\u672C\u540E\uFF0C\u53EF\u91CD\u65B0\u542F\u52A8\uFF1B\u5DF2\u6709\u767B\u5F55\u6001\u4F1A\u4FDD\u7559\u3002",
    paperPending: "Paper \u81EA\u5B9A\u4E49\u76AE\u80A4\u5F85\u5B8C\u6210\u5B9E\u673A\u9A8C\u6536\uFF0C\u6682\u4E0D\u53EF\u9009\u3002\u5DF2\u6709\u4E16\u754C\u4F1A\u4FDD\u7559\u3002",
    vanillaFallback: "\u6539\u7528\u539F\u7248\u91CD\u65B0\u51C6\u5907",
    "extracting-portable": "\u6B63\u5728\u89E3\u538B\u5E76\u6821\u9A8C NapCat \u4FBF\u643A\u7248\u2026",
    "starting-portable": "\u6B63\u5728\u542F\u52A8\u4FBF\u643A\u7248\u5E76\u83B7\u53D6\u767B\u5F55\u4E8C\u7EF4\u7801\u2026",
    unsigned: "\u5F53\u524D\u5B89\u88C5\u52A9\u624B\u6CA1\u6709\u53EF\u9A8C\u8BC1\u7684\u53D1\u5E03\u8005\u7B7E\u540D\uFF0C\u5DF2\u5173\u95ED\u81EA\u52A8\u6267\u884C\u3002\u8BF7\u6309\u624B\u52A8\u8BF4\u660E\u5B89\u88C5\u3002",
    execution: "\u6211\u5DF2\u6838\u5BF9\u663E\u793A\u7684\u7248\u672C\u53F7\u4E0E\u54C8\u5E0C\uFF0C\u786E\u8BA4\u6267\u884C",
    "manual-required": "\u81EA\u52A8\u5B89\u88C5\u5DF2\u505C\u6B62\uFF0C\u8BF7\u6309\u624B\u52A8\u8BF4\u660E\u7EE7\u7EED\u3002",
    consent: "\u5141\u8BB8\u4ECE\u5B98\u65B9\u6765\u6E90\u4E0B\u8F7D\u6240\u9700\u7EC4\u4EF6",
    eula: "\u6211\u5DF2\u9605\u8BFB\u5E76\u540C\u610F Minecraft \u4F7F\u7528\u534F\u8BAE",
    prepare: "\u51C6\u5907\u5E76\u5F00\u542F\u4E16\u754C",
    serverType: "\u670D\u52A1\u7AEF\u7C7B\u578B",
    vanilla: "\u539F\u7248\uFF08\u6700\u5FEB\uFF0C\u65E0\u76AE\u80A4\uFF09",
    paper: "Paper\uFF08\u652F\u6301\u81EA\u5B9A\u4E49\u76AE\u80A4\uFF09",
    skin: "\u4E3A\u89D2\u8272\u8BBE\u7F6E\u76AE\u80A4",
    skinUrl: "\u76AE\u80A4\u56FE\u7247\u7684 https \u5730\u5740",
    skinApply: "\u5E94\u7528\u76AE\u80A4",
    skinNote: "\u5148\u5F00\u542F\u4E16\u754C\u5E76\u8BA9\u89D2\u8272\u8FDB\u5165\uFF0C\u518D\u586B\u5199 PNG \u56FE\u7247\u76F4\u94FE\u3002\u65E0\u9700\u5173\u95ED\u4E16\u754C\uFF0C\u6536\u5230\u6210\u529F\u56DE\u6267\u540E\u4F1A\u66F4\u65B0\u3002",
    skinDone: "\u76AE\u80A4\u5DF2\u5E94\u7528",
    paperVersions: "\u81EA\u5B9A\u4E49\u76AE\u80A4\u76EE\u524D\u652F\u6301\u7684\u6E38\u620F\u7248\u672C\uFF1A",
    qqTitle: "\u8BA9\u89D2\u8272\u6765\u5230 QQ",
    qqIntro: "\u4E3A\u89D2\u8272\u4F7F\u7528\u4E00\u4E2A\u72EC\u7ACB QQ \u8D26\u53F7\u3002\u6309\u8FD9\u91CC\u63D0\u793A\u7684\u65B9\u5F0F\u51C6\u5907\u8FDE\u63A5\uFF0C\u5E76\u7528\u624B\u673A\u626B\u7801\u786E\u8BA4\u767B\u5F55\u3002",
    owner: "\u4F60\u7684 QQ \u53F7",
    self: "\u89D2\u8272\u4F7F\u7528\u7684 QQ \u53F7",
    different: "\u8BF7\u4F7F\u7528\u4E24\u4E2A\u4E0D\u540C\u7684 QQ \u8D26\u53F7\u3002\u79C1\u804A\u53EA\u63A5\u6536\u4F60\u7684\u8D26\u53F7\uFF1B\u7FA4\u804A\u53EF\u7A0D\u540E\u8BBE\u7F6E\u3002",
    qqPrepare: "\u4E0B\u8F7D\u8FDE\u63A5\u52A9\u624B",
    openHelper: "\u6253\u5F00\u5B89\u88C5\u52A9\u624B",
    helperInstall: "\u5728\u6253\u5F00\u7684\u52A9\u624B\u4E2D\u5B8C\u6210\u5B89\u88C5\uFF0C\u7136\u540E\u56DE\u5230\u8FD9\u91CC\u7EE7\u7EED\u3002",
    launchHelper: "\u5B89\u88C5\u597D\u4E86\uFF0C\u7EE7\u7EED\u767B\u5F55",
    helperLogin: "\u5728\u8FDE\u63A5\u52A9\u624B\u7A97\u53E3\u4E2D\u626B\u7801\u767B\u5F55\u89D2\u8272 QQ\u3002\u5B8C\u6210\u540E\u68C0\u67E5\u8FDE\u63A5\u3002",
    check: "\u6211\u5DF2\u767B\u5F55\uFF0C\u68C0\u67E5\u8FDE\u63A5",
    biliTitle: "\u7528 B\u7AD9 App \u626B\u7801",
    biliIntro: "\u8BF7\u4F7F\u7528\u4F60\u5E0C\u671B\u89D2\u8272\u4F7F\u7528\u7684\u8D26\u53F7\u626B\u7801\uFF0C\u5E76\u5728\u624B\u673A\u4E0A\u786E\u8BA4\u3002\u767B\u5F55\u6210\u529F\u540E\u4F1A\u81EA\u52A8\u4FDD\u5B58\u3002",
    scan: "\u7B49\u5F85\u626B\u7801",
    confirm: "\u8BF7\u5728\u624B\u673A\u4E0A\u786E\u8BA4\u767B\u5F55",
    expired: "\u4E8C\u7EF4\u7801\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u83B7\u53D6\u3002",
    newCode: "\u91CD\u65B0\u83B7\u53D6\u4E8C\u7EF4\u7801",
    complete: "\u5DF2\u51C6\u5907\u597D\uFF0C\u53EF\u4EE5\u5F00\u59CB\u4F7F\u7528\u4E86\u3002",
    connected: "\u8D26\u53F7\u5DF2\u8FDE\u63A5\u3002",
    address: "\u5728 Minecraft \u591A\u4EBA\u6E38\u620F\u4E2D\u6DFB\u52A0\u8FD9\u4E2A\u5730\u5740",
    copy: "\u590D\u5236\u5730\u5740",
    copied: "\u5730\u5740\u5DF2\u590D\u5236",
    xhhTitle: "\u5C0F\u9ED1\u76D2\u9700\u8981\u989D\u5916\u5DE5\u5177",
    xhhIntro: "\u5F53\u524D\u7248\u672C\u8FD8\u6CA1\u6709\u9002\u5408\u65B0\u624B\u7684\u4E00\u952E\u767B\u5F55\u3002\u9700\u8981\u5DF2\u6709\u7684\u517C\u5BB9\u5DE5\u5177\uFF0C\u624D\u80FD\u5728\u9AD8\u7EA7\u8BBE\u7F6E\u4E2D\u63A5\u5165\u3002\u5176\u4ED6\u529F\u80FD\u53EF\u4EE5\u7167\u5E38\u4F7F\u7528\u3002",
    xhhDetail: "\u5DF2\u6709\u5DE5\u5177\u7684\u7528\u6237\u53EF\u5728\u9AD8\u7EA7\u8BBE\u7F6E\u4E2D\u586B\u5199\u5DE5\u5177\u4F4D\u7F6E\u5E76\u6D4B\u8BD5\u8FDE\u63A5\u3002\u63D2\u4EF6\u4E0D\u63D0\u4F9B\u5C0F\u9ED1\u76D2\u7B7E\u540D\u5B9E\u73B0\u3002",
    retry: "\u91CD\u65B0\u51C6\u5907",
    cancel: "\u53D6\u6D88\u51C6\u5907",
    close: "\u6536\u8D77",
    preparing: "\u6B63\u5728\u68C0\u67E5\u51C6\u5907\u6761\u4EF6\u2026",
    "downloading-java": "\u6B63\u5728\u4E0B\u8F7D\u8FD0\u884C\u73AF\u5883\u2026",
    "extracting-java": "\u6B63\u5728\u51C6\u5907\u8FD0\u884C\u73AF\u5883\u2026",
    "downloading-world": "\u6B63\u5728\u4E0B\u8F7D\u4E16\u754C\u7EC4\u4EF6\u2026",
    "preparing-world": "\u6B63\u5728\u521B\u5EFA\u4F60\u7684\u72EC\u7ACB\u4E16\u754C\u2026",
    "starting-world": "\u6B63\u5728\u5F00\u542F\u4E16\u754C\uFF0C\u7B49\u5F85\u89D2\u8272\u8FDB\u5165\u2026",
    "downloading-helper": "\u6B63\u5728\u4E0B\u8F7D QQ \u8FDE\u63A5\u52A9\u624B\u2026",
    "helper-ready": "\u8FDE\u63A5\u52A9\u624B\u5DF2\u4E0B\u8F7D\u3002",
    "install-helper": "\u7B49\u5F85\u4F60\u5B8C\u6210\u52A9\u624B\u5B89\u88C5\u3002",
    "waiting-login": "\u7B49\u5F85\u89D2\u8272\u767B\u5F55 QQ\u3002",
    error: "\u51C6\u5907\u672A\u5B8C\u6210\uFF0C\u53EF\u4EE5\u91CD\u8BD5\u3002",
    cancelled: "\u5DF2\u53D6\u6D88\u51C6\u5907\u3002",
    interrupted: "\u4E0A\u6B21\u51C6\u5907\u5DF2\u4E2D\u65AD\uFF0C\u53EF\u4EE5\u91CD\u65B0\u5F00\u59CB\u3002",
    qrAlt: "B\u7AD9\u767B\u5F55\u4E8C\u7EF4\u7801",
    fetching: "\u6B63\u5728\u83B7\u53D6\u767B\u5F55\u4E8C\u7EF4\u7801\u2026",
    notConnected: "\u8FD8\u6CA1\u6709\u8FDE\u4E0A\u3002\u8BF7\u786E\u8BA4\u52A9\u624B\u4E2D\u7684\u89D2\u8272 QQ \u5DF2\u767B\u5F55\uFF0C\u518D\u91CD\u8BD5\u3002"
  },
  en: {
    mcStart: "Play together",
    qqStart: "Connect QQ",
    biliStart: "Connect Bilibili",
    xhhStart: "Connection requirements",
    guide: "Connection guide",
    mcTitle: "Enter a world together",
    mcIntro: "Do you already have a world? Choose how to connect.",
    managed: "Prepare a new world (recommended)",
    lan: "Open my singleplayer world to LAN",
    existing: "Use an existing server folder",
    version: "Your selected version",
    supported: "Character supported",
    serverOnly: "World only; character unsupported",
    unavailable: "Unavailable",
    versionsLoading: "Loading official versions\u2026",
    mcVersion: "Prepare your selected version. Initial setup may take a few minutes. Changing versions creates a separate world; the old world stays in its original folder.",
    serverOnlyConfirm: "I understand the character cannot join this version",
    lanHelp: "In Minecraft: enter a singleplayer world \u2192 Esc \u2192 Open to LAN \u2192 return here and retry.",
    modWarning: "Modded clients may kick the character due to registry differences. A vanilla client is recommended.",
    findLan: "Find and join world",
    directory: "Existing server folder",
    java: "Java path (optional; auto-detect)",
    inspect: "Check and enter world",
    "discovering-lan": "Discovering LAN worlds (up to 4 seconds)\u2026",
    "checking-existing": "Checking the existing server\u2026",
    "server-only-ready": "World is open; this version cannot host the character yet.",
    manual: "Install NapCat yourself, then enter its connection address in advanced settings below.",
    manualLink: "NapCat manual installation guide",
    trust: "Installer version / first 8 SHA-256 characters",
    portableConsent: "Run NapCat portable (an unofficial QQ client)",
    portablePrepare: "Prepare and start QQ connection",
    portableScan: "Scan using the character QQ and confirm on your phone. The connection is checked automatically.",
    portableQr: "QQ login QR code",
    resumeQQ: "Restart QQ connection",
    "reconnect-required": "The portable helper stopped. Confirm the version below to restart it. Saved login data is retained.",
    paperPending: "Paper skins are awaiting in-game acceptance and are unavailable. Existing worlds are retained.",
    vanillaFallback: "Prepare with vanilla instead",
    "extracting-portable": "Extracting and verifying NapCat portable\u2026",
    "starting-portable": "Starting portable runtime and requesting a login code\u2026",
    unsigned: "This installer has no verified publisher signature. Automatic execution is disabled. Please use the manual guide.",
    execution: "I checked the displayed version and hash and confirm execution",
    "manual-required": "Automatic installation stopped. Please follow the manual guide.",
    consent: "Allow required components to download from official sources",
    eula: "I have read and accept the Minecraft usage agreement",
    prepare: "Prepare and open world",
    serverType: "Server type",
    vanilla: "Vanilla (fastest, no skins)",
    paper: "Paper (supports custom skins)",
    skin: "Set the character skin",
    skinUrl: "Skin image https URL",
    skinApply: "Apply skin",
    skinNote: "Open the world and let the character join, then paste a direct PNG URL. Keep the world open; success appears after the server confirms it.",
    skinDone: "Skin applied",
    paperVersions: "Game versions verified for custom skins:",
    qqTitle: "Bring your character to QQ",
    qqIntro: "Use a separate QQ account for the character. Follow the preparation steps here and confirm login on your phone.",
    owner: "Your QQ number",
    self: "Character QQ number",
    different: "Use two different accounts. Only your private messages are accepted; groups can be set up later.",
    qqPrepare: "Download connection helper",
    openHelper: "Open installer",
    helperInstall: "Finish installation in the helper window, then return here.",
    launchHelper: "Installed, continue to login",
    helperLogin: "Scan the code in the helper window to log in the character, then check the connection.",
    check: "Logged in, check connection",
    biliTitle: "Scan with the Bilibili app",
    biliIntro: "Use the account you want the character to use and confirm on your phone. The confirmed login is saved automatically.",
    scan: "Waiting for scan",
    confirm: "Confirm login on your phone",
    expired: "This code expired. Request a new one.",
    newCode: "Get a new code",
    complete: "Ready to use.",
    connected: "Account connected.",
    address: "Add this address in Minecraft multiplayer",
    copy: "Copy address",
    copied: "Address copied",
    xhhTitle: "Heybox needs an additional tool",
    xhhIntro: "A beginner login flow is not available yet. A compatible external tool is required in advanced settings. Other features work independently.",
    xhhDetail: "If you already have a compatible tool, set its location in advanced settings. No Heybox signing implementation is provided.",
    retry: "Try setup again",
    cancel: "Cancel setup",
    close: "Close guide",
    preparing: "Checking requirements\u2026",
    "downloading-java": "Downloading the runtime\u2026",
    "extracting-java": "Preparing the runtime\u2026",
    "downloading-world": "Downloading world components\u2026",
    "preparing-world": "Creating your separate world\u2026",
    "starting-world": "Opening the world and connecting the character\u2026",
    "downloading-helper": "Downloading the QQ helper\u2026",
    "helper-ready": "Connection helper downloaded.",
    "install-helper": "Waiting for helper installation.",
    "waiting-login": "Waiting for character login.",
    error: "Setup did not finish. You can retry.",
    cancelled: "Setup cancelled.",
    interrupted: "The previous setup was interrupted. You can restart it.",
    qrAlt: "Bilibili login QR code",
    fetching: "Getting a login code\u2026",
    notConnected: "Not connected yet. Finish the character login in the helper and retry."
  }
};
var friendly = (message, lang) => lang === "zh" ? String(message).split(" / ").at(-1) : String(message);
function SetupFlow({ id, lang, request: request2, onComplete, ownerId = "", selfId = "", online = false, configured = false, world = {} }) {
  const t = copy[lang] || copy.zh;
  const [open, setOpen] = (0, import_react.useState)(false), [consent, setConsent] = (0, import_react.useState)(false), [eula, setEula] = (0, import_react.useState)(false), [owner, setOwner] = (0, import_react.useState)(ownerId), [self, setSelf] = (0, import_react.useState)(selfId);
  const [state, setState] = (0, import_react.useState)(null), [login, setLogin] = (0, import_react.useState)(null), [busy, setBusy] = (0, import_react.useState)(false), [error, setError] = (0, import_react.useState)(""), [notice, setNotice] = (0, import_react.useState)("");
  const [qqLogin, setQqLogin] = (0, import_react.useState)(null);
  const [source, setSource] = (0, import_react.useState)("managed"), [catalog, setCatalog] = (0, import_react.useState)(null), [version, setVersion] = (0, import_react.useState)(""), [serverOnly, setServerOnly] = (0, import_react.useState)(false), [directory, setDirectory] = (0, import_react.useState)(""), [javaPath, setJavaPath] = (0, import_react.useState)(""), [trust, setTrust] = (0, import_react.useState)(null), [execution, setExecution] = (0, import_react.useState)(false);
  const [serverType, setServerType] = (0, import_react.useState)("vanilla"), [skinUrl, setSkinUrl] = (0, import_react.useState)("");
  const completed = (0, import_react.useRef)(null), mounted = (0, import_react.useRef)(true), completeRef = (0, import_react.useRef)(onComplete);
  completeRef.current = onComplete;
  (0, import_react.useEffect)(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  (0, import_react.useEffect)(() => {
    if (!open) {
      setOwner(ownerId);
      setSelf(selfId);
    }
  }, [ownerId, selfId, open]);
  (0, import_react.useEffect)(() => {
    if (!open && id === "mc") {
      setSource(world.source || "managed");
      setDirectory(world.serverDir || "");
      setJavaPath(world.javaPath || "");
      setServerType(world.serverType || "vanilla");
      if (world.version) setVersion(world.version);
    }
  }, [open, id, world.source, world.serverDir, world.javaPath, world.version, world.serverType]);
  const perform = async (fn) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      if (mounted.current) setError(friendly(e.message, lang));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  (0, import_react.useEffect)(() => {
    if (!open || !["mc", "qq"].includes(id)) return;
    let active = true;
    request2(id === "mc" ? "/setup/mc/versions" : "/setup/qq/trust").then((data) => {
      if (!active) return;
      if (id === "mc") {
        setCatalog(data);
        setVersion((v) => v || data.defaultVersion || "");
      } else setTrust(data);
    }).catch((e) => {
      if (active) setError(friendly(e.message, lang));
    });
    return () => {
      active = false;
    };
  }, [open, id, request2, lang, source]);
  (0, import_react.useEffect)(() => {
    if (!open || !["mc", "qq"].includes(id)) return;
    let active = true;
    const read = async () => {
      if (document.hidden) return;
      try {
        const all = await request2("/setup");
        if (!active) return;
        const next = all[id];
        if (next) {
          setState(next);
          if (["complete", "server-only-ready"].includes(next.phase) && completed.current !== next.id) {
            completed.current = next.id;
            await completeRef.current(id);
          }
        }
      } catch (e) {
        if (active) setError(friendly(e.message, lang));
      }
    };
    read();
    const timer = setInterval(read, 1e3);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [open, id, request2, lang]);
  (0, import_react.useEffect)(() => {
    if (!login?.id || ["complete", "expired"].includes(login.phase)) return;
    let active = true, pending = false;
    const poll = async () => {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const result = await request2("/setup/bili/poll", { id: login.id });
        if (!active) return;
        setLogin((v) => ({ ...v, ...result }));
        if (result.phase === "complete") await completeRef.current("bili");
      } catch (e) {
        if (active) {
          setError(friendly(e.message, lang));
          setLogin((v) => ({ ...v, phase: "expired" }));
        }
      } finally {
        pending = false;
      }
    };
    const timer = setInterval(poll, 2500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [login?.id, login?.phase, request2, lang]);
  const newCode = () => perform(async () => setLogin(await request2("/setup/bili/start", {})));
  (0, import_react.useEffect)(() => {
    if (!open || id !== "qq" || state?.phase !== "waiting-login" || online) return;
    let active = true, pending = false;
    const read = async () => {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const data = await request2("/setup/qq/login");
        if (active) setQqLogin(data);
      } catch (e) {
        if (active) setError(friendly(e.message, lang));
      } finally {
        pending = false;
      }
    };
    read();
    const timer = setInterval(read, 2e3);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [open, id, state?.phase, online, request2, lang]);
  const begin = () => {
    setOpen(true);
    if (id === "bili" && !login) newCode();
  };
  const title = t[`${id}Title`], progress = state?.total > 0 ? Math.min(100, Math.round(state.bytes / state.total * 100)) : null;
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "dsc-setup" }, !open ? /* @__PURE__ */ import_react.default.createElement("button", { className: `${configured ? "" : "primary "}dsc-start`, onClick: begin }, configured ? t.guide : t[`${id}Start`]) : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "dsc-guide-head" }, /* @__PURE__ */ import_react.default.createElement("h4", null, title), /* @__PURE__ */ import_react.default.createElement("button", { className: "small", onClick: () => setOpen(false) }, t.close)), id !== "mc" && /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-guide-copy" }, t[`${id}Intro`]), id === "mc" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("fieldset", { className: "dsc-world-source", disabled: busy || state?.running }, /* @__PURE__ */ import_react.default.createElement("legend", null, t.mcIntro), ["managed", "lan", "existing"].map((item) => /* @__PURE__ */ import_react.default.createElement("label", { className: "dsc-check", key: item }, /* @__PURE__ */ import_react.default.createElement("input", { type: "radio", name: "world-source", value: item, checked: source === item, onChange: () => {
    setSource(item);
    setState(null);
    setError("");
  } }), t[item]))), source === "managed" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("label", { className: "field" }, /* @__PURE__ */ import_react.default.createElement("span", null, t.version), /* @__PURE__ */ import_react.default.createElement("select", { "aria-label": t.version, value: version, onChange: (e) => {
    setVersion(e.target.value);
    setServerOnly(false);
    if (!catalog?.paper?.versions?.includes(e.target.value)) setServerType("vanilla");
  }, disabled: !catalog || busy || state?.running }, !catalog && /* @__PURE__ */ import_react.default.createElement("option", { value: "" }, t.versionsLoading), ["supported", "server-only", "unavailable"].map((group) => /* @__PURE__ */ import_react.default.createElement("optgroup", { key: group, label: t[group === "server-only" ? "serverOnly" : group] }, catalog?.versions.filter((v) => v.state === group).map((v) => /* @__PURE__ */ import_react.default.createElement("option", { key: v.id, value: v.id, disabled: group === "unavailable" }, v.id)))))), /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-note" }, t.mcVersion), /* @__PURE__ */ import_react.default.createElement("label", { className: "field" }, /* @__PURE__ */ import_react.default.createElement("span", null, t.serverType), /* @__PURE__ */ import_react.default.createElement("select", { "aria-label": t.serverType, value: serverType, onChange: (e) => setServerType(e.target.value), disabled: busy || state?.running }, /* @__PURE__ */ import_react.default.createElement("option", { value: "vanilla" }, t.vanilla), /* @__PURE__ */ import_react.default.createElement("option", { value: "paper", disabled: catalog?.paper?.available !== true || !catalog.paper.versions.includes(version) }, t.paper))), catalog?.paper?.available !== true && /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-note" }, t.paperPending), catalog?.paper?.available === true && /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-note" }, t.paperVersions, " ", catalog.paper.versions.join(", ")), catalog?.versions.find((v) => v.id === version)?.state === "server-only" && /* @__PURE__ */ import_react.default.createElement("label", { className: "dsc-check" }, /* @__PURE__ */ import_react.default.createElement("input", { type: "checkbox", checked: serverOnly, onChange: (e) => setServerOnly(e.target.checked) }), t.serverOnlyConfirm)), source === "lan" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-note" }, t.lanHelp), /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-warning" }, t.modWarning)), source === "existing" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("label", { className: "field" }, /* @__PURE__ */ import_react.default.createElement("span", null, t.directory), /* @__PURE__ */ import_react.default.createElement("input", { value: directory, onChange: (e) => setDirectory(e.target.value) })), /* @__PURE__ */ import_react.default.createElement("label", { className: "field" }, /* @__PURE__ */ import_react.default.createElement("span", null, t.java), /* @__PURE__ */ import_react.default.createElement("input", { value: javaPath, onChange: (e) => setJavaPath(e.target.value) }))), !state?.running && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, source === "managed" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("label", { className: "dsc-check" }, /* @__PURE__ */ import_react.default.createElement("input", { type: "checkbox", checked: consent, onChange: (e) => setConsent(e.target.checked) }), t.consent), /* @__PURE__ */ import_react.default.createElement("label", { className: "dsc-check" }, /* @__PURE__ */ import_react.default.createElement("input", { type: "checkbox", checked: eula, onChange: (e) => setEula(e.target.checked) }), /* @__PURE__ */ import_react.default.createElement("span", null, t.eula, " \xB7 ", /* @__PURE__ */ import_react.default.createElement("a", { href: "https://www.minecraft.net/eula", target: "_blank", rel: "noreferrer" }, lang === "zh" ? "\u9605\u8BFB\u534F\u8BAE" : "Read agreement")))), /* @__PURE__ */ import_react.default.createElement("button", { className: "primary", disabled: busy || (source === "managed" ? !version || !consent || !eula || catalog?.versions.find((v) => v.id === version)?.state === "server-only" && !serverOnly : source === "existing" ? !directory.trim() : false), onClick: () => perform(async () => setState(await request2("/setup/mc", source === "managed" ? { source, version, serverType, downloadConsent: consent, eulaAccepted: eula, acknowledgeServerOnly: serverOnly } : source === "lan" ? { source } : { source, directory, javaPath }))) }, source === "managed" ? t.prepare : source === "lan" ? t.findLan : t.inspect)), state?.checks && /* @__PURE__ */ import_react.default.createElement("ul", { className: "dsc-checks" }, state.checks.map((check, i) => /* @__PURE__ */ import_react.default.createElement("li", { key: i, "data-ok": check.ok }, check.ok ? "\u2713" : "\u2715", " ", friendly(check.message, lang)))), ["complete", "server-only-ready"].includes(state?.phase) && state.address && /* @__PURE__ */ import_react.default.createElement("div", { className: "dsc-join" }, /* @__PURE__ */ import_react.default.createElement("p", null, t.address), /* @__PURE__ */ import_react.default.createElement("strong", null, state.address), /* @__PURE__ */ import_react.default.createElement("button", { className: "small", onClick: () => perform(async () => {
    await navigator.clipboard.writeText(state.address);
    setNotice(t.copied);
  }) }, t.copy)), world.serverType === "paper" && catalog?.paper?.available === true && catalog.paper.versions.includes(world.version) && /* @__PURE__ */ import_react.default.createElement("div", { className: "dsc-runtime" }, /* @__PURE__ */ import_react.default.createElement("h4", null, t.skin), /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-note" }, t.skinNote), /* @__PURE__ */ import_react.default.createElement("label", { className: "field" }, /* @__PURE__ */ import_react.default.createElement("span", null, t.skinUrl), /* @__PURE__ */ import_react.default.createElement("input", { type: "url", value: skinUrl, onChange: (e) => setSkinUrl(e.target.value), placeholder: "https://\u2026/skin.png", disabled: busy || state?.running })), /* @__PURE__ */ import_react.default.createElement("div", { className: "dsc-toolbar" }, /* @__PURE__ */ import_react.default.createElement("button", { disabled: busy || state?.running || !skinUrl.trim(), onClick: () => perform(async () => {
    const result = await request2("/setup/skin", { url: skinUrl });
    if (result.ok !== true) throw new Error(result.error || t.error);
    setNotice(t.skinDone);
  }) }, t.skinApply))), (world.serverType === "paper" && catalog?.paper?.available !== true || source === "managed" && state?.phase === "error") && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-note" }, catalog?.paper?.available !== true ? t.paperPending : t.mcVersion), /* @__PURE__ */ import_react.default.createElement("button", { disabled: busy || state?.running || !consent || !eula || !version, onClick: () => perform(async () => {
    setServerType("vanilla");
    setState(await request2("/setup/mc", { source: "managed", version, serverType: "vanilla", downloadConsent: consent, eulaAccepted: eula, acknowledgeServerOnly: serverOnly }));
  }) }, t.vanillaFallback))), id === "qq" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, trust && /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-trust" }, t.trust, /* @__PURE__ */ import_react.default.createElement("br", null), /* @__PURE__ */ import_react.default.createElement("strong", null, trust.version, " \xB7 ", trust.hashPrefix)), (trust?.automaticExecution === false || state?.phase === "manual-required" || error) && /* @__PURE__ */ import_react.default.createElement("div", { className: "dsc-manual" }, /* @__PURE__ */ import_react.default.createElement("p", null, trust?.automaticExecution === false ? t.unsigned : t.manual), /* @__PURE__ */ import_react.default.createElement("a", { href: trust?.manualUrl || "https://napneko.github.io/guide/boot/Shell", target: "_blank", rel: "noreferrer" }, t.manualLink)), trust?.mode === "portable" && !online && !state?.running && ["reconnect-required", "complete", "waiting-login"].includes(state?.phase) && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("label", { className: "dsc-check" }, /* @__PURE__ */ import_react.default.createElement("input", { type: "checkbox", checked: execution, onChange: (e) => setExecution(e.target.checked) }), t.portableConsent), /* @__PURE__ */ import_react.default.createElement("button", { disabled: busy || !execution, onClick: () => perform(async () => {
    setQqLogin(null);
    setState(await request2("/setup/qq/launch", { confirmExecution: execution, version: trust.version, sha256: trust.sha256 }));
  }) }, t.resumeQQ)), trust?.automaticExecution === true && !error && !state?.running && !["helper-ready", "install-helper", "waiting-login", "complete", "manual-required", "reconnect-required"].includes(state?.phase) && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("label", { className: "field" }, /* @__PURE__ */ import_react.default.createElement("span", null, t.owner), /* @__PURE__ */ import_react.default.createElement("input", { inputMode: "numeric", value: owner, onChange: (e) => setOwner(e.target.value), autoComplete: "off" })), /* @__PURE__ */ import_react.default.createElement("label", { className: "field" }, /* @__PURE__ */ import_react.default.createElement("span", null, t.self), /* @__PURE__ */ import_react.default.createElement("input", { inputMode: "numeric", value: self, onChange: (e) => setSelf(e.target.value), autoComplete: "off" })), /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-note" }, t.different), /* @__PURE__ */ import_react.default.createElement("label", { className: "dsc-check" }, /* @__PURE__ */ import_react.default.createElement("input", { type: "checkbox", checked: consent, onChange: (e) => setConsent(e.target.checked) }), t.consent), trust.mode === "portable" && /* @__PURE__ */ import_react.default.createElement("label", { className: "dsc-check" }, /* @__PURE__ */ import_react.default.createElement("input", { type: "checkbox", checked: execution, onChange: (e) => setExecution(e.target.checked) }), t.portableConsent), /* @__PURE__ */ import_react.default.createElement("button", { className: "primary", disabled: !consent || trust.mode === "portable" && !execution || !/^\d{5,12}$/.test(owner) || !/^\d{5,12}$/.test(self) || owner === self || busy, onClick: () => perform(async () => setState(await request2("/setup/qq", { downloadConsent: consent, ownerId: owner, selfId: self, ...trust.mode === "portable" ? { confirmExecution: execution, version: trust.version, sha256: trust.sha256 } : {} }))) }, trust.mode === "portable" ? t.portablePrepare : t.qqPrepare)), trust?.automaticExecution === true && !error && ["helper-ready", "install-helper"].includes(state?.phase) && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("label", { className: "dsc-check" }, /* @__PURE__ */ import_react.default.createElement("input", { type: "checkbox", checked: execution, onChange: (e) => setExecution(e.target.checked) }), t.execution), /* @__PURE__ */ import_react.default.createElement("div", { className: "dsc-toolbar" }, /* @__PURE__ */ import_react.default.createElement("button", { className: state.phase === "helper-ready" ? "primary" : "", disabled: busy || !execution, onClick: () => perform(async () => setState(await request2("/setup/qq/open", { confirmExecution: execution, version: trust.version, sha256: trust.sha256 }))) }, t.openHelper), /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-note" }, t.helperInstall), state.phase === "install-helper" && /* @__PURE__ */ import_react.default.createElement("button", { disabled: busy, onClick: () => perform(async () => {
    setState(await request2("/setup/qq/launch", {}));
    await completeRef.current("qq");
  }) }, t.launchHelper))), state?.phase === "waiting-login" && !online && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-note" }, trust?.mode === "portable" ? t.portableScan : t.helperLogin), qqLogin?.image && /* @__PURE__ */ import_react.default.createElement("figure", { className: "dsc-qr" }, /* @__PURE__ */ import_react.default.createElement("img", { src: qqLogin.image, alt: t.portableQr, width: "220", height: "220" })), /* @__PURE__ */ import_react.default.createElement("button", { disabled: busy, onClick: () => perform(async () => {
    const result = await request2("/setup/qq/check", {});
    if (!result.ok) throw new Error(t.notConnected);
    setState((v) => ({ ...v, phase: "complete" }));
    await completeRef.current("qq");
  }) }, t.check)), online && /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-message" }, t.connected)), id === "bili" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, busy && !login && /* @__PURE__ */ import_react.default.createElement("p", { role: "status" }, t.fetching), login && !["expired", "complete"].includes(login.phase) && /* @__PURE__ */ import_react.default.createElement("figure", { className: "dsc-qr" }, /* @__PURE__ */ import_react.default.createElement("img", { src: login.image, alt: t.qrAlt, width: "220", height: "220" }), /* @__PURE__ */ import_react.default.createElement("figcaption", { "aria-live": "polite" }, login.phase === "confirm-on-phone" ? t.confirm : t.scan)), login?.phase === "complete" && /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-message", role: "status" }, t.connected), login?.phase === "expired" && /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-note" }, t.expired), login?.phase !== "complete" && /* @__PURE__ */ import_react.default.createElement("button", { disabled: busy, onClick: newCode }, t.newCode)), id === "xhh" && /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-note" }, t.xhhDetail), state && /* @__PURE__ */ import_react.default.createElement("div", { className: "dsc-setup-progress", "aria-live": "polite" }, /* @__PURE__ */ import_react.default.createElement("p", null, t[state.phase] || t.preparing), progress !== null && state.running && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("progress", { value: progress, max: "100", "aria-label": t[state.phase] || t.preparing }), /* @__PURE__ */ import_react.default.createElement("span", null, progress, "%")), state.running && state.phase !== "starting-world" && /* @__PURE__ */ import_react.default.createElement("button", { className: "small", onClick: () => perform(() => request2("/setup/cancel", { id })) }, t.cancel), state.error && ["error", "manual-required"].includes(state.phase) && /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-error", role: "alert" }, friendly(state.error, lang)))), error && /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-error", role: "alert" }, error), notice && /* @__PURE__ */ import_react.default.createElement("p", { className: "dsc-message", role: "status" }, notice));
}

// ui/life.jsx
var import_react2 = __toESM(require("react"), 1);
var copy2 = {
  zh: { title: "\u966A\u4F34\u65E5\u5E38", hint: "\u4E09\u4E2A\u5F00\u5173\u5404\u81EA\u72EC\u7ACB\uFF0C\u9ED8\u8BA4\u5173\u95ED\u3002\u9700\u8981\u989D\u5916\u5B89\u88C5\u5E76\u542F\u7528 dsh-proactive 0.3.1 \u6587\u4EF6\u8868\u95F9\u949F\uFF1B\u6A21\u578B\u989D\u5EA6\u548C\u5B89\u9759\u65F6\u6BB5\u5728\u5B83\u7684\u9762\u677F\u8BBE\u7F6E\u3002", selfplay: "\u4F1A\u81EA\u5DF1\u63A5\u7740\u505A", selfplayHint: "\u53EA\u5728 Minecraft \u8EAB\u4F53\u5728\u7EBF\u3001\u6CA1\u6709\u4EFB\u52A1\u65F6\u7EE7\u7EED\u4E00\u5C0F\u6B65\uFF1B\u8FDE\u7EED\u6700\u591A\u5341\u6B21\u3002", reachout: "\u4F1A\u4E3B\u52A8\u627E\u4F60", reachoutHint: "\u548C Minecraft \u65E0\u5173\u3002\u6BCF\u5929\u5728\u968F\u673A\u7A97\u53E3\u91CC\u60F3\u8D77\u4F60\uFF0C\u6700\u591A\u4E00\u53E5\uFF0C\u4E5F\u53EF\u4EE5\u5B89\u9759\u8DF3\u8FC7\u3002", diary: "\u4F1A\u5199\u81EA\u5DF1\u7684\u65E5\u8BB0", diaryHint: "\u6BCF\u5929\u6700\u591A\u4E00\u6BB5\uFF0C\u5DE5\u5177\u81EA\u52A8\u65B0\u8D77\u65E5\u671F\uFF1B\u6CA1\u6709\u503C\u5F97\u5199\u7684\u5C31\u5982\u5B9E\u8BB0\u5F55\u3002", time: "\u7A97\u53E3\u8D77\u70B9", window: "\u968F\u673A\u7A97\u53E3\uFF08\u5C0F\u65F6\uFF09", diaryTime: "\u5199\u65E5\u8BB0\u7684\u65F6\u95F4", zone: "\u65F6\u533A\uFF08\u7559\u7A7A\u8DDF\u968F\u7CFB\u7EDF\uFF09", save: "\u4FDD\u5B58\u966A\u4F34\u8BBE\u7F6E", saving: "\u4FDD\u5B58\u4E2D\u2026", check: "\u67E5\u770B\u8FDE\u63A5\u72B6\u6001", saved: "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\uFF1B\u8BF7\u67E5\u770B\u4E0B\u65B9\u5B9E\u9645\u63A5\u5165\u72B6\u6001\u3002", unavailable: "\u5C1A\u672A\u63A5\u5165\u5524\u9192\u63D2\u4EF6\u3002\u5F00\u5173\u4FDD\u5B58\u540E\u4ECD\u9700\u5B8C\u6210\u63A5\u5165\u3002", armed: "\u5DF2\u63A5\u5165", pending: "\u7B49\u5F85\u540C\u6B65", paused: "\u7B49\u5F85\u8EAB\u4F53\u4E0A\u7EBF", disabled: "\u5DF2\u5173\u95ED", idle: "\u65E0\u4EBA\u6307\u4EE4\u540E\uFF08\u79D2\uFF09", after: "\u505A\u5B8C\u540E\uFF08\u79D2\uFF09", advanced: "\u8C03\u6574\u81EA\u4E3B\u8282\u594F", quota: "\u8FD9\u4E9B\u529F\u80FD\u4F1A\u8C03\u7528\u5BBF\u4E3B\u6A21\u578B\u3002\u8BF7\u6309\u81EA\u5DF1\u7684\u989D\u5EA6\u542F\u7528\u3002" },
  en: { title: "Daily companionship", hint: "Three independent switches, all off by default. Install and enable the optional dsh-proactive 0.3.1 schedule-file provider; set its model budget and quiet hours in its own panel.", selfplay: "Keep going independently", selfplayHint: "Take one small step only while the Minecraft body is online and idle, up to ten consecutive wakes.", reachout: "Think of you", reachoutHint: "Independent of Minecraft. At most one line in a random daily window; staying silent is allowed.", diary: "Write a personal diary", diaryHint: "At most one entry per day, with a new date heading. Record only what really happened.", time: "Window starts at", window: "Random window (hours)", diaryTime: "Diary time", zone: "Time zone (system when empty)", save: "Save companionship settings", saving: "Saving\u2026", check: "Check provider connection", saved: "Settings saved. Review the actual provider status below.", unavailable: "Wake provider not connected. Saving a switch does not confirm activation.", armed: "Connected", pending: "Awaiting sync", paused: "Waiting for body", disabled: "Off", idle: "Idle before waking (seconds)", after: "After task (seconds)", advanced: "Adjust self-play timing", quota: "These features use the host model. Enable them to suit your budget." }
};
function LifeSettings({ lang, request: request2, settings, onSaved }) {
  const t = copy2[lang === "en" ? "en" : "zh"], [value, setValue] = (0, import_react2.useState)(settings), [result, setResult] = (0, import_react2.useState)(null), [busy, setBusy] = (0, import_react2.useState)(false), [error, setError] = (0, import_react2.useState)(""), [notice, setNotice] = (0, import_react2.useState)("");
  (0, import_react2.useEffect)(() => {
    if (settings) setValue(settings);
  }, [settings]);
  (0, import_react2.useEffect)(() => {
    let live = true;
    request2("/life").then((r) => {
      if (live) setResult(r);
    }).catch((e) => {
      if (live) setError(e.message);
    });
    return () => {
      live = false;
    };
  }, [request2]);
  if (!value) return null;
  const set = (feature, key, v) => setValue((c) => ({ ...c, [feature]: { ...c[feature], [key]: v } }));
  const act = async (save) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await request2("/life", save ? value : void 0);
      setResult(r);
      if (save) {
        setValue(r.settings);
        onSaved?.(r.settings);
        setNotice(t.saved);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ import_react2.default.createElement("section", { className: "dsc-section", "aria-labelledby": "life-heading" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "dsc-section-head" }, /* @__PURE__ */ import_react2.default.createElement("div", null, /* @__PURE__ */ import_react2.default.createElement("h2", { id: "life-heading" }, t.title), /* @__PURE__ */ import_react2.default.createElement("p", { className: "dsc-hint" }, t.hint))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "dsc-runtime" }, ["selfplay", "reachout", "diary"].map((feature) => /* @__PURE__ */ import_react2.default.createElement("div", { className: "dsc-life-setting", key: feature }, /* @__PURE__ */ import_react2.default.createElement("label", { className: "dsc-check" }, /* @__PURE__ */ import_react2.default.createElement("input", { type: "checkbox", checked: value[feature].enabled, onChange: (e) => set(feature, "enabled", e.target.checked) }), t[feature]), /* @__PURE__ */ import_react2.default.createElement("p", { className: "dsc-note" }, t[feature + "Hint"]), feature === "reachout" && value.reachout.enabled && /* @__PURE__ */ import_react2.default.createElement("div", { className: "dsc-persona-grid" }, /* @__PURE__ */ import_react2.default.createElement("label", { className: "field" }, /* @__PURE__ */ import_react2.default.createElement("span", null, t.time), /* @__PURE__ */ import_react2.default.createElement("input", { type: "time", value: value.reachout.time, onChange: (e) => set(feature, "time", e.target.value) })), /* @__PURE__ */ import_react2.default.createElement("label", { className: "field" }, /* @__PURE__ */ import_react2.default.createElement("span", null, t.window), /* @__PURE__ */ import_react2.default.createElement("input", { type: "number", min: "1", max: "23", value: value.reachout.windowHours, onChange: (e) => set(feature, "windowHours", Number(e.target.value)) }))), feature === "diary" && value.diary.enabled && /* @__PURE__ */ import_react2.default.createElement("label", { className: "field" }, /* @__PURE__ */ import_react2.default.createElement("span", null, t.diaryTime), /* @__PURE__ */ import_react2.default.createElement("input", { type: "time", value: value.diary.time, onChange: (e) => set(feature, "time", e.target.value) })), feature === "selfplay" && value.selfplay.enabled && /* @__PURE__ */ import_react2.default.createElement("details", { className: "dsc-advanced" }, /* @__PURE__ */ import_react2.default.createElement("summary", null, t.advanced), [["idleSeconds", t.idle], ["afterTaskSeconds", t.after]].map(([key, label]) => /* @__PURE__ */ import_react2.default.createElement("label", { className: "field", key }, /* @__PURE__ */ import_react2.default.createElement("span", null, label), /* @__PURE__ */ import_react2.default.createElement("input", { type: "number", min: key === "idleSeconds" ? 60 : 1, max: "86400", value: value.selfplay[key], onChange: (e) => set(feature, key, Number(e.target.value)) })))), result?.features?.[feature] && /* @__PURE__ */ import_react2.default.createElement("p", { className: "dsc-status-detail" }, t[result.features[feature].state] || result.features[feature].message))), /* @__PURE__ */ import_react2.default.createElement("details", { className: "dsc-advanced" }, /* @__PURE__ */ import_react2.default.createElement("summary", null, t.zone), /* @__PURE__ */ import_react2.default.createElement("label", { className: "field" }, /* @__PURE__ */ import_react2.default.createElement("span", null, t.zone), /* @__PURE__ */ import_react2.default.createElement("input", { value: value.timeZone, placeholder: Intl.DateTimeFormat().resolvedOptions().timeZone, onChange: (e) => setValue((c) => ({ ...c, timeZone: e.target.value })) }))), /* @__PURE__ */ import_react2.default.createElement("p", { className: "dsc-note" }, t.quota), /* @__PURE__ */ import_react2.default.createElement("div", { className: "dsc-toolbar" }, /* @__PURE__ */ import_react2.default.createElement("button", { disabled: busy, onClick: () => act(true) }, busy ? t.saving : t.save), /* @__PURE__ */ import_react2.default.createElement("button", { disabled: busy, onClick: () => act(false) }, t.check)), error && /* @__PURE__ */ import_react2.default.createElement("div", { className: "dsc-error", role: "alert" }, error), notice && /* @__PURE__ */ import_react2.default.createElement("p", { className: "dsc-message", role: "status" }, notice), result?.message && /* @__PURE__ */ import_react2.default.createElement("p", { className: result.available ? "dsc-note" : "dsc-error", role: "status" }, result.message), result?.diary?.warning && value.diary.enabled && /* @__PURE__ */ import_react2.default.createElement("p", { className: "dsc-message", role: "status" }, result.diary.warning)));
}

// ui/panel.jsx
var normalize = (text) => String(text).replace(/\r\n?/g, "\n");
var storage = { get(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}, set(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
  }
} };
var format = (value, lang) => value ? new Date(value).toLocaleString(lang === "en" ? "en-US" : "zh-CN", { hour12: false }) : "\u2014";
var initialConfig = { character: { name: "", relationship: "", tone: "" }, owner: { id: "", callName: "" }, ui: { language: "zh", theme: "system" }, runtime: { nodePath: "", pythonPath: "" }, mc: {}, qq: {}, xhh: {}, bili: {}, schedule: { enabled: false }, media: { enabled: false } };
async function request(route, body, method = body === void 0 ? "GET" : "POST") {
  const response = await fetch(`/api/dsh-companion${route}`, { method, headers: body === void 0 ? {} : { "Content-Type": "application/json" }, body: body === void 0 ? void 0 : JSON.stringify(body), cache: "no-store" });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`HTTP ${response.status}`);
  }
  if (!response.ok || data?.error) throw new Error(data?.error || `HTTP ${response.status}`);
  return data;
}
function Field({ label, value, onChange, type = "text", options, disabled = false, name }) {
  return /* @__PURE__ */ import_react3.default.createElement("label", { className: "field" }, /* @__PURE__ */ import_react3.default.createElement("span", null, label), type === "select" ? /* @__PURE__ */ import_react3.default.createElement("select", { value: value ?? "", onChange: (e) => onChange(e.target.value), disabled, name }, options.map((v) => /* @__PURE__ */ import_react3.default.createElement("option", { key: v, value: v }, v))) : /* @__PURE__ */ import_react3.default.createElement("input", { name, type: type === "number" ? "number" : "text", value: Array.isArray(value) ? value.join(", ") : value ?? "", onChange: (e) => onChange(type === "list" ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean) : type === "number" ? e.target.value === "" ? "" : Number(e.target.value) : e.target.value), disabled, autoComplete: "off" }));
}
function Channel({ id, status, value, persisted, credentials, lang, t, onChange, onSave, onProbe, onReload, onSetupComplete, ownerId }) {
  const [busy, setBusy] = (0, import_react3.useState)(""), [notice, setNotice] = (0, import_react3.useState)(""), [error, setError] = (0, import_react3.useState)(""), [secretValues, setSecretValues] = (0, import_react3.useState)({}), [text, setText] = (0, import_react3.useState)(""), [output, setOutput] = (0, import_react3.useState)("");
  const dirty = JSON.stringify(value) !== JSON.stringify(persisted);
  const schema = status?.schema || [], currentState = busy === "probe" ? "checking" : status?.state || "unconfigured";
  const keys = id === "qq" ? ["token"] : id === "bili" ? ["sessdata", "bili_jct", "buvid3"] : id === "xhh" ? ["pkey", "x_xhh_tokenid"] : [];
  const act = async (kind, fn) => {
    setBusy(kind);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };
  const action = (name) => act(name, async () => {
    const result = await request(`/adapters/${id}/actions/${name}`, { text });
    setOutput(JSON.stringify(result, null, 2));
    setNotice(result.ok === false ? result.message : t.operationDone);
    await onSetupComplete(id);
  });
  const title = id === "mc" ? lang === "zh" ? "\u6211\u7684\u4E16\u754C" : "Minecraft" : id === "qq" ? "QQ" : id === "xhh" ? lang === "zh" ? "\u5C0F\u9ED1\u76D2" : "Heybox" : lang === "zh" ? "B\u7AD9" : "Bilibili";
  const configured = id === "mc" ? Boolean(persisted.serverDir) || persisted.source === "lan" : id === "qq" ? Boolean(persisted.wsUrl) : id === "bili" ? Boolean(credentials?.sessdata) : Boolean(persisted.toolPath);
  const worldExit = persisted.source === "lan" || status?.detail?.owned === false;
  const canLeave = status?.state === "online" && (!worldExit || status?.detail?.body?.online);
  return /* @__PURE__ */ import_react3.default.createElement("article", { className: "dsc-channel", "aria-label": `${title} ${t.channels}`, "data-channel": id }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-channel-head" }, /* @__PURE__ */ import_react3.default.createElement("h3", null, title), /* @__PURE__ */ import_react3.default.createElement("span", { className: "dsc-status", "data-state": currentState }, t[currentState] || currentState)), /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-hint" }, t[`${id}Hint`]), configured && persisted.enabled && ["mc", "qq"].includes(id) && /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-toolbar dsc-main-actions" }, /* @__PURE__ */ import_react3.default.createElement("button", { className: "primary", disabled: Boolean(busy) || dirty, onClick: () => action(id === "mc" ? canLeave ? worldExit ? "leave" : "down" : "up" : status?.ok ? "disconnect" : "connect") }, id === "mc" ? canLeave ? worldExit ? t.leave : t.down : worldExit ? t.enter : t.up : status?.ok ? t.disconnect : t.connect), id === "mc" && status?.state === "online" && /* @__PURE__ */ import_react3.default.createElement("button", { disabled: Boolean(busy) || dirty, onClick: () => action("around") }, t.around)), /* @__PURE__ */ import_react3.default.createElement(SetupFlow, { id, lang, request, onComplete: onSetupComplete, ownerId, selfId: persisted.selfId, online: status?.ok, configured, world: persisted }), status?.message && !["unconfigured", "disabled"].includes(currentState) && /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-status-detail" }, status.message), error && /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-error", role: "alert" }, error), notice && /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-message", role: "status" }, notice), /* @__PURE__ */ import_react3.default.createElement("details", { className: "dsc-advanced" }, /* @__PURE__ */ import_react3.default.createElement("summary", null, t.advanced), /* @__PURE__ */ import_react3.default.createElement("label", { className: "dsc-check" }, /* @__PURE__ */ import_react3.default.createElement("input", { type: "checkbox", checked: Boolean(value.enabled), onChange: (e) => onChange({ ...value, enabled: e.target.checked }) }), t.enable), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-card-fields" }, schema.map((f) => /* @__PURE__ */ import_react3.default.createElement(Field, { key: f.key, name: `${id}.${f.key}`, label: Array.isArray(f.label) ? f.label[lang === "en" ? 1 : 0] : f.label, value: value[f.key], type: f.type, options: f.options, onChange: (v) => onChange({ ...value, [f.key]: v }) }))), keys.length > 0 && /* @__PURE__ */ import_react3.default.createElement("details", { className: "dsc-credentials" }, /* @__PURE__ */ import_react3.default.createElement("summary", null, t.credentials), /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-hint" }, t.credentialsHint), keys.map((key) => /* @__PURE__ */ import_react3.default.createElement("label", { className: "field", key }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "dsc-credential-label" }, /* @__PURE__ */ import_react3.default.createElement("span", null, t[key] || key), /* @__PURE__ */ import_react3.default.createElement("small", null, credentials?.[key] ? t.present : t.absent)), /* @__PURE__ */ import_react3.default.createElement("input", { type: "password", value: secretValues[key] || "", autoComplete: "new-password", onChange: (e) => setSecretValues((v) => ({ ...v, [key]: e.target.value })), "aria-label": `${title} ${t[key] || key}` }))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-toolbar" }, /* @__PURE__ */ import_react3.default.createElement("button", { className: "small", disabled: Boolean(busy) || !Object.values(secretValues).some(Boolean), onClick: () => act("credentials", async () => {
    const values = Object.fromEntries(Object.entries(secretValues).filter(([, v]) => v !== ""));
    await request("/credentials", { id, values });
    setSecretValues({});
    setNotice(t.credentialsSaved);
    await onReload(true);
  }) }, t.saveCredentials))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-status-lines" }, /* @__PURE__ */ import_react3.default.createElement("div", null, t.lastCheck, "\uFF1A", status?.checkedAt ? format(status.checkedAt, lang) : t.never), /* @__PURE__ */ import_react3.default.createElement("div", null, t.lastSuccess, "\uFF1A", status?.lastSuccessAt ? format(status.lastSuccessAt, lang) : "\u2014")), dirty && /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-note" }, t.unsaved), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-card-actions" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-action-row" }, /* @__PURE__ */ import_react3.default.createElement("button", { disabled: Boolean(busy), onClick: () => act("save", async () => {
    await onSave(id);
    setNotice(t.channelSaved);
  }) }, busy === "save" ? t.saving : t.save), /* @__PURE__ */ import_react3.default.createElement("button", { disabled: Boolean(busy) || dirty, onClick: () => act("probe", () => onProbe(id)) }, busy === "probe" ? t.testing : t.test)), ["mc", "qq"].includes(id) && /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-toolbar dsc-action-row" }, (id === "mc" ? ["up", "down", "around", "map"] : ["connect", "disconnect"]).map((name) => /* @__PURE__ */ import_react3.default.createElement("button", { key: name, disabled: Boolean(busy) || dirty || !value.enabled && name !== "disconnect", onClick: () => action(name) }, t[name]))), ["mc", "qq"].includes(id) && /* @__PURE__ */ import_react3.default.createElement("details", { className: "dsc-credentials" }, /* @__PURE__ */ import_react3.default.createElement("summary", null, id === "mc" ? t.say : t.qqSay), /* @__PURE__ */ import_react3.default.createElement(Field, { label: t.channelMessage, value: text, onChange: setText }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-toolbar" }, /* @__PURE__ */ import_react3.default.createElement("button", { className: "small", disabled: Boolean(busy) || dirty || !value.enabled || !text.trim(), onClick: () => action("say") }, t.send))), busy && !["save", "probe", "credentials"].includes(busy) && /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-note" }, t.actionRunning), output && /* @__PURE__ */ import_react3.default.createElement("pre", { className: "dsc-output" }, output))));
}
function SchedulesEditor({ t, run }) {
  const [files, setFiles] = (0, import_react3.useState)([]), [name, setName] = (0, import_react3.useState)("daily.schedule.json"), [document2, setDocument] = (0, import_react3.useState)(""), [error, setError] = (0, import_react3.useState)(""), [notice, setNotice] = (0, import_react3.useState)("");
  const perform = async (fn) => {
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    }
  };
  const load = async () => {
    const r = await request("/schedules");
    setFiles(r.files || []);
  };
  const fresh = () => setDocument(JSON.stringify({ version: 1, target: { mode: "resume", channel: "dsh" }, entries: [{ id: "daily-journal", enabled: false, cron: "0 22 * * *", time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", prompt: "Read today\u2019s notes and write an honest diary entry in diary.md." }] }, null, 2));
  return /* @__PURE__ */ import_react3.default.createElement("details", { className: "dsc-schedule-editor" }, /* @__PURE__ */ import_react3.default.createElement("summary", null, t.editSchedules), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-toolbar" }, /* @__PURE__ */ import_react3.default.createElement("button", { className: "small", onClick: () => perform(load) }, t.loadSchedules), /* @__PURE__ */ import_react3.default.createElement("button", { className: "small", onClick: fresh }, t.newSchedule)), files.length ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-schedule-files" }, files.map((file) => /* @__PURE__ */ import_react3.default.createElement("button", { key: file.name, onClick: () => {
    setName(file.name);
    setDocument(JSON.stringify(file.document, null, 2) || "");
    setError(file.error || "");
  } }, file.name))) : /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-note" }, t.noSchedules), /* @__PURE__ */ import_react3.default.createElement(Field, { label: t.scheduleFile, value: name, onChange: setName }), /* @__PURE__ */ import_react3.default.createElement("label", { className: "field" }, /* @__PURE__ */ import_react3.default.createElement("span", null, t.scheduleDocument), /* @__PURE__ */ import_react3.default.createElement("textarea", { value: document2, onChange: (e) => setDocument(e.target.value), spellCheck: false })), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-toolbar" }, /* @__PURE__ */ import_react3.default.createElement("button", { className: "small", disabled: !document2.trim() || !name.trim(), onClick: () => perform(async () => {
    await request("/schedules", { name, document: JSON.parse(document2) });
    setNotice(t.scheduleSaved);
    await load();
  }) }, t.saveSchedule)), error && /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-error", role: "alert" }, error), notice && /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-message" }, notice));
}
function MediaLibrary({ t, enabled }) {
  const [items, setItems] = (0, import_react3.useState)([]), [file, setFile] = (0, import_react3.useState)(null), [busy, setBusy] = (0, import_react3.useState)(false), [error, setError] = (0, import_react3.useState)(""), [notice, setNotice] = (0, import_react3.useState)("");
  const load = async () => {
    const r = await request("/media");
    setItems(Array.isArray(r) ? r : r.items || []);
  };
  const perform = async (fn) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!enabled) return null;
  return /* @__PURE__ */ import_react3.default.createElement("section", { className: "dsc-section", "aria-labelledby": "media-heading" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-section-head" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h2", { id: "media-heading" }, t.mediaLibrary), /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-hint" }, t.uploadHint)), /* @__PURE__ */ import_react3.default.createElement("button", { disabled: busy, onClick: () => perform(load) }, t.loadMedia)), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-toolbar" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "dsc-media-file" }, t.selectFile, /* @__PURE__ */ import_react3.default.createElement("input", { type: "file", accept: ".png,.jpg,.jpeg,.gif,.webp,.mp3,.ogg,.wav,.m4a", onChange: (e) => setFile(e.target.files?.[0] || null) })), /* @__PURE__ */ import_react3.default.createElement("button", { disabled: busy || !file, onClick: () => perform(async () => {
    if (file.size > 8 * 1024 * 1024) throw new Error(t.uploadHint);
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.readAsDataURL(file);
    });
    await request("/media", { name: file.name, kind: file.type.startsWith("audio/") ? "audio" : "image", data });
    setFile(null);
    setNotice(t.mediaSaved);
    await load();
  }) }, t.uploadMedia)), error && /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-error", role: "alert" }, error), notice && /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-message" }, notice), items.length ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-media-grid" }, items.map((item) => /* @__PURE__ */ import_react3.default.createElement("article", { className: "dsc-media-item", key: item.id }, item.type === "audio" ? /* @__PURE__ */ import_react3.default.createElement("audio", { controls: true, preload: "none", src: item.url }) : /* @__PURE__ */ import_react3.default.createElement("img", { loading: "lazy", src: item.url, alt: item.name }), /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-media-name" }, item.name), /* @__PURE__ */ import_react3.default.createElement("button", { disabled: busy, onClick: () => perform(async () => {
    await request("/media/remove", { id: item.id });
    setNotice(t.mediaRemoved);
    await load();
  }) }, t.removeMedia)))) : /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-note" }, t.noMedia));
}
function Panel({ onOpenSession }) {
  const [lang, setLang] = (0, import_react3.useState)(storage.get("dsh-companion.language") || "zh"), [theme, setTheme] = (0, import_react3.useState)(storage.get("dsh-companion.theme") || "system"), [systemDark, setSystemDark] = (0, import_react3.useState)(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches || false);
  const t = messages[lang] || messages.zh;
  const [config, setConfig] = (0, import_react3.useState)(initialConfig), [savedConfig, setSavedConfig] = (0, import_react3.useState)(initialConfig), [credentials, setCredentials] = (0, import_react3.useState)({}), [persona, setPersona] = (0, import_react3.useState)(""), [savedPersona, setSavedPersona] = (0, import_react3.useState)(""), [templates, setTemplates] = (0, import_react3.useState)({}), [status, setStatus] = (0, import_react3.useState)({ channels: {} }), [words, setWords] = (0, import_react3.useState)({}), [tab, setTab] = (0, import_react3.useState)("diary");
  const [loading, setLoading] = (0, import_react3.useState)(true), [globalError, setGlobalError] = (0, import_react3.useState)(""), [notice, setNotice] = (0, import_react3.useState)(""), [busy, setBusy] = (0, import_react3.useState)(""), [checks, setChecks] = (0, import_react3.useState)(null), [chatText, setChatText] = (0, import_react3.useState)(""), [chat, setChat] = (0, import_react3.useState)([]);
  const [hostModel, setHostModel] = (0, import_react3.useState)({ state: "unknown" });
  const mounted = (0, import_react3.useRef)(true), persisted = (0, import_react3.useRef)(false), writesBusy = (0, import_react3.useRef)(false);
  const refresh = (0, import_react3.useCallback)(async (includeConfig = false) => {
    const results = await Promise.allSettled([request("/status"), request("/writings"), ...includeConfig ? [request("/config")] : []]);
    if (!mounted.current) return;
    if (results[0].status === "fulfilled") setStatus(results[0].value);
    if (results[1].status === "fulfilled") setWords(results[1].value);
    if (includeConfig && results[2]?.status === "fulfilled") setCredentials(results[2].value.credentials || {});
    const failure = results.find((x) => x.status === "rejected");
    if (failure) throw failure.reason;
  }, []);
  const load = (0, import_react3.useCallback)(async () => {
    setGlobalError("");
    setLoading(true);
    const tasks = await Promise.allSettled([request("/config"), request("/persona"), request("/templates"), request("/status"), request("/writings"), request("/host-model")]);
    if (!mounted.current) return;
    if (tasks[0].status === "fulfilled") {
      const d = tasks[0].value;
      setConfig(d.config);
      setSavedConfig(d.config);
      setCredentials(d.credentials || {});
      if (!persisted.current) {
        if (!storage.get("dsh-companion.language")) setLang(d.config.ui.language);
        if (!storage.get("dsh-companion.theme")) setTheme(d.config.ui.theme);
        persisted.current = true;
      }
    }
    if (tasks[1].status === "fulfilled") {
      setPersona(tasks[1].value.text);
      setSavedPersona(tasks[1].value.text);
    }
    if (tasks[2].status === "fulfilled") setTemplates(tasks[2].value);
    if (tasks[3].status === "fulfilled") setStatus(tasks[3].value);
    if (tasks[4].status === "fulfilled") setWords(tasks[4].value);
    setHostModel(tasks[5].status === "fulfilled" ? tasks[5].value : { state: "unknown" });
    setGlobalError(tasks.filter((x) => x.status === "rejected").map((x) => x.reason.message).join("\n"));
    setLoading(false);
  }, []);
  (0, import_react3.useEffect)(() => {
    mounted.current = true;
    let tag = document.getElementById("dsh-companion-style");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "dsh-companion-style";
      tag.textContent = styles_default;
      document.head.appendChild(tag);
    }
    load();
    const timer = setInterval(() => {
      if (!document.hidden) refresh().catch((e) => {
        if (mounted.current) setGlobalError(e.message);
      });
    }, 1e4);
    const visible = () => {
      if (!document.hidden) refresh().catch((e) => setGlobalError(e.message));
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [load, refresh]);
  (0, import_react3.useEffect)(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const change = () => setSystemDark(media.matches);
    media.addEventListener?.("change", change);
    return () => media.removeEventListener?.("change", change);
  }, []);
  const effectiveTheme = theme === "system" ? systemDark ? "dark" : "light" : theme;
  const run = async (key, fn) => {
    if (writesBusy.current) return;
    writesBusy.current = true;
    setBusy(key);
    setGlobalError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setGlobalError(e.message || t.taskError);
    } finally {
      writesBusy.current = false;
      if (mounted.current) setBusy("");
    }
  };
  const savePatch = async (patch) => {
    const r = await request("/config", patch);
    setSavedConfig(r.config);
    return r.config;
  };
  const saveCard = async (id) => {
    await savePatch({ [id]: config[id] });
    await refresh(true);
  };
  const applySetup = (0, import_react3.useCallback)(async (id) => {
    const data = await request("/config");
    setSavedConfig(data.config);
    setCredentials(data.credentials || {});
    setConfig((current) => ({ ...current, [id]: data.config[id], owner: id === "qq" ? { ...current.owner, id: data.config.owner.id } : current.owner }));
    await refresh();
  }, [refresh]);
  const personaCount = normalize(persona).length, overflow = personaCount > 4e3, personaDirty = persona !== savedPersona || JSON.stringify(config.character) !== JSON.stringify(savedConfig.character) || config.owner.callName !== savedConfig.owner.callName;
  const generated = () => lang === "en" ? `# Who you are

Your name is ${config.character.name || "(name)"}.

# Our relationship

${config.character.relationship || "(describe your relationship)"}
Call me ${config.owner.callName || "(preferred name)"}.

# How you speak

${config.character.tone || "(describe the voice)"}

# Memory and daily life

Keep honest notes in this workspace. Check current facts before claiming a channel is online.
` : `# \u4F60\u662F\u8C01

\u4F60\u7684\u540D\u5B57\u662F${config.character.name || "\uFF08\u540D\u5B57\uFF09"}\u3002

# \u4F60\u548C\u6211\u7684\u5173\u7CFB

${config.character.relationship || "\uFF08\u5199\u4E0B\u4F60\u4EEC\u7684\u5173\u7CFB\uFF09"}
\u4F60\u79F0\u547C\u6211\u4E3A${config.owner.callName || "\uFF08\u79F0\u547C\uFF09"}\u3002

# \u4F60\u600E\u4E48\u8BF4\u8BDD

${config.character.tone || "\uFF08\u5199\u4E0B\u8BF4\u8BDD\u7684\u8BED\u6C14\uFF09"}

# \u8BB0\u5FC6\u4E0E\u65E5\u5E38

\u5728\u5F53\u524D\u5DE5\u4F5C\u533A\u7559\u4E0B\u771F\u5B9E\u7684\u8BB0\u5FC6\u548C\u8BB0\u5F55\u3002\u5148\u68C0\u67E5\u4E8B\u5B9E\uFF0C\u518D\u5224\u65AD\u901A\u9053\u662F\u5426\u5728\u7EBF\u3002
`;
  const preference = async (key, value) => {
    if (key === "language") {
      setLang(value);
      storage.set("dsh-companion.language", value);
    } else {
      setTheme(value);
      storage.set("dsh-companion.theme", value);
    }
    try {
      const c = await savePatch({ ui: { [key]: value } });
      setConfig((v) => ({ ...v, ui: c.ui }));
    } catch (e) {
      setGlobalError(e.message);
    }
  };
  const open = () => run("open", async () => {
    const model = await request("/host-model");
    setHostModel(model);
    if (model.state === "unconfigured") throw new Error(model.message || t.modelHelp);
    const r = await request("/session", {});
    if (onOpenSession) await onOpenSession(r.sessionId);
    else setNotice(`${t.nativeHint} ${r.sessionId}`);
  });
  return /* @__PURE__ */ import_react3.default.createElement("main", { className: "dsc", "data-theme": effectiveTheme, lang: lang === "en" ? "en" : "zh-CN", "aria-label": t.title }, /* @__PURE__ */ import_react3.default.createElement("header", { className: "dsc-header" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h1", null, config.character.name || t.title), /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-subtitle" }, t.subtitle)), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-header-controls" }, /* @__PURE__ */ import_react3.default.createElement("label", null, /* @__PURE__ */ import_react3.default.createElement("span", { className: "dsc-hint" }, t.language, " "), /* @__PURE__ */ import_react3.default.createElement("select", { "aria-label": t.language, value: lang, onChange: (e) => preference("language", e.target.value) }, /* @__PURE__ */ import_react3.default.createElement("option", { value: "zh" }, "\u4E2D\u6587"), /* @__PURE__ */ import_react3.default.createElement("option", { value: "en" }, "English"))), /* @__PURE__ */ import_react3.default.createElement("label", null, /* @__PURE__ */ import_react3.default.createElement("span", { className: "dsc-hint" }, t.theme, " "), /* @__PURE__ */ import_react3.default.createElement("select", { "aria-label": t.theme, value: theme, onChange: (e) => preference("theme", e.target.value) }, ["system", "light", "dark"].map((v) => /* @__PURE__ */ import_react3.default.createElement("option", { key: v, value: v }, t[v])))), /* @__PURE__ */ import_react3.default.createElement("button", { onClick: () => run("refresh", () => refresh(true)), disabled: Boolean(busy) }, t.refresh))), !savedPersona.trim() && /* @__PURE__ */ import_react3.default.createElement("aside", { className: "dsc-intro" }, /* @__PURE__ */ import_react3.default.createElement("strong", null, t.first), /* @__PURE__ */ import_react3.default.createElement("p", null, t.firstHint)), globalError && /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-error", role: "alert" }, globalError, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-toolbar" }, /* @__PURE__ */ import_react3.default.createElement("button", { className: "small", onClick: load }, t.retry))), notice && /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-message", role: "status" }, notice), loading && /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-loading" }, t.loading), /* @__PURE__ */ import_react3.default.createElement("section", { "aria-labelledby": "persona-heading" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-section-head" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h2", { id: "persona-heading" }, t.persona), /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-hint" }, t.personaHint))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-persona" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-persona-grid" }, [["name", t.name], ["relationship", t.relationship], ["tone", t.tone]].map(([key, label]) => /* @__PURE__ */ import_react3.default.createElement(Field, { key, name: `character.${key}`, label, value: config.character[key], onChange: (value) => setConfig((c) => ({ ...c, character: { ...c.character, [key]: value } })) })), /* @__PURE__ */ import_react3.default.createElement(Field, { label: t.owner, name: "owner.callName", value: config.owner.callName, onChange: (value) => setConfig((c) => ({ ...c, owner: { ...c.owner, callName: value } })) }), /* @__PURE__ */ import_react3.default.createElement("details", { className: "dsc-advanced dsc-identity-advanced" }, /* @__PURE__ */ import_react3.default.createElement("summary", null, t.advanced), /* @__PURE__ */ import_react3.default.createElement(Field, { label: t.ownerId, name: "owner.id", value: config.owner.id, onChange: (value) => setConfig((c) => ({ ...c, owner: { ...c.owner, id: value } })) }))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-label-row" }, /* @__PURE__ */ import_react3.default.createElement("label", { htmlFor: "dsc-persona" }, t.fullPersona), /* @__PURE__ */ import_react3.default.createElement("span", { className: `dsc-count ${overflow ? "dsc-overflow" : ""}`, "aria-live": "polite" }, personaCount, " / 4000")), /* @__PURE__ */ import_react3.default.createElement("textarea", { id: "dsc-persona", className: "persona-text", value: persona, onChange: (e) => setPersona(e.target.value), spellCheck: false, "aria-invalid": overflow }), overflow && /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-message dsc-overflow", role: "alert" }, t.overflow), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-toolbar" }, /* @__PURE__ */ import_react3.default.createElement("button", { className: "small", onClick: () => setPersona(templates.template || ""), disabled: !templates.template || Boolean(busy) }, t.template), /* @__PURE__ */ import_react3.default.createElement("button", { className: "small", onClick: () => setPersona(templates.example || ""), disabled: !templates.example || Boolean(busy) }, t.example), /* @__PURE__ */ import_react3.default.createElement("button", { className: "small", onClick: () => setPersona(generated()), disabled: Boolean(busy) }, t.generate)), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-toolbar" }, /* @__PURE__ */ import_react3.default.createElement("button", { className: "primary", disabled: Boolean(busy) || overflow || !persona.trim(), onClick: () => run("persona", async () => {
    const c = await savePatch({ character: config.character, owner: config.owner });
    const r = await request("/persona", { text: normalize(persona) });
    setPersona(normalize(persona));
    setSavedPersona(normalize(persona));
    setNotice(r.warning || t.saved);
  }) }, busy === "persona" ? t.saving : t.savePersona), /* @__PURE__ */ import_react3.default.createElement("button", { disabled: Boolean(busy) || !savedPersona.trim(), onClick: open }, t.open), personaDirty && /* @__PURE__ */ import_react3.default.createElement("span", { className: "dsc-hint" }, t.unsaved)), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-host-model", role: "status" }, /* @__PURE__ */ import_react3.default.createElement("strong", null, t.hostModel, "\uFF1A", t[`model_${hostModel.state}`] || t.model_unknown), /* @__PURE__ */ import_react3.default.createElement("button", { className: "small", disabled: Boolean(busy), onClick: () => run("model", async () => setHostModel(await request("/host-model"))) }, t.modelCheck), /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-note" }, t.modelHelp), hostModel.message && /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-note" }, hostModel.message)), /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-note" }, status.hostAvailable ? t.nativeHint : t.previewHint), status.hostAvailable && /* @__PURE__ */ import_react3.default.createElement("details", { className: "dsc-conversation" }, /* @__PURE__ */ import_react3.default.createElement("summary", null, t.chat), /* @__PURE__ */ import_react3.default.createElement("textarea", { "aria-label": t.input, value: chatText, onChange: (e) => setChatText(e.target.value) }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-toolbar" }, /* @__PURE__ */ import_react3.default.createElement("button", { disabled: Boolean(busy) || !chatText.trim() || !savedPersona.trim(), onClick: () => run("chat", async () => {
    const text = chatText;
    const r = await request("/chat", { text });
    setChat((v) => [...v, { role: "user", text }, { role: "assistant", text: r.text }]);
    setChatText("");
  }) }, t.send)), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-chat-log" }, chat.map((line, i) => /* @__PURE__ */ import_react3.default.createElement("div", { key: i, className: `dsc-chat-line ${line.role}` }, line.text)))))), /* @__PURE__ */ import_react3.default.createElement("section", { className: "dsc-section", "aria-labelledby": "channels-heading" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-section-head" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h2", { id: "channels-heading" }, t.channels), /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-hint" }, t.channelsHint))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-pair" }, ["mc", "qq", "xhh", "bili"].map((id) => /* @__PURE__ */ import_react3.default.createElement(Channel, { key: id, id, lang, t, status: status.channels?.[id], value: config[id], persisted: savedConfig[id], credentials: credentials[id], ownerId: savedConfig.owner.id, onSetupComplete: applySetup, onChange: (value) => setConfig((c) => ({ ...c, [id]: value })), onSave: saveCard, onProbe: async (id2) => {
    await request(`/adapters/${id2}/probe`, {});
    await refresh();
  }, onReload: refresh })))), /* @__PURE__ */ import_react3.default.createElement("section", { className: "dsc-section", "aria-labelledby": "writings-heading" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-section-head" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h2", { id: "writings-heading" }, t.writings), /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-hint" }, t.writingsHint))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-writing" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-tabs", role: "tablist", "aria-label": t.writings }, writingIds.map((id) => /* @__PURE__ */ import_react3.default.createElement("button", { role: "tab", id: `tab-${id}`, "aria-controls": `writing-${id}`, "aria-selected": tab === id, key: id, onClick: () => setTab(id) }, t[id]))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-writing-body", role: "tabpanel", id: `writing-${tab}`, "aria-labelledby": `tab-${tab}` }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-writing-meta" }, words[tab]?.mtime ? `${t.updated} ${format(words[tab].mtime, lang)}` : "\u2014", words[tab]?.truncated && ` \xB7 ${t.recentOnly}`), words[tab]?.error && /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-error" }, words[tab].error), words[tab]?.text ? /* @__PURE__ */ import_react3.default.createElement("pre", { className: "dsc-writing-text" }, words[tab].text) : /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-empty" }, t.emptyWriting)))), /* @__PURE__ */ import_react3.default.createElement("section", { className: "dsc-section dsc-footer-grid" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-runtime" }, /* @__PURE__ */ import_react3.default.createElement("h2", null, t.deps), /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-hint" }, t.depsHint), /* @__PURE__ */ import_react3.default.createElement("details", { className: "dsc-advanced dsc-runtime-advanced" }, /* @__PURE__ */ import_react3.default.createElement("summary", null, t.advanced), /* @__PURE__ */ import_react3.default.createElement(Field, { label: t.nodePath, value: config.runtime.nodePath, onChange: (value) => setConfig((c) => ({ ...c, runtime: { ...c.runtime, nodePath: value } })) }), /* @__PURE__ */ import_react3.default.createElement(Field, { label: t.pythonPath, value: config.runtime.pythonPath, onChange: (value) => setConfig((c) => ({ ...c, runtime: { ...c.runtime, pythonPath: value } })) })), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-toolbar" }, /* @__PURE__ */ import_react3.default.createElement("button", { onClick: () => run("runtime", async () => {
    await savePatch({ runtime: config.runtime });
    setNotice(t.depsSaved);
  }), disabled: Boolean(busy) }, t.save), /* @__PURE__ */ import_react3.default.createElement("button", { disabled: Boolean(busy), onClick: () => run("deps", async () => setChecks(await request("/deps", {}))) }, busy === "deps" ? t.testing : t.runDeps)), checks && /* @__PURE__ */ import_react3.default.createElement("ul", { className: "dsc-deps" }, checks.map((c) => /* @__PURE__ */ import_react3.default.createElement("li", { key: c.id }, /* @__PURE__ */ import_react3.default.createElement("strong", null, c.id, c.optional ? ` (${t.optional})` : ""), /* @__PURE__ */ import_react3.default.createElement("span", null, c.ok ? t.available : t.notDetected, c.detail ? ` \xB7 ${c.detail}` : ""))))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dsc-runtime" }, /* @__PURE__ */ import_react3.default.createElement("h2", null, t.schedule), /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-hint" }, t.scheduleHint), /* @__PURE__ */ import_react3.default.createElement("label", { className: "dsc-check" }, /* @__PURE__ */ import_react3.default.createElement("input", { type: "checkbox", checked: Boolean(config.schedule.enabled), onChange: (e) => setConfig((c) => ({ ...c, schedule: { ...c.schedule, enabled: e.target.checked } })) }), t.scheduleEnable), /* @__PURE__ */ import_react3.default.createElement(SchedulesEditor, { t, run }), /* @__PURE__ */ import_react3.default.createElement("h3", { style: { marginTop: 20 } }, t.media), /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-hint" }, t.mediaHint), /* @__PURE__ */ import_react3.default.createElement("label", { className: "dsc-check" }, /* @__PURE__ */ import_react3.default.createElement("input", { type: "checkbox", checked: Boolean(config.media.enabled), onChange: (e) => setConfig((c) => ({ ...c, media: { ...c.media, enabled: e.target.checked } })) }), t.mediaEnable), /* @__PURE__ */ import_react3.default.createElement("button", { disabled: Boolean(busy), onClick: () => run("optional", async () => {
    await savePatch({ schedule: config.schedule, media: config.media });
    setNotice(t.saved);
  }) }, t.save), status.errors?.length > 0 && /* @__PURE__ */ import_react3.default.createElement("details", { className: "dsc-credentials" }, /* @__PURE__ */ import_react3.default.createElement("summary", null, t.errorLog), status.errors.map((e, i) => /* @__PURE__ */ import_react3.default.createElement("p", { className: "dsc-note", key: i }, format(e.at, lang), " ", e.message))))), /* @__PURE__ */ import_react3.default.createElement(LifeSettings, { lang, request, settings: config.life, onSaved: (life) => {
    setConfig((c) => ({ ...c, life }));
    setSavedConfig((c) => ({ ...c, life }));
  } }), /* @__PURE__ */ import_react3.default.createElement(MediaLibrary, { t, enabled: savedConfig.media.enabled }), /* @__PURE__ */ import_react3.default.createElement("footer", { className: "dsc-version" }, "dsh-companion ", status.version || "0.1.0"));
}

// ui/client.jsx
var inject = ["slots"];
function apply(ctx) {
  const open = (sessionId) => {
    const workspace = ctx.get?.("uiWorkspace") || ctx.uiWorkspace;
    if (!workspace?.openSession) throw new Error("Open the character session in DSH / \u8BF7\u5728 DSH \u4E2D\u6253\u5F00\u89D2\u8272\u4F1A\u8BDD");
    return workspace.openSession(sessionId);
  };
  ctx.effect(() => ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: "dsh-companion", order: 7, label: () => "\u540C\u5C45\u8005 / Companion" }, ({ close }) => /* @__PURE__ */ import_react4.default.createElement(Panel, { onOpenSession: async (sessionId) => {
    await open(sessionId);
    close?.();
  } })), "dsh-companion settings"), "dsh-companion settings");
}

return module.exports;}});
