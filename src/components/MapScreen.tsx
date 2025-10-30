import React, { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useTheme, useLocation, useTripManager } from '../hooks';
import { Text } from './Text';
import type { ColorScheme } from '../types/theme';
import {
  locationToLatLng,
  routePointToLatLng,
  createRouteSegmentsFromPoints,
  fitCoordinates,
  getColorBySpeed,
  optimizeRouteForZoom,
  getZoomLevel,
} from '../utils/mapHelpers';

export function MapScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { location, isTracking, permission } = useLocation({ autoStart: true });
  const { currentTrip } = useTripManager();

  const mapRef = useRef<MapView>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [followUser, setFollowUser] = useState(true);
  const [region, setRegion] = useState<Region | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const currentLocation = useMemo(() => {
    if (!location) {
      console.log('MapScreen: No location available');
      return null;
    }
    console.log('MapScreen: Location updated', {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      accuracy: location.coords.accuracy,
    });
    return locationToLatLng(location);
  }, [location]);

  const initialRegion = {
    latitude: 21.028511,
    longitude: 105.804817,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const routeSegments = useMemo(() => {
    if (!currentTrip || currentTrip.route.length === 0) return [];
    return createRouteSegmentsFromPoints(currentTrip.route, 10);
  }, [currentTrip]);

  const optimizedRoute = useMemo(() => {
    if (!region || !currentTrip || currentTrip.route.length === 0) return [];

    const zoomLevel = getZoomLevel(region.latitudeDelta);
    const routeCoords = currentTrip.route.map(routePointToLatLng);

    return optimizeRouteForZoom(routeCoords, zoomLevel);
  }, [currentTrip, region]);

  useEffect(() => {
    console.log('MapScreen: GPS tracking status:', {
      isTracking,
      permission,
      hasLocation: !!location,
    });
  }, [isTracking, permission, location]);

  useEffect(() => {
    if (hasInitialized) return;

    const timeout = setTimeout(() => {
      console.log('GPS timeout - initializing without location');
      setHasInitialized(true);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [hasInitialized]);

  useEffect(() => {
    if (!hasInitialized && currentLocation && mapRef.current) {
      setHasInitialized(true);
      mapRef.current.animateToRegion(
        {
          ...currentLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  }, [currentLocation, hasInitialized]);

  useEffect(() => {
    if (followUser && currentLocation && mapRef.current && hasInitialized) {
      mapRef.current.animateToRegion(
        {
          ...currentLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  }, [currentLocation, followUser, hasInitialized]);

  const handleCenterLocation = useCallback(() => {
    if (currentLocation && mapRef.current) {
      setFollowUser(true);
      mapRef.current.animateToRegion(
        {
          ...currentLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  }, [currentLocation]);

  const handleFitRoute = useCallback(() => {
    if (currentTrip && currentTrip.route.length > 0 && mapRef.current) {
      setFollowUser(false);
      const coords = currentTrip.route.map(routePointToLatLng);
      const region = fitCoordinates(coords, 0.2);
      mapRef.current.animateToRegion(region, 500);
    }
  }, [currentTrip]);

  const handleToggleMapType = useCallback(() => {
    setMapType((prev) => {
      if (prev === 'standard') return 'satellite';
      if (prev === 'satellite') return 'hybrid';
      return 'standard';
    });
  }, []);

  const onRegionChangeComplete = useCallback((newRegion: Region) => {
    setRegion(newRegion);
    setFollowUser(false);
  }, []);

  const mapStyle = useMemo(() => {
    if (!isDark) return undefined;

    return [
      {
        elementType: 'geometry',
        stylers: [{ color: '#242f3e' }],
      },
      {
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#242f3e' }],
      },
      {
        elementType: 'labels.text.fill',
        stylers: [{ color: '#746855' }],
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#38414e' }],
      },
      {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#212a37' }],
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }],
      },
    ];
  }, [isDark]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Đang tải bản đồ...</Text>
        </View>
      )}

      {mapReady && !hasInitialized && (
        <View style={styles.gpsIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <View style={{ marginLeft: 8 }}>
            <Text variant="caption" style={{ color: colors.text }}>
              {permission === 'granted'
                ? isTracking
                  ? 'Đang tìm vệ tinh GPS...'
                  : 'Đang khởi động GPS...'
                : 'Cần cấp quyền truy cập vị trí'}
            </Text>
            {location && (
              <Text variant="caption" style={{ color: colors.success, fontSize: 10 }}>
                GPS đã sẵn sàng! Lat: {location.coords.latitude.toFixed(5)}
              </Text>
            )}
          </View>
        </View>
      )}

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        loadingEnabled={true}
        loadingIndicatorColor={colors.primary}
        loadingBackgroundColor={colors.background}
        minZoomLevel={8}
        maxZoomLevel={20}
        moveOnMarkerPress={false}
        onMapReady={() => setMapReady(true)}
        onRegionChangeComplete={onRegionChangeComplete}
        customMapStyle={mapStyle}
      >
        {mapReady &&
          routeSegments.map((segment, index) => (
            <Polyline
              key={`segment-${index}`}
              coordinates={segment.coordinates}
              strokeColor={getColorBySpeed(segment.avgSpeed)}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          ))}

        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            rotation={location?.coords.heading ?? 0}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.marker, { backgroundColor: colors.primary }]}>
                <View style={styles.markerInner} />
              </View>
              {location?.coords.heading !== undefined && (
                <View style={[styles.heading, { borderTopColor: colors.primary }]} />
              )}
            </View>
          </Marker>
        )}
      </MapView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.surface }]}
          onPress={handleToggleMapType}
        >
          <Text variant="body" color="primary">
            {mapType === 'standard' ? '🗺️' : mapType === 'satellite' ? '🛰️' : '🌍'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: followUser ? colors.primary : colors.surface,
            },
          ]}
          onPress={handleCenterLocation}
        >
          <Text variant="body" color={followUser ? 'inverse' : 'primary'}>
            📍
          </Text>
        </TouchableOpacity>

        {currentTrip && currentTrip.route.length > 0 && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.surface }]}
            onPress={handleFitRoute}
          >
            <Text variant="body" color="primary">
              🔍
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {currentTrip && currentTrip.route.length > 0 && (
        <View style={[styles.statsOverlay, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <Text variant="caption" color="secondary">
              Điểm route
            </Text>
            <Text variant="h4" color="primary">
              {currentTrip.route.length}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="caption" color="secondary">
              Đã tối ưu
            </Text>
            <Text variant="h4" color="primary">
              {optimizedRoute.length}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="caption" color="secondary">
              Segments
            </Text>
            <Text variant="h4" color="primary">
              {routeSegments.length}
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.legend, { backgroundColor: colors.surface }]}>
        <Text variant="caption" color="secondary" style={styles.legendTitle}>
          Tốc độ:
        </Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
            <Text variant="caption" color="secondary">
              0-36
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
            <Text variant="caption" color="secondary">
              36-72
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F97316' }]} />
            <Text variant="caption" color="secondary">
              72-96
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
            <Text variant="caption" color="secondary">
              96+
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    map: {
      flex: 1,
    },
    controls: {
      position: 'absolute',
      top: 16,
      right: 16,
      gap: 12,
    },
    controlButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    markerContainer: {
      alignItems: 'center',
    },
    marker: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 3,
      borderColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
    },
    markerInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'white',
    },
    heading: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderTopWidth: 16,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      marginTop: -3,
    },
    statsOverlay: {
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-around',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    statItem: {
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.border,
    },
    legend: {
      position: 'absolute',
      top: 16,
      left: 16,
      borderRadius: 8,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    legendTitle: {
      marginBottom: 8,
      fontWeight: '600',
    },
    legendItems: {
      gap: 6,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendColor: {
      width: 16,
      height: 3,
      borderRadius: 2,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 1000,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      fontWeight: '600',
    },
    gpsIndicator: {
      position: 'absolute',
      top: 70,
      left: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
      zIndex: 10,
    },
  });
