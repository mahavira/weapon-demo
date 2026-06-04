# AGENTS.md

## Project Overview

- 这是一个 Cocos Creator `3.8.8` + TypeScript 项目。


## Tech Stack

- Cocos Creator `3.8.8`
- TypeScript
- `npm`
- Node 内置测试框架 `node:test`

## Cocos Creator Rules

- 修改前必须先确认节点是“场景静态节点”还是“代码动态创建节点”。

## Plan Rules
- 修改前先确认好这个文件(或者函数)为什么要放在这，有没有其他更好的设计方式。

## Coding Rules

- 修改前先读相关文件，不允许只凭文件名猜。
- 优先做最小修改，不顺手重构无关代码。
- 不要删除看起来无用但未确认用途的代码。
- 保持现有命名风格：
  - 类名 PascalCase
  - 变量和函数 camelCase
  - 节点名用语义化英文

## Asset / Prefab / Scene Rules

- 不要随意改资源路径、场景文件名、脚本文件名、`.meta` 文件。
- 当前仓库未发现实际 `.prefab` 文件；如果新增 Prefab，必须同时关注它的 `.meta` 和引用关系。
- 修改 `.scene`、`.prefab`、`.meta` 前，先确认：
  - 是否有场景脚本挂载依赖
  - 是否有资源 UUID 关联
  - 是否有 Editor 手动绑定字段依赖
- 不要为了“修复引用”直接删除 `.meta` 重建。
- 移动或重命名资源时，优先保留原 `.meta`，避免 UUID 变化导致引用断裂。

## After Editing

1. 再读一遍受影响文件，确认没有顺手改出额外行为。
2. 运行能确认的最低检查：
   - `npm test`
4. 如果改了场景/UI/资源，检查是否会出现：
   - 重复节点
   - 丢失脚本挂载
   - 丢失 Inspector 引用
   - `.meta` / UUID 关联断裂
5. 提交说明里写清楚：
   - 改了哪一层
   - 是否动了场景/资源
   - 哪些信息仍未确认
