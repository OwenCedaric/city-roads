# city-roads

> Visualizing every single road in any city at once with WebGL and minimalist cartographic aesthetics.

**Repository:** [https://github.com/OwenCedaric/city-roads](https://github.com/OwenCedaric/city-roads) (forked from [anvaka/city-roads](https://github.com/anvaka/city-roads))

---

### Highlights in this Fork:
- **Refined Typography & Visual Restraint**: Serif headings, warm-ivory paper surface (`#fbf9f6`), deep ink roads (`#3d4451`), and muted blue-gray accents (`#82a1b9`).
- **Mobile-First Touch Redesign**: Responsive layout, thumb-friendly export cards, iOS Safari auto-zoom prevention, and centered modal color picker via Vue 3 Teleport.
- **Open Grid Cartography Logo & Favicon**: Custom vector street network emblem with automatic browser dark/light mode switching.
- **Programmatic Vector & Image API**: Direct SVG / PNG extraction via `window.cityRoads` and iframe `postMessage` integration (optimized for tools like **GrowingGalaxy / Traces**).
- **UI One-Click SVG Copy**: Added "Copy SVG Code" button in the Export menu to copy raw vector paths directly to clipboard.

---

## Integration & Export API (for GrowingGalaxy / Traces)

`city-roads` provides programmatic interfaces to extract vector paths and images directly without triggering browser download prompts.

### 1. JavaScript API (`window.cityRoads`)

```js
// 1. Get raw SVG XML markup (ideal for Traces path animation)
const svg = window.cityRoads.getSVG({
  minLength: 2,         // Filter out tiny line segments (< 2px) to optimize performance
  includeLabels: false  // Exclude text labels, exporting pure road geometry
});

// 2. Get SVG Data URL (for <img src="..."> or WebGL canvas texture)
const svgDataUrl = window.cityRoads.getSVGDataURL();

// 3. Get SVG as a Blob
const svgBlob = window.cityRoads.getSVGBlob();

// 4. Get rendered PNG as Data URL or Blob
const pngDataUrl = await window.cityRoads.getPNG('dataUrl');
const pngBlob = await window.cityRoads.getPNG('blob');

// 5. One-click copy SVG markup to clipboard
await window.cityRoads.copySVG();

// 6. Programmatically load any city and retrieve its SVG
const result = await window.cityRoads.loadCity('Paris', { minLength: 2 });
console.log(result.svg);
```

### 2. Iframe / Cross-Window Integration (`postMessage`)

When embedding `city-roads` in an `<iframe>` within another project:

```js
// In host window (e.g. GrowingGalaxy):
const iframe = document.querySelector('#city-roads-iframe');

// Request SVG:
iframe.contentWindow.postMessage({
  type: 'GET_SVG',
  city: 'Seattle',      // Optional: loads Seattle if specified, or exports current city
  options: { minLength: 2, includeLabels: false }
}, '*');

// Receive SVG:
window.addEventListener('message', (event) => {
  if (event.data?.type === 'CITY_ROADS_SVG_RESPONSE' && event.data.success) {
    const { city, svg, dataUrl } = event.data;
    traces.loadTraceFromSVG(svg);
  }
});
```

*See [API.md](API.md) for full scene scripting documentation.*

---

## About the Project

Render every single road in any city at once with WebGL.

![demo](https://i.imgur.com/6bFhX3e.png)

## How it is made?

The data is fetched from OpenStreetMap using [overpass API](http://overpass-turbo.eu/). While that API
is free (as long as you follow ODbL licenses), it can be rate-limited and sometimes it is slow. After all
we are downloading thousands of roads within an area!

To improve the performance of download, I indexed ~3,000 cities with population larger than 100,000 people and
stored into a [very simple](https://github.com/anvaka/index-large-cities/blob/master/proto/place.proto) protobuf format. The cities are stored into a cache in this github [repository](https://github.com/anvaka/index-large-cities).

The name resolution is done by [nominatim](https://nominatim.openstreetmap.org/) - for any query that you type
into the search box it returns list of area ids. I check for the area id in my list of cached cities first,
and fallback to overpass if area is not present in cache.

## Scripting

Behind simple UI software engineers would also find scripting capabilities. You can develop programs on top
of the city-roads. A few examples are available in [city-script](https://github.com/anvaka/city-script). Scene
API is documented here: https://github.com/OwenCedaric/city-roads/blob/main/API.md

Please share your creations and do not hesitate to reach out if you have any questions.

## Limitations

The rendering of the city is limited by the browser and video card memory capacity. I was able to render Seattle
roads without a hiccup on a very old samsung phone, though when I tried Tokyo (with 1.4m segments) the phone
was very slow.

Selecting area that has millions of roads (e.g. a Washington state) may cause the page to crash even on a
powerful device.

Luckily, most of the cities can be rendered without problems, resulting in a beautiful art.

## Support & Credits

Originally created by [Andrei Kashcha (@anvaka)](https://github.com/anvaka). Redesigned, enhanced with programmatic vector APIs, and maintained by [Owen Cedaric](https://github.com/OwenCedaric/city-roads).

## Local development

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```

## License

The source code is licensed under MIT license
