import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/types';

interface StatCard {
  label: string;
  value: string;
  color: string;
}

export default function AdminDashboardScreen() {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const isAdmin = user?.role === UserRole.ADMINISTRADOR;

  // TODO: Conectar con API real
  const stats: StatCard[] = [
    { label: 'Trámites activos', value: '24', color: '#C4A265' },
    { label: 'Pendientes revisión', value: '8', color: '#E67E22' },
    { label: 'Citas hoy', value: '5', color: '#27AE60' },
    { label: 'Documentos por revisar', value: '12', color: '#3498DB' },
  ];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Refrescar datos
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.welcome}>
        <Text style={styles.greeting}>
          Hola, {user?.fullName || 'Usuario'} 👋
        </Text>
        <Text style={styles.roleTag}>
          {isAdmin ? '🔑 Administrador' : '📋 Gestor'}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionEmoji}>📄</Text>
            <Text style={styles.actionText}>Nuevo trámite</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionEmoji}>👤</Text>
            <Text style={styles.actionText}>Nuevo extranjero</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionEmoji}>📅</Text>
            <Text style={styles.actionText}>Agendar cita</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionEmoji}>📊</Text>
            <Text style={styles.actionText}>Reportes</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actividad reciente</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: '#27AE60' }]} />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Trámite #TR-001 aprobado</Text>
              <Text style={styles.activityTime}>Hace 2 horas</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: '#E67E22' }]} />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Documento pendiente de revisión</Text>
              <Text style={styles.activityTime}>Hace 4 horas</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: '#3498DB' }]} />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Nueva cita programada</Text>
              <Text style={styles.activityTime}>Ayer</Text>
            </View>
          </View>
        </View>
      </View>

      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solo Admin</Text>
          <TouchableOpacity style={styles.adminAction}>
            <Text style={styles.adminActionText}>👥 Gestionar gestores</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.adminAction}>
            <Text style={styles.adminActionText}>⚙️ Configuración del sistema</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.webNote}>
        <Text style={styles.webNoteText}>
          💻 Para gestión completa, usa el panel web:{'\n'}
          migracion-segura-mx-admin-panel.vercel.app
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  welcome: {
    padding: 20,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C1810',
  },
  roleTag: {
    fontSize: 14,
    color: '#6B5B4F',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B5B4F',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C1810',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8DFD3',
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2C1810',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#2C1810',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: '#8B7B6F',
    marginTop: 2,
  },
  adminAction: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8DFD3',
  },
  adminActionText: {
    fontSize: 15,
    color: '#2C1810',
    fontWeight: '500',
  },
  webNote: {
    margin: 20,
    backgroundColor: '#EDE9E0',
    borderRadius: 10,
    padding: 16,
  },
  webNoteText: {
    fontSize: 13,
    color: '#6B5B4F',
    textAlign: 'center',
    lineHeight: 20,
  },
});
