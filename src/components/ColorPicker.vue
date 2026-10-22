<template>
<div class='vue-colorpicker'>
  <span class='vue-colorpicker-btn' :style='btnStyle' ref='triggerButton' @click='togglePicker'></span>
  <teleport to="body">
    <div v-if='showPicker' class='vue-colorpicker-portal' :class='{ "is-mobile": isMobile }' @click.self='hide'>
      <div class='vue-colorpicker-panel' :style='panelStyle' @click.stop>
        <div class='vue-colorpicker-header' v-if='isMobile'>
          <span class='vue-colorpicker-title'>Select Color</span>
          <button class='vue-colorpicker-close' @click='hide'>Done</button>
        </div>
        <component :is='pickerType' :modelValue='colors' @update:modelValue='changeColor'></component>
      </div>
    </div>
  </teleport>
</div>
</template>

<script>
import tinycolor from 'tinycolor2'
import Sketch from './vue3-color/Sketch.vue'

export default {
  name: 'vue-colorpicker',
  components: {
    'sketch-picker': Sketch,
  },
  props: {
    modelValue: {
      type: Object,
    },
  },
  emits: ['update:modelValue', 'change'],
  data () {
    return {
      showPicker: false,
      colors: {
        hex: '#FFFFFF',
        a: 1
      },
      colorValue: '#FFFFFF',
      panelLeft: '0px',
      panelTop: '0px',
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1024
    }
  },
  computed: {
    pickerType () {
      return 'sketch-picker';
    },
    isMobile () {
      return this.windowWidth <= 640;
    },
    isTransparent () {
      return this.colors.a === 0;
    },
    btnStyle () {
      if (this.isTransparent) {
        return {
          background: '#eee',
          backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,.25) 25%, transparent 0, transparent 75%,rgba(0,0,0,.25)0), linear-gradient(45deg, rgba(0,0,0,.25)25%,transparent 0, transparent 75%,rgba(0,0,0,.25)0)',
          backgroundPosition: '0 0, 11px 11px',
          backgroundSize: '22px 22px'
        }
      }
      let {r, g, b, a} = this.colorValue;
      return {
        background: `rgba(${r}, ${g}, ${b}, ${a})`
      }
    },
    panelStyle () {
      if (this.isMobile) {
        return {};
      }
      return {
        left: this.panelLeft,
        top: this.panelTop
      };
    }
  },
  watch: {
    modelValue(val, oldVal) {
      if (val !== oldVal) {
        this.updateColorObject(val);
      }
    },
    showPicker(newVal) {
      if (!newVal) return;
      if (!this.isMobile) {
        this.computePanelPosition();
      }
    }
  },

  methods: {
    togglePicker () {
      this.showPicker = !this.showPicker;
    },
    hide () {
      this.showPicker = false;
    },
    onResize () {
      this.windowWidth = window.innerWidth;
      if (this.showPicker && !this.isMobile) {
        this.computePanelPosition();
      }
    },
    computePanelPosition () {
      if (!this.$refs.triggerButton) return;
      const PICKER_WIDTH = 230;
      const PANEL_HEIGHT = 330;
      let triggerRect = this.$refs.triggerButton.getBoundingClientRect();
      let desiredLeft = triggerRect.left;
      let desiredTop = triggerRect.bottom + 6;
      if (desiredTop + PANEL_HEIGHT > window.innerHeight) {
        desiredTop = Math.max(10, triggerRect.top - PANEL_HEIGHT - 6);
      }
      if (desiredLeft + PICKER_WIDTH > window.innerWidth) {
        desiredLeft = Math.max(10, window.innerWidth - PICKER_WIDTH - 12);
      } 
      this.panelLeft = desiredLeft + 'px';
      this.panelTop = desiredTop + 'px';
    },
    changeColor (data) {
      this.colorValue = data.rgba;
      this.$emit('update:modelValue', this.colorValue);
      this.$emit('change', this.colorValue);
    },
    updateColorObject (color) {
      if (!color) return
      const colorObj = tinycolor(color);
      if (!color || color === 'transparent') {
        this.colors = {
          hex: '#000000',
          hsl: { h: 0, s: 0, l: 0, a: 0 },
          hsv: { h: 0, s: 0, v: 0, a: 0 },
          rgba: { r: 255, g: 255, b: 255, a: 0 },
          a: 0
        };
      } else {
        this.colors = {
          hex: colorObj.toHexString(),
          hsl: colorObj.toHsl(),
          hsv: colorObj.toHsv(),
          rgba: colorObj.toRgb(),
          a: colorObj.getAlpha()
        };
      }
      this.colorValue = this.colors.rgba;
    }
  },
  mounted () {
    this.updateColorObject(this.modelValue);
    window.addEventListener('resize', this.onResize);
  },
  beforeUnmount () {
    window.removeEventListener('resize', this.onResize);
  }
}
</script>

<style lang="stylus" scoped>
@import('../vars.styl');

.vue-colorpicker {
  display: inline-block;
  box-sizing: border-box;
  font-size: 0;
  cursor: pointer;

  &-btn {
    display: inline-block;
    width: 32px;
    height: 24px;
    border: 1px solid subtle-border;
    border-radius: 2px;
    background: #FFFFFF;
    box-shadow: 0 1px 3px rgba(61, 68, 81, 0.08);
    transition: transform 0.15s ease-in-out, border-color 0.15s ease-in-out;

    &:hover {
      transform: scale(1.06);
      border-color: sole-accent;
    }
  }
}

.vue-colorpicker-portal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: transparent;

  &.is-mobile {
    background: rgba(28, 31, 38, 0.4);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
}

.vue-colorpicker-panel {
  position: fixed;
  z-index: 10000;
  box-shadow: 0 12px 36px rgba(61, 68, 81, 0.18);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid subtle-border;
  background: base-surface;
}

.is-mobile .vue-colorpicker-panel {
  position: relative;
  max-width: 90vw;
}

.vue-colorpicker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: glass-surface;
  border-bottom: 1px solid subtle-border;
}

.vue-colorpicker-title {
  font-family: serif-font;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: primary-ink;
}

.vue-colorpicker-close {
  background: sole-accent;
  color: base-surface;
  border: none;
  border-radius: 3px;
  padding: 4px 12px;
  font-family: sans-font;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  cursor: pointer;
}
</style>
