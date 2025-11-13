// MapContainerBase.jsx
import React from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  ZoomControl,
  AttributionControl,
} from "react-leaflet";

const containerStyle = {
  width: "100%",
  height: "calc(100vh - 120px)",
  position: "fixed",
};

const MapContainerBase = ({ children, center, zoom }) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={containerStyle}
      zoomControl={false}
      maxZoom={22}
      minZoom={14}
      zoomSnap={0.5}
      zoomDelta={0.5}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            subdomains={["a", "b", "c"]}
            maxZoom={22}
            minZoom={8}
            noWrap={true}
            maxNativeZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Vệ tinh">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles © Esri"
            maxZoom={22}
            minZoom={8}
            noWrap={true}
            maxNativeZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Tối (Dark)">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap &copy; CARTO"
            maxZoom={22}
            minZoom={8}
            noWrap={true}
            maxNativeZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Màu sắc">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap &copy; CARTO"
            maxZoom={22}
            minZoom={8}
            noWrap={true}
            maxNativeZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Trắng đơn giản">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap &copy; CARTO"
            maxZoom={22}
            minZoom={8}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Google Satellite">
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            attribution="&copy; Google"
            maxZoom={22}
            minZoom={8}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Google Hybrid">
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            attribution="&copy; Google"
            maxZoom={22}
            minZoom={8}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Google Terrain">
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
            attribution="&copy; Google"
            maxZoom={22}
            minZoom={8}
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      <ZoomControl position="topright" />
      <AttributionControl position="bottomright" />
      {children}
    </MapContainer>
  );
};

export default MapContainerBase;
