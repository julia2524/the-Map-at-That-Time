import "ol/ol.css";

import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import OSM from "ol/source/OSM.js";

const map = new Map({
  target: "map",

  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],

  view: new View({
    center: [14100000, 4500000],
    zoom: 7,
  }),
});

const style = document.createElement("style");

style.textContent = `
  html,
  body,
  #map {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
  }
`;

document.head.appendChild(style);
