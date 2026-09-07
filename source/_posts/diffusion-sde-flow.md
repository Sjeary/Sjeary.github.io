---
title: "扩散模型、SDE 与 Flow 基础"
date: 2025-07-17 12:00:00
updated: 2025-07-17 12:00:00
description: "从布朗运动与 Wiener 过程出发，串联 SDE、逆向扩散、Score Matching、Probability Flow ODE 与 Flow Matching。"
categories: ["扩散模型"]
tags: ["SDE","Flow Matching","学习笔记"]
comments:
  enabled: false
---

**学习笔记 · 原始整理日期：2025-07-17**

## 概览

这份笔记沿着扩散模型的数学基础展开：从布朗运动和 Wiener 过程出发，将粒子的随机轨迹与概率密度演化联系起来，再依次讨论逆向 SDE、score matching、Probability Flow ODE、guidance，并引入 Flow Matching。

这份学习材料整理自一组公开文章，并补充了串联各主题的简短笔记。原 PDF 中已标记 LLM 辅助生成的总结，文末列出了对应的来源文章。

## 关注重点

- 建立微观随机运动与宏观概率密度演化之间的联系。
- 通过 Fokker–Planck 方程和连续性方程理解 SDE 与 ODE 两种描述。
- 理解逆向生成为何可以归结为学习 score function。
- 对比随机扩散采样与确定性的 Probability Flow ODE。
- 建立从扩散模型过渡到 Flow Matching 的概念桥梁。

## 知识脉络

```text
布朗运动
    -> Wiener 过程与 Itô 微积分
    -> 随机微分方程（SDE）
    -> Fokker-Planck 方程
    -> 逆向 SDE
    -> Denoising Score Matching
    -> Probability Flow ODE
    -> Guidance
    -> Flow Matching
```

## 核心收获

1. 随机游走的连续极限可由 Wiener 过程描述，它构成了扩散 SDE 的基本随机过程。
2. Lagrangian 视角跟踪单个随机轨迹，Eulerian 视角则描述整体概率密度如何演化。
3. SDE 与 Fokker–Planck 方程从不同层次描述同一随机过程：前者对应样本路径，后者对应概率密度。
4. Wiener 增量与普通时间增量具有不同的尺度关系，因此 Itô 微积分会保留二阶修正项。
5. 逆向 SDE 引入 score `∇x log p_t(x)`，它是反转扩散过程所需的关键量。
6. Denoising Score Matching 将难以直接求解的边缘分布 score，替换为前向扰动过程下可计算的条件目标。
7. Probability Flow ODE 去除了随机项，同时与对应 SDE 保持相同的时变边缘分布。
8. Classifier guidance 与 classifier-free guidance 通过改变采样方向，在多样性和条件一致性之间进行权衡。
9. Flow Matching 直接学习确定性的速度场，将样本从简单分布输运到数据分布。

## 阅读与下载

以下为原始 PDF 材料，可在浏览器中阅读或下载。

- [扩散模型 / SDE / Flow Matching 学习笔记](/downloads/research-notes/diffusion-sde-flow-notes.pdf) · 4 页

## 参考资料

主要来源为孙兵兵在 2025 年发布的微信文章系列，并补充了 cheern 的 Flow Matching 课程：

1. [从布朗运动到 Wiener 过程](https://mp.weixin.qq.com/s/iyyui_SOGU3gj2UJ06Ukbw)
2. [扩散过程的 Lagrangian 与 Eulerian 视角](https://mp.weixin.qq.com/s/XKgtZhLm0TMKsmCkB7SEkg)
3. [SDE、ODE、Fokker–Planck 与 Liouville 方程](https://mp.weixin.qq.com/s/3TyrYG7jFtOAcG0kQZ148w)
4. [Itô 积分与随机项](https://mp.weixin.qq.com/s/oCTG08AqBF3TJtpgoT_stw)
5. [前向与逆向扩散过程](https://mp.weixin.qq.com/s/ZhjlJ29UQUnPVChD2BS9Nw)
6. [逆向 SDE](https://mp.weixin.qq.com/s/8y-OCj8_EzdoklfPyj-0Kw)
7. [Denoising Score Matching](https://mp.weixin.qq.com/s/Lbns01ZwEgu9DeaPlsrLMQ)
8. [VP-SDE](https://mp.weixin.qq.com/s/jVnvT80xDsjF6wPttHqrrQ)
9. [Probability Flow ODE](https://mp.weixin.qq.com/s/OEh5NtOYZ-o4aCxenAAoOg)
10. [Classifier 与 Classifier-Free Guidance](https://mp.weixin.qq.com/s/LHfRgh_tKPqA_Yvhq0Tmuw)
11. [Flow Matching 入门](https://mp.weixin.qq.com/s/n7VobD5yVnkTAzl6Ya4n9g)
12. [Generative AI Lecture 5：Guided Flow Matching](https://mp.weixin.qq.com/s/RNU0maaf_tkIA3w6a5w3EA)

## 笔记来源

本页整理自我的 [Research-Notes](https://github.com/Sjeary/Research-Notes/tree/main/diffusion-models/foundations)，保留原始整理日期与参考资料。完整推导、图示和实验讨论见上方 PDF。
