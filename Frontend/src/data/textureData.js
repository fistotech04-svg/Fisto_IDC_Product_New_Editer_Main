const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const TEXTURE_BASE_URL = `${BACKEND_URL}/textures`;

export const textureData = [
  {
    id: "none",
    name: "None",
    category: "All",
    preview: null,
    maps: {},
  },
  {
    id: "metal_gold_paint",
    name: "Metal Gold Paint",
    category: "metal",
    preview: `${TEXTURE_BASE_URL}/Poliigon_MetalGoldPaint_7253/Poliigon_MetalGoldPaint_7253_Preview1.png`,
    maps: {
      map: `${TEXTURE_BASE_URL}/Poliigon_MetalGoldPaint_7253/2K/Poliigon_MetalGoldPaint_7253_BaseColor.jpg`,
      normalMap: `${TEXTURE_BASE_URL}/Poliigon_MetalGoldPaint_7253/2K/Poliigon_MetalGoldPaint_7253_Normal.png`,
      roughnessMap: `${TEXTURE_BASE_URL}/Poliigon_MetalGoldPaint_7253/2K/Poliigon_MetalGoldPaint_7253_Roughness.jpg`,
      metalnessMap: `${TEXTURE_BASE_URL}/Poliigon_MetalGoldPaint_7253/2K/Poliigon_MetalGoldPaint_7253_Metallic.jpg`,
      aoMap: `${TEXTURE_BASE_URL}/Poliigon_MetalGoldPaint_7253/2K/Poliigon_MetalGoldPaint_7253_AmbientOcclusion.jpg`,
    },
  },
  {
    id: "grass_paint",
    name: "Grass Paint",
    category: "nature",
    preview: `${TEXTURE_BASE_URL}/Poliigon_GrassPatchyGround_4585/Poliigon_GrassPatchyGround_4585_Preview1.png`,
    maps: {
      map: `${TEXTURE_BASE_URL}/Poliigon_GrassPatchyGround_4585/2K/Poliigon_GrassPatchyGround_4585_BaseColor.jpg`,
      normalMap: `${TEXTURE_BASE_URL}/Poliigon_GrassPatchyGround_4585/2K/Poliigon_GrassPatchyGround_4585_Normal.png`,
      roughnessMap: `${TEXTURE_BASE_URL}/Poliigon_GrassPatchyGround_4585/2K/Poliigon_GrassPatchyGround_4585_Roughness.jpg`,
      metalnessMap: `${TEXTURE_BASE_URL}/Poliigon_GrassPatchyGround_4585/2K/Poliigon_GrassPatchyGround_4585_Metallic.jpg`,
      aoMap: `${TEXTURE_BASE_URL}/Poliigon_GrassPatchyGround_4585/2K/Poliigon_GrassPatchyGround_4585_AmbientOcclusion.jpg`,
    },
  },
  {
    id: "sand",
    name: "Sand",
    category: "nature",
    preview: `${TEXTURE_BASE_URL}/GroundSand005/GroundSand005_Preview1.png`,
    maps: {
      map: `${TEXTURE_BASE_URL}/GroundSand005/GroundSand005_COL_2K.jpg`,
      normalMap: `${TEXTURE_BASE_URL}/GroundSand005/GroundSand005_NRM_2K.jpg`,
      roughnessMap: `${TEXTURE_BASE_URL}/GroundSand005/GroundSand005_GLOSS_2K.jpg`,
      metalnessMap: `${TEXTURE_BASE_URL}/GroundSand005/GroundSand005_REFL_2K.jpg`,
      displacementMap: `${TEXTURE_BASE_URL}/GroundSand005/GroundSand005_DISP_2K.jpg`,
      aoMap: `${TEXTURE_BASE_URL}/GroundSand005/GroundSand005_AO_2K.jpg`,
    },
  },
  {
    id: "Dirty_Sand",
    name: "Sand1",
    category: "nature",
    preview: `${TEXTURE_BASE_URL}/GroundDirtWeedsPatchy004/GroundDirtWeedsPatchy004_Preview1.png`,
    maps: {
      map: `${TEXTURE_BASE_URL}/GroundDirtWeedsPatchy004/GroundDirtWeedsPatchy004_COL_2K.jpg`,
      normalMap: `${TEXTURE_BASE_URL}/GroundDirtWeedsPatchy004/GroundDirtWeedsPatchy004_NRM_2K.jpg`,
      roughnessMap: `${TEXTURE_BASE_URL}/GroundDirtWeedsPatchy004/GroundDirtWeedsPatchy004_GLOSS_2K.jpg`,
      displacementMap: `${TEXTURE_BASE_URL}/GroundDirtWeedsPatchy004/GroundDirtWeedsPatchy004_DISP_2K.jpg`,
      aoMap: `${TEXTURE_BASE_URL}/GroundDirtWeedsPatchy004/GroundDirtWeedsPatchy004_AO_2K.jpg`,
    },
  },
  {
    id: "rattan_weave",
    name: "Rattan Weave",
    category: "nature",
    preview: `${TEXTURE_BASE_URL}/Poliigon_RattanWeave_6945/Poliigon_RattanWeave_6945_Preview1.png`,
    maps: {
      map: `${TEXTURE_BASE_URL}/Poliigon_RattanWeave_6945/2K/Poliigon_RattanWeave_6945_BaseColor.jpg`,
      normalMap: `${TEXTURE_BASE_URL}/Poliigon_RattanWeave_6945/2K/Poliigon_RattanWeave_6945_Normal.png`,
      roughnessMap: `${TEXTURE_BASE_URL}/Poliigon_RattanWeave_6945/2K/Poliigon_RattanWeave_6945_Roughness.jpg`,
      metalnessMap: `${TEXTURE_BASE_URL}/Poliigon_RattanWeave_6945/2K/Poliigon_RattanWeave_6945_Metallic.jpg`,
      aoMap: `${TEXTURE_BASE_URL}/Poliigon_RattanWeave_6945/2K/Poliigon_RattanWeave_6945_AmbientOcclusion.jpg`,
    },
  },
  {
    id: "Tiles_Square_Pool_Mixed",
    name: "Tiles Square Pool Mixed",
    category: "nature",
    preview: `${TEXTURE_BASE_URL}/TilesSquarePoolMixed001/TilesSquarePoolMixed001_Preview1.png`,
    maps: {
      map: `${TEXTURE_BASE_URL}/TilesSquarePoolMixed001/TilesSquarePoolMixed001_COL_2K.jpg`,
      normalMap: `${TEXTURE_BASE_URL}/TilesSquarePoolMixed001/TilesSquarePoolMixed001_NRM_2K.jpg`,
      roughnessMap: `${TEXTURE_BASE_URL}/TilesSquarePoolMixed001/TilesSquarePoolMixed001_GLOSS_2K.jpg`,
      displacementMap: `${TEXTURE_BASE_URL}/TilesSquarePoolMixed001/TilesSquarePoolMixed001_DISP_2K.jpg`,
      metalnessMap: `${TEXTURE_BASE_URL}/TilesSquarePoolMixed001/TilesSquarePoolMixed001_REFL_2K.jpg`,
    },
  },
];
