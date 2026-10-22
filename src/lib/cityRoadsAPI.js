import { getSVGString, getSVGBlob, getSVGDataURL, getPNGDataURL, getPNGBlob } from './saveFile.js';
import findBoundaryByName from './findBoundaryByName.js';
import Grid from './Grid.js';
import config from '../config.js';
import LoadOptions from './LoadOptions.js';

let appInstance = null;

export function registerAppInstance(app) {
  appInstance = app;
}

export const cityRoads = {
  /**
   * Get the current rendered city's SVG XML markup string
   * @param {Object} options - { minLength?: number, round?: boolean, includeLabels?: boolean }
   * @returns {string} SVG XML markup string
   */
  getSVG(options = {}) {
    const scene = getActiveScene();
    return getSVGString(scene, {
      name: appInstance ? appInstance.name : 'city-roads',
      ...options
    });
  },

  /**
   * Get the SVG as a Blob object (image/svg+xml)
   */
  getSVGBlob(options = {}) {
    const scene = getActiveScene();
    return getSVGBlob(scene, {
      name: appInstance ? appInstance.name : 'city-roads',
      ...options
    });
  },

  /**
   * Get the SVG as a Data URL (data:image/svg+xml;utf8,...)
   * Ideal for direct <img src="..."> or WebGL texture / canvas drawing in Traces
   */
  getSVGDataURL(options = {}) {
    const scene = getActiveScene();
    return getSVGDataURL(scene, {
      name: appInstance ? appInstance.name : 'city-roads',
      ...options
    });
  },

  /**
   * Get the rendered PNG image as Data URL or Blob
   * @param {'dataUrl' | 'blob'} type 
   */
  async getPNG(type = 'dataUrl') {
    const scene = getActiveScene();
    if (type === 'blob') {
      return getPNGBlob(scene);
    }
    return getPNGDataURL(scene);
  },

  /**
   * Copy the raw SVG markup directly to clipboard
   */
  async copySVG(options = {}) {
    const svg = this.getSVG(options);
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
    return svg;
  },

  /**
   * Get current city status and scene instance
   */
  getCityInfo() {
    return {
      name: appInstance ? appInstance.name : '',
      isLoaded: !!(appInstance && appInstance.placeFound),
      scene: getActiveScene(false)
    };
  },

  /**
   * Programmatically load any city by name and return its SVG when ready
   * @param {string} cityName - City name to search and load, e.g. "Seattle", "Paris", "Tokyo"
   * @param {Object} options - SVG export options { minLength, round, includeLabels }
   * @returns {Promise<{ name: string, svg: string, dataUrl: string, blob: Blob }>}
   */
  async loadCity(cityName, options = {}) {
    if (!cityName) throw new Error('cityName is required');

    const boundaries = await findBoundaryByName(cityName);
    if (!boundaries || !boundaries.length) {
      throw new Error(`City not found: ${cityName}`);
    }

    const firstMatch = boundaries[0];
    const loadOptions = new LoadOptions();
    if (firstMatch.areaId) {
      loadOptions.areaId = firstMatch.areaId;
    } else if (firstMatch.bbox) {
      loadOptions.bbox = firstMatch.bbox;
    }

    let grid;
    if (firstMatch.areaId) {
      try {
        grid = await Grid.fromServer(loadOptions, config.areaServer, {
          name: firstMatch.name
        });
      } catch (err) {
        // Fallback to OSM overpass
        grid = null;
      }
    }

    if (!grid) {
      throw new Error(`Unable to load pre-cached grid for ${cityName}. Please load it through the interface.`);
    }

    if (appInstance && appInstance.onGridLoaded) {
      appInstance.onGridLoaded(grid);
    }

    // Wait for frame rendering
    await new Promise(resolve => setTimeout(resolve, 150));

    const svg = this.getSVG(options);
    const dataUrl = this.getSVGDataURL(options);
    const blob = this.getSVGBlob(options);

    return {
      name: firstMatch.name,
      svg,
      dataUrl,
      blob
    };
  }
};

function getActiveScene(throwIfEmpty = true) {
  if (appInstance && appInstance.scene) {
    return appInstance.scene;
  }
  if (typeof window !== 'undefined' && window.scene) {
    return window.scene;
  }
  if (throwIfEmpty) {
    throw new Error('City roads scene is not initialized or no city is currently loaded.');
  }
  return null;
}

/**
 * Setup cross-window postMessage listener
 * Enables GrowingGalaxy or any host window to communicate with city-roads in an iframe
 */
export function setupPostMessageBridge() {
  if (typeof window === 'undefined') return;

  window.addEventListener('message', async (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    const action = data.action || data.type;
    const targetSource = event.source;

    if (action === 'GET_SVG' || action === 'CITY_ROADS_GET_SVG') {
      try {
        if (data.city && (!appInstance || appInstance.name !== data.city)) {
          const res = await cityRoads.loadCity(data.city, data.options || {});
          targetSource?.postMessage({
            type: 'CITY_ROADS_SVG_RESPONSE',
            success: true,
            city: res.name,
            svg: res.svg,
            dataUrl: res.dataUrl
          }, '*');
        } else {
          const svg = cityRoads.getSVG(data.options || {});
          const dataUrl = cityRoads.getSVGDataURL(data.options || {});
          targetSource?.postMessage({
            type: 'CITY_ROADS_SVG_RESPONSE',
            success: true,
            city: appInstance?.name || '',
            svg,
            dataUrl
          }, '*');
        }
      } catch (err) {
        targetSource?.postMessage({
          type: 'CITY_ROADS_SVG_RESPONSE',
          success: false,
          error: err.message
        }, '*');
      }
    } else if (action === 'GET_PNG' || action === 'CITY_ROADS_GET_PNG') {
      try {
        const dataUrl = await cityRoads.getPNG('dataUrl');
        targetSource?.postMessage({
          type: 'CITY_ROADS_PNG_RESPONSE',
          success: true,
          city: appInstance?.name || '',
          dataUrl
        }, '*');
      } catch (err) {
        targetSource?.postMessage({
          type: 'CITY_ROADS_PNG_RESPONSE',
          success: false,
          error: err.message
        }, '*');
      }
    }
  });
}
