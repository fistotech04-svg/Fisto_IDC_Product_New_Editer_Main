
// ============================================================================
// 1. IMPORT YOUR TEXTURES HERE
// ============================================================================
import goldBaseColor from '../assets/Texture/Poliigon_MetalGoldPaint_7253/2K/Poliigon_MetalGoldPaint_7253_BaseColor.jpg';
import goldNormal from '../assets/Texture/Poliigon_MetalGoldPaint_7253/2K/Poliigon_MetalGoldPaint_7253_Normal.png';
import goldRoughness from '../assets/Texture/Poliigon_MetalGoldPaint_7253/2K/Poliigon_MetalGoldPaint_7253_Roughness.jpg';
import goldMetallic from '../assets/Texture/Poliigon_MetalGoldPaint_7253/2K/Poliigon_MetalGoldPaint_7253_Metallic.jpg';
import goldAO from '../assets/Texture/Poliigon_MetalGoldPaint_7253/2K/Poliigon_MetalGoldPaint_7253_AmbientOcclusion.jpg';
import goldPreview from '../assets/Texture/Poliigon_MetalGoldPaint_7253/Poliigon_MetalGoldPaint_7253_Preview1.png';

// ============================================================================
// 2. IMPORT YOUR TEXTURES HERE
// ============================================================================
import grassBaseColor from '../assets/Texture/Poliigon_GrassPatchyGround_4585/2K/Poliigon_GrassPatchyGround_4585_BaseColor.jpg';
import grassNormal from '../assets/Texture/Poliigon_GrassPatchyGround_4585/2K/Poliigon_GrassPatchyGround_4585_Normal.png';
import grassRoughness from '../assets/Texture/Poliigon_GrassPatchyGround_4585/2K/Poliigon_GrassPatchyGround_4585_Roughness.jpg';
import grassMetallic from '../assets/Texture/Poliigon_GrassPatchyGround_4585/2K/Poliigon_GrassPatchyGround_4585_Metallic.jpg';
import grassAO from '../assets/Texture/Poliigon_GrassPatchyGround_4585/2K/Poliigon_GrassPatchyGround_4585_AmbientOcclusion.jpg';
import grassPreview from '../assets/Texture/Poliigon_GrassPatchyGround_4585/Poliigon_GrassPatchyGround_4585_Preview1.png';

// ============================================================================
// 3. IMPORT YOUR TEXTURES HERE
// ============================================================================
import sandBaseColor from '../assets/Texture/GroundSand005/GroundSand005_COL_2K.jpg';
import sandNormal from '../assets/Texture/GroundSand005/GroundSand005_NRM_2K.jpg';
import sandGloss from '../assets/Texture/GroundSand005/GroundSand005_GLOSS_2K.jpg';
import sandAO from '../assets/Texture/GroundSand005/GroundSand005_AO_2K.jpg';
import sandMetallic from '../assets/Texture/GroundSand005/GroundSand005_DISP_2K.jpg';
import sandPreview from '../assets/Texture/GroundSand005/GroundSand005_Preview1.png';

// ============================================================================
// 4 IMPORT YOUR TEXTURES HERE
// ============================================================================
import GroundBaseColor from '../assets/Texture/GroundDirtWeedsPatchy004/GroundDirtWeedsPatchy004_COL_2K.jpg';
import GroundNormal from '../assets/Texture/GroundDirtWeedsPatchy004/GroundDirtWeedsPatchy004_NRM_2K.jpg';
import GroundGloss from '../assets/Texture/GroundDirtWeedsPatchy004/GroundDirtWeedsPatchy004_GLOSS_2K.jpg';
import GroundAO from '../assets/Texture/GroundDirtWeedsPatchy004/GroundDirtWeedsPatchy004_AO_2K.jpg';
import GroundMetallic from '../assets/Texture/GroundDirtWeedsPatchy004/GroundDirtWeedsPatchy004_DISP_2K.jpg';
import GroundPreview from '../assets/Texture/GroundDirtWeedsPatchy004/GroundDirtWeedsPatchy004_Preview1.png';

// ============================================================================
// 5. IMPORT YOUR TEXTURES HERE
// ============================================================================
import RattanWeaveBaseColor from '../assets/Texture/Poliigon_RattanWeave_6945/2K/Poliigon_RattanWeave_6945_BaseColor.jpg';
import RattanWeaveNormal from '../assets/Texture/Poliigon_RattanWeave_6945/2K/Poliigon_RattanWeave_6945_Normal.png';
import RattanWeaveRoughness from '../assets/Texture/Poliigon_RattanWeave_6945/2K/Poliigon_RattanWeave_6945_Roughness.jpg';
import RattanWeaveMetallic from '../assets/Texture/Poliigon_RattanWeave_6945/2K/Poliigon_RattanWeave_6945_Metallic.jpg';
import RattanWeaveAO from '../assets/Texture/Poliigon_RattanWeave_6945/2K/Poliigon_RattanWeave_6945_AmbientOcclusion.jpg';
import RattanWeavePreview from '../assets/Texture/Poliigon_RattanWeave_6945/Poliigon_RattanWeave_6945_Preview1.png';

// ============================================================================
// 6. IMPORT YOUR TEXTURES HERE
// ============================================================================
import TilesSquareBaseColor from '../assets/Texture/TilesSquarePoolMixed001/TilesSquarePoolMixed001_COL_2K.jpg';
import TilesSquareNormal from '../assets/Texture/TilesSquarePoolMixed001/TilesSquarePoolMixed001_NRM_2K.jpg';
import TilesSquareGloss from '../assets/Texture/TilesSquarePoolMixed001/TilesSquarePoolMixed001_GLOSS_2K.jpg'; 
import TilesSquareMetallic from '../assets/Texture/TilesSquarePoolMixed001/TilesSquarePoolMixed001_REFL_2K.jpg';
import TilesSquarePreview from '../assets/Texture/TilesSquarePoolMixed001/TilesSquarePoolMixed001_Preview1.png';


export const textureData = [
  {
    id: 'metal_gold_paint',
    name: 'Metal Gold Paint',
    category: 'metal',
    preview: goldPreview, 
    maps: {
      map: goldBaseColor,
      normalMap: goldNormal,
      roughnessMap: goldRoughness,
      metalnessMap: goldMetallic,
      aoMap: goldAO,
    }
  },
  {
    id: 'grass_paint',
    name: 'Grass Paint',
    category: 'nature',
    preview: grassPreview, 
    maps: {
      map: grassBaseColor,
      normalMap: grassNormal,
      roughnessMap: grassRoughness,
      metalnessMap: grassMetallic,
      aoMap: grassAO,
    }
  },
  {
    id: 'sand',
    name: 'Sand',
    category: 'nature',
    preview: sandPreview, 
    maps: {
      map: sandBaseColor,
      normalMap: sandNormal,
      roughnessMap: sandGloss,
      metalnessMap: sandMetallic,
      aoMap: sandAO,
    }
  },
  {
    id: 'Dirty_Sand',
    name: 'Sand1',
    category: 'nature',
    preview: GroundPreview, 
    maps: {
      map: GroundBaseColor,
      normalMap: GroundNormal,
      roughnessMap: GroundGloss,
      metalnessMap: GroundMetallic,
      aoMap: GroundAO,
    }
  },
  {
    id: 'rattan_weave',
    name: 'Rattan Weave',
    category: 'nature',
    preview: RattanWeavePreview, 
    maps: {
      map: RattanWeaveBaseColor,
      normalMap: RattanWeaveNormal,
      roughnessMap: RattanWeaveRoughness,
      metalnessMap: RattanWeaveMetallic,
      aoMap: RattanWeaveAO,
    }
  },
  {
    id: 'Tiles_Square_Pool_Mixed',
    name: 'Tiles Square Pool Mixed',
    category: 'nature',
    preview: TilesSquarePreview, 
    maps: {
      map: TilesSquareBaseColor,
      normalMap: TilesSquareNormal,
      roughnessMap: TilesSquareGloss,
      metalnessMap: TilesSquareMetallic,
    }
  },
];
