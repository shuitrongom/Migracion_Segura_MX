import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, ScrollView, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { apiFetch } from '@/lib/api';
import { useTheme } from '@/lib/theme';

const PARENTESCOS = [
  { value: 'yo_mismo', label: 'Yo mismo' },
  { value: 'esposa', label: 'Esposa/o' },
  { value: 'hijo', label: 'Hijo/a' },
  { value: 'hermano', label: 'Hermano/a' },
  { value: 'padre', label: 'Padre/Madre' },
  { value: 'amigo', label: 'Amigo/a' },
  { value: 'familiar', label: 'Otro familiar' },
  { value: 'otro', label: 'Otro' },
];

interface Beneficiario {
  id: string;
  nombre: string;
  apellidos: string;
  parentesco: string;
  nacionalidad?: string;
  curp?: string;
  email?: string;
  telefono?: string;
  sexo?: string;
  fechaNacimiento?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
}

export default function BeneficiariosScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ selectMode?: string; redirect?: string }>();
  const selectMode = params.selectMode === 'true';

  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [parentesco, setParentesco] = useState('yo_mismo');
  const [nacionalidad, setNacionalidad] = useState('');
  const [curp, setCurp] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await apiFetch('/beneficiarios/mis-beneficiarios');
      if (res.ok) {
        const data = await res.json();
        setBeneficiarios(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoading(false);
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, []);

  const handleCreate = async () => {
    if (!nombre.trim() || !apellidos.trim()) {
      Alert.alert('Error', 'Nombre y apellidos son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch('/beneficiarios', {
        method: 'POST',
        body: JSON.stringify({
          nombre: nombre.trim(),
          apellidos: apellidos.trim(),
          parentesco,
          nacionalidad: nacionalidad.trim() || null,
          curp: curp.trim() || null,
          email: email.trim() || null,
          telefono: telefono.trim() || null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setBeneficiarios(prev => [created, ...prev]);
        resetForm();
        setShowForm(false);

        // Si estamos en modo selección, seleccionar automáticamente al recién creado
        if (selectMode) {
          handleSelect(created);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo crear el beneficiario');
      }
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally { setSaving(false); }
  };

  const handleSelect = (beneficiario: Beneficiario) => {
    if (selectMode) {
      const redirect = params.redirect || '/(cliente)/solicitud-nueva';
      router.navigate({
        pathname: redirect as any,
        params: { beneficiarioId: beneficiario.id, beneficiarioNombre: `${beneficiario.nombre} ${beneficiario.apellidos}` },
      });
    }
  };

  const handleDelete = (id: string, nombre: string) => {
    Alert.alert(
      'Eliminar beneficiario',
      `¿Estás seguro de eliminar a "${nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
          await apiFetch(`/beneficiarios/mis-beneficiarios/${id}`, { method: 'DELETE' });
          setBeneficiarios(prev => prev.filter(b => b.id !== id));
        }},
      ]
    );
  };

  const resetForm = () => {
    setNombre(''); setApellidos(''); setParentesco('yo_mismo');
    setNacionalidad(''); setCurp(''); setEmail(''); setTelefono('');
  };

  if (loading) return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#f59e0b" />
    </LinearGradient>
  );

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {selectMode ? '¿Para quién es el trámite?' : 'Mis Beneficiarios'}
        </Text>
        <Text style={styles.subtitle}>
          {selectMode ? 'Selecciona o registra un nuevo extranjero' : 'Extranjeros registrados en tu cuenta'}
        </Text>
      </View>

      {/* Botón crear nuevo */}
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
        <Text style={{ fontSize: 20 }}>➕</Text>
        <Text style={styles.addBtnText}>Agregar nuevo extranjero</Text>
      </TouchableOpacity>

      {/* Lista de beneficiarios */}
      {beneficiarios.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48 }}>👤</Text>
          <Text style={styles.emptyTitle}>Sin beneficiarios</Text>
          <Text style={styles.emptyText}>Agrega a las personas para quienes harás trámites migratorios.</Text>
        </View>
      ) : (
        <FlatList
          data={beneficiarios}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          renderItem={({ item }) => {
            const parentescoLabel = PARENTESCOS.find(p => p.value === item.parentesco)?.label || item.parentesco;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => selectMode ? handleSelect(item) : null}
                activeOpacity={selectMode ? 0.7 : 1}
              >
                <View style={styles.cardRow}>
                  <View style={styles.avatar}>
                    <Text style={{ fontSize: 20 }}>👤</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{item.nombre} {item.apellidos}</Text>
                    <View style={styles.tagRow}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{parentescoLabel}</Text>
                      </View>
                      {item.nacionalidad && (
                        <View style={[styles.tag, { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)' }]}>
                          <Text style={[styles.tagText, { color: '#3b82f6' }]}>{item.nacionalidad}</Text>
                        </View>
                      )}
                    </View>
                    {item.curp && <Text style={styles.cardSub}>CURP: {item.curp}</Text>}
                  </View>
                  {selectMode && <Text style={{ color: '#f59e0b', fontSize: 20 }}>→</Text>}
                  {!selectMode && (
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id, `${item.nombre} ${item.apellidos}`)}
                      style={{ padding: 8, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)' }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={{ fontSize: 16 }}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Modal para crear beneficiario */}
      <Modal visible={showForm} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={styles.modalTitle}>Nuevo beneficiario</Text>
              <Text style={styles.modalSubtitle}>Datos del extranjero</Text>

              <Text style={styles.fieldLabel}>Nombre(s) *</Text>
              <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Juan" placeholderTextColor="#666" />

              <Text style={styles.fieldLabel}>Apellidos *</Text>
              <TextInput style={styles.input} value={apellidos} onChangeText={setApellidos} placeholder="Pérez López" placeholderTextColor="#666" />

              <Text style={styles.fieldLabel}>Parentesco / Relación</Text>
              <View style={styles.parentescoRow}>
                {PARENTESCOS.slice(0, 4).map(p => (
                  <TouchableOpacity
                    key={p.value}
                    style={[styles.parentescoChip, parentesco === p.value && styles.parentescoChipActive]}
                    onPress={() => setParentesco(p.value)}
                  >
                    <Text style={[styles.parentescoChipText, parentesco === p.value && styles.parentescoChipTextActive]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.parentescoRow}>
                {PARENTESCOS.slice(4).map(p => (
                  <TouchableOpacity
                    key={p.value}
                    style={[styles.parentescoChip, parentesco === p.value && styles.parentescoChipActive]}
                    onPress={() => setParentesco(p.value)}
                  >
                    <Text style={[styles.parentescoChipText, parentesco === p.value && styles.parentescoChipTextActive]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Nacionalidad</Text>
              <TextInput style={styles.input} value={nacionalidad} onChangeText={setNacionalidad} placeholder="Colombiana" placeholderTextColor="#666" />

              <Text style={styles.fieldLabel}>CURP (si tiene)</Text>
              <TextInput style={styles.input} value={curp} onChangeText={t => setCurp(t.toUpperCase())} placeholder="CURP del extranjero" placeholderTextColor="#666" autoCapitalize="characters" />

              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="correo@ejemplo.com" placeholderTextColor="#666" keyboardType="email-address" />

              <Text style={styles.fieldLabel}>Teléfono</Text>
              <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} placeholder="+52 55 1234 5678" placeholderTextColor="#666" keyboardType="phone-pad" />

              {/* Botones */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={saving}>
                <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.saveBtnGradient}>
                  <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : '✓ Guardar beneficiario'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { resetForm(); setShowForm(false); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, marginBottom: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: '#f59e0b', fontSize: 14, fontWeight: '500' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  addBtn: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, padding: 16, borderRadius: 14, borderWidth: 2, borderColor: '#f59e0b', borderStyle: 'dashed', backgroundColor: 'rgba(245,158,11,0.05)', gap: 12, marginBottom: 16 },
  addBtnText: { color: '#f59e0b', fontSize: 15, fontWeight: '600' },

  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245,158,11,0.1)', justifyContent: 'center', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  cardSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontFamily: 'monospace' },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  tagText: { fontSize: 10, fontWeight: '600', color: '#f59e0b' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#333', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#fff' },
  parentescoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  parentescoChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#333', backgroundColor: '#1e1e1e' },
  parentescoChipActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)' },
  parentescoChipText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  parentescoChipTextActive: { color: '#f59e0b' },
  saveBtn: { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
  saveBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '500' },
});
