import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { WebView } from "react-native-webview";

const HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@10.6.1/ol.css" />
  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #f8f9fa;
      touch-action: none; /* 브라우저 스크롤 터치 방지 */
    }
    #yearLabel {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 9999;
      padding: 10px 16px;
      background: rgba(0, 0, 0, 0.75);
      color: white;
      border-radius: 20px;
      font-size: 18px;
      font-weight: 700;
      pointer-events: none;
    }
  </style>
</head>
<body>

<div id="map"></div>
<div id="yearLabel">2026년</div>

<script src="https://cdn.jsdelivr.net/npm/ol@10.6.1/dist/ol.js"></script>

<script>
  // 1. [기본 지도] 현재 표준 지도
  const currentMap = new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    }),
    opacity: 1
  });

  // 2. [테스트용 지도] 지형 지도
  const historicalMap = new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png"
    }),
    opacity: 0
  });

  // 3. 지도 객체 생성 (interactions: [] 설정으로 드래그 및 이동 완전 고정)
  const map = new ol.Map({
    target: "map",
    layers: [currentMap, historicalMap],
    
    // 💡 드래그, 줌, 패닝 등 모든 조작 비활성화
    interactions: [], 

    view: new ol.View({
      center: ol.proj.fromLonLat([127.4, 38.5]),
      zoom: 6.1
    }),
    controls: []
  });

  // RN 메시지 수신 함수
  function handleMessage(event) {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data.type !== "YEAR") return;

      const year = data.year;
      document.getElementById("yearLabel").innerText = year + "년";

      let progress = (2026 - year) / (2026 - 1919);
      progress = Math.max(0, Math.min(1, progress));

      historicalMap.setOpacity(progress);
      currentMap.setOpacity(1 - progress);
    } catch (error) {
      console.log("Error handling message:", error);
    }
  }

  window.addEventListener("message", handleMessage);
  document.addEventListener("message", handleMessage);
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
          source={{ html: HTML }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={["*"]}
          scrollEnabled={false} // 💡 WebView 자체 스크롤 방지
          onLoadEnd={() => sendYearToMap(2026)}
          style={styles.webview}
        />
      </View>

      <View style={styles.control}>
        <View style={styles.yearRow}>
          <Text style={styles.yearText}>{year}년</Text>
          <Text style={styles.description}>
            {year === 2026
              ? "현재 지도"
              : year <= 1919
                ? "과거 지도 (테스트)"
                : "시간 이동 중..."}
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
          <Text>1919년</Text>
          <Text>2026년</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  mapContainer: { flex: 1 },
  webview: { flex: 1 },
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
  yearText: { fontSize: 32, fontWeight: "800" },
  description: { fontSize: 14, color: "#777" },
  slider: { width: "100%", height: 40 },
  rangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -4,
  },
});
