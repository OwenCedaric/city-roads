# Console API

*This is work in progress and subject to change. Please don't rely on it for anything critical* 

The `city-roads` provides additional set of operations for the software engineers, allowing them
to execute arbitrary OpenStreetMap queries and visualize results.

## Methods

This section describes available console API methods.

### `scene.load()`

Allows you to load more city roads into the current scene. Before we dive into details, let's explore what
it takes to render Tokyo and Seattle next to each other. 

![Tokyo and Seattle](./images/tokyo_and_seattle.png)

First, open [city roads](https://anvaka.github.io/city-roads/)
and load `Seattle` roads. Then open [developer console](https://developers.google.com/web/tools/chrome-devtools/open) and run the following command:

``` js
scene.load(Query.Road, 'Tokyo'); // load every single road in Tokyo
```

Monitor your `Networks` tab and see when request is done. Tokyo bounding box is very large,
so it will appear very far away on the top left corner. Let's move Tokyo grid next to Seattle:

``` js
// Find the loaded layer with Tokyo:
tokyo = scene.queryLayer('Tokyo');

// Exact offset numbers can be found by experimenting
tokyo.moveBy(/* xOffset = */ 718000, /* yOffset = */ 745000)
```

`scene.load()` has the following signature:

``` js
function load(wayFilter: String, loadOptions: LoadOptions);
```

* `wayFilter` is used to filter out OpenStreetMap ways. You can find a list of well-known filters [here](https://github.com/anvaka/city-roads/blob/f543a712a0b88b12751aad691baa5eb9d6c0c664/src/lib/Query.js#L6-L24). If you need 
to know more to create custom filters, here is a complete [language guide](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL). You can also get good insight into key/value distribution for ways by exploring [taginfo](https://taginfo.openstreetmap.org/tags) (make sure to sort by Ways in descending order to get the most popular combinations);
* `loadOptions` allows you to have granular control over the bounding box of the loaded results. If this
value is a string, then it is converted to a geocoded area id with nominatim, and then the first match
is used as a bounding box. This may not be enough sometimes, so you can provide a specific area id, or 
a bounding box, by passing an object. For example:

``` js
scene.load(Query.Road, {areaId: 3600237385}); // Explicitly set area id to Seattle

scene.load(Query.Building, { // Load all buildings...
  bbox: [       // ...in the given bounding box
    "-15.8477", /* south lat */ 
    "-47.9841", /* west  lon */ 
    "-15.7330", /* north lat */ 
    "-47.7970"  /* east  lon */ 
  ]});
```

### scene.queryLayerAll()

Returns all layers added to the scene. This is what it takes to assign different colors to each layer:

``` js
allLayers = scene.queryLayerAll()
allLayers[0].color = 'deepskyblue'; // color can be a name.
allLayers[1].color = 'rgb(255, 12, 43)'; // or a any other expression (rgb, hex, hsl, etc.)
```

### `scene.clear()`

Clears the current scene, allowing you to start from scratch.


### `scene.saveToPNG(fileName: string)`

To save the current scene as a PNG file run

``` js
scene.saveToPNG('hello'); // hello.png is saved
```

### `scene.saveToSVG(fileName: string, options?: Object)`

This command allows you to save the scene as an SVG file.

``` js
scene.saveToSVG('hello'); // hello.svg is saved
```

If you are planning to use a pen-plotter or a laser cutter, you can also
greatly reduce the print time, by removing very short paths from the final
export. To do so, pass `minLength` option:

``` js
scene.saveToSVG('hello', {minLength: 2}); 
// All paths with length shorter than 2px are removed from the final SVG.
```

---

## Programmatic Image & SVG Export API (`window.cityRoads`)

For external applications (such as **GrowingGalaxy / Traces**), `city-roads` provides a programmatic interface on `window.cityRoads` and cross-origin `postMessage` support to extract raw SVG vector paths without triggering browser downloads:

### 1. JavaScript API (`window.cityRoads`)

```js
// 1. Get raw SVG XML string directly (ideal for Traces SVG path parsers)
const svgString = window.cityRoads.getSVG({
  minLength: 2,           // Filter out tiny road segments (< 2px) to optimize performance
  includeLabels: false    // Exclude city name & attribution text, exporting pure road lines
});

// 2. Get SVG Data URL (ready for <img src="..."> or WebGL canvas texture)
const svgDataUrl = window.cityRoads.getSVGDataURL();

// 3. Get SVG as a Blob (image/svg+xml)
const svgBlob = window.cityRoads.getSVGBlob();

// 4. Get rendered PNG as Data URL or Blob
const pngDataUrl = await window.cityRoads.getPNG('dataUrl');
const pngBlob = await window.cityRoads.getPNG('blob');

// 5. One-click copy SVG markup to clipboard
await window.cityRoads.copySVG();

// 6. Programmatically load any city and receive its SVG
const result = await window.cityRoads.loadCity('Paris', { minLength: 2 });
console.log(result.svg); // SVG string of Paris roads
```

### 2. Iframe / Cross-Window Integration (`postMessage`)

If embedding `city-roads` in an `<iframe>` within GrowingGalaxy:

```js
// In GrowingGalaxy (parent window):
const iframe = document.querySelector('#city-roads-iframe');

// Request SVG of the currently loaded city:
iframe.contentWindow.postMessage({
  type: 'GET_SVG',
  options: { minLength: 2, includeLabels: false }
}, '*');

// Or request a specific city:
iframe.contentWindow.postMessage({
  type: 'GET_SVG',
  city: 'Tokyo',
  options: { minLength: 3 }
}, '*');

// Listen for the SVG response:
window.addEventListener('message', (event) => {
  if (event.data?.type === 'CITY_ROADS_SVG_RESPONSE' && event.data.success) {
    const { city, svg, dataUrl } = event.data;
    // Pass svg directly to Traces engine!
    traces.loadSVG(svg);
  }
});
```

---

## Examples

Here are a few example of working with the API.

### Loading all bikeways in the current city

``` js
var bikes = scene.load('way[highway="cycleway"]', {layer: scene.queryLayer()})
// Make lines 4 pixels wide
bikes.lineWidth = 4
// and red
bikes.color = 'red'
```

### Loading all bus routes in the current city

This script will get all bus routes in the current city, and render them 4px wide, with
red color:

``` js
var areaId = scene.queryLayer().getQueryBounds().areaId;
var bus = scene.load('', {
  layer: scene.queryLayer(),
  raw: `[out:json][timeout:250];
area(${areaId});(._; )->.area;
(nwr[route=bus](area.area););
out body;>;out skel qt;`
});

bus.color='red';
bus.lineWidth = 4;
```

If you want a specific bus number, pass additional `ref=bus_number`. For example, bus route #24:

``` js
var areaId = scene.queryLayer().getQueryBounds().areaId;
var bus = scene.load('', {
  layer: scene.queryLayer(),
  raw: `[out:json][timeout:250];
area(${areaId});(._; )->.area;
(nwr[route=bus][ref=24](area.area););
out body;>;out skel qt;`
});

bus.color = 'green';
bus.lineWidth = 4;
```

