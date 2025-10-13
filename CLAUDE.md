# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 uni-app 框架的多端小程序项目，支持微信小程序、H5、App 等多个平台。项目使用 Vue 3 + TypeScript + Pinia 技术栈。

## 开发命令

### 开发环境
- `npm run dev:mp-weixin` - 开发微信小程序
- `npm run dev:h5` - 开发 H5 版本
- `npm run dev:app` - 开发 App 版本
- `npm run dev:mp-alipay` - 开发支付宝小程序
- `npm run dev:mp-baidu` - 开发百度小程序

### 构建部署
- `npm run build:mp-weixin` - 构建微信小程序
- `npm run build:h5` - 构建 H5 版本
- `npm run build:app` - 构建 App 版本

### 代码检查
- `npm run type-check` - TypeScript 类型检查

## 项目架构

### 目录结构
- `src/pages/` - 主包页面
- `src/pagesMall/` - 商城相关分包页面
- `src/components/` - 公共组件
- `src/services/` - API 服务层
- `src/store/` - Pinia 状态管理
- `src/utils/` - 工具函数
- `src/static/` - 静态资源

### 技术栈
- **框架**: uni-app 3.x (Vue 3)
- **语言**: TypeScript
- **状态管理**: Pinia
- **样式**: UnoCSS + SCSS
- **UI组件**: @dcloudio/uni-ui
- **构建工具**: Vite
- **日期处理**: moment.js

### 关键配置
- `src/pages.json` - 页面路由配置，包含主包和分包页面
- `src/manifest.json` - 应用配置，包含各平台特定设置
- `unocss.config.ts` - UnoCSS 原子化 CSS 配置，使用微信小程序预设
- `vite.config.ts` - Vite 构建配置
- `.prettierrc` - 代码格式化配置（单引号、160字符宽度、尾随逗号）

### 状态管理
- 使用 Pinia 进行状态管理
- 全局状态存储在 `src/store/global.ts`

### API 服务层
- `src/services/base.ts` - 基础 API 服务
- `src/services/login.ts` - 登录相关 API
- `src/services/shop.ts` - 商城相关 API
- `src/services/pay.ts` - 支付相关 API
- `src/services/mine.ts` - 个人中心 API
- `src/services/collection.ts` - 收藏相关 API

### 工具函数
- `src/utils/request.ts` - HTTP 请求封装
- `src/utils/constant.ts` - 常量定义
- `src/utils/index.ts` - 通用工具函数

### 样式系统
- 使用 UnoCSS 进行原子化 CSS 开发
- 支持微信小程序的 rpx 单位转换
- 支持属性化写法，可直接在标签上写样式属性

### 多端支持
项目支持多个平台，主要配置在 `manifest.json` 中：
- 微信小程序 (mp-weixin)
- 支付宝小程序 (mp-alipay)
- 百度小程序 (mp-baidu)
- H5 (h5)
- App (app-plus)

### 代码规范
- 使用 Prettier 进行代码格式化
- TypeScript 严格模式
- 单引号字符串
- 160 字符行宽
- 尾随逗号