---
title: "3D Gaussian Splatting"
date: 2026-05-28 12:00:00
updated: 2026-05-28 12:00:00
description: "串联 3D 高斯表示、相机投影、Alpha Blending、可微渲染和优化，并梳理几何、语义与生成方向的扩展。"
categories: ["3D 视觉"]
tags: ["3D Gaussian Splatting","可微渲染","论文阅读"]
comments:
  enabled: false
---

**技术分享 · 原始整理日期：2026-05-28**

## 概览

这份材料梳理了从多视角图像和相机参数到渲染图像监督的完整流程：显式 3D 高斯表示、相机投影、屏幕空间 footprint、alpha blending、可微渲染、致密化与参数优化。随后进一步讨论后续工作如何将高斯基元扩展到几何、语义、语言、编辑、生成和建图任务。

## 关注重点

- 将世界空间中的 3D 高斯连接到图像像素的坐标变换。
- 3D 协方差如何在局部投影下变换为 2D 椭圆 footprint。
- 从前向后的 alpha blending 与考虑可见性的颜色累积。
- 渲染图像损失如何通过可微过程反向更新高斯参数。
- 致密化、剪枝、初始化，以及渲染质量与几何精度之间的差距。
- 后续工作如何为高斯表示加入几何、语义、语言和身份特征。

## 知识脉络

```text
多视角图像 + 相机参数
    -> 显式 3D 高斯
    -> 世界坐标到相机坐标
    -> 透视投影
    -> 2D 高斯 Footprint
    -> Alpha Blending
    -> 可微渲染
    -> 损失与高斯参数优化
    -> 新视角渲染
    -> 几何 / 语义 / 生成 / 建图
```

## 核心收获

1. 3DGS 使用显式高斯基元表示场景，每个基元包含位置、尺度、旋转、不透明度和视角相关颜色。
2. 相机外参将高斯中心从世界坐标变换到相机坐标；内参与透视除法共同决定其图像位置。
3. 仅投影高斯中心并不充分，还需要变换协方差，才能确定屏幕空间 footprint 的大小、方向和柔和程度。
4. 通过正尺度和旋转参数化协方差，可以在优化过程中保持其有效性。
5. 多个 footprint 按深度从前向后合成；每项贡献取决于局部不透明度，以及更近高斯透射后剩余的 transmittance。
6. 渲染器是可微的，因此图像空间误差可以更新位置、协方差、不透明度和颜色参数。
7. 自适应致密化在梯度表明表示不足的位置增加细节，剪枝则移除作用较小的基元。
8. 较高的渲染质量并不必然意味着准确的表面或深度，尤其是在视角稀疏、纹理较弱、存在反射或初始化较差时。
9. 后续方法在保留显式表示和渲染器的同时，为高斯加入深度、语义、语言或身份特征。
10. 比较后续方法时，可以关注它们增加了哪些高斯属性，以及修改了初始化、训练或渲染流程中的哪一部分。

## 阅读与下载

以下为原始 PDF 材料，可在浏览器中阅读或下载。

- [3D Gaussian Splatting 技术分享](/downloads/research-notes/3d-gaussian-splatting.pdf) - 87 页

## 参考资料

- Kerbl et al., [3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://arxiv.org/abs/2308.04079)
- [3D Gaussian Splatting 官方项目](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/)
- Lei Mao, [Camera Intrinsics and Extrinsics](https://leimao.github.io/blog/Camera-Intrinsics-Extrinsics/)
- PyTorch3D, [Cameras](https://pytorch3d.org/docs/cameras)
- Hugging Face, [Introduction to 3D Gaussian Splatting](https://huggingface.co/blog/gaussian-splatting)
- Shi Yan, [How to Render a Single Gaussian Splat](https://shi-yan.github.io/how_to_render_a_single_gaussian_splat/)
- [Gaussian Splatting Notes](https://github.com/kwea123/gaussian_splatting_notes)
- [Awesome 3D Gaussian Splatting Applications](https://github.com/heshuting555/Awesome-3DGS-Applications)

## 笔记来源

本页整理自我的 [Research-Notes](https://github.com/Sjeary/Research-Notes/tree/main/3d-vision/3d-gaussian-splatting)，保留原始整理日期与参考资料。完整推导、图示和实验讨论见上方 PDF。
