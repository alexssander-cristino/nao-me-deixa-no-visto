/* Rendering foundation — perfis previsíveis e configuração central do Three.js.
 * Compatível com Three.js r128 usado pelo projeto.
 */
(function(root){
  "use strict";
  const PROFILES = Object.freeze({
    low: Object.freeze({ pixelRatio: .85, shadows: false, shadowMapSize: 384, particles: 55, fog: .92 }),
    medium: Object.freeze({ pixelRatio: 1, shadows: true, shadowMapSize: 512, particles: 100, fog: 1 }),
    high: Object.freeze({ pixelRatio: 1.25, shadows: true, shadowMapSize: 768, particles: 160, fog: 1.06 })
  });
  function profile(name){
    return PROFILES[name] || PROFILES.high;
  }
  function createRenderer(THREE, canvas, quality="high", devicePixelRatio=1){
    if(!THREE || !THREE.WebGLRenderer) throw new TypeError("Three.js WebGLRenderer indisponível");
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false
    });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    applyQuality(renderer, null, quality, devicePixelRatio);
    return renderer;
  }
  function applyQuality(renderer, keyLight, quality="high", devicePixelRatio=1){
    const selected = profile(quality);
    if(renderer){
      const dpr = Number.isFinite(devicePixelRatio) ? Math.max(.5, devicePixelRatio) : 1;
      renderer.setPixelRatio(Math.min(dpr, selected.pixelRatio));
      renderer.shadowMap.enabled = selected.shadows;
    }
    if(keyLight){
      keyLight.castShadow = selected.shadows;
      if(keyLight.shadow && keyLight.shadow.mapSize){
        keyLight.shadow.mapSize.set(selected.shadowMapSize, selected.shadowMapSize);
        keyLight.shadow.needsUpdate = true;
      }
    }
    return selected;
  }
  root.GameRendering = Object.freeze({ profiles: PROFILES, profile, createRenderer, applyQuality });
})(typeof window !== "undefined" ? window : globalThis);
