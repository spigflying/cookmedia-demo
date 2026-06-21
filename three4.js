/* 庫客行銷 Cookmedia — index4 數據區「BRAND PARTNERS」的金屬 3D「88」
 * 真正的 WebGL 3D:PBR 金屬材質(metalness/roughness)+ 環境反射(RoomEnvironment)
 * + 環境光(Ambient)+ 直射光(Directional),持續水平慢轉,旋轉時金屬反光隨角度流動。
 * 失敗時(無 WebGL / 載入錯誤)保留 HTML 的平面「88」fallback。 */

import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const mount = document.getElementById("brand3d");
if (mount) init(mount).catch((err) => console.warn("[three4] 3D 初始化失敗,保留平面 88:", err));

async function init(mount) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const w0 = mount.clientWidth || 240;
  const h0 = mount.clientHeight || 140;

  // ---- Renderer(透明背景,讓白色面板透出)----
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(w0, h0);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;   // 金屬高光更自然
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, w0 / h0, 0.1, 100);
  camera.position.set(0, 0, 3.3);   // 容納較寬的「88+」,避免裁切

  // ---- 環境反射:RoomEnvironment 經 PMREM 產生 envMap,金屬才有東西可反射 ----
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // ---- 光:環境光打底 + 主直射光給強高光 + 一道朱橘紅補光做色溫 ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(2.5, 3, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xeb5f43, 1.4);  // 朱橘紅邊光,呼應品牌色
  rim.position.set(-3, -1, 2);
  scene.add(rim);

  // ---- 載入字體並建立「88+」立體幾何(「+」也一起做成玻璃)----
  const font = await new FontLoader().loadAsync(
    "https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json"
  );
  const geo = new TextGeometry("88+", {
    font,
    size: 1,
    height: 0.34,           // 擠出厚度:旋轉時看得到側面,才有 3D 感
    curveSegments: 10,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.035,
    bevelSegments: 4,
  });
  geo.center();

  // ---- 背景圖案:朱橘紅色系「夥伴集合」圓球聚落,擺在玻璃後面 ----
  // 透過毛玻璃折射出流動色塊,讓玻璃效果更明顯(也呼應「合作品牌客戶」)
  // 兩個交叉色環,當作有設計感的雕塑,透過毛玻璃折射出流動色弧
  const backdrop = new THREE.Group();
  const ringMat1 = new THREE.MeshStandardMaterial({ color: 0xeb5f43, roughness: 0.38, metalness: 0.1 });
  const ringMat2 = new THREE.MeshStandardMaterial({ color: 0xf5853a, roughness: 0.38, metalness: 0.1 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.15, 28, 80), ringMat1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.12, 28, 80), ringMat2);
  ring2.rotation.x = Math.PI / 2;   // 與 ring1 交叉
  backdrop.add(ring1, ring2);
  backdrop.rotation.set(0.5, 0.35, 0);
  backdrop.position.z = -0.85;      // 在玻璃(z≈0)後面,才會被玻璃折射
  scene.add(backdrop);

  // ---- 透明毛玻璃材質(PBR 物理材質):全透光 + 適度霧面,只剩極淡朱橘紅 ----
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.4,                 // 霧面但保留透明感
    transmission: 1.0,              // 全透光,玻璃感更強
    thickness: 0.5,                 // 薄 → 內部染色很淡
    ior: 1.45,
    attenuationColor: 0xeb5f43,     // 僅淡淡一抹朱橘紅
    attenuationDistance: 3.0,       // 距離大 → 染色極淡,接近透明
    clearcoat: 0.5,                 // 表面清漆,霧面仍有光澤
    clearcoatRoughness: 0.35,
    envMapIntensity: 1.0,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -0.12;        // 微微俯角,金屬面更立體
  scene.add(mesh);

  // 3D 就緒,移除平面 fallback
  const fb = mount.querySelector(".fallback");
  if (fb) fb.remove();
  mount.appendChild(renderer.domElement);

  // ---- RWD:容器尺寸變動時更新相機與畫布 ----
  const ro = new ResizeObserver(() => {
    const w = mount.clientWidth || w0;
    const h = mount.clientHeight || h0;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  ro.observe(mount);

  // ---- 持續水平慢轉(減少動態偏好時:只渲染一格靜態角度)----
  if (reduceMotion) {
    mesh.rotation.y = -0.5;
    renderer.render(scene, camera);
    return;
  }
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    mesh.rotation.y += dt * 0.6;        // 玻璃「88+」約 5.7 秒一圈,優雅不暈
    backdrop.rotation.y += dt * 0.25;   // 背景色環反向緩轉,折射色弧隨之流動
    backdrop.rotation.x += dt * 0.1;
    renderer.render(scene, camera);
  });
}
