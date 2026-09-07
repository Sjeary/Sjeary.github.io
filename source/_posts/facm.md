---
title: "FACM：Flow-Anchored Consistency Models"
date: 2025-08-21 12:00:00
updated: 2025-08-21 12:00:00
description: "从扩散与 Flow 的理论基础到 FACM 论文，理解瞬时速度锚点与少步一致性生成；附两份完整分享材料。"
categories: ["扩散模型"]
tags: ["Flow Matching","Consistency Models","论文阅读"]
comments:
  enabled: false
---

**技术分享 · 原始整理日期：2025-08-21**

## 概览

两份材料从不同层次梳理这一主题。理论基础部分从扩散 SDE 和 Fokker–Planck 方程出发，依次连接 Probability Flow ODE、Continuous Normalizing Flow、Flow Matching 与一致性模型。论文阅读部分进一步聚焦 FACM：利用 Flow Matching 学到的瞬时速度，为少步一致性捷径所使用的平均速度提供锚点。

## 关注重点

- SDE 与 Probability Flow ODE 为何能够共享相同的时变边缘分布。
- Flow Matching 如何在不模拟完整轨迹的情况下监督瞬时速度场。
- 为什么一致性映射可以解释为剩余时间区间上的平均速度。
- FACM 如何在同一个模型中结合 FM 锚点与一致性捷径。
- Expanded-time、auxiliary-time 条件方式，基于 JVP 的训练，以及一至两步推理。

## 知识脉络

```text
扩散 SDE
    -> Fokker-Planck 方程
    -> Probability Flow ODE
    -> Continuous Normalizing Flow
    -> Flow Matching：瞬时速度
    -> Consistency Model：平均速度 / 捷径
    -> FACM：锚点 + 捷径
```

## 核心收获

1. Fokker–Planck 方程可以改写为连续性方程，从而得到与扩散 SDE 具有相同边缘分布的确定性 Probability Flow ODE。
2. Flow Matching 学习局部、瞬时的输运方向；一致性模型则尝试直接预测通向终点的映射。
3. 在分享材料采用的参数化下，一致性输出可理解为“剩余位移除以剩余时间”，即一段时间区间上的平均速度。
4. FACM 论文指出，只训练捷径目标会使瞬时速度场缺少约束，并导致自指形式的导数目标不稳定。
5. FACM 使用同一个网络承担两项任务：Flow Matching 提供锚点，一致性目标提供捷径。
6. Expanded-time conditioning 将 FM 与 CM 目标放入相邻时间区间；auxiliary-time conditioning 则在不扩展时间范围的情况下提供另一种条件方式。
7. Jacobian-vector product 用于计算连续一致性关系中沿轨迹方向的导数。
8. 推理时可以一步直接使用一致性映射，也可以通过短时间表进行两次或更多次评估；Flow teacher 只在训练阶段使用。
9. 论文中的消融实验表明，在不同 backbone 下持续保留 Flow Matching 锚点，是稳定性提升的主要来源。

## 阅读与下载

以下为原始 PDF 材料，可在浏览器中阅读或下载。

- [理论基础：扩散、Flow 与一致性模型](/downloads/research-notes/facm-foundations.pdf) - 48 页
- [论文阅读：FACM 方法与实验](/downloads/research-notes/facm-paper-reading.pdf) - 35 页

## 参考资料

- Peng et al., [FACM: Flow-Anchored Consistency Models](https://arxiv.org/abs/2507.03738)
- Lipman et al., [Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747)
- Song et al., [Consistency Models](https://arxiv.org/abs/2303.01469)
- Song et al., [Score-Based Generative Modeling through Stochastic Differential Equations](https://arxiv.org/abs/2011.13456)
- Chen et al., [Neural Ordinary Differential Equations](https://arxiv.org/abs/1806.07366)

## 笔记来源

本页整理自我的 [Research-Notes](https://github.com/Sjeary/Research-Notes/tree/main/diffusion-models/facm)，保留原始整理日期与参考资料。完整推导、图示和实验讨论见上方 PDF。
