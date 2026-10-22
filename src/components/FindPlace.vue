<template>
<div class='find-place' :class='{centered: boxInTheMiddle }'>
  <div v-if='boxInTheMiddle' class='site-header-container'>
    <city-logo :size='52' class='site-logo'></city-logo>
    <h3 class='site-header'>city roads</h3>
    <p class='description'>This website renders every single road within a city</p>
  </div>
  <form v-on:submit.prevent="onSubmit" class='search-box'>
      <input class='query-input' v-model='enteredInput' type='text' placeholder='Enter a city name to start' ref='input'>
      <a type='submit' class='search-submit' href='#' @click.prevent='onSubmit' v-if='enteredInput && !hideInput'>{{mainActionText}}</a>
  </form>
  <div v-if='showWarning' class='prompt message note shadow'>
    Note: Large cities may require 200MB+ of data transfer and may need a powerful device to render.
  </div>
  <div class='results' v-if='!loading'>
    <div v-if='suggestionsLoaded && suggestions.length' class='suggestions shadow'>
      <div class='prompt message'>
        <div>Select boundaries below to download all roads within</div>
        <div class='note'>large cities may require 200MB+ of data transfer and a powerful device</div>
      </div>
      <ul>
        <li v-for='(suggestion, index) in suggestions' :key="index">
          <a @click.prevent='pickSuggestion(suggestion)' class='suggestion'
          href='#'>
          <span>
          {{suggestion.name}} <small>({{suggestion.type}})</small>
          </span>
          </a>
        </li>
      </ul>
    </div>
    <div v-if='suggestionsLoaded && !suggestions.length && !loading && !error' class='no-results message shadow'>
      Didn't find matching cities. Try a different query?
    </div>
    <div v-if='noRoads' class='no-results message shadow'>
      Didn't find any roads. Try a different query?
    </div>
  </div>
  <div v-if='error' class='error message shadow'>
    <div v-if='isServerError(error)'>
      <div>OpenStreetMap servers are busy or temporarily unavailable.</div>
      <div class='error-note'>We tried {{error.serversAttempted || 'multiple'}} servers but none responded in time. This usually resolves within a few minutes.</div>
      <div class='error-actions'>
        <a href='#' @click.prevent="retry" class='retry-btn'>Retry</a>
      </div>
    </div>
    <div v-else>
      <div>Sorry, something went wrong while loading data.</div>
      <div class='error-note'>{{error.message || error.toString()}}</div>
      <div class='error-actions'>
        <a href='#' @click.prevent="retry" class='retry-btn'>Retry</a>
      </div>
      <div class='error-links'>
        <a href='https://twitter.com/anvaka/status/1218971717734789120' title='see what it supposed to do' target="_blank">see how it should have worked</a>
        <a :href='getBugReportURL(error)' :title='"report error: " + error' target='_blank'>report this bug</a>
      </div>
    </div>
  </div>
  <div v-if='loading' class='loading message shadow'>
    <loading-icon></loading-icon>
    <span>{{loading}}</span>
    <a href="#" @click.prevent='cancelRequest' class='cancel-request'>cancel</a>
    <div class='load-padding' v-if='stillLoading > 0'>
      Still loading...
    </div>
    <div class='load-padding' v-if='stillLoading > 1'>
      Sorry it takes so long!
    </div>
  </div>
</div>
</template>

<script>
import LoadingIcon from './LoadingIcon.vue';
import CityLogo from './CityLogo.vue';
import Query from '../lib/Query.js';
import request from '../lib/request.js';
import findBoundaryByName from '../lib/findBoundaryByName.js';
import appState from '../lib/appState.js';
import Grid from '../lib/Grid.js';
import queryState from '../lib/appState.js';
import config from '../config.js';
import Progress from '../lib/Progress.js'
import LoadOptions from '../lib/LoadOptions.js';
import Pbf from 'pbf';
import {place} from '../proto/place.js';

const FIND_TEXT = 'Find City Bounds';

export default {
  name: 'FindPlace',
  components: {
    LoadingIcon,
    CityLogo
  },
  data () {
    const enteredInput = appState.get('q') || '';
    let hasValidArea = restoreStateFromQueryString();

    return {
      enteredInput,
      loading: null,
      lastCancel: null,
      suggestionsLoaded: false,
      boxInTheMiddle: true,
      stillLoading: 0,
      error: null,
      hideInput: false,
      noRoads: false,
      clicked: false,
      showWarning: hasValidArea, 
      mainActionText: hasValidArea ? 'Download Area' : FIND_TEXT,
      suggestions: []
    }
  },
  watch: {
    enteredInput() {
      // As soon as they change it, we need not to download:
      this.mainActionText = FIND_TEXT;
      this.showWarning = false;
      this.hideInput = false;
      appState.unsetPlace();
    }
  },
  mounted() {
    this.$refs.input.focus();
    if (queryState.get('auto')) {
      this.onSubmit();
    }
  },
  beforeUnmount() {
    if (this.lastCancel) this.lastCancel();
    clearInterval(this.notifyStillLoading);
  },
  methods: {
    onSubmit() {
      queryState.set('q', this.enteredInput);
      this.cancelRequest()
      this.suggestions = [];
      this.noRoads = false;
      this.error = false;
      this.showWarning = false;

      const restoredState = restoreStateFromQueryString(this.enteredInput);
      if (restoredState) {
        this.pickSuggestion(restoredState);
        return;
      }

      this.loading = 'Searching cities that match your query...'
      findBoundaryByName(this.enteredInput)
        .then(suggestions => {
          this.loading = null;
          this.hideInput = suggestions && suggestions.length;
          if (this.boxInTheMiddle) {
            // let animation that moves input box proceed a bit
            this.boxInTheMiddle = false; // This triggers transition
            // wait for it and then set the suggestions:
            setTimeout(() => {
              this.suggestionsLoaded = true;
              this.suggestions = suggestions;
            }, 50)
          } else {
              this.suggestionsLoaded = true;
              this.suggestions = suggestions; 
          }
        });
    },

    isServerError(error) {
      if (!error) return false;
      // These are transient server issues, not bugs in our code
      return error.allServersFailed ||
             error.invalidResponse ||
             error.statusError ||
             (error.message && error.message.includes('Failed to download'));
    },

    getBugReportURL(error) {
      let title = encodeURIComponent('OSM Error');
      let body = '';
      if (error) {
        body = 'Hello, an error occurred on the website:\n\n```\n' +
          error.toString() + '\n```\n\n Can you please help?';
      }

      return `https://github.com/anvaka/city-roads/issues/new?title=${title}&body=${encodeURIComponent(body)}`
    },

    updateProgress(status) {
      this.stillLoading = 0;
      clearInterval(this.notifyStillLoading);
      if (status.loaded < 0) {
        this.loading = 'Trying a different server'
        this.restartLoadingMonitor();
        return;
      }
      if (status.percent !== undefined) {
        this.loading = 'Loaded ' + Math.round(100 * status.percent) + '% (' + formatNumber(status.loaded) + ' bytes)...';
      } else {
        this.loading = 'Loaded ' + formatNumber(status.loaded) + ' bytes...';
      }
    },

    retry() {
      if (this.lastSuggestion) {
        this.pickSuggestion(this.lastSuggestion);
      }
    },

    pickSuggestion(suggestion) {
      this.lastSuggestion = suggestion;
      this.error = false;
      if (appState.isCacheEnabled() && suggestion.areaId) {
        this.checkCache(suggestion)
          .catch(error => {
            if (error.cancelled) return; // no need to do anything. They've cancelled

            // No Cache - fallback
            return this.useOSM(suggestion);
          });
      } else {
        // we don't have cache for nodes yet.
        this.useOSM(suggestion);
      }
    },

    restartLoadingMonitor() {
      clearInterval(this.notifyStillLoading);
      this.stillLoading = 0;
      this.notifyStillLoading = setInterval(() => {
        this.stillLoading++;
      }, 10000);
    },

    checkCache(suggestion) {
      this.loading = 'Checking cache...'
      let areaId = suggestion.areaId;

      return request(config.areaServer + '/' + areaId + '.pbf', {
        progress: this.generateNewProgressToken(),
        responseType: 'arraybuffer'
      }).then(arrayBuffer => {
        var byteArray = new Uint8Array(arrayBuffer);
        return byteArray;
      }).then(byteArray => {
        var pbf = new Pbf(byteArray);
        var obj = place.read(pbf);
        let grid = Grid.fromPBF(obj)
        this.$emit('loaded', grid);
      });
    },

    useOSM(suggestion) {
      this.loading = 'Connecting to OpenStreetMap...'
      
      // it may take a while to load data. 
      this.restartLoadingMonitor();
      Query.runFromOptions(new LoadOptions({
        wayFilter: Query.Road,
        areaId: suggestion.areaId,
        bbox: suggestion.bbox
      }), this.generateNewProgressToken())
      .then(grid => {
        this.loading = null;
        if (!grid.hasRoads()) {
          this.noRoads = true;
        } else {
          grid.setName(suggestion.name);
          grid.setId(suggestion.areaId || suggestion.osm_id);
          grid.setIsArea(suggestion.areaId); // osm nodes don't have area.
          grid.setBBox(serializeBBox(suggestion.bbox));
          this.$emit('loaded', grid);
        }
      }).catch(err => {
        if (err.cancelled) {
          this.loading = null;
          return;
        }
        console.error(err);
        this.error = err;
        this.loading = null;
        this.suggestions = [];
      })
      .finally(() => {
        clearInterval(this.notifyStillLoading);
        this.stillLoading = 0;
      });
    },

    cancelRequest() {
      if (this.progressToken) {
        this.progressToken.cancel();
        this.progressToken = null;
        this.loading = false;
      }
    },

    generateNewProgressToken() {
      if (this.progressToken) {
        this.progressToken.cancel();
        this.progressToken = null;
      }

      this.progressToken = new Progress(this.updateProgress);
      return this.progressToken;
    }
  }
}

function serializeBBox(bbox) {
  return bbox && bbox.join(',');
}

function formatNumber(x) {
  if (!Number.isFinite(x)) return 'N/A';
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function restoreStateFromQueryString(name) {
  let areaId = getCurrentAreaId();
  if (areaId) {
    return {name, areaId};
  }

  let nodeAndBox = getCurrentNodeAndBox();
  if (nodeAndBox) {
    return {
      name,
      osm_id: nodeAndBox.osm_id,
      bbox: nodeAndBox.bbox
    };
  }
}

function getCurrentAreaId() {
  let areaId = appState.get('areaId');
  if (!Number.isFinite(Number.parseInt(areaId, 10))) {
    areaId = null;
  }
  return areaId;
}

function getCurrentNodeAndBox() {
  let osm_id = appState.get('osm_id');
  if (!Number.isFinite(Number.parseInt(osm_id, 10))) return;

  let bbox = parseBBox(appState.get('bbox'));
  if (!bbox) return;

  return { osm_id, bbox };
}

function parseBBox(bboxStr) {
  if (!bboxStr) return null;

  let bbox = bboxStr.split(',').map(x => Number.parseFloat(x)).filter(x => Number.isFinite(x));
  return bbox.length === 4 ? bbox : null;
}

</script>

<style lang="stylus">
@import('../vars.styl');

.find-place {
  width: desktop-controls-width;
}

.site-header-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 4px;
}

.site-logo {
  margin-bottom: 12px;
  filter: drop-shadow(0 2px 8px rgba(61, 68, 81, 0.08));
}

h3.site-header {
  margin: 0;
  font-family: serif-font;
  font-weight: 600;
  font-size: 32px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: primary-ink;
  text-align: center;
}

input {
  border: none;
  flex: 1;
  font-family: sans-font;
  font-weight: 400;
  padding: 0 4px;
  color: primary-ink;
  background: transparent;
  height: 100%;
  font-size: 16px;
  letter-spacing: 0.02em;

  &::placeholder {
    color: secondary-ink;
    opacity: 0.65;
    font-weight: 300;
  }

  &:focus {
    outline: none;
  }
}

.search-box {
  position: relative;
  background: glass-surface;
  backdrop-filter: blur(glass-blur);
  -webkit-backdrop-filter: blur(glass-blur);
  border: 1px solid subtle-border;
  border-radius: 3px;
  padding: 0 0 0 12px;
  margin-top: 16px;
  box-shadow: 0 4px 20px rgba(61, 68, 81, 0.05);
  height: 48px;
  display: flex;
  font-size: 15px;
  cursor: text;
  transition: border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:focus-within {
    border-color: sole-accent;
    box-shadow: 0 4px 24px rgba(130, 161, 185, 0.15);
  }

  a {
    cursor: pointer;
  }

  span {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
}

.prompt {
  padding: 8px 12px;
  text-align: center;
  font-size: 12px;
  color: secondary-ink;
  font-family: sans-font;
  font-weight: 300;
  line-height: 1.6;
}

.search-submit {
  padding: 0 14px;
  align-items: center;
  text-decoration: none;
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  outline: none;
  z-index: 1;
  color: sole-accent;
  font-family: sans-font;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.04em;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: primary-ink;
    background: subtle-fill;
  }
}

.suggestion {
  display: flex;
  min-height: 56px;
  align-items: center;
  border-bottom: 1px solid subtle-border;
  padding: 8px 14px;
  text-decoration: none;
  color: primary-ink;
  font-family: sans-font;
  font-size: 14px;
  line-height: 1.45;
  transition: background 0.15s ease-in-out, transform 0.15s ease-in-out;

  small {
    color: secondary-ink;
    font-weight: 300;
    margin-left: 6px;
    font-size: 12px;
  }

  &:hover {
    background: subtle-fill;
    color: primary-ink;
  }
}

.suggestions {
  position: relative;
  background: glass-surface;
  backdrop-filter: blur(glass-blur);
  -webkit-backdrop-filter: blur(glass-blur);
  border: 1px solid subtle-border;
  border-radius: 3px;
  margin-top: 8px;
  box-shadow: 0 8px 24px rgba(61, 68, 81, 0.06);

  .prompt {
    border-bottom: 1px solid subtle-border;
  }

  .note {
    font-size: 11px;
    font-style: italic;
    color: secondary-ink;
    opacity: 0.85;
  }

  ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
    max-height: calc(100vh - 180px);
    overflow-y: auto;
    overflow-x: hidden;
  }
}

.message,
.loading {
  padding: 10px 14px;
  position: relative;
  border: 1px solid subtle-border;
  border-radius: 3px;
  background: glass-surface;
  backdrop-filter: blur(glass-blur);
  -webkit-backdrop-filter: blur(glass-blur);
  color: primary-ink;
  font-family: sans-font;
  font-size: 13px;
  margin-top: 8px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  color: sole-accent;

  svg {
    margin-right: 8px;
    color: sole-accent;
  }
}

.no-results {
  text-align: center;
  color: secondary-ink;
  font-family: sans-font;
  font-weight: 300;
}

.shadow {
  box-shadow: 0 4px 16px rgba(61, 68, 81, 0.05);
}

.error {
  overflow-x: auto;
  border-left: 2px solid sole-accent;
}

.find-place {
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 12px;
  left: 50%;
  transform: translateX(-50%) translateY(0);
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-property: top left transform;
  transition-duration: 0.3s;
}

.find-place.centered {
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-143px);
}

.load-padding {
  padding-left: 22px;
  font-size: 12px;
  color: secondary-ink;
  margin-top: 4px;
}

.description {
  padding: 8px;
  margin: 6px 0 0 0;
  text-align: center;
  font-family: sans-font;
  font-weight: 300;
  font-size: 14px;
  line-height: 1.85;
  color: secondary-ink;
  letter-spacing: 0.02em;
}

.cancel-request {
  position: absolute;
  right: 10px;
  top: 10px;
  font-size: 12px;
  font-family: sans-font;
  color: secondary-ink;
  text-decoration: none;
  letter-spacing: 0.04em;

  &:hover {
    color: primary-ink;
  }
}

.error-note {
  font-size: 12px;
  color: secondary-ink;
  font-weight: 300;
  line-height: 1.6;
  margin: 8px 0;
}

.error-actions {
  margin: 12px 0 8px 0;
}

.retry-btn {
  display: inline-block;
  padding: 6px 20px;
  background: sole-accent;
  color: base-surface;
  text-decoration: none;
  border-radius: 3px;
  font-family: sans-font;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.04em;
  transition: opacity 0.15s ease-in-out;

  &:hover {
    opacity: 0.88;
  }
}

.error-links {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid subtle-border;

  a {
    color: secondary-ink;
    text-decoration: none;

    &:hover {
      color: sole-accent;
    }
  }
}

@media (max-width: small-screen) {
  .find-place {
    width: calc(100% - 32px);
    max-width: 440px;
    left: 50%;
    transform: translateX(-50%);
    top: 16px;
  }

  .find-place.centered {
    top: 16vh;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 32px);
  }

  .site-logo {
    width: 44px;
    height: 44px;
    margin-bottom: 8px;
  }

  h3.site-header {
    font-size: 26px;
    letter-spacing: 0.1em;
  }

  .description {
    font-size: 13px;
    line-height: 1.6;
    padding: 4px 8px;
  }

  .search-box {
    height: 48px;
    margin-top: 12px;
  }

  input {
    font-size: 16px !important;
  }

  .suggestions ul {
    max-height: calc(100dvh - 240px);
    -webkit-overflow-scrolling: touch;
  }

  .suggestion {
    min-height: 52px;
    padding: 10px 14px;

    &:active {
      background: subtle-fill;
      opacity: 0.85;
    }
  }

  .message {
    font-size: 12px;
  }

  .prompt {
    font-size: 12px;

    .note {
      font-size: 10px;
    }
  }
}
</style>
