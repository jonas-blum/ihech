import { defineStore } from 'pinia'
import { Texture } from 'pixi.js'

export const useTextureStore = defineStore('textureStore', {
  state: () => ({
    // textures
    heatmapCellTexture: new Texture(),
    chevronTexture: new Texture(),
    circleTexture: new Texture(),
    bubbleTexture: new Texture(),
    stickyBubbleTexture: new Texture(),
  }),
  getters: {},
  actions: {},
})
