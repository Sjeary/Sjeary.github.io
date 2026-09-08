---
title: JiT：理解大 Patch 像素空间 DiT
date: 2025-12-04 12:00:00
updated: 2026-09-07 00:00:00
description: 从 Patch 维度与注意力成本出发，推导 JiT 的图像预测和速度损失，解释信息瓶颈、流形假设、消融实验及 CFG interval。
categories: [扩散模型]
tags: [DiT, JiT, 论文阅读]
comments:
  enabled: false
---

**技术分享 · 原始报告日期：2025-12-04**

将潜空间 DiT 直接搬到像素空间时，一个很自然的做法是增大 Patch：Token 数量变少，注意力计算便宜了。但实验中，沿用噪声或速度预测，生成质量可能严重退化。

JiT（Just image Transformer）研究了这个看似简单的迁移问题。它让网络直接预测干净图像，再在速度空间计算损失，展示了大 Patch 像素空间 Transformer 的可训练性。

本文由 95 页组会报告整理而来，保留“背景—方法—解释—实验—个人分析”的主线，并将实现附录并入对应章节。文中的实验数字来自原论文，未在此重新训练模型。

## 为什么图像生成会引入潜空间

DDPM 在图像上定义加噪与去噪过程，ADM 等工作进一步改进网络和条件引导。但高分辨率图像本身具有很高的维度，每次训练或采样都直接处理像素，会产生明显成本。

Latent Diffusion 的思路是先压缩图像，再在压缩空间训练生成模型：

$$
x\xrightarrow{\mathrm{Encoder}}z
\xrightarrow{\mathrm{Diffusion}}z'
\xrightarrow{\mathrm{Decoder}}\widehat x.
$$

理解这条路线，可以先回顾 VAE 的目标：

$$
\begin{aligned}
\log p_\theta(x)
\geq{}&
\mathbb E_{q_\phi(z\mid x)}[\log p_\theta(x\mid z)]\\
&-\mathrm{KL}\big(q_\phi(z\mid x)\|p(z)\big).
\end{aligned}
$$

第一项鼓励重建，第二项约束潜变量分布。重参数化写作：

$$
z=\mu_\phi(x)+\sigma_\phi(x)\odot\epsilon.
$$

潜空间提高了后续建模效率，同时引入了一个需要权衡的瓶颈：过强压缩会损失细节，过大潜空间又会增加生成模型的负担。用于实际 LDM 的图像自编码器也可能使用感知或对抗目标，不能将所有实现等同于最基础的 VAE。

JiT 选择直接在像素空间定义生成过程。这移除了独立自编码器阶段，但如何让高维像素适合 Transformer，仍然需要回答。

## Patch 同时改变了两种维度

对 $H\times W$ 的 RGB 图像，使用边长为 $p$ 的不重叠 Patch：

$$
N=\frac Hp\frac Wp,\qquad d_{\mathrm{patch}}=3p^2.
$$

$N$ 是 Token 数，$d_{\mathrm{patch}}$ 是每个 Patch 展平后的原始维度。进入 Transformer 前，还会经过一次投影，变成宽度为 $D$ 的内部特征。

标准全局注意力中的矩阵乘法部分约为：

$$
O(N^2D).
$$

这里的 $D$ 是注意力内部宽度，不是 RGB 的 3 个通道。整个 Transformer 还包括投影与 MLP 等计算，不能仅凭 $N^2D$ 估算全部开销。

以 256×256 图像为例：

| Patch 边长 | Token 数 $N$ | 每个 Patch 的原始维度 |
| --- | --- | --- |
| 2 | 16,384 | 12 |
| 8 | 1,024 | 192 |
| 16 | 256 | 768 |
| 32 | 64 | 3,072 |

增大 Patch 减少了 Token 间通信的代价，却提高了单个 Token 所对应的输入和输出维度。高分辨率也可以通过同比增大 Patch 来保持相同 Token 数：

| 图像大小 | Patch | Token 数 | 原始 Patch 维度 |
| --- | --- | --- | --- |
| 256×256 | 16×16 | 256 | 768 |
| 512×512 | 32×32 | 256 | 3,072 |
| 1024×1024 | 64×64 | 256 | 12,288 |

所以，“序列长度相同”不代表模型面对的任务同样容易。

## 数学上可转换的预测量，训练时未必同样容易

采用从噪声到数据的线性路径：

$$
z_t=tx+(1-t)\epsilon,\qquad t\in[0,1].
$$

其中 $x$ 为干净图像，$\epsilon$ 为噪声，$t=0$ 为噪声端。对应条件速度：

$$
v=x-\epsilon=\frac{x-z_t}{1-t}.
$$

对于 $0<t<1$，可以在干净图像、噪声和速度之间转换。例如：

$$
\begin{aligned}
x&=z_t+(1-t)v,\\
\epsilon&=z_t-tv.
\end{aligned}
$$

转换关系成立，并不意味着直接输出不同变量的有限网络会遇到同样的优化问题。尤其在输入投影形成瓶颈时，模型要保留和重建的信息可能不同。

这里还要把两个设计选择分开：

- **预测空间**：神经网络的直接输出代表什么。
- **损失空间**：经过必要转换后，在哪个变量上计算误差。

“使用速度损失”并不意味着网络必须直接预测速度。

## JiT 的核心：图像预测，加上速度损失

JiT 令网络直接输出 $x_\theta(z_t,t)$，再转换成速度：

$$
v_\theta(z_t,t)=\frac{x_\theta(z_t,t)-z_t}{1-t}.
$$

训练目标为：

$$
\mathcal L
=\mathbb E\|v_\theta(z_t,t)-v\|_2^2.
$$

将目标与预测同时展开，可以得到：

$$
v_\theta-v=\frac{x_\theta-x}{1-t},
$$

因此：

$$
\mathcal L
=
\mathbb E\left[
\frac{\|x_\theta-x\|_2^2}{(1-t)^2}
\right].
$$

这说明它在图像误差上引入了依赖时间的权重。接近数据端时，分母变小，相同图像误差会受到更强惩罚。但整体训练关注哪些时刻，还同时取决于时间采样分布，不能只看这一项权重。

### 分母裁剪的含义

当 $t$ 接近 1 时，误差会按反幂次放大。实现采用：

$$
d_t=\max(1-t,0.05).
$$

在作者提供的 PyTorch 实现中，预测与目标使用同一个 $d_t$：

$$
\widetilde v_\theta=\frac{x_\theta-z_t}{d_t},
\qquad
\widetilde v=\frac{x-z_t}{d_t}.
$$

因此裁剪后的损失仍可写成：

$$
\|\widetilde v_\theta-\widetilde v\|^2
=\frac{\|x_\theta-x\|^2}{d_t^2}.
$$

这限制了高信噪比区域的损失权重。只裁剪预测的分母而不裁剪目标，会得到不同的训练目标。可对照[官方去噪器实现](https://github.com/LTH14/JiT/blob/main/denoiser.py)。

下面用一个函数表示这一训练计算。它假设传入的模型接收图像、时间和类别标签；不包含优化器、EMA 或类别丢弃等完整训练流程。

~~~python
import torch

def jit_training_loss(model, x, labels, noise_scale=1.0):
    batch = x.shape[0]
    t = torch.sigmoid(
        -0.8 + 0.8 * torch.randn(batch, device=x.device)
    )
    time = t.reshape(batch, 1, 1, 1)
    noise = noise_scale * torch.randn_like(x)
    z = time * x + (1 - time) * noise

    x_pred = model(z, t, labels)
    denominator = (1 - time).clamp_min(0.05)
    target_velocity = (x - z) / denominator
    predicted_velocity = (x_pred - z) / denominator
    return (predicted_velocity - target_velocity).square().mean()
~~~

### 时间采样与噪声尺度

报告采用 logit-normal 时间采样：

$$
s\sim\mathcal N(\mu,\sigma^2),\qquad t=\operatorname{sigmoid}(s),
$$

其中 $\mu=-0.8$、$\sigma=0.8$。这里 $\sigma$ 是标准差，方差是 $0.64$。

按照本文的时间方向，减小 $\mu$ 会让样本更偏向高噪声端。报告还讨论了高分辨率设置：保持相同 Token 数时，单个 Patch 包含更多像素，需要结合分辨率调整噪声尺度。具体尺度应与模型配置一起记录，不能仅保存一个 Patch 大小。

## 流形假设如何解释预测目标的差别

自然图像虽然位于很高维的像素空间中，但其中具有边缘、纹理、对象结构和大量统计相关性。流形假设用“数据集中在较低维结构附近”来描述这种现象。

各向同性高斯噪声没有同样的图像结构，各维通常具有独立自由度。在一个压缩后的内部表示上，输出干净图像和重建原始噪声残差，可能提出不同的信息要求。

这里有两个容易误解的地方：

1. **生成高斯噪声本身很容易。** 困难不是从标准高斯取样，而是模型在给定带噪输入和有限结构下，回归与当前样本对应的高维噪声或速度。
2. **流形解释不是任意数据集上的保证。** 它帮助解释论文的实验现象，不能单凭这一假设计算出一个通用的最优网络宽度。

报告中的 Toy 实验将低维数据嵌入到更高维环境，再比较不同预测目标。随着环境维度增加，图像预测仍能利用原有结构，而噪声或速度预测在所测网络中更容易退化。这为“大维度下预测什么很重要”提供了受控例子。

## Bottleneck Patch Embedding 为什么反而有帮助

JiT 可以先将原始 Patch 压到较小的中间维度，再映射到 Transformer 的宽度：

$$
3p^2\longrightarrow d'\longrightarrow D.
$$

以报告中的 JiT-B/16 为例：

| 阶段 | 张量形状 |
| --- | --- |
| 输入图像 | $(B,3,256,256)$ |
| Patch 卷积，核大小与步长均为 16 | $(B,128,16,16)$ |
| 1×1 通道投影 | $(B,768,16,16)$ |
| 展平成序列 | $(B,256,768)$ |

中间维度 $d'=128$ 与内部宽度 $D=768$ 承担不同作用。前者限制每个独立 Patch 初始保留的线性信息，后者决定后续计算的表示宽度。

如果两个投影之间没有非线性，组合线性映射的秩不会超过 $d'$。不过，进入 Transformer 后，每个 Token 可以利用其他 Token 和条件信息，所以不能进一步断言它以后只能包含最初那个 Patch 的信息。

报告将这种投影比作可学习压缩；它没有 PCA 的方差最大化或正交约束，因此不是严格的 PCA。相关实验表明，较强瓶颈仍可得到合理的图像生成结果，支持了图像 Patch 存在大量结构与冗余的解释。

## 用实验把预测空间和损失空间分开

下面按原论文表 2 重排关键实验。数值为 **FID-50K，训练 200 epochs，使用 CFG**。两组设置分别对应 768 维与 48 维原始 Patch。

### ImageNet 256×256，JiT-B/16

| 损失空间 | 直接预测图像 | 直接预测噪声 | 直接预测速度 |
| --- | --- | --- | --- |
| 图像损失 | 10.14 | 379.21 | 107.55 |
| 噪声损失 | 10.45 | 394.58 | 126.88 |
| 速度损失 | **8.62** | 372.38 | 96.53 |

### ImageNet 64×64，JiT-B/4

| 损失空间 | 直接预测图像 | 直接预测噪声 | 直接预测速度 |
| --- | --- | --- | --- |
| 图像损失 | 5.76 | 6.20 | 6.12 |
| 噪声损失 | 3.56 | 4.02 | 3.76 |
| 速度损失 | 3.55 | 3.63 | **3.46** |

数值来源：[原论文表 2](https://arxiv.org/html/2511.13720v1#S4.T2)。

大 Patch 组中，选择图像预测产生了显著差别；小 Patch 组中，速度预测仍然很强。这比“所有扩散都该预测图像”更准确。

两张表同时改变了分辨率和 Patch 大小，单独比较它们不能完全分离两个因素。还需要结合论文中的高维 Toy、噪声调度和瓶颈实验理解机制。原报告中的额外控制变量设想，可以作为后续复现实验的设计，不能直接写成已经完成的个人实验。

### 噪声调度能否补救预测目标

报告还引用了 JiT-B/16 的时间分布消融：

| $\mu$ | 图像预测的 FID |
| --- | --- |
| 0.0 | 14.44 |
| -0.4 | 9.79 |
| -0.8 | **8.62** |
| -1.2 | 8.99 |

适当改变噪声水平有帮助，但对应实验中的噪声预测和速度预测仍然表现很差。调度与预测目标都需要考虑，不能假定一个可以完全补偿另一个。

### 附录实验提供了哪些补充证据

| 实验 | 观察重点 |
| --- | --- |
| 同一速度损失下的训练曲线与去噪图 | 检查不同直接输出参数化的优化差异 |
| 改变瓶颈维度 | 检查图像预测对输入压缩的容忍程度 |
| EDM 风格预条件 | 加入输入跳连后，网络实际承担的残差任务会改变 |
| 额外分类监督 | 一些配置中有小幅改善，但主实验没有采用 |
| 高低分辨率生成后重采样 | 下采样与上采样的效果不同，不能把上采样当成学到了高频细节 |
| Precision / Recall 与定性样本 | 结合保真度和覆盖情况理解 FID，不靠单一分数下结论 |

这些消融属于各自的具体设置，不应把不同训练长度、模型大小和引导策略下的最优数值拼成一组“统一配置”。

## 现代 DiT 组件与条件注入

报告讨论的结构组件包括 SwiGLU、RMSNorm、RoPE 和 QK normalization：

- SwiGLU 提供门控的非线性变换。
- RMSNorm 按均方根归一化，不执行 LayerNorm 的减均值操作。
- RoPE 将位置信息编码进注意力相关表示。
- QK normalization 控制注意力输入的尺度。

这些组件与预测目标是不同维度的设计。不能把“使用了某个归一化”当作解释大 Patch 实验现象的全部原因。

类别信息除了通过常规条件调制注入，也可以用一组 In-context class tokens 表达。报告给出的示例是 32 个类别 Token，在指定层加入序列。较大的模型还使用 dropout 和基于评估的早停，并比较不同 EMA 权重。

## CFG interval：先确认系数约定

采用：

$$
v_{\mathrm{cfg}}
=v_{\mathrm{uncond}}
+w(t)(v_{\mathrm{cond}}-v_{\mathrm{uncond}}).
$$

在这个定义下：

- $w=0$ 是无条件预测。
- $w=1$ 是普通条件预测。
- $w>1$ 才是超出普通条件预测的引导增强。

因此，“不额外使用 CFG”应该恢复 $w=1$，不能误写成 $w=0$。

CFG interval 让增强仅在指定时间段内生效：

$$
w(t)=
\begin{cases}
w_{\mathrm{strong}}, & t\in\mathcal I,\\
1, & t\notin\mathcal I.
\end{cases}
$$

原报告讨论的配置采用接近 $[0.1,1]$ 的引导区间，具体端点判断以实现为准。官方 PyTorch 代码在区间外使用系数 1。这样保留基本条件生成，只限制额外引导出现的阶段。

## 与 LDM 的比较，以及我的理解

可以用“一个 Token 对应多大图像范围”来比较两条路线。例如，下采样 8 倍的自编码器，接上潜空间 Patch=2 的 DiT，在网格尺度上对应约 16×16 的输入区域。

但这只是采样网格的比较，不是严格的等价关系：卷积编码器的实际感受野会跨越邻域，而且做了多层非线性处理。它与直接对一个独立 16×16 Patch 做线性投影具有不同的信息路径。

| 比较点 | 潜空间生成 | JiT 式像素空间生成 |
| --- | --- | --- |
| 状态空间 | 自编码器潜变量 | 原始像素 |
| 表示学习 | 通常包含独立自编码器阶段 | 与去噪模型一同训练 |
| 主要瓶颈 | 潜空间分辨率、通道与重建能力 | Patch 投影、模型容量与预测目标 |
| 工程代价 | 需要自编码器及其训练或权重 | 仍需大规模像素生成训练 |
| 阅读重点 | 表示损失与生成目标是否匹配 | 高维状态经过瓶颈后如何预测 |

我更倾向于把 JiT 看成一个解释清楚的案例：空间选择、Patch 大小、网络宽度、直接输出和损失权重，需要放在一起分析。

报告提到的更强编码与解码结构，是值得探索的方向；是否能取代某种 VAE 路线，需要在同样数据、算力和评估协议下验证。JiT 本身没有给出“所有像素模型更高效”或“所有潜空间方案都应被替换”的结论。

与其他工作的联系也可以按设计维度来读：SD3 提供了相关的 Flow 与时间采样经验；SiD2 代表另一类多尺度像素生成路线；PixelFlow、PixelNerd 等探索不同的生成或解码组织。比较时要回到各自的完整方法和实验设置。

## 原始报告与延伸阅读

[阅读或下载 95 页 JiT 原始报告](/downloads/research-notes/jit-pixel-dit.pdf)

| 本文主题 | 原报告页码 |
| --- | --- |
| VAE、潜空间与 Patch 背景 | 4–19 |
| 图像预测、速度损失与结构 | 24–40 |
| 流形解释与个人分析 | 42–61 |
| 相关工作与研究启发 | 63–72 |
| 配置、消融和 CFG interval | 75–95 |

- Li and He, [Back to Basics: Let Denoising Generative Models Denoise](https://arxiv.org/abs/2511.13720) · [作者的 PyTorch 实现](https://github.com/LTH14/JiT)
- Peebles and Xie, [Scalable Diffusion Models with Transformers](https://arxiv.org/abs/2212.09748)
- Rombach et al., [High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752)
- Ho et al., [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239)
- Esser et al., [Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206)
