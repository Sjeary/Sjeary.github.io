---
title: 扩散模型、SDE 与 Flow 基础
date: 2025-07-17 12:00:00
updated: 2026-09-07 00:00:00
description: 从布朗运动出发，推导 SDE、去噪分数匹配、VP-SDE 与概率流 ODE，再用条件期望理解 Flow Matching。
categories: [扩散模型]
tags: [SDE, Flow Matching, 学习笔记]
comments:
  enabled: false
---

**学习笔记 · 原始整理日期：2025-07-17**

理解扩散模型时，我更习惯先看随机过程与概率密度如何演化，再回到神经网络究竟在学习什么。本文沿原始笔记的顺序，把布朗运动、SDE、分数匹配、概率流 ODE 和 Flow Matching 连成一条推导路径，并补充必要的公式和适用条件。

原始笔记主要整理自孙兵兵的微信文章系列，以及 cheern 的 Flow Matching 课程；原 PDF 中的灰色总结已标注为 LLM 辅助内容。对应学习来源保留在文末，下面的讲解是对这些主题的重新整理。

## 从随机游走到布朗运动

先考虑一维随机游走：每隔一小段时间，粒子向左或向右移动。若每步独立、方向等概率，就没有确定的运动方向，但位置的不确定性会随时间增大。

在合适的缩放下，这类随机游走的连续极限是 Wiener 过程，也称标准布朗运动 $W_t$。它的关键性质是：

- 起点为 $W_0=0$。
- 不相交时间区间的增量相互独立。
- 对 $t>s$，增量满足 $W_t-W_s\sim\mathcal N(0,t-s)$。
- 路径连续，但通常不可微。

最后两条解释了随机微积分为什么不能直接照搬普通微积分。长度为 $\Delta t$ 的时间区间里，布朗增量的典型尺度是 $\sqrt{\Delta t}$，而不是 $\Delta t$。

$$
\Delta W_t=\sqrt{\Delta t}\,\epsilon,\qquad
\epsilon\sim\mathcal N(0,1).
$$

这意味着二阶随机项的量级仍然是 $\Delta t$，不会像普通泰勒展开中的二阶时间项那样被忽略。

## 用 SDE 描述一条轨迹，用密度方程描述一个群体

常见的连续时间扩散写成：

$$
dX_t=f(X_t,t)\,dt+g(t)\,dW_t.
$$

其中，$f$ 是漂移项，决定当前位置上的确定性趋势；$g$ 控制随机扰动的强度。本文采用空间各向同性、扩散系数只依赖时间的情形，避免把一般矩阵扩散的公式混在一起。

这一个过程可以从两个层面理解。

| 视角 | 关注对象 | 数学描述 |
| --- | --- | --- |
| 拉格朗日视角 | 一个粒子如何移动 | 样本路径 $X_t$ 与 SDE |
| 欧拉视角 | 大量粒子怎样分布 | 概率密度 $p_t(x)$ 与偏微分方程 |

对应的 Fokker–Planck 方程为：

$$
\partial_t p_t
=-\nabla\cdot(f p_t)+\frac12 g(t)^2\Delta p_t.
$$

第一项搬运已有的概率质量，第二项让分布扩散。它们描述的是同一个随机过程的群体行为。

如果直接令 $g(t)=0$，SDE 会退化为 ODE：

$$
\frac{dX_t}{dt}=f(X_t,t).
$$

此时密度满足连续性方程：

$$
\partial_t p_t=-\nabla\cdot(f p_t).
$$

这里守恒的是总概率质量。一般 ODE 并不自动保持体积，也不能直接说它的微分熵始终不变；密度是否压缩还取决于速度场的散度。

## Itô 修正项从哪里来

对一维随机过程 $X_t$ 上的光滑函数 $h(X_t,t)$，Itô 引理给出：

$$
dh=
\left(
\partial_t h+f\,\partial_x h
+\frac12g^2\,\partial_{xx}h
\right)dt
+g\,\partial_xh\,dW_t.
$$

与普通链式法则相比，多出来的是：

$$
\frac12g^2\,\partial_{xx}h\,dt.
$$

直觉上，它来自布朗运动的二次变差，常用形式记作 $(dW_t)^2=dt$。这是一条随机微积分中的运算规则，不是对每个随机增量逐点成立的普通代数等式。

因此，随机项影响的不只是轨迹的抖动，也会改变对函数和密度求导时的规则。理解这一点，再看 Fokker–Planck 方程里的二阶空间导数就比较自然了。

## 逆向生成为什么需要 score

扩散模型先定义一个容易采样的前向加噪过程，把数据逐渐变成接近简单先验的分布。生成时，再从这个先验出发逆向运行。

对前面的时间相关标量扩散系数，在常见的正则条件下，逆时间 SDE 可写为：

$$
dX_t=
\left[f(X_t,t)-g(t)^2s_t(X_t)\right]dt
+g(t)\,d\overline W_t,
$$

其中：

$$
s_t(x)=\nabla_x\log p_t(x).
$$

这里沿时间从大到小积分，$dt<0$；$\overline W_t$ 表示逆时间布朗运动。公式中的符号必须和时间方向一起理解，不能把这个漂移项原封不动地拿去做正向时间积分。

Score 不是一个表示“好坏”的标量分数，而是向量场：它给出当前位置上对数密度上升的方向。前向过程由我们设定，难以直接获得的是它在每个时刻的边缘 score。于是，生成问题转化为学习 $s_t(x)$。

## 从不可计算的边缘 score 到去噪分数匹配

假设前向扰动可以写成：

$$
X_t=a_tX_0+\sigma_t\epsilon,\qquad
\epsilon\sim\mathcal N(0,I).
$$

给定干净样本 $X_0=x_0$，条件分布是已知高斯，因此条件 score 可以直接计算：

$$
\nabla_{x_t}\log p(x_t\mid x_0)
=-\frac{x_t-a_tx_0}{\sigma_t^2}
=-\frac{\epsilon}{\sigma_t}.
$$

边缘密度虽然未知，但它的 score 与条件 score 有如下关系：

$$
\nabla_{x_t}\log p_t(x_t)
=
\mathbb E\left[
\nabla_{x_t}\log p(x_t\mid X_0)
\mid X_t=x_t
\right].
$$

因此可以使用可采样的训练目标：

$$
\mathcal L_{\mathrm{DSM}}
=
\mathbb E_{t,X_0,\epsilon}
\left[
\lambda(t)
\left\|
s_\theta(X_t,t)+\frac{\epsilon}{\sigma_t}
\right\|_2^2
\right].
$$

平方损失的最优回归函数是条件期望。这就是为什么只需要从数据中取样、添加已知噪声，就能学习不可直接计算的边缘 score。

如果模型选择预测噪声 $\epsilon_\theta$，可通过 $s_\theta=-\epsilon_\theta/\sigma_t$ 转换成 score。不同参数化之间可以转换，但在有限网络、特定损失权重和噪声水平下，训练难度未必相同。这一点会在 [JiT 的讨论](/blog/2025/12/jit-pixel-dit/) 中再次出现。

## VP-SDE：把抽象过程落到一个具体例子

Variance Preserving SDE 的常见写法是：

$$
dX_t=-\frac12\beta(t)X_t\,dt+\sqrt{\beta(t)}\,dW_t.
$$

设：

$$
a_t=\exp\left(-\frac12\int_0^t\beta(s)\,ds\right),
\qquad
\sigma_t^2=1-a_t^2.
$$

它的条件扰动可以直接采样：

$$
X_t=a_tX_0+\sqrt{1-a_t^2}\,\epsilon.
$$

当初始数据的每个分量具有单位方差，并满足独立噪声等条件时，上式的总方差保持为 1。“方差保持”并不意味着每个给定样本的条件分布方差不变：条件噪声方差 $1-a_t^2$ 实际上随时间增加。

训练时，随机采样 $t$ 和噪声即可构造输入及监督；生成时，则需要用学到的 score 配合逆向方程和数值求解器。

## 概率流 ODE：吸收扩散项，而不是直接删除随机项

回到 Fokker–Planck 方程，利用：

$$
\nabla p_t=p_t\nabla\log p_t,
$$

可以得到：

$$
\begin{aligned}
\partial_t p_t
&=-\nabla\cdot(f p_t)+\frac12g^2\Delta p_t\\
&=-\nabla\cdot
\left[
p_t\left(f-\frac12g^2\nabla\log p_t\right)
\right].
\end{aligned}
$$

它已经是连续性方程的形式，所以可以选择确定性速度场：

$$
v_{\mathrm{PF}}(x,t)
=f(x,t)-\frac12g(t)^2\nabla_x\log p_t(x),
$$

从而得到 Probability Flow ODE：

$$
\frac{dX_t}{dt}=v_{\mathrm{PF}}(X_t,t).
$$

在精确 score、相同初始密度和适当正则条件下，这个 ODE 与原 SDE 具有相同的时变边缘分布。相同的是每个时刻的分布，单条轨迹及跨时间的联合分布通常不同。

还要区分两个系数：逆时间 SDE 的 score 修正系数是 $g^2$，概率流 ODE 中是 $\frac12g^2$。仅仅删掉逆向 SDE 的随机项，会得到另一个动力系统。

确定性 ODE 提供了使用不同数值积分器的机会，但“换成 ODE”本身不保证可以任意增大步长。速度场误差、曲率和求解器误差仍然会影响生成质量。

## 条件生成：Classifier Guidance 与 CFG

对于条件 $y$，贝叶斯公式给出：

$$
\nabla_x\log p_t(x\mid y)
=
\nabla_x\log p_t(x)
+\nabla_x\log p_t(y\mid x).
$$

Classifier Guidance 用噪声条件下的分类器提供第二项。这个分类器需要适应对应的噪声等级，不能简单拿只见过干净图片的分类器代替。

Classifier-Free Guidance 则让生成模型通过随机丢弃条件，同时学习有条件与无条件预测。在 score 参数化下，可以写成：

$$
s_{\mathrm{cfg}}
=s_{\mathrm{uncond}}
+w\left(s_{\mathrm{cond}}-s_{\mathrm{uncond}}\right).
$$

按这里的约定，$w=1$ 恢复条件预测，$w>1$ 进一步加强条件方向。噪声预测或速度预测也可以采用相应的组合形式，但比较不同实现时，要先确认其 guidance scale 的定义。

更大的引导通常会加强条件一致性，也可能损失多样性或产生伪影。它是采样策略中的权衡参数，而不是越大越好。

## Flow Matching：直接监督速度场

前面通过 score 构造了一个确定性 ODE。Flow Matching 则从另一侧入手：先指定连接先验与数据的概率路径，再训练网络逼近能够实现这条路径的速度场。

这一节改用生成方向的时间约定：$t=0$ 是噪声端，$t=1$ 是数据端。最简单的条件插值是：

$$
X_t=(1-t)X_0+tX_1,
\qquad
U_t=X_1-X_0.
$$

其中 $X_0$ 来自先验，$X_1$ 来自数据。条件速度 $U_t$ 很容易计算，因此可以训练：

$$
\mathcal L_{\mathrm{CFM}}
=
\mathbb E_{t,X_0,X_1}
\left\|
v_\theta(X_t,t)-(X_1-X_0)
\right\|_2^2.
$$

最优的边缘速度是：

$$
u_t(x)=\mathbb E[X_1-X_0\mid X_t=x].
$$

这与去噪分数匹配有相似的计算思路：把难以直接计算的边缘目标，转成易于采样的条件监督。条件路径是一条直线，并不意味着学习到的边缘 ODE 轨迹也都是直线。

推理时仍需从先验取样，并求解 $\dot X_t=v_\theta(X_t,t)$。如果进一步希望一步跳到终点，就会自然遇到一致性模型和 [FACM](/blog/2025/08/facm/) 所讨论的问题。

## 把几个对象放在一起看

| 对象 | 描述或学习的量 | 在生成过程中的作用 |
| --- | --- | --- |
| SDE | 漂移与随机扰动 | 描述随机轨迹 |
| Fokker–Planck 方程 | 概率密度的时间变化 | 联系轨迹与分布 |
| Score 模型 | 对数密度梯度 | 构造逆向 SDE 或概率流 ODE |
| Probability Flow ODE | 与指定 SDE 同边缘的速度场 | 提供确定性采样动力学 |
| Flow Matching | 条件速度的边缘回归 | 直接训练生成 ODE |
| 一致性模型 | 沿轨迹共享的终点映射 | 学习一步或少步生成 |

理解这条链路后，阅读一个新生成方法时，可以依次检查：它在哪个空间定义状态、采用什么时间方向、监督什么量、最后又如何采样。

## 原始材料

[阅读或下载 4 页原始学习笔记](/downloads/research-notes/diffusion-sde-flow-notes.pdf)

原笔记是一份带学习来源的阅读提纲；本文补充了可独立阅读的公式与衔接说明。更完整的随机过程证明仍可沿下面的来源继续学习。

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

- [Score-Based Generative Modeling through Stochastic Differential Equations](https://arxiv.org/abs/2011.13456)
- [Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747)
