import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';

interface WizardStep {
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

interface FormWizardProps {
  steps: WizardStep[];
  onFinish: () => void;
  finishLabel?: string;
}

export default function FormWizard({ steps, onFinish, finishLabel = 'Siguiente →' }: FormWizardProps) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  const handleNext = () => {
    if (isLast) {
      onFinish();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) setCurrentStep(prev => prev - 1);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Progress bar */}
      <View style={[styles.progressContainer, { borderBottomColor: colors.borderLight }]}>
        <View style={styles.progressBar}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.progressDot, { backgroundColor: i <= currentStep ? '#f59e0b' : colors.borderLight }]} />
          ))}
        </View>
        <Text style={[styles.stepCounter, { color: colors.textMuted }]}>Paso {currentStep + 1} de {steps.length}</Text>
      </View>

      {/* Step header */}
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>{step.subtitle}</Text>
      </View>

      {/* Step content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.stepContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step.content}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={[styles.navContainer, { borderTopColor: colors.borderLight }]}>
        {!isFirst ? (
          <TouchableOpacity onPress={handleBack} style={[styles.backBtn, { borderColor: colors.border }]}>
            <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>← Anterior</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85} style={{ flex: 1, marginLeft: isFirst ? 0 : 10 }}>
          <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>{isLast ? finishLabel : 'Siguiente →'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Helper message */}
      <Text style={[styles.helperText, { color: colors.textMuted }]}>
        💡 Llena los datos que conozcas. Si no tienes toda la información, tu asesor te contactará para completarla.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressBar: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 24, height: 4, borderRadius: 2 },
  stepCounter: { fontSize: 11, fontWeight: '500' },
  stepHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  stepTitle: { fontSize: 18, fontWeight: '700' },
  stepSubtitle: { fontSize: 13, marginTop: 4, lineHeight: 19 },
  stepContent: { paddingHorizontal: 16, paddingBottom: 16 },
  navContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, alignItems: 'center' },
  backBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1 },
  backBtnText: { fontSize: 14, fontWeight: '600' },
  nextBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  nextBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  helperText: { fontSize: 11, textAlign: 'center', paddingHorizontal: 24, paddingBottom: 12, lineHeight: 16 },
});
