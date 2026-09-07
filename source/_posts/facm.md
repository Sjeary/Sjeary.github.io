---
title: FACM：用瞬时速度稳定一致性模型
date: 2025-08-21 12:00:00
updated: 2026-09-07 00:00:00
description: 合并两份 FACM 报告，从 SDE 与 Flow 的联系推导一致性模型的平均速度，再讲清双任务条件、JVP、训练目标和少步采样。
categories: [扩散模型]
tags: [Flow Matching, Consistency Models, 论文阅读]
comments:
  enabled: false
---

**技术分享 · 原始报告日期：2025-08-21**

一个 Flow 模型已经能把噪声逐步变成图像，为什么再训练一个“一步到终点”的模型，反而会不稳定？FACM 讨论的就是这个问题：少步生成需要学习跨越整段轨迹的映射，但训练过程中仍然需要明确约束底层的瞬时速度。

本文合并了 48 页前置理论报告与 35 页论文阅读报告。先建立 Diffusion、Flow 和 Consistency 的数学联系，再展开 FACM 的训练流程、实现细节和实验结论。报告中的重复目录与过渡页已合并，原始 PDF 保留在文末。

## 先分清四个对象

本文在讨论 Flow 与 FACM 时统一采用 $t=0$ 为噪声、$t=1$ 为数据的时间方向。

| 符号 | 含义 |
| --- | --- |
| $x_t$ | 生成轨迹上时刻 $t$ 的状态 |
| $v(x_t,t)$ | 轨迹的瞬时速度，满足 $\dot x_t=v(x_t,t)$ |
| $F_\theta(x_t,t)$ | 网络预测的剩余区间平均速度 |
| $f_\theta(x_t,t)$ | 由平均速度构造的终点映射 |

最后两个对象容易混淆：网络 $F_\theta$ 输出的是一个速度形式的量，而真正给出干净样本的是 $f_\theta$。本文始终使用这个区分。

## 从 Diffusion 到 Flow：联系在密度演化方程里

前置报告先从连续时间扩散出发。对于扩散系数只依赖时间、空间各向同性的 SDE：

$$
dX_t=b(X_t,t)\,dt+g(t)\,dW_t,
$$

其概率密度满足：

$$
\partial_t p_t
=-\nabla\cdot(b p_t)+\frac12g^2\Delta p_t.
$$

利用 $\nabla p_t=p_t\nabla\log p_t$，可将右侧整理为：

$$
\partial_t p_t=
-\nabla\cdot
\left[
p_t\left(b-\frac12g^2\nabla\log p_t\right)
\right].
$$

这与确定性 ODE 的连续性方程相同，所以可以选择：

$$
\dot X_t=b(X_t,t)-\frac12g(t)^2\nabla\log p_t(X_t).
$$

这就是与原 SDE 同边缘的 Probability Flow ODE。这里的 SDE 时间沿用其前向定义；实际生成可以逆向积分。转到下面的 Flow Matching 时，重新把生成方向记为 $0\to1$。

这个推导说明两种描述可以共享密度路径，但不表示所有 Flow Matching 都必须从某个扩散 SDE 推导而来，也不表示 ODE 和 SDE 的单条轨迹相同。更基础的展开见[扩散模型、SDE 与 Flow 基础](/blog/2025/07/diffusion-sde-flow/)。

### CNF 与 Flow Matching 分别解决什么

Continuous Normalizing Flow 用神经网络定义连续动力系统：

$$
\dot x_t=v_\theta(x_t,t).
$$

Flow Matching 则提供一种训练这个速度场的方式。选取噪声 $x_0$、数据 $x_1$ 和条件路径：

$$
x_t=(1-t)x_0+tx_1,
\qquad
u_t=x_1-x_0,
$$

就可以优化条件回归目标：

$$
\mathcal L_{\mathrm{CFM}}
=
\mathbb E\left\|
v_\theta(x_t,t)-u_t
\right\|_2^2.
$$

为什么监督条件速度，却能学到边缘速度？令 $\bar u_t(x)=\mathbb E[u_t\mid x_t=x]$，平方损失可以分解为：

$$
\begin{aligned}
\mathbb E\|v_\theta-u_t\|^2
&=\mathbb E\|v_\theta-\bar u_t\|^2\\
&\quad+\mathbb E\|u_t-\bar u_t\|^2.
\end{aligned}
$$

第二项与模型参数无关，所以两种目标具有相同梯度和最优回归函数。实际计算使用可采样的条件速度，避免显式求解边缘向量场。

这里仍然需要数值积分。即使条件插值是直线，边缘场的生成轨迹也未必笔直，不能据此认为一步 Euler 更新总是足够。

## 从 Flow 到 Consistency：把终点写成平均速度

一个理想的一致性映射，需要将同一条底层 ODE 轨迹上的任意状态映射到同一个终点：

$$
f_\theta(x_t,t)=f_\theta(x_s,s)=x_1.
$$

采用参数化：

$$
f_\theta(x_t,t)=x_t+(1-t)F_\theta(x_t,t),
$$

便自动满足边界条件 $f_\theta(x,1)=x$。

当映射正确时：

$$
F_\theta(x_t,t)=\frac{x_1-x_t}{1-t}.
$$

右侧是“剩余位移除以剩余时间”，也就是平均速度。它还可以写成沿底层轨迹的积分：

$$
\overline v(x_t,t)
=\frac{1}{1-t}\int_t^1v(x_s,s)\,ds.
$$

瞬时速度回答现在往哪里走，平均速度回答剩余路程如何一次跨越。二者在一般曲线轨迹上并不相等。

### 连续一致性方程怎样推出来

理想终点映射沿轨迹保持常数，因此：

$$
\frac{d}{dt}f_\theta(x_t,t)=0.
$$

将参数化代入，并使用 $\dot x_t=v(x_t,t)$：

$$
0=v-F_\theta+(1-t)\frac{dF_\theta(x_t,t)}{dt}.
$$

整理得到：

$$
F_\theta=v+(1-t)D_tF_\theta,
$$

其中：

$$
D_tF_\theta
=\partial_tF_\theta+(\nabla_xF_\theta)v.
$$

$D_t$ 是沿轨迹的全导数，既包含时间输入的变化，也包含状态随时间移动产生的变化。只计算 $\partial_tF_\theta$ 会漏掉后一项。

当 $t\to1$ 且导数项有界时，平均速度趋近于终点的瞬时速度。这也是 FACM 在两项任务之间设置共同边界的依据。

## 为什么只训练捷径会不稳定

从上式可以构造学习目标：

$$
T(F)=v+(1-t)D_tF.
$$

问题在于，目标右侧包含模型自身的导数。模型既要预测终点方向，又要用自己当前的变化率生成监督。如果导数估计不可靠，目标会随着网络的错误一起移动。

报告按照论文的解释，把问题分成两部分：

1. **瞬时速度缺少持续监督。** 即使模型经过 Flow Matching 预训练，后续仅优化一致性目标，也可能逐渐失去原先对底层速度场的表示。
2. **目标具有自指关系。** 当前网络的导数参与构造下一步目标，容易形成误差相互放大的反馈。

这是一种针对连续一致性训练的机制解释和实验观察，不能把它理解为所有一致性模型都会崩溃的普遍定理。FACM 的处理是保留一项显式的速度回归，让共享网络持续接触稳定的底层目标。

## 同一个网络，同时学习瞬时速度与平均速度

FACM 的总目标为：

$$
\mathcal L_{\mathrm{FACM}}
=\mathcal L_{\mathrm{FM}}+\mathcal L_{\mathrm{CM}}.
$$

同一个输入状态 $x_t$ 对应两种输出含义，需要使用不同条件来区分任务。

| 条件方案 | CM：平均速度 | FM：瞬时速度 |
| --- | --- | --- |
| 扩展时间区间 | $c_{\mathrm{CM}}=t$ | $c_{\mathrm{FM}}=2-t$ |
| 辅助时间条件 | $(t,r)=(t,1)$ | $(t,r)=(t,t)$ |

### 扩展时间区间

在扩展方案中，CM 的条件落在 $[0,1]$，FM 的条件落在 $[1,2]$。两个分支使用同一个真实状态 $x_t$，改变的是传入网络的条件标签，不是重新采样一个“物理时间为 $2-t$”的状态。

在 $t=1$ 处，两种标签相遇；平均速度也在适当条件下趋于瞬时速度。这样既能区分任务，也有自然的边界衔接。

### 辅助时间条件

另一个方案额外提供终点条件 $r$。当 $r=1$ 时预测到终点的平均速度，当 $r=t$ 时预测当前位置的瞬时速度。

报告引用的消融结果显示，两种方案都有效，扩展区间在所比较配置中表现更好。它是该实验设定下的结论，不意味着所有模型都应固定选择同一种条件编码。

## 两路损失怎样写

### FM 分支持续回归速度

用 $v_{\mathrm{anchor}}$ 表示训练用的瞬时速度目标，基本损失为：

$$
\mathcal L_{\mathrm{FM}}
=
\mathbb E\left[
\|F_\theta(x_t,c_{\mathrm{FM}})-v_{\mathrm{anchor}}\|_2^2
+L_{\cos}(F_\theta,v_{\mathrm{anchor}})
\right].
$$

余弦项补充方向上的约束：

$$
L_{\cos}(a,b)
=1-\frac{\langle a,b\rangle}{\|a\|_2\|b\|_2}.
$$

实现中需要处理零范数等数值情况。速度目标的来源取决于训练方式：

- 从头训练的基本形式使用条件速度 $x_1-x_0$。
- 蒸馏时由冻结的 Flow 教师提供速度。
- 如果加入条件引导，应保持教师、训练目标和推理时使用的引导约定一致。

本文先用不展开 CFG 的形式解释两路目标；具体 guidance 与损失设置见原论文及官方实现。

### CM 分支使用带停梯度的修正目标

记 $F^-=\operatorname{sg}(F_{\mathrm{CM}})$，其中停梯度作用于训练目标。先计算：

$$
T=v_{\mathrm{anchor}}
+(1-t)\operatorname{sg}(D_tF_{\mathrm{CM}}).
$$

再得到并限制一致性残差：

$$
g=\operatorname{clip}(F^- -T,-1,1).
$$

目标取为：

$$
v_{\mathrm{tar}}=F^- -\alpha(t)g.
$$

如果没有触发残差裁剪，可以把它改写成：

$$
v_{\mathrm{tar}}
=(1-\alpha(t))F^-+\alpha(t)T.
$$

裁剪生效时，后一条未裁剪的插值公式与实际目标不再完全相等。整理报告时需要保留这个区别，避免讲解公式与实现混用。

最后使用带时间权重的距离函数：

$$
\mathcal L_{\mathrm{CM}}
=
\mathbb E\left[
\beta(t)\,
d_{\mathrm{norm}}(F_{\mathrm{CM}},v_{\mathrm{tar}})
\right].
$$

报告用这一形式表达“逐步靠近一致性目标”的思路；原论文对归一化距离和权重给出了具体定义。它们不应在复现时未经说明地换成普通 MSE。

## JVP 与训练流程

JVP 是 Jacobian-vector product。对于以 $(x,t)$ 为输入的 CM 包装函数，沿轨迹的切向量是 $(v_{\mathrm{anchor}},1)$：

$$
D_tF
=
\operatorname{JVP}
\left(F,(x_t,t),(v_{\mathrm{anchor}},1)\right).
$$

直观上，把时间增加一个小量时，状态应同步沿速度方向移动。JVP 计算的是两者共同引起的输出变化，不需要显式构造完整 Jacobian。

如果网络直接接收 $(x,t,r)$，而 CM 分支固定 $r=1$，对应切向为 $(v_{\mathrm{anchor}},1,0)$。下面的包装函数将固定条件封装进去，因此调用者仍然只传 $(x,t)$。

以下是整理后的**教学伪代码**，用于辨认数据流；它省略完整模型、CFG、损失归一化和训练调度，不能直接作为论文复现结果使用。

~~~python
# Expanded Time Interval: t=0 is noise, t=1 is data.
xt = (1 - t) * x0 + t * x1
v_anchor = velocity_target(xt, t, x0, x1).detach()

def cm_field(x, time):
    return model(x, time)

f_fm = model(xt, 2 - t)
f_cm, d_cm = torch.func.jvp(
    cm_field, (xt, t), (v_anchor, torch.ones_like(t))
)

# Keep the instantaneous target separate from the CM correction.
target_consistency = v_anchor + (1 - t) * d_cm.detach()
residual = (f_cm.detach() - target_consistency).clamp(-1, 1)
target_cm = f_cm.detach() - alpha(t) * residual

loss_fm = anchor_distance(f_fm, v_anchor)
loss_cm = (beta(t) * normalized_distance(f_cm, target_cm)).mean()
loss = loss_fm + loss_cm
~~~

这里特意保留了三个不同的变量：瞬时目标、连续一致性目标、最终松弛目标。若在计算 CM 修正时覆盖了瞬时速度，再把修正后的值拿去监督 FM 分支，就失去了“显式回归瞬时速度”的原意。

## 一步与少步推理

一步生成时，从 $x_0\sim p_0$ 出发：

$$
\widehat x_1=f_\theta(x_0,0)
=x_0+F_\theta(x_0,0).
$$

少步一致性采样通常会在中间噪声等级重新构造状态，再应用终点映射。以本文的线性路径约定为例，第一次预测 $\widehat x_1$ 后，可以选择 $\tau\in(0,1)$：

$$
z_\tau=\tau\widehat x_1+(1-\tau)\epsilon',
\qquad
\epsilon'\sim\mathcal N(0,I),
$$

再执行：

$$
\widehat x_1^{\,\mathrm{new}}
=z_\tau+(1-\tau)F_\theta(z_\tau,\tau).
$$

具体时间表、噪声尺度与模型训练的概率路径必须一致。不能把使用 $t=0$ 为数据端的 VE 一致性采样公式，直接套进这里的时间约定。

这也说明，一步映射对给定初始状态可以是确定性的，但含重新加噪的多步采样并非全程无随机性。教师只在训练中提供监督，推理阶段使用学生模型。

## 实验应该怎样读

下表是原报告引用的论文结果，**不是本博客重新训练得到的结果**。FID 越低越好，NFE 统计网络函数评估次数。

| 数据与模型设定 | NFE=1 的 FID | NFE=2 的 FID |
| --- | --- | --- |
| ImageNet 256×256，类别条件，latent-space LightningDiT 蒸馏 | 1.76 | 1.32 |
| CIFAR-10，无条件，pixel-space DDPM++ | 2.69 | 1.87 |

数值及设定可对照 [FACM 原论文表 1](https://arxiv.org/html/2507.03738v1#S4.T1)。这些结果对应论文当时的训练与评估协议；跨方法比较时，还需要同时考虑教师预训练、骨干容量、引导方式和额外计算。

对理解 FACM 更有帮助的是消融中的三个问题：

- 在相同骨干和初始化下，移除 FM 目标会怎样影响收敛与质量？
- 持续保留 FM 目标，与仅做 FM 预训练是否具有相同效果？
- 改变任务条件化方式后，提升是否仍然存在？

报告中的结论是：持续的 Flow 监督是关键因素，两种条件编码都可以承载这项监督。不同骨干上的有效性提供了可迁移的证据，但不构成对任意架构的性能保证。

## 与其他少步方法的关系

| 方法或思路 | 主要学习对象 | 阅读时应区分的重点 |
| --- | --- | --- |
| Flow Matching / Rectified Flow | 瞬时速度场 | 用求解器沿 ODE 生成 |
| ReFlow | 重新配对后训练的流 | 试图使轨迹更适合少步积分 |
| 一致性模型 | 同轨迹共享的终点映射 | 直接学习生成捷径 |
| MeanFlow | 指定时间区间的平均速度 | 终点也是条件的一部分 |
| FACM | 分条件学习瞬时速度与终点平均速度 | 在同一网络中保留两项显式任务 |

FACM 给我的主要启发是：压缩采样过程时，可以把“理解底层动力学”和“学习长距离映射”作为两个相关但不同的训练任务，再通过共享参数连接它们。理解这个分工，比只记住损失相加更有用。

## 原始报告与参考资料

- [前置理论报告：48 页](/downloads/research-notes/facm-foundations.pdf)：SDE 与概率流 ODE 见第 10–16 页，FM / CFM 见第 19–23 页，一致性推导见第 28–43 页。
- [FACM 论文阅读报告：35 页](/downloads/research-notes/facm-paper-reading.pdf)：条件设计见第 13–14 页，损失与训练见第 17–21 页，实验见第 26–30 页。
- Peng et al., [Flow-Anchored Consistency Models](https://arxiv.org/abs/2507.03738) · [官方代码](https://github.com/ali-vilab/FACM)
- Lipman et al., [Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747)
- Song et al., [Consistency Models](https://arxiv.org/abs/2303.01469)
- Song et al., [Score-Based Generative Modeling through Stochastic Differential Equations](https://arxiv.org/abs/2011.13456)
- Chen et al., [Neural Ordinary Differential Equations](https://arxiv.org/abs/1806.07366)
