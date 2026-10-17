---
摘要：首版23个天体的数据出处、单位、转换规则与科学展示边界
标签：#太阳系 #数据 #NASA #JPL #科学边界
更新：2026-09-19
---

# 数据与科学表达依据

数据文件：`src/data.js`。本轮于 **2026-09-19** 在线核对公开来源；仅用于亲子科普与交互示意，不作为天文历表。范围为太阳、八大行星、14颗已选卫星。每个对象有可点击的官方 `source`；卫星另有 `numericSource`。

## 字段与单位

| 字段 | 含义与处理 |
|---|---|
| `radiusKm` | 平均半径，单位km。采用等体积球的半径；不拿赤道半径当作平均半径。火卫一、火卫二等不规则天体的值也不等于最长轴。 |
| `distanceKm` | 轨道半长轴的科普近似，单位km。行星相对太阳中心；卫星相对所属行星中心。不是距表面高度，也不是任意日期的即时距离。太阳填0表示不适用。 |
| `orbitalDays` | 绕母体一圈的周期，单位地球日。采用事实表的近似值；太阳填0，代码必须按恒星类型跳过公转。 |
| `dayHours` | 自转一圈的恒星周期绝对值，单位小时；**不等于从一次正午到下一次正午的太阳日**。同步自转卫星按公转天数乘24换算，月球采用事实表655.72小时。 |
| `tiltDeg` | 太阳相对黄道的自转轴倾角；行星/月球相对其轨道的轴倾角，单位度。其余卫星填0并带 `tiltIsSchematic: true`，属于渲染占位，不是测得0°。 |
| `retrograde` | 海卫一为true，表示绕海王星的方向与海王星自转相反。公转周期仍保存正数。 |
| `rotationRetrograde` | 金星、天王星为true，仅标记自转方向；若渲染器已使用大于90°的轴倾角，应避免再次反号造成双重翻转。 |
| `color`、`assetNote` | 用于视觉呈现的颜色与素材边界，不是校准后的测光数据。 |

太阳609.12小时是NASA事实表采用的约16°纬度自转周期；太阳不同纬度转速不同。巨行星的自转周期受参考系统与观测方法影响，界面应使用“约”，不把一位小数当成绝对精度。

## 数值来源

- **八大行星平均半径**：[JPL Planetary Physical Parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html)，使用Mean Radius列。该列定义为与天体等体积的球半径。
- **八大行星距离、公转、自转、倾角**：[NASA/NSSDCA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)，页面标注更新于2025-03-18。采用该汇总表的取整值；不混入页面中可能随发现变化的卫星总数。
- **太阳**：[NASA Sun Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html)。
- **月球**：[NASA Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html)。
- **14颗卫星平均半径**：[JPL Planetary Satellite Physical Parameters](https://ssd.jpl.nasa.gov/sats/phys_par/)。海卫一采用JPL的1352.6km，避免与较早NASA页面的1353.4km混用。
- **火卫一、火卫二距离和周期**：[JPL Planetary Satellite Mean Elements](https://ssd.jpl.nasa.gov/sats/elem/)，MAR099行的半长轴与P。平均轨道元素用于大致描述；JPL明确说明它们不适合用于精确天文历表。
- **木星、土星、天王星、海王星所选卫星距离和同步周期**：下表链接的NASA卫星事实表。按各表S标记采用同步自转；海卫一R标记用于逆行。保留科普有效精度，未拟合其他时刻的轨道。

| 天体 | 平均半径 km | 距母体中心 km | 公转周期 地球日 | 距离/周期来源 |
|---|---:|---:|---:|---|
| 太阳 | 695700 | 0 | 不适用 | [太阳事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html) |
| 水星 | 2439.4 | 57900000 | 88 | [行星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) |
| 金星 | 6051.8 | 108200000 | 224.7 | [行星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) |
| 地球 | 6371.0084 | 149600000 | 365.2 | [行星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) |
| 火星 | 3389.5 | 228000000 | 687 | [行星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) |
| 木星 | 69911 | 778500000 | 4331 | [行星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) |
| 土星 | 58232 | 1432000000 | 10747 | [行星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) |
| 天王星 | 25362 | 2867000000 | 30589 | [行星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) |
| 海王星 | 24622 | 4515000000 | 59800 | [行星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) |
| 月球 | 1737.4 | 384400 | 27.3217 | [月球事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) |
| 火卫一 | 11.08 | 9375 | 0.3187 | [JPL平均轨道元素](https://ssd.jpl.nasa.gov/sats/elem/) |
| 火卫二 | 6.2 | 23457 | 1.2625 | [JPL平均轨道元素](https://ssd.jpl.nasa.gov/sats/elem/) |
| 木卫一 | 1821.49 | 421800 | 1.769138 | [NASA卫星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html) |
| 木卫二 | 1560.8 | 671100 | 3.551181 | [NASA卫星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html) |
| 木卫三 | 2631.2 | 1070400 | 7.154553 | [NASA卫星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html) |
| 木卫四 | 2410.3 | 1882700 | 16.689017 | [NASA卫星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html) |
| 土卫六 | 2574.76 | 1221870 | 15.945421 | [NASA卫星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html) |
| 土卫二 | 252.1 | 238020 | 1.370218 | [NASA卫星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html) |
| 土卫一 | 198.2 | 185520 | 0.9424218 | [NASA卫星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html) |
| 土卫八 | 734.3 | 3560850 | 79.330183 | [NASA卫星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html) |
| 天卫五 | 235.8 | 129900 | 1.413479 | [NASA卫星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/uraniansatfact.html) |
| 天卫三 | 788.9 | 436300 | 8.705867 | [NASA卫星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/uraniansatfact.html) |
| 海卫一 | 1352.6 | 354760 | 5.876854 | [NASA卫星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/neptuniansatfact.html) |

## 科普文字来源

科普说明以短中文重新表述，避免把“有海洋证据”写成“发现生命”。太阳直径约为地球109倍、木卫三比水星大等比较直接由上表平均半径计算；这里只比直径，不推断质量。

| 范围 | 来源与采用内容 |
|---|---|
| 太阳 | [NASA Sun Facts](https://science.nasa.gov/sun/facts/)：恒星、光与能量；差异自转见太阳事实表。 |
| 水星 | [NASA行星事实表](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)：最近、最小及公转周期。 |
| 金星 | [NASA Venus Facts](https://science.nasa.gov/venus/venus-facts/)：浓厚大气、温室效应、云层和缓慢逆向自转。 |
| 地球 | [NASA Earth Facts](https://science.nasa.gov/earth/facts/)：海洋约覆盖71%表面。 |
| 火星 | [NASA Mars Facts](https://science.nasa.gov/mars/facts/)：含铁矿物氧化与红色表面。 |
| 木星 | [NASA Jupiter Facts](https://science.nasa.gov/jupiter/jupiter-facts/)：最大行星、云带、大红斑风暴。 |
| 土星 | [NASA太阳系基础](https://science.nasa.gov/learn/basics-of-space-flight/chapter1-2/)：冰粒光环；大小和平均密度见行星事实表。 |
| 天王星、海王星 | [NASA Neptune Facts](https://science.nasa.gov/neptune/neptune-facts/)：甲烷大气、风、2024年重新处理影像后的颜色认识；天王星轴倾角见事实表。 |
| 月球 | [NASA Moon](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html)：离地球最近的天然伙伴。 |
| 火卫一 | [NASA Phobos](https://science.nasa.gov/mars/moons/phobos/)：绕火星飞快转的小伙伴。 |
| 火卫二 | [NASA Deimos](https://science.nasa.gov/mars/moons/deimos/)：小小的外侧火星卫星。 |
| 木卫一 | [NASA Io](https://science.nasa.gov/jupiter/jupiter-moons/io/)：火山活跃的彩色世界。 |
| 木卫二 | [NASA Europa](https://science.nasa.gov/jupiter/jupiter-moons/europa/)：冰壳下可能藏着海洋。 |
| 木卫三 | [NASA Ganymede](https://science.nasa.gov/jupiter/jupiter-moons/ganymede/)：比水星还大的卫星。 |
| 木卫四 | [NASA Callisto](https://science.nasa.gov/jupiter/jupiter-moons/callisto/)：保存撞击痕迹的古老世界。 |
| 土卫六 | [NASA Titan](https://science.nasa.gov/saturn/moons/titan/)：有浓雾与甲烷湖的卫星。 |
| 土卫二 | [NASA Enceladus](https://science.nasa.gov/saturn/moons/enceladus/)：向太空喷出冰粒的小世界。 |
| 土卫一 | [NASA Mimas](https://science.nasa.gov/saturn/moons/mimas/)：有一只巨大“眼睛”的冰卫星。 |
| 土卫八 | [NASA Iapetus](https://science.nasa.gov/saturn/moons/iapetus/)：一边暗、一边亮的卫星。 |
| 天卫五 | [NASA Miranda](https://science.nasa.gov/uranus/moons/miranda/)：地形像拼图一样的卫星。 |
| 天卫三 | [NASA Titania](https://science.nasa.gov/uranus/moons/titania/)：天王星最大的卫星。 |
| 海卫一 | [NASA Triton](https://science.nasa.gov/neptune/moons/triton/)：沿特别方向运行的冰卫星。 |

## 展示简化与素材边界

1. 全景可以压缩轨道距离、放大天体。大小比例与距离比例须分别标注，不能称为统一真实比例。
2. 动画初始角度、圆形轨道、轨道平面、相位和速度均为示意；没有逐时历表计算，不标“实时天象”。所选卫星属于局部母体系统，距离不能当成日心距离。
3. 轴倾角数据不能与轨道倾角混用。月球6.68°相对其轨道，而不是相对黄道；卫星0°占位不应作为科学数值展示。
4. 月球与其他同步自转卫星大致以同一面朝向母体。自转动画若有艺术化加速，必须说明；仅在卡片展示周期并不保证动画按实速运行。
5. 金星显示云层，土卫六显示橙黄色云雾。云下地表的雷达、红外图像不能描述为可见光表面全貌。
6. 天卫五、天卫三和海卫一的近距离观测覆盖有限，缺测区域的程序纹理或补全均属于示意；尤其不得宣称全球实测高清贴图。
7. 海王星并非一定比天王星鲜艳很多；旧旅行者影像常增强颜色。示意配色使用偏蓝绿色，但不宣称绝对校色。
8. 数据、贴图与实时状态是不同层次：天文参数已核对，不代表每张纹理都是实测。具体素材文件、作者与许可由资产清单另行记录，`assetNote`不代替许可证明。
9. 本版不展示各行星“当前已知卫星总数”，避免把本版精选数量当成实际总数，也避免复用事实表中更新不同步的总数。

## 验证记录

- 23个ID唯一；1颗恒星、8颗行星、14颗卫星；母体引用全部有效。
- 半径和自转周期为正数；非恒星的距离与公转周期为正数。
- 卫星距离全部按km记录；NASA表中千km已乘1000；同步周期天数已乘24转为小时。
- 所有条目有3个短知识点与直接官方链接；太阳orbitalDays=0和卫星轴倾角占位已显式注明。
- UTF-8写入后执行模块导入与结构回读检查。记录只涵盖数据文件，不代替网页操作和视觉验收。
