import request from './request.js';
import Query from './Query.js';
import Grid from './Grid.js';
import LoadOptions from './LoadOptions.js';
import Progress from './Progress.js';
import config from '../config.js';
import appState from './appState.js';
import Pbf from 'pbf';
import { place } from '../proto/place.js';

export function serializeBBox(bbox) {
  return bbox ? bbox.join(',') : '';
}

/**
 * Downloads a city grid using areaId cache or OSM Overpass
 * @param {Object} suggestion - Boundary info { areaId, bbox, name, osmId, osm_id }
 * @param {Function} [onProgress] - Optional callback (status: { label, percent, loaded })
 * @param {Function} [onCancelToken] - Optional callback to register cancel function
 * @returns {Promise<Grid>}
 */
export function fetchCityGrid(suggestion, onProgress, onCancelToken) {
  let cancelled = false;
  let activeCancelFn = null;

  if (onCancelToken) {
    onCancelToken(() => {
      cancelled = true;
      if (activeCancelFn) activeCancelFn();
    });
  }

  function createProgressToken(label) {
    const pt = new Progress();
    activeCancelFn = () => pt.cancel();
    pt.onData = (status) => {
      if (onProgress) {
        onProgress({ label, ...status });
      }
    };
    return pt;
  }

  // 1. Try cache if areaId is present
  if (appState.isCacheEnabled() && suggestion.areaId) {
    if (onProgress) onProgress({ label: 'Checking cache...' });
    const progressToken = createProgressToken('Downloading cached roads...');

    return request(config.areaServer + '/' + suggestion.areaId + '.pbf', {
      progress: progressToken,
      responseType: 'arraybuffer'
    }).then(arrayBuffer => {
      if (cancelled) throw { cancelled: true };
      const byteArray = new Uint8Array(arrayBuffer);
      const pbf = new Pbf(byteArray);
      const obj = place.read(pbf);
      const grid = Grid.fromPBF(obj);
      return grid;
    }).catch(err => {
      if (err && err.cancelled) throw err;
      // If cache fails (e.g. 404 or network issue), fall back to OSM Overpass
      return fetchFromOSM();
    });
  }

  // 2. Direct OSM Overpass
  return fetchFromOSM();

  function fetchFromOSM() {
    if (cancelled) return Promise.reject({ cancelled: true });
    if (onProgress) onProgress({ label: 'Connecting to OpenStreetMap...' });

    const progressToken = createProgressToken('Downloading roads from OpenStreetMap...');
    const loadOptions = new LoadOptions({
      wayFilter: Query.Road,
      areaId: suggestion.areaId,
      bbox: suggestion.bbox
    });

    return Query.runFromOptions(loadOptions, progressToken)
      .then(grid => {
        if (cancelled) throw { cancelled: true };
        if (!grid.hasRoads()) {
          throw new Error('No roads found in this boundary.');
        }
        grid.setName(suggestion.name);
        grid.setId(suggestion.areaId || suggestion.osmId || suggestion.osm_id);
        grid.setIsArea(suggestion.areaId);
        grid.setBBox(serializeBBox(suggestion.bbox));
        return grid;
      });
  }
}
