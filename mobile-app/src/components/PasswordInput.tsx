import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#6B5B4F" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <Path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      </Svg>
    );
  }
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#6B5B4F" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <Path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <Path d="M1 1l22 22" />
    </Svg>
  );
}

export default function PasswordInput({ value, onChangeText, placeholder = 'Contraseña' }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={!visible}
        autoCapitalize="none"
      />
      <TouchableOpacity
        onPress={() => setVisible(!visible)}
        style={styles.toggle}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <EyeIcon open={visible} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DFD3',
    borderRadius: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2C1810',
  },
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
