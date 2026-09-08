---
title: 关于我
description: 申家芮（Sjeary）的教育背景、竞赛经历、开源项目与技术兴趣。
layout: page
breadcrumb: false
collection:
  profile: wiki
  id: sjeary
active_menu: about
date: 2026-09-06 12:00:00
---

{% navbar active:/about/ [主页](/) [关于我](/about/) [博客](/blog/) %}

你好，我是 **申家芮（Jiarui Shen）**，也叫 **Sjeary**。目前在北京理工大学计算机学院攻读计算机科学与技术硕士学位。

我的兴趣主要是 **3D 视觉、自动驾驶、多模态 3D 感知与扩散模型**。除了算法学习与实践，我也做桌面应用和研究工具，并把学习过程整理成[博客与技术分享](/blog/)。

## 教育背景

### 北京理工大学 · 硕士研究生

**2025.09 — 至今** · 计算机学院 · 计算机科学与技术

### 北京理工大学 · 本科

**2021.09 — 2025.06** · 徐特立英才班 · 计算机科学与技术

- GPA：**3.7 / 4.0**，专业排名 **10 / 68（Top 14%）**。
- 获评 **北京理工大学优秀学生**。

## 竞赛经历

### TGAC 2025 · 3D Video MoCap

**腾讯游戏算法大赛 · 决赛第 7 名**

任务是从单目视频恢复世界坐标系中的连续人体运动，同时估计人体姿态与相机轨迹。

- 基于 TRAM / VIMO 构建人体运动与相机轨迹双分支方案。
- 在相机分支接入 ViPE，探索 SAM 3D Body 与时序建模。
- 引入 SLOPER4D，完成数据标注适配、多数据集联合微调与评估。

[查看赛事结果](https://mp.weixin.qq.com/s/5NW8mic6rWAaJ5yz86On2w)

## 开源项目

### ShareGPT · AI 桌面协作工作区

面向团队协作的跨平台桌面应用。我负责客户端、Node.js 协作服务端与管理控制台的全栈实现。

- 将多模型标签页、Markdown 知识库、日历与待办、历史记录和团队通信放进同一个工作区。
- 使用 Electron IPC 与 HTTP / WebSocket 连接桌面进程、服务端和协作功能。
- 技术栈：**Electron · React · TypeScript · Node.js**。

[查看 ShareGPT 源码](https://github.com/Sjeary/ShareGPT)

### arXiv Paper Radar · 论文检索与分析

围绕研究主题迭代检索 arXiv，使用 LLM 辅助判断论文相关性，整理结构化分析并浏览结果，让论文收集与阅读更有条理。

[查看 arXiv Paper Radar 源码](https://github.com/Sjeary/arxiv_papers_analysis)

### Research Notes · 学习笔记与技术分享

整理扩散模型、SDE / ODE、Flow Matching、DiT 和 3D Gaussian Splatting 的学习材料。博客收录笔记正文，并提供原始技术分享 PDF。

[阅读博客](/blog/) · [查看笔记仓库](https://github.com/Sjeary/Research-Notes)

## 技术兴趣与工具

- **3D 视觉与感知**：相机几何、SMPL / SMPL-X、人体运动重建、语义占用、多模态融合。
- **生成模型**：SDE / ODE、Score Matching、Probability Flow ODE、Flow Matching、Consistency Models、DiT。
- **开发工具**：C / C++、Python / PyTorch、TypeScript / React / Electron / Node.js、Linux、Git。

## 联系我

欢迎在 [GitHub · @Sjeary](https://github.com/Sjeary) 交流，或通过项目的 Issues 讨论问题与想法。
