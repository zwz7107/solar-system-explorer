---
摘要：首版22个天体观测派生贴图与土卫六霾层示意的来源、授权和显示边界
标签：#天文 #纹理 #素材来源 #视觉核查
更新：2026-09-19
---

# 纹理素材来源与验证

## 当前结果

- 23 个首版天体中，22 个具有可用经纬贴图；土卫六不使用外部纹理。
- 25 张图像合计 7,180,434 字节（约 6.85 MiB）：22 张天体贴图、地球云图与夜光图、土星环。
- 主行星与月球为 2048×1024；其余卫星为 1440×720；土星环为 2048×125 RGBA 条带。
- 原始图像字节保持不变，仅更名。没有AI生成纹理、正面照片拉伸、超分辨率或补绘。
- 所有应用路径见 `public/textures/manifest.json`；逐图下载URL、尺寸、字节数和SHA-256见 `public/textures/download-audit.json`。

## 署名与使用依据

1. [Solar System Scope / INOVE 纹理库](https://www.solarsystemscope.com/textures/)：使用太阳和八大行星及附属云图、夜光和环纹理，按 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 署名。该库基于NASA数据进行颜色调整，作者明确说明部分缺测地形由补绘填充。
2. [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720)：使用2025版LROC颜色图；署名 `NASA's Scientific Visualization Studio / LRO / LROC / LOLA`。极区由LOLA反照率补足；图为视觉用途优化。使用依据为 [NASA媒体使用指南](https://www.nasa.gov/nasa-brand-center/images-and-media/)。
3. [JPL Solar System Simulator Texture Maps](https://space.jpl.nasa.gov/tmaps/)：使用12颗卫星的Viking或Voyager观测拼接素材；Io另结合Galileo颜色。保留 `Courtesy NASA/JPL-Caltech / USGS` 署名，遵守 [JPL图片使用政策](https://www.jpl.nasa.gov/jpl-image-use-policy/)。

建议界面署名：`纹理：Solar System Scope / INOVE（CC BY 4.0）；NASA SVS；NASA/JPL-Caltech / USGS。部分缺测区域为示意。` 同时提供以上来源与许可链接。使用这些机构名称表示素材出处，不表示其审核或背书本应用。

## 逐天体清单

| 天体 | 文件 / 状态 | 来源 | 展示边界 |
|---|---|---|---|
| 太阳（sun） | `/textures/sun.jpg` | [Solar System Scope](https://www.solarsystemscope.com/textures/) | 观测数据加工的经纬贴图；颜色增强，部分未测绘区域由素材作者补绘，非实时天象。 |
| 水星（mercury） | `/textures/mercury.jpg` | [Solar System Scope](https://www.solarsystemscope.com/textures/) | 观测数据加工的经纬贴图；颜色增强，部分未测绘区域由素材作者补绘，非实时天象。 |
| 金星（venus） | `/textures/venus.jpg` | [Solar System Scope](https://www.solarsystemscope.com/textures/) | 显示浓厚云层的外观贴图；不是穿透大气看到的金星地表。 |
| 地球（earth） | `/textures/earth.jpg` | [Solar System Scope](https://www.solarsystemscope.com/textures/) | 观测数据加工的经纬贴图；颜色增强，部分未测绘区域由素材作者补绘，非实时天象。 |
| 火星（mars） | `/textures/mars.jpg` | [Solar System Scope](https://www.solarsystemscope.com/textures/) | 观测数据加工的经纬贴图；颜色增强，部分未测绘区域由素材作者补绘，非实时天象。 |
| 木星（jupiter） | `/textures/jupiter.jpg` | [Solar System Scope](https://www.solarsystemscope.com/textures/) | 观测数据加工的经纬贴图；颜色增强，部分未测绘区域由素材作者补绘，非实时天象。 |
| 土星（saturn） | `/textures/saturn.jpg` | [Solar System Scope](https://www.solarsystemscope.com/textures/) | 观测数据加工的经纬贴图；颜色增强，部分未测绘区域由素材作者补绘，非实时天象。 |
| 天王星（uranus） | `/textures/uranus.jpg` | [Solar System Scope](https://www.solarsystemscope.com/textures/) | 观测数据加工的经纬贴图；颜色增强，部分未测绘区域由素材作者补绘，非实时天象。 |
| 海王星（neptune） | `/textures/neptune.jpg` | [Solar System Scope](https://www.solarsystemscope.com/textures/) | 观测数据加工的经纬贴图；颜色增强，部分未测绘区域由素材作者补绘，非实时天象。 |
| 月球（moon） | `/textures/moon.jpg` | [NASA SVS](https://svs.gsfc.nasa.gov/4720) | NASA CGI Moon Kit 2025版LROC颜色拼接图，极区用LOLA反照率补足；为视觉效果优化，不供科学测量。 |
| 火卫一（phobos） | `/textures/phobos.jpg` | [JPL](https://space.jpl.nasa.gov/tmaps/mars.html) | Viking影像灰度拼接；外形不规则，球面UV为简化。 观测拼接及视觉处理贴图，不供科学测量。 |
| 火卫二（deimos） | `/textures/deimos.jpg` | [JPL](https://space.jpl.nasa.gov/tmaps/mars.html) | Viking影像灰度拼接；外形不规则，球面UV为简化。 观测拼接及视觉处理贴图，不供科学测量。 |
| 木卫一（io） | `/textures/io.jpg` | [JPL](https://space.jpl.nasa.gov/tmaps/jupiter.html) | Voyager/USGS拼接底图，结合Galileo颜色；极区有数据缺口。 观测拼接及视觉处理贴图，不供科学测量。 |
| 木卫二（europa） | `/textures/europa.jpg` | [JPL](https://space.jpl.nasa.gov/tmaps/jupiter.html) | Voyager拼接图的清理版本；不代表全表面同样清晰。 观测拼接及视觉处理贴图，不供科学测量。 |
| 木卫三（ganymede） | `/textures/ganymede.jpg` | [JPL](https://space.jpl.nasa.gov/tmaps/jupiter.html) | Voyager灰度拼接图的清理版本；不代表全表面同样清晰。 观测拼接及视觉处理贴图，不供科学测量。 |
| 木卫四（callisto） | `/textures/callisto.jpg` | [JPL](https://space.jpl.nasa.gov/tmaps/jupiter.html) | Voyager灰度拼接图的清理版本；不代表全表面同样清晰。 观测拼接及视觉处理贴图，不供科学测量。 |
| 土卫六（titan） | `无纹理，材质示意` | [JPL](https://space.jpl.nasa.gov/tmaps/saturn.html) | 本轮未取得适合普通可见光外观的可靠全球经纬贴图。JPL旧素材明确标为虚构，未采用；用橙色霾层科学示意。红外地表拼接不可当成肉眼外观。 |
| 土卫二（enceladus） | `/textures/enceladus.jpg` | [JPL](https://space.jpl.nasa.gov/tmaps/saturn.html) | Voyager拼接图的清理版本；不是Cassini全任务最新底图。 观测拼接及视觉处理贴图，不供科学测量。 |
| 土卫一（mimas） | `/textures/mimas.jpg` | [JPL](https://space.jpl.nasa.gov/tmaps/saturn.html) | Voyager拼接图的清理版本；不是Cassini全任务最新底图。 观测拼接及视觉处理贴图，不供科学测量。 |
| 土卫八（iapetus） | `/textures/iapetus.jpg` | [JPL](https://space.jpl.nasa.gov/tmaps/saturn.html) | Voyager拼接图的清理版本；不是Cassini全任务最新底图。 观测拼接及视觉处理贴图，不供科学测量。 |
| 天卫五（miranda） | `/textures/miranda.jpg` | [JPL](https://space.jpl.nasa.gov/tmaps/uranus.html) | Voyager观测灰度拼接；大片未观测区域保留缺测，不能理解为真实表面均一。 观测拼接及视觉处理贴图，不供科学测量。 |
| 天卫三（titania） | `/textures/titania.jpg` | [JPL](https://space.jpl.nasa.gov/tmaps/uranus.html) | Voyager观测灰度拼接；大片未观测区域保留缺测，不能理解为真实表面均一。 观测拼接及视觉处理贴图，不供科学测量。 |
| 海卫一（triton） | `/textures/triton.jpg` | [JPL](https://space.jpl.nasa.gov/tmaps/neptune.html) | USGS拼接的有限Voyager观测；未测绘区域不代表实际地貌。 观测拼接及视觉处理贴图，不供科学测量。 |

## 材质与显示注意

- 金星：显示云层外观，未采用雷达地表图。
- 地球：`earth_clouds.jpg` 为黑白云图，可作透明度；`earth_night.jpg` 只在背光侧显示。
- 土星环：`saturn_ring.png` 自带透明度，需沿环半径读取横向条带；不按球面经纬贴图解释。
- 天卫五、天卫三：图中大片黑色为未观测区域。贴图本身保留原数据，不将缺测表述为真实黑色地貌。可优先展示已观测半球；若应用以无细节中性色显示缺口，应标明示意。
- 海卫一：观测覆盖有限，近景仍须显示覆盖限制说明。
- 土卫八：显著明暗差异包含真实表面特征，不可全局将暗色按缺测替换。
- 土卫六：JPL旧贴图被明确标为虚构，因此未下载；橙色霾层由应用材质示意。红外地表地图不能被当作可见光外观。
- 部分旧卫星图有残留光照、拼接接缝、低分辨率和观测缺口；近景的清晰度有真实资料限制。所有素材均不供科学测量，也不表示今天的实时外观。

## 验证记录

- 25 张图像均完成格式解码、尺寸和SHA-256检查；所有 manifest 引用均指向实际文件。
- 已目视检查天卫五与土卫八，确认前者存在大片未观测黑区，后者贴图具有明显明暗差异。其余视觉效果由网页三维场景验收继续核查。
- 未公开发布；素材来源核查和下载仅用于本地首版。

## 后续可改进

如后续提高卫星近景画质，可逐一替换为更新的Cassini或USGS底图；需继续保留覆盖、波段、投影和来源说明。
