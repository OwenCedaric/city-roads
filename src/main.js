// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import {createApp} from 'vue';
import {require as d3Require} from 'd3-require';
import {isWebGLEnabled} from 'w-gl';
import App from './App.vue';
import NoWebGL from './NoWebGL.vue';
import Query from './lib/Query.js';
import { cityRoads, setupPostMessageBridge } from './lib/cityRoadsAPI.js';

// const wgl = require('w-gl');

window.addEventListener('error', logError);

// expose the developer & integration API
window.requireModule = d3Require;
window.Query = Query;
window.cityRoads = cityRoads;

// Enable cross-window / iframe integration for projects like GrowingGalaxy
setupPostMessageBridge();

if (isWebGLEnabled(document.querySelector('#canvas'))) {
  createApp(App).mount('#host');
} else {
  createApp(NoWebGL).mount('#host');
}

function logError(e) {
  console.error(e);

  if (typeof window.gtag === 'function') {
    const exDescription = e ? `${e.message} in ${e.filename}:${e.lineno}` : 'Unknown exception';
    window.gtag('send', 'exception', {
      description: exDescription,
      fatal: false
    });
  }
}