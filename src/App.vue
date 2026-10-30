<template>
  <find-place v-if='!placeFound' @loaded='onGridLoaded'></find-place>
  <div id="app">
    <div v-if='placeFound'>
      <div class='controls'>
        <div class='brand-emblem' title='City Roads'>
          <city-logo :size='24'></city-logo>
        </div>
        <a href="#" class='print-button' @click.prevent='toggleSettings'>Customize...</a>
        <a href="#" class='try-another' @click.prevent='startOver'>Try another city</a>
      </div>
      <div v-if='showSettings' class='print-window'>
        <h3>Display</h3>
        <div class='row'>
          <div class='col'>Colors</div>
          <div class='col colors c-2'>
            <div v-for='layer in layers' :key='layer.name' class='color-container'>
              <color-picker v-model='layer.color' @change='layer.changeColor'></color-picker>
              <div class='color-label'>{{layer.name}}</div>
            </div>
          </div>
        </div>

        <h3>Export</h3>
        <div class='row'>
          <a href='#' @click.prevent='zazzleMugPrint()' class='col'>Onto a mug</a> 
          <span class='col c-2'>
            Print what you see onto a mug. <br/>Get a unique gift of your favorite city.
          </span>
        </div>
        <div class='preview-actions message' v-if='zazzleLink || generatingPreview'>
            <div v-if='zazzleLink' class='padded popup-help'>
              If your browser has blocked the new window, <br/>please <a :href='zazzleLink' target='_blank'>click here</a>
              to open it.
            </div>
            <div v-if='generatingPreview' class='loading-container'>
              <loading-icon></loading-icon>
              Generating preview url...
            </div>
        </div>
        <div class='row'>
          <a href='#'  @click.prevent='toPNGFile' class='col'>As an image (.png)</a> 
          <span class='col c-2'>
            Save the current screen as a raster image.
          </span>
        </div>
        
        <div class='row'>
          <a href='#'  @click.prevent='toSVGFile' class='col'>As a vector (.svg)</a> 
          <span class='col c-2'>
            Save the current screen as a vector image.
          </span>
        </div>

        <div class='row'>
          <a href='#'  @click.prevent='copySVGCode' class='col'>Copy SVG Code</a> 
          <span class='col c-2'>
            Copy raw SVG paths to clipboard (ideal for Traces in GrowingGalaxy).
          </span>
        </div>
        <div v-if='copyFeedback' class='preview-actions message'>
          {{ copyFeedback }}
        </div>
        <div v-if='false' class='row'>
          <a href='#' @click.prevent='toProtobuf' class='col'>To a .PBF file</a> 
          <span class='col c-2'>
            Save the current data as a protobuf message. For developer use only.
          </span>
        </div>

        <h3>About</h3>
        <div>
          <p>
            Renders every road within a city using OpenStreetMap data and WebGL.
          </p>
          <p>
            Redesigned and maintained by <a href='https://github.com/OwenCedaric/city-roads' target='_blank'>Owen Cedaric</a>, originally created by <a href='https://github.com/anvaka/city-roads' target='_blank'>@anvaka</a>.
          </p>
        </div>
      </div>
    </div>
  </div>

  <editable-label v-if='placeFound' v-model='name' class='city-name' :printable='true' :style='{color: labelColorRGBA}' :overlay-manager='overlayManager'></editable-label>
  <div v-if='placeFound' class='license printable can-drag' :style='{color: labelColorRGBA}'>data <a href='https://www.openstreetmap.org/about/' target="_blank" :style='{color: labelColorRGBA}'>© OpenStreetMap</a></div>
</template>

<script>
import FindPlace from './components/FindPlace.vue';
import LoadingIcon from './components/LoadingIcon.vue';
import EditableLabel from './components/EditableLabel.vue';
import ColorPicker from './components/ColorPicker.vue';
import CityLogo from './components/CityLogo.vue';
import createScene from './lib/createScene.js';
import GridLayer from './lib/GridLayer.js';
import generateZazzleLink from './lib/getZazzleLink.js';
import appState from './lib/appState.js';
import {getPrintableCanvas, getCanvas, getSVGString} from './lib/saveFile.js';
import {registerAppInstance} from './lib/cityRoadsAPI.js';
import config from './config.js';
import './lib/canvas2BlobPolyfill.js';
import bus from './lib/bus.js';
import createOverlayManager from './createOverlayManager.js';
import tinycolor from 'tinycolor2';

class ColorLayer {
  constructor(name, color, callback) {
    this.name = name;
    this.changeColor = callback;
    this.color = color;
  }
}

export default {
  name: 'App',
  components: {
    FindPlace,
    LoadingIcon,
    EditableLabel,
    ColorPicker,
    CityLogo
  },
  data() {
    return {
      placeFound: false,
      name: '',
      zazzleLink: null,
      generatingPreview: false,
      showSettings: false,
      settingsOpen: false,
      copyFeedback: null,
      labelColor: config.getLabelColor().toRgb(),
      backgroundColor: config.getBackgroundColor().toRgb(),
      layers: []
    }
  },
  computed: {
    labelColorRGBA() {
      return toRGBA(this.labelColor);
    }
  },
  created() {
    registerAppInstance(this);
    bus.on('scene-transform', this.handleSceneTransform);
    bus.on('background-color', this.syncBackground);
    bus.on('line-color', this.syncLineColor);
    this.overlayManager = createOverlayManager();
  },
  beforeUnmount() {
    debugger;
    this.overlayManager.dispose();
    this.dispose();
    bus.off('scene-transform', this.handleSceneTransform);
    bus.off('background-color', this.syncBackground);
    bus.off('line-color', this.syncLineColor);
  },
  methods: {
    dispose() {
      if (this.scene) {
        this.scene.dispose();
        window.scene = null;
      }
    },
    toggleSettings() {
      this.showSettings = !this.showSettings;
    },
    handleSceneTransform() {
      this.zazzleLink = null;
    },
    onGridLoaded(grid) {
      if (grid.isArea) {
        appState.set('areaId', grid.id);
        appState.unset('osm_id');
        appState.unset('bbox');
      } else if (grid.bboxString) {
        appState.unset('areaId');
        appState.set('osm_id', grid.id);
        appState.set('bbox', grid.bboxString);
      }
      this.placeFound = true;
      this.name = grid.name.split(',')[0];
      let canvas = getCanvas();
      canvas.style.visibility = 'visible';

      this.scene = createScene(canvas);
      this.scene.on('layer-added', this.updateLayers);
      this.scene.on('layer-removed', this.updateLayers);

      window.scene = this.scene;

      let gridLayer = new GridLayer();
      gridLayer.id = 'lines';
      gridLayer.setGrid(grid);
      this.scene.add(gridLayer)
    },

    startOver() {
      appState.unset('areaId');
      appState.unsetPlace();
      appState.unset('q');
      appState.enableCache();

      this.dispose();
      this.placeFound = false;
      this.zazzleLink = null;
      this.showSettings = false;
      this.backgroundColor = config.getBackgroundColor().toRgb();
      this.labelColor = config.getLabelColor().toRgb();

      document.body.style.backgroundColor = config.getBackgroundColor().toRgbString();
      getCanvas().style.visibility = 'hidden';
    },

    toPNGFile(e) {
      scene.saveToPNG(this.name)
    },

    toSVGFile(e) { 
      scene.saveToSVG(this.name)
    },

    async copySVGCode() {
      recordOpenClick('copy-svg');
      try {
        const svg = getSVGString(this.scene, { name: this.name });
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(svg);
        } else {
          let textarea = document.createElement('textarea');
          textarea.value = svg;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
        this.copyFeedback = 'SVG code copied to clipboard!';
        setTimeout(() => {
          this.copyFeedback = null;
        }, 3000);
      } catch (err) {
        this.copyFeedback = 'Failed to copy SVG: ' + err.message;
      }
    },

    updateLayers() {
      // TODO: This method likely doesn't belong here
      let newLayers = [];
      let lastLayer = 0;
      let renderer = this.scene.getRenderer();
      let root = renderer.getRoot();
      root.children.forEach(layer => {
        if (!layer.color) return;
        let name = layer.id;
        if (!name) {
          lastLayer += 1;
          name = 'lines ' + lastLayer;
        }
        let layerColor = tinycolor.fromRatio(layer.color);
        newLayers.push(new ColorLayer(name, layerColor, newColor => {
          this.zazzleLink = null;
          layer.color = toRatioColor(newColor);
          renderer.renderFrame();
          this.scene.fire('color-change', layer);
        }));
      });

      newLayers.push(
        new ColorLayer('background', this.backgroundColor, this.setBackgroundColor),
        new ColorLayer('labels', this.labelColor, newColor => this.labelColor = newColor)
      );

      this.layers = newLayers;

      function toRatioColor(c) {
        return {r: c.r/0xff, g: c.g/0xff, b: c.b/0xff, a: c.a}
      }
      this.zazzleLink = null;
    },

    syncLineColor() {
      this.updateLayers();
    },

    syncBackground(newBackground) {
      this.backgroundColor = newBackground.toRgb();
      this.updateLayers()
    },
    // TODO: I need two background methods?
    updateBackground() {
      this.setBackgroundColor(this.backgroundColor)
      this.zazzleLink = null;
    },
    setBackgroundColor(c) {
      this.scene.background = c;
      document.body.style.backgroundColor = toRGBA(c);
      this.zazzleLink = null;
    },

    zazzleMugPrint() {
      if (this.zazzleLink) {
        window.open(this.zazzleLink, '_blank');
        recordOpenClick(this.zazzleLink);
        return;
      }

      this.generatingPreview = true;
      getPrintableCanvas(this.scene).then(printableCanvas => {
        generateZazzleLink(printableCanvas).then(link => {
          this.zazzleLink = link;
          window.open(link, '_blank');
          recordOpenClick(link);
          this.generatingPreview = false;
        }).catch(e => {
          this.error = e;
          this.generatingPreview = false;
        });
      });
    }
  }
}

function toRGBA(c) {
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
}

function recordOpenClick(link) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'click', {
      'event_category': 'Outbound Link',
      'event_label': link
    });
  }
}
</script>

<style lang='stylus'>
@import('./vars.styl');

#app {
  margin: 16px;
  max-height: 100vh;
  position: absolute;
  z-index: 10;

  h3 {
    font-weight: 600;
  }
}

.can-drag {
  border: 1px solid transparent;
}

.drag-overlay {
  position: fixed;
  background: transparent;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
}

.overlay-active {
  border: 1px dashed sole-accent;
}
.overlay-active.exclusive {
  border-style: solid;
}

.controls {
  height: 44px;
  background: glass-surface;
  backdrop-filter: blur(glass-blur);
  -webkit-backdrop-filter: blur(glass-blur);
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: desktop-controls-width;
  justify-content: space-around;
  border: 1px solid subtle-border;
  border-radius: 3px;
  box-shadow: 0 4px 16px rgba(61, 68, 81, 0.05);

  .brand-emblem {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    border-right: 1px solid subtle-border;
    opacity: 0.85;
    transition: opacity 0.15s ease-in-out;

    &:hover {
      opacity: 1;
    }
  }

  a {
    text-decoration: none;
    display: flex;
    justify-content: center;
    align-items: center;
    color: primary-ink;
    font-family: sans-font;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.04em;
    margin: 0;
    border: 0;
    transition: background 0.15s ease-in-out, color 0.15s ease-in-out;

    &:hover {
      color: sole-accent;
      background: subtle-fill;
    }
  }

  a.try-another {
    flex: 1;
  }

  a.print-button {
    flex: 1;
    border-right: 1px solid subtle-border;

    &:focus {
      outline: none;
      background: subtle-fill;
    }
  }
}

.col {
  display: flex;
  flex: 1;
  align-items: center;
  font-family: sans-font;
  font-size: 13px;

  select {
    margin-left: 14px;
  }
}

.row {
  margin-top: 8px;
  display: flex;
  flex-direction: row;
  min-height: 36px;
  align-items: center;

  a.col {
    color: primary-ink;
    font-weight: 500;
    letter-spacing: 0.02em;
    transition: color 0.15s ease-in-out;

    &:hover {
      color: sole-accent;
    }
  }
}

.colors {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  .color-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 64px;
    margin-right: 8px;
  }

  .color-label {
    font-size: 11px;
    font-family: sans-font;
    font-weight: 300;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: secondary-ink;
    margin-top: 4px;
  }
}

a {
  border: 1px solid transparent;
  margin: -1px;
  text-decoration: none;
  color: sole-accent;
  transition: color 0.15s ease-in-out;
}

a:focus {
  outline: none;
}

.print-window {
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  border: 1px solid subtle-border;
  border-top: none;
  background: glass-surface;
  backdrop-filter: blur(glass-blur);
  -webkit-backdrop-filter: blur(glass-blur);
  box-shadow: 0 8px 32px rgba(61, 68, 81, 0.06);
  width: desktop-controls-width;
  padding: 18px;
  border-radius: 0 0 3px 3px;

  .row a {
    margin-right: 8px;
  }

  h3 {
    margin: 18px 0 10px 0;
    font-family: serif-font;
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: primary-ink;
    text-align: left;
    border-bottom: 1px solid subtle-border;
    padding-bottom: 6px;

    &:first-child {
      margin-top: 0;
    }
  }

  p {
    font-family: sans-font;
    font-weight: 300;
    font-size: 13px;
    line-height: 1.85;
    color: secondary-ink;
    margin: 8px 0;

    a {
      color: primary-ink;
      border-bottom: 1px solid stroke-tint;

      &:hover {
        color: sole-accent;
        border-bottom-color: sole-accent;
      }
    }
  }
}

.message {
  border-top: 1px solid subtle-border;
  border-bottom: 1px solid subtle-border;
  background: subtle-fill;
}

.preview-actions {
  display: flex;
  padding: 10px;
  margin: 10px 0;
  width: 100%;
  flex-direction: column;
  align-items: center;
  font-size: 13px;
  color: primary-ink;
  border-radius: 3px;

  .popup-help {
    text-align: center;
    font-family: sans-font;
    font-weight: 300;
    line-height: 1.6;

    a {
      color: sole-accent;
      font-weight: 500;
    }
  }

  .loading-container {
    display: flex;
    align-items: center;
    color: sole-accent;

    .loader {
      margin-right: 8px;
    }
  }
}

.city-name {
  position: absolute;
  right: 40px;
  bottom: 60px;
  font-size: 28px;
  color: primary-ink;

  input {
    font-size: 28px;
  }
}

.license {
  text-align: right;
  position: fixed;
  font-family: sans-font;
  font-weight: 300;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  right: 40px;
  bottom: 34px;
  font-size: 11px;
  padding-right: 8px;
  opacity: 0.8;

  a {
    text-decoration: none;
    display: inline-block;
  }
}

.c-2 {
  flex: 2;
  color: secondary-ink;
  font-family: sans-font;
  font-weight: 300;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: small-screen) {
  #app {
    width: calc(100% - 24px);
    margin: 12px;
    left: 0;
    right: 0;

    .preview-actions, .error,
    .controls, .print-window {
      width: 100%;
    }

    .loading-container {
      font-size: 12px;
    }

    .print-window {
      max-height: calc(82dvh - 54px);
      -webkit-overflow-scrolling: touch;
      font-size: 13px;
      padding: 14px;

      .row {
        flex-direction: column;
        align-items: stretch;
        margin-top: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid subtle-border;

        &:last-of-type {
          border-bottom: none;
        }

        a.col {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background: subtle-fill;
          border: 1px solid subtle-border;
          border-radius: 3px;
          font-size: 13px;
          margin-bottom: 4px;
          margin-right: 0;

          &:active {
            opacity: 0.8;
          }
        }

        .c-2 {
          padding-left: 2px;
          font-size: 12px;
          line-height: 1.45;
        }
      }

      .colors {
        flex-direction: row;
        justify-content: space-around;
        width: 100%;
        margin-top: 6px;

        .color-container {
          margin: 0;
        }
      }
    }
  }

  .city-name {
    right: 16px;
    bottom: "calc(48px + env(safe-area-inset-bottom, 0px))";
    font-size: 20px;
    max-width: calc(100vw - 32px);

    input {
      font-size: 20px;
    }
  }

  .license {
    right: 16px;
    bottom: "calc(20px + env(safe-area-inset-bottom, 0px))";
    font-size: 10px;
  }
}
</style>
