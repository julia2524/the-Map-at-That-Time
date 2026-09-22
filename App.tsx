import React, { useMemo, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { WebView } from "react-native-webview";

const HGIS_API_KEY = "YOUR_HGIS_API_KEY";

const HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
  />

  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/ol@10.6.1/ol.css"
  />

  <style>
    html,
    body,
    #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    #yearLabel {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 9999;

      padding: 10px 16px;

      background: rgba(0, 0, 0, 0.72);
      color: white;

      border-radius: 999px;

      font-size: 18px;
      font-weight: 700;

      pointer-events: none;
    }
  </style>
</head>

<body>

<div id="map"></div>

<div id="yearLabel">
  2026
</div>

<script src="https://cdn.jsdelivr.net/npm/ol@10.6.1/dist/ol.js"></script>

<script>

  const apiKey = "${HGIS_API_KEY}";

  const resolutions = [
    15636.779110998164,
    7818.389555499082,
    3909.194777749541,
    1954.5973888747706,
    977.2986944373853,
    488.64934721869264,
    244.32467302558137,
    122.16233680467316,
    61.081168402836,
    30.540584201418,
    15.270292100709,
    7.635146050354,
    3.817573025177
  ];

  const matrixIds = resolutions.map(
    (_, index) => "EPSG:5179:" + index
  );

  const tileGrid = new ol.tilegrid.WMTS({
    tileSize: [256, 256],

    extent: [
      815164.9555917948,
      1455946.3608951417,
      1220536.614974792,
      2075064.925722272
    ],

    origin: [
      -200000,
      4000000
    ],

    resolutions: resolutions,

    matrixIds: matrixIds
  });


  // -----------------------------------------
  // 현재 지도
  // -----------------------------------------

  const currentMap = new ol.layer.Tile({

    source: new ol.source.XYZ({
      url:
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    },

    opacity: 1
  });


  // -----------------------------------------
  // 1919 역사 지도
  // -----------------------------------------

  const historicalMap = new ol.layer.Tile({

    source: new ol.source.WMTS({

      url:
        "https://hgis.history.go.kr/openapi/get.do?apiKey="
        + apiKey,

      layer: "history:map1919",

      matrixSet: "EPSG:5179",

      format: "image/png",

      projection: "EPSG:5179",

      tileGrid: tileGrid,

      style: "default",

      wrapX: true,

      serverType: "geoserver"
    }),

    opacity: 0
  });


  // -----------------------------------------
  // 지도
  // -----------------------------------------

  const map = new ol.Map({

    target: "map",

    layers: [
      currentMap,
      historicalMap
    ],

    view: new ol.View({

      projection: "EPSG:3857",

      center: ol.proj.fromLonLat([
        127.8,
        36.5
      ]),

      zoom: 6
    }),

    controls: [],

    loadTilesWhileInteracting: true
  });


  // -----------------------------------------
  // React Native → WebView
  // 연도 변경
  // -----------------------------------------

  document.addEventListener(
    "message",
    function(event) {

      try {

        const data = JSON.parse(event.data);

        if (data.type !== "YEAR") {
          return;
        }

        const year = data.year;

        document.getElementById(
          "yearLabel"
        ).innerText = year + "년";


        // -----------------------------------
        // 2026 → 1919
        // -----------------------------------

        let progress =
          (2026 - year) /
          (2026 - 1919);


        progress =
          Math.max(
            0,
            Math.min(
              1,
              progress
            )
          );


        // 역사 지도 opacity
        historicalMap.setOpacity(progress);

        // 현재 지도 opacity
        currentMap.setOpacity(1 - progress);

      } catch (error) {

        console.log(error);

      }

    }
  );

</script>

</body>
</html>
`;

export default function App() {
  const [year, setYear] = useState(2026);

  const webViewRef = React.useRef<WebView>(null);

  const sendYearToMap = (newYear: number) => {
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "YEAR",
        year: newYear,
      }),
    );
  };

  const handleYearChange = (value: number) => {
    const newYear = Math.round(value);

    setYear(newYear);

    sendYearToMap(newYear);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{
            html: HTML,
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={["*"]}
          onLoad={() => {
            sendYearToMap(2026);
          }}
          style={styles.webview}
        />
      </View>

      <View style={styles.control}>
        <View style={styles.yearRow}>
          <Text style={styles.yearText}>{year}년</Text>

          <Text style={styles.description}>
            {year === 2026
              ? "현재"
              : year <= 1919
                ? "역사 지도"
                : "시간을 거슬러 올라가는 중"}
          </Text>
        </View>

        <Slider
          minimumValue={1919}
          maximumValue={2026}
          step={1}
          value={year}
          onValueChange={handleYearChange}
          minimumTrackTintColor="#222"
          maximumTrackTintColor="#D5D5D5"
          thumbTintColor="#222"
          style={styles.slider}
        />

        <View style={styles.rangeRow}>
          <Text>1919</Text>

          <Text>2026</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  mapContainer: {
    flex: 1,
  },

  webview: {
    flex: 1,
  },

  control: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    backgroundColor: "#fff",
  },

  yearRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  yearText: {
    fontSize: 32,
    fontWeight: "800",
  },

  description: {
    fontSize: 14,
    color: "#777",
  },

  slider: {
    width: "100%",
    height: 40,
  },

  rangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -4,
  },
});
