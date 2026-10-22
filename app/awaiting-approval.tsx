import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useGlobalTheme } from '@/lib/theme';
import { signOut } from '@/lib/auth';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function AwaitingApprovalScreen() {
  const { darkMode } = useGlobalTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const themeContainer = darkMode ? styles.darkContainer : styles.lightContainer;
  const themeMainText = darkMode ? styles.darkMainText : styles.lightMainText;
  const themeSubText = darkMode ? styles.darkSubText : styles.lightSubText;

  return (
    <View style={[styles.container, themeContainer]}>
      <Ionicons name="time-outline" size={80} color="#3498db" style={styles.icon} />
      
      <Text style={[styles.title, themeMainText]}>Account Pending Approval</Text>
      
      <Text style={[styles.subtitle, themeSubText]}>
        Your registration was successful! However, your account must be verified by a teacher before you can log in. Please check back shortly.
      </Text>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#FFF" />
        <Text style={styles.logoutButtonText}>Back to Sign In</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  lightContainer: { backgroundColor: '#FAF8F5' },
  darkContainer: { backgroundColor: '#121212' },
  icon: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 35, paddingHorizontal: 10 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e74c3c', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  logoutButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  darkMainText: { color: '#FFF' },
  lightMainText: { color: '#222' },
  darkSubText: { color: '#AAA' },
  lightSubText: { color: '#666' }
});
