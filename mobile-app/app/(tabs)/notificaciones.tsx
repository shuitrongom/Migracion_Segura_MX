import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Notificacion {
  id: string;
  tipo: 'cambio_estatus' | 'documento_rechazado' | 'cita_proxima' | 'pago_pendiente' | 'mensaje_asesor' | 'documento_por_vencer';
  titulo: string;
  contenido: string;
  fecha: string;
  leida: boolean;
}

const TIPO_ICONS: Record<string, string> = {
  cambio_estatus: '📋',
  documento_rechazado: '❌',
  cita_proxima: '📅',
  pago_pendiente: '💰',
  mensaje_asesor: '💬',
  documento_por_vencer: '⚠️',
};

// Mock data
const MOCK_NOTIFICACIONES: Notificacion[] = [
  {
    id: '1',
    tipo: 'cambio_estatus',
    titulo: 'Cambio de estatus',
    contenido: 'Tu trámite MSM-2024-001234 cambió a "En revisión".',
    fecha: '2024-03-18 14:30',
    leida: false,
  },
  {
    id: '2',
    tipo: 'documento_por_vencer',
    titulo: 'Documento por vencer',
    contenido: 'Tu pasaporte vence en 5 días. Actualiza tu documento.',
    fecha: '2024-03-18 09:00',
    leida: false,
  },
  {
    id: '3',
    tipo: 'cita_proxima',
    titulo: 'Cita próxima',
    contenido: 'Tienes una cita por videollamada el 25 de marzo a las 10:00.',
    fecha: '2024-03-17 18:00',
    leida: false,
  },
  {
    id: '4',
    tipo: 'documento_rechazado',
    titulo: 'Documento rechazado',
    contenido: 'Tu carta de empleo fue rechazada. Motivo: firma ilegible.',
    fecha: '2024-03-16 11:45',
    leida: true,
  },
  {
    id: '5',
    tipo: 'mensaje_asesor',
    titulo: 'Mensaje de tu asesor',
    contenido: 'Carlos Mendoza te envió un mensaje sobre tu expediente.',
    fecha: '2024-03-15 16:20',
    leida: true,
  },
  {
    id: '6',
    tipo: 'pago_pendiente',
    titulo: 'Pago pendiente',
    contenido: 'Tienes un pago pendiente de $3,500 MXN por concepto de honorarios.',
    fecha: '2024-03-14 10:00',
    leida: true,
  },
];

export default function NotificacionesScreen() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(MOCK_NOTIFICACIONES);

  const marcarComoLeida = (id: string) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );
  };

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Notificaciones</Text>
          {noLeidas > 0 && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{noLeidas}</Text>
            </View>
          )}
        </View>

        {/* Lista de notificaciones */}
        {notificaciones.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptyText}>
              Cuando haya actualizaciones sobre tu trámite, aparecerán aquí.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notificaciones.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notifCard, !notif.leida && styles.notifCardUnread]}
                onPress={() => marcarComoLeida(notif.id)}
                accessibilityRole="button"
                accessibilityLabel={`${notif.leida ? '' : 'No leída. '}${notif.titulo}: ${notif.contenido}`}
              >
                {/* Unread dot */}
                {!notif.leida && <View style={styles.unreadDot} />}

                {/* Icon */}
                <Text style={styles.notifIcon}>{TIPO_ICONS[notif.tipo] ?? '📌'}</Text>

                {/* Content */}
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitulo, !notif.leida && styles.notifTituloUnread]}>
                    {notif.titulo}
                  </Text>
                  <Text style={styles.notifContenido} numberOfLines={2}>
                    {notif.contenido}
                  </Text>
                  <Text style={styles.notifFecha}>{notif.fecha}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  unreadCountBadge: {
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCountText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', maxWidth: 260 },
  list: { gap: 10 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  notifCardUnread: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  unreadDot: {
    position: 'absolute',
    top: 18,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  notifIcon: { fontSize: 20, marginRight: 12, marginTop: 2 },
  notifContent: { flex: 1 },
  notifTitulo: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 },
  notifTituloUnread: { fontWeight: '700', color: '#111827' },
  notifContenido: { fontSize: 13, color: '#6b7280', marginBottom: 6, lineHeight: 18 },
  notifFecha: { fontSize: 11, color: '#9ca3af' },
});
