import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useGlobalTheme } from '@/lib/theme';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/lib/auth'; // Context integration
import { getProfile, type Role } from '@/lib/profiles'; // Profile resolution

export default function DashboardScreen() {
  const { darkMode } = useGlobalTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    if (!user) {
      setRole(null);
      return;
    }

    getProfile(user.id)
      .then((profile) => {
        setRole(profile?.role ?? 'student');
      })
      .catch((error) => {
        console.error('Error loading role in dashboard:', error);
        setRole('student'); // Fallback safely to student limits
      });
  }, [user]);

  const themeContainer = darkMode ? styles.darkContainer : styles.lightContainer;
  const themeCard = darkMode ? styles.darkCard : styles.lightCard;
  const themeMainText = darkMode ? styles.darkMainText : styles.lightMainText;
  const themeSubText = darkMode ? styles.darkSubText : styles.lightSubText;

  return (
    <View style={[styles.container, themeContainer]}>
      {/* Header Banner */}
      <View style={[styles.headerBanner, darkMode && styles.darkHeaderBanner]}>
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="person" size={28} color="#4aa9db" />
          </View>
          <View style={styles.headerTextWrapper}>
            <Text style={styles.bannerTitle}>Welcome Back!</Text>
            <Text style={styles.bannerSubtitle}>
              {role === 'teacher' ? 'Ready to manage attendance?' : 'Track your check-in records'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, themeMainText]}>Quick Actions</Text>

      {/* Action Button 1 - Visible to Everyone */}
      <Pressable 
        style={[styles.actionButton, themeCard]} 
        onPress={() => router.push('/history')}
      >
        <Ionicons name="time-outline" size={22} color={darkMode ? '#AAA' : '#555'} />
        <Text style={[styles.actionButtonText, themeMainText]}>Attendance History</Text>
      </Pressable>

      {/* Action Button 2 - ONLY Visible to Teachers */}
      {role === 'teacher' && (
        <Pressable 
          style={[styles.actionButton, themeCard]} 
          onPress={() => router.push('/teacher')}
        >
          <Ionicons name="school-outline" size={22} color={darkMode ? '#AAA' : '#555'} />
          <Text style={[styles.actionButtonText, themeMainText]}>Teacher Management</Text>
        </Pressable>
      )}

      {/* Action Button 3 - ONLY Visible to Students */}
      {role === 'student' && (
        <Pressable 
          style={[styles.actionButton, themeCard]} 
          onPress={() => router.push('/scan')}
        >
          <Ionicons name="qr-code-outline" size={22} color={darkMode ? '#AAA' : '#555'} />
          <Text style={[styles.actionButtonText, themeMainText]}>Scan QR Attendance</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  lightContainer: { backgroundColor: '#FAF8F5' },
  darkContainer: { backgroundColor: '#121212' },
  headerBanner: {
    backgroundColor: '#1a73e8',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    marginTop: 10,
  },
  darkHeaderBanner: {
    backgroundColor: '#1E3A8A',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrapper: {
    marginLeft: 15,
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  lightCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EAEAEA',
  },
  darkCard: {
    backgroundColor: '#1E1E1E',
    borderColor: '#2D2D2D',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  lightMainText: { color: '#222' },
  darkMainText: { color: '#FFF' },
  lightSubText: { color: '#888' },
  darkSubText: { color: '#AAA' },
});
