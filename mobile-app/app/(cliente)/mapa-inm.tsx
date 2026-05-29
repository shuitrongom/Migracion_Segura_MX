import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// Oficinas del INM en CDMX y principales ciudades
const INM_OFFICES = [
  { id: '1', name: 'INM Delegación CDMX', address: 'Av. Ejército Nacional 862, Polanco', lat: 19.4326, lng: -99.1892 },
  { id: '2', name: 'INM Oficina Central', address: 'Versalles 49, Juárez, CDMX', lat: 19.4270, lng: -99.1580 },
  { id: '3', name: 'INM Aeropuerto CDMX', address: 'Terminal 1, AICM', lat: 19.4363, lng: -99.0721 },
  { id: '4', name: 'INM Guadalajara', address: 'Av. Alcalde 500, Guadalajara', lat: 20.6767, lng: -103.3475 },
  { id: '5', name: 'INM Monterrey', address: 'Av. Constitución 411, Monterrey', lat: 25.6714, lng: -100.3090 },
  { id: '6', name: 'INM Cancún', address: 'Av. Nader 1, SM 2, Cancún', lat: 21.1619, lng: -86.8515 },
];

export default function MapaINMScreen() {
  const [selectedOffice, setSelectedOffice] = useState<typeof INM_OFFICES[0] | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const openInMaps = (office: typeof INM_OFFICES[0]) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${office.lat},${office.lng}(${office.name})`,
      android: `geo:${office.lat},${office.lng}?q=${office.lat},${office.lng}(${office.name})`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={styles.headerGradient}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>Oficinas del INM</Text>
          <Text style={styles.subtitle}>Encuentra la oficina más cercana para tu cita</Text>
        </Animated.View>
      </LinearGradient>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{ latitude: 19.4326, longitude: -99.1332, latitudeDelta: 0.15, longitudeDelta: 0.15 }}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        >
          {INM_OFFICES.map((office) => (
            <Marker
              key={office.id}
              coordinate={{ latitude: office.lat, longitude: office.lng }}
              title={office.name}
              description={office.address}
              onPress={() => setSelectedOffice(office)}
              pinColor="#f59e0b"
            />
          ))}
        </MapView>
      </View>

      {/* Detalle de oficina seleccionada */}
      {selectedOffice && (
        <View style={styles.officeCard}>
          <LinearGradient colors={['rgba(245,158,11,0.1)', 'rgba(245,158,11,0.02)']} style={styles.officeCardBg}>
            <View style={styles.officeInfo}>
              <Text style={styles.officeName}>{selectedOffice.name}</Text>
              <Text style={styles.officeAddress}>{selectedOffice.address}</Text>
            </View>
            <TouchableOpacity onPress={() => openInMaps(selectedOffice)}>
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.directionsBtn}>
                <Text style={styles.directionsBtnText}>📍 Cómo llegar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Lista de oficinas */}
      <View style={styles.officesList}>
        {INM_OFFICES.slice(0, 3).map((office) => (
          <TouchableOpacity key={office.id} style={styles.officeItem} onPress={() => setSelectedOffice(office)}>
            <View style={styles.officeIcon}>
              <Text style={{ fontSize: 16 }}>🏛️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.officeItemName}>{office.name}</Text>
              <Text style={styles.officeItemAddress}>{office.address}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  headerGradient: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#ffffff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  mapContainer: { height: 280, marginHorizontal: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  map: { flex: 1 },

  officeCard: { marginHorizontal: 12, marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  officeCardBg: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  officeInfo: { flex: 1, marginRight: 12 },
  officeName: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  officeAddress: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  directionsBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  directionsBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },

  officesList: { paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  officeItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  officeIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.1)', justifyContent: 'center', alignItems: 'center' },
  officeItemName: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  officeItemAddress: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
});
