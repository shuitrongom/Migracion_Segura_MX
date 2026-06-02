import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, Linking, Animated } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '@/lib/api';

const estatusConfig: Record<string, { color: string; label: string; icon: string; step: number }> = {
  borrador: { color: '#9CA3AF', label: 'Borrador', icon: '📝', step: 1 },
  recibido: { color: '#3498DB', label: 'Recibido', icon: '📥', step: 2 },
  en_revision: { color: '#E67E22', label: 'En revisión', icon: '🔍', step: 3 },
  presentado_inm: { color: '#8E44AD', label: 'Presentado ante INM', icon: '🏛️', step: 4 },
  en_espera_resolucion: { color: '#9B59B6', label: 'En espera de resolución', icon: '⏳', step: 5 },
  aprobado: { color: '#27AE60', label: 'Aprobado', icon: '✅', step: 6 },
  rechazado: { color: '#E74C3C', label: 'Rechazado', icon: '❌', step: 6 },
  cancelado: { color: '#6B7280', label: 'Cancelado', icon: '🚫', step: 0 },
  entregado: { color: '#1ABC9C', label: 'Documento entregado', icon: '📄', step: 7 },
  completado: { color: '#27AE60', label: 'Completado', icon: '🎉', step: 8 },
};

const STEPS = ['Recibido', 'En revisión', 'En espera', 'Resuelto', 'Entregado', 'Completado'];

export default function EstatusScreen() {
  const [tramites, setTramites] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [pagos, setPagos] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'tramites' | 'solicitudes'>('tramites');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadData = async () => {
    await Promise.all([loadTramites(), loadSolicitudes()]);
    setLoading(false);
    setRefreshing(false);
  };

  const loadSolicitudes = async () => {
    try {
      const res = await apiFetch('/solicitudes/mis-solicitudes');
      if (res.ok) {
        const data = await res.json();
        setSolicitudes(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  const loadTramites = async () => {
    try {
      const res = await apiFetch('/tramites?page=1&limit=50');
      if (res.ok) {
        const data = await res.json();
        const tramitesList = data.data || [];
        setTramites(tramitesList);

        // Cargar pagos de cada trámite
        const pagosMap: Record<string, any[]> = {};
        for (const t of tramitesList) {
          try {
            const pagosRes = await apiFetch(`/financiero/pagos/tramite/${t.id}`);
            if (pagosRes.ok) {
              pagosMap[t.id] = await pagosRes.json();
            }
          } catch {}
        }
        setPagos(pagosMap);
      }
    } catch {}
    setLoading(false);
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); }, []);

  if (loading) return (
    <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#f59e0b" />
    </LinearGradient>
  );

  const renderTramite = ({ item }: { item: any }) => {
    const config = estatusConfig[item.estatus] || estatusConfig.borrador;
    const currentStep = config.step;

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
            <Text style={{ fontSize: 16 }}>{config.icon}</Text>
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
          {item.numeroPieza && (
            <Text style={styles.pieceNumber}>#{item.numeroPieza}</Text>
          )}
        </View>

        {/* Tipo de trámite */}
        <Text style={styles.tramiteType}>{(item.tipo || '').replace(/_/g, ' ')}</Text>

        {/* Timeline de progreso */}
        <View style={styles.timeline}>
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStep - 1;
            const isCurrent = index === currentStep - 1;
            return (
              <View key={step} style={styles.timelineStep}>
                <View style={[
                  styles.timelineDot,
                  isCompleted && { backgroundColor: '#27AE60' },
                  isCurrent && { backgroundColor: config.color, transform: [{ scale: 1.3 }] },
                  !isCompleted && !isCurrent && { backgroundColor: 'rgba(255,255,255,0.1)' },
                ]} />
                {index < STEPS.length - 1 && (
                  <View style={[styles.timelineLine, isCompleted && { backgroundColor: '#27AE60' }]} />
                )}
                <Text style={[styles.timelineLabel, isCurrent && { color: config.color, fontWeight: '600' }]}>{step}</Text>
              </View>
            );
          })}
        </View>

        {/* Fecha */}
        <Text style={styles.date}>Iniciado: {item.createdAt?.slice(0, 10)}</Text>

        {/* Pagos pendientes */}
        {pagos[item.id]?.filter((p: any) => p.estatusPago === 'pendiente' && p.mercadopagoInitPoint).map((pago: any) => (
          <TouchableOpacity
            key={pago.id}
            onPress={() => Linking.openURL(pago.mercadopagoInitPoint)}
          >
            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.payButton}>
              <Text style={styles.payButtonText}>💳 Pagar {pago.tipoPago === 'anticipo' ? 'Anticipo' : 'Liquidación'}: ${Number(pago.monto).toLocaleString()} MXN</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {/* Pagos aprobados */}
        {pagos[item.id]?.filter((p: any) => p.estatusPago === 'aprobado').map((pago: any) => (
          <View key={pago.id} style={styles.paidBadge}>
            <Text style={styles.paidText}>✅ {pago.tipoPago === 'anticipo' ? 'Anticipo' : 'Liquidación'} pagado: ${Number(pago.monto).toLocaleString()}</Text>
          </View>
        ))}

        {/* Pieza INM */}
        {item.numeroPieza && !item.numeroPieza.startsWith('MSX-') && (
          <View style={styles.inmDataBox}>
            <Text style={styles.inmDataLabel}>📋 Pieza INM</Text>
            <Text style={styles.inmDataValue}>{item.numeroPieza}</Text>
          </View>
        )}

        {/* NUT */}
        {(item.nut || item.datosFormulario?.nut) && (
          <View style={styles.inmDataBox}>
            <Text style={styles.inmDataLabel}>🔑 NUT</Text>
            <Text style={styles.inmDataValue}>{item.nut || item.datosFormulario?.nut}</Text>
          </View>
        )}

        {/* Leyenda de requisitos - mostrar cuando está en revisión */}
        {(item.estatus === 'en_revision' || item.estatus === 'recibido') && (
          <View style={styles.requisitosLeyenda}>
            <Text style={styles.requisitosTitle}>📄 Importante sobre tus documentos:</Text>
            <Text style={styles.requisitosText}>• Entrega todos los requisitos en original y copia.</Text>
            <Text style={styles.requisitosText}>• La solicitud debe estar firmada.</Text>
            <Text style={styles.requisitosText}>• Tu firma debe ser lo más parecida posible a la de tu pasaporte para que no sea rechazada por el INM.</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <Text style={styles.title}>Estatus de trámites</Text>
          <Text style={styles.subtitle}>Sigue el progreso de tus solicitudes</Text>
        </View>
      </Animated.View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'tramites' && styles.tabBtnActive]}
          onPress={() => setActiveTab('tramites')}
        >
          <Text style={[styles.tabText, activeTab === 'tramites' && styles.tabTextActive]}>Trámites</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'solicitudes' && styles.tabBtnActive]}
          onPress={() => setActiveTab('solicitudes')}
        >
          <Text style={[styles.tabText, activeTab === 'solicitudes' && styles.tabTextActive]}>
            Solicitudes {solicitudes.filter(s => s.estatus === 'pendiente_pago').length > 0 ? `🔴` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'tramites' && (tramites.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Text style={{ fontSize: 48 }}>📋</Text>
          </View>
          <Text style={styles.emptyTitle}>Sin trámites</Text>
          <Text style={styles.emptyText}>Cuando inicies un trámite, aquí verás su progreso en tiempo real</Text>
        </View>
      ) : (
        <FlatList
          data={tramites}
          renderItem={renderTramite}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
        />
      ))}

      {activeTab === 'solicitudes' && (
        solicitudes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>Sin solicitudes</Text>
            <Text style={styles.emptyText}>Aquí verás tus solicitudes de generación de documentos INM.</Text>
          </View>
        ) : (
          <FlatList
            data={solicitudes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
            renderItem={({ item }) => {
              const ESTATUS_SOL: Record<string, { color: string; label: string; icon: string }> = {
                pendiente_revision: { color: '#E67E22', label: 'Pendiente revisión', icon: '⏳' },
                en_proceso: { color: '#3498DB', label: 'En proceso', icon: '🔄' },
                pendiente_pago: { color: '#E74C3C', label: 'Pago pendiente', icon: '💳' },
                pagada: { color: '#27AE60', label: 'Pagada', icon: '✅' },
                cancelada: { color: '#6B7280', label: 'Cancelada', icon: '🚫' },
              };
              const cfg = ESTATUS_SOL[item.estatus] || ESTATUS_SOL.pendiente_revision;
              const tipoLabel = (item.tipoTramite || '').replace(/_/g, ' ');
              const nombre = `${item.datosFormulario?.nombre || ''} ${item.datosFormulario?.apellidos || ''}`.trim();
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.color + '15' }]}>
                      <Text style={{ fontSize: 16 }}>{cfg.icon}</Text>
                      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.pieceNumber}>{item.costo ? `$${item.costo} MXN` : ''}</Text>
                  </View>
                  <Text style={styles.tramiteType}>{tipoLabel}</Text>
                  {nombre && <Text style={styles.date}>Extranjero: {nombre}</Text>}
                  <Text style={styles.date}>Creada: {item.createdAt?.slice(0, 10)}</Text>

                  {/* Botón pagar si está pendiente */}
                  {item.estatus === 'pendiente_pago' && item.mercadopagoInitPoint && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(item.mercadopagoInitPoint)}
                      style={styles.payButton}
                    >
                      <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.payButton}>
                        <Text style={styles.payButtonText}>💳 Pagar $100 MXN — Enlace de pago</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {/* Pagada */}
                  {item.estatus === 'pagada' && (
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidText}>✅ Solicitud pagada el {item.fechaPago?.slice(0, 10)}</Text>
                    </View>
                  )}
                </View>
              );
            }}
          />
        )
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#ffffff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },

  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 13, fontWeight: '600' },
  pieceNumber: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' },
  tramiteType: { fontSize: 16, fontWeight: '600', color: '#ffffff', textTransform: 'capitalize', marginBottom: 16 },

  timeline: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  timelineStep: { alignItems: 'center', flex: 1 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 6 },
  timelineLine: { position: 'absolute', top: 5, left: '50%', right: '-50%', height: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
  timelineLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },

  date: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },

  payButton: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, marginTop: 10, alignItems: 'center', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  payButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  paidBadge: { backgroundColor: '#27AE6015', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginTop: 8 },
  paidText: { color: '#27AE60', fontSize: 12, fontWeight: '500' },
  inmDataBox: { backgroundColor: 'rgba(245,158,11,0.06)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', borderRadius: 10, padding: 12, marginTop: 10 },
  inmDataLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  inmDataValue: { fontSize: 18, fontWeight: '700', color: '#f59e0b', fontFamily: 'monospace', marginTop: 4 },
  requisitosLeyenda: { backgroundColor: 'rgba(245,158,11,0.04)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)', borderRadius: 10, padding: 12, marginTop: 12 },
  requisitosTitle: { fontSize: 12, fontWeight: '700', color: '#f59e0b', marginBottom: 6 },
  requisitosText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 18, marginBottom: 2 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  emptyIconContainer: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 20 },

  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  tabBtnActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)' },
  tabText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  tabTextActive: { color: '#f59e0b' },
});
