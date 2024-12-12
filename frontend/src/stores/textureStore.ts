import { defineStore } from 'pinia'
import { Texture } from 'pixi.js'

export const useTextureStore = defineStore('textureStore', {
  state: () => ({
    // NOTE: it seems like textures can not be shared between different pixi apps
    // textures from Heatmap
    heatmapCellTexture: new Texture(),
    chevronTexture: new Texture(),
    circleTexture: new Texture(),
    starTexture: new Texture(),

    // textures from Dimred
    bubbleTexture: new Texture(),
    bubbleTextureBordered: new Texture(),
    stickyBubbleTexture: new Texture(),
  }),
  getters: {},
  actions: {},
})
