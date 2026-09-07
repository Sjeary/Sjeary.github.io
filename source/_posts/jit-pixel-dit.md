---
title: "JiT：理解大 Patch 像素空间 DiT"
date: 2025-12-04 12:00:00
updated: 2025-12-04 12:00:00
description: "从像素空间 DiT 的大 Patch 训练困难出发，梳理 JiT 的预测目标、流形解释、实验结果与适用边界。"
categories: ["扩散模型"]
tags: ["DiT","JiT","论文阅读"]
comments:
  enabled: false
---

**技术分享 · 原始整理日期：2025-12-04**

## 概览

这份材料讨论一个极简的像素空间 Diffusion Transformer 在大 Patch 和高维 token 条件下为何难以训练。内容先回顾 DDPM、ADM、VAE、潜空间扩散与 DiT，再分析 JiT 的预测目标、Patch 尺寸实验、基于流形的解释、与潜空间模型的对比，以及方法的局限。

## 关注重点

- 像素空间扩散与潜空间扩散在效率和信息保留方面的权衡。
- Patch 化为何能够降低 attention 成本，同时提高单个 token 的维度。
- 预测干净图像、噪声和速度三种目标之间的区别。
- JiT 在 rectified flow 下采用的 `x`-prediction 与 velocity-space loss。
- 如何用流形假设和固定 hidden dimension 解释大 Patch 的训练困难。
- JiT 对替代 VAE 潜空间扩散能够说明什么，以及不能说明什么。

## 知识脉络

```text
DDPM / ADM
    -> VAE 与潜空间扩散
    -> DiT 与 Patch Token
    -> 像素空间扩散
    -> 大 Patch 与高维 Token
    -> x / epsilon / velocity 预测目标
    -> JiT：x-prediction + velocity loss
    -> 流形解释与实验验证
```

## 核心收获

1. 潜空间扩散通过学习得到的瓶颈提高效率，但 VAE 可能损失细节，并将表征学习与扩散训练分离。
2. 像素空间扩散移除了外部 tokenizer，能够端到端学习，但模型需要直接处理维度更高的输入。
3. 增大 Patch 可以减少 token 数量和二次复杂度的 attention 成本，但单个 token 所代表的原始维度会迅速增加。
4. 当 Patch 维度超过 Transformer 的 hidden dimension 时，输入投影会形成明显的压缩瓶颈。
5. 论文从流形视角解释这一现象：干净图像集中在较低维的结构附近，而高斯噪声会填充高维环境空间。
6. JiT 输出干净图像预测，并在 rectified-flow 形式下通过等价的 velocity-space loss 进行训练。
7. 论文实验表明，velocity prediction 在小 Patch 下仍有竞争力，而 clean-image prediction 在大 Patch 下明显更好。
8. Patch 尺寸、预测目标、模型容量和数据空间需要联合评估，不能被视为相互独立的设计选择。
9. JiT 更适合被理解为面向大 Patch 像素 DiT 的专门方案，不能据此推导所有扩散模型都应采用干净图像预测。
10. 简单的 patchify/unpatchify 设计仍需要较高计算成本，也没有消除促使潜空间扩散产生的表征与效率权衡。

## 阅读与下载

以下为原始 PDF 材料，可在浏览器中阅读或下载。

- [JiT：理解大 Patch 像素空间 DiT](/downloads/research-notes/jit-pixel-dit.pdf) - 95 页

## 参考资料

- Li and He, [Back to Basics: Let Denoising Generative Models Denoise](https://arxiv.org/abs/2511.13720)
- Peebles and Xie, [Scalable Diffusion Models with Transformers](https://arxiv.org/abs/2212.09748)
- Rombach et al., [High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752)
- Ho et al., [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239)
- Esser et al., [Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206)

## 笔记来源

本页整理自我的 [Research-Notes](https://github.com/Sjeary/Research-Notes/tree/main/diffusion-models/jit-pixel-dit)，保留原始整理日期与参考资料。完整推导、图示和实验讨论见上方 PDF。
