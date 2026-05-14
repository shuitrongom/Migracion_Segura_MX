import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

interface Ticket {
  id: string;
  asunto: string;
  estatus: 'abierto' | 'en_atencion' | 'resuelto' | 'cerrado';
  fecha: string;
}

const ESTATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  abierto: { label: 'Abierto', bgColor: '#eff6ff', textColor: '#2563eb' },
  en_atencion: { label: 'En atención', bgColor: '#fffbeb', textColor: '#b45309' },
  resuelto: { label: 'Resuelto', bgColor: '#f0fdf4', textColor: '#15803d' },
  cerrado: { label: 'Cerrado', bgColor: '#f3f4f6', textColor: '#6b7280' },
};

// Mock data
const MOCK_TICKETS: Ticket[] = [
  {
    id: '1',
    asunto: 'No puedo subir mi comprobante de domicilio',
    estatus: 'en_atencion',
    fecha: '2024-03-17',
  },
  {
    id: '2',
    asunto: 'Consulta sobre requisitos para renovación',
    estatus: 'abierto',
    fecha: '2024-03-15',
  },
  {
    id: '3',
    asunto: 'Error al agendar cita',
    estatus: 'resuelto',
    fecha: '2024-03-10',
  },
  {
    id: '4',
    asunto: 'Solicitud de factura',
    estatus: 'cerrado',
    fecha: '2024-02-28',
  },
];

export default function SoporteScreen() {
  const router = useRouter();
  const [tickets] = useState<Ticket[]>(MOCK_TICKETS);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Regresar"
          >
            <Text style={styles.backButton}>← Regresar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Soporte</Text>
        </View>

        {/* Crear nuevo ticket */}
        <TouchableOpacity
          style={styles.newTicketButton}
          accessibilityRole="button"
          accessibilityLabel="Crear nuevo ticket de soporte"
        >
          <Text style={styles.newTicketButtonText}>+ Nuevo Ticket</Text>
        </TouchableOpacity>

        {/* Lista de tickets */}
        {tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={styles.emptyTitle}>Sin tickets</Text>
            <Text style={styles.emptyText}>
              No tienes tickets de soporte. Crea uno si necesitas ayuda.
            </Text>
          </View>
        ) : (
          <View style={styles.ticketList}>
            {tickets.map((ticket) => {
              const config = ESTATUS_CONFIG[ticket.estatus];
              return (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.ticketCard}
                  accessibilityRole="button"
                  accessibilityLabel={`Ticket: ${ticket.asunto}, estatus: ${config.label}`}
                >
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketAsunto} numberOfLines={2}>
                      {ticket.asunto}
                    </Text>
                    <View style={[styles.estatusBadge, { backgroundColor: config.bgColor }]}>
                      <Text style={[styles.estatusBadgeText, { color: config.textColor }]}>
                        {config.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.ticketFecha}>{ticket.fecha}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 32 },
  header: { marginBottom: 20 },
  backButton: { fontSize: 14, color: '#2563eb', fontWeight: '500', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  newTicketButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  newTicketButtonText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', maxWidth: 260 },
  ticketList: { gap: 12 },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  ticketAsunto: { fontSize: 14, fontWeight: '500', color: '#111827', flex: 1 },
  estatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  estatusBadgeText: { fontSize: 11, fontWeight: '600' },
  ticketFecha: { fontSize: 12, color: '#9ca3af' },
});
