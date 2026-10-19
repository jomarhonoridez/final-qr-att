import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { useGlobalTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { getProfile, type Role } from '@/lib/profiles';
import Ionicons from '@expo/vector-icons/Ionicons';
import QRCode from 'react-native-qrcode-svg';

export default function TeacherScreen() {
  const { user } = useAuth();
  const { darkMode } = useGlobalTheme();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [generatedValue, setGeneratedValue] = useState('');
  const [activeEventTitle, setActiveEventTitle] = useState('');

  const [startsAt] = useState('2026-10-16 12:31:00');
  const [endsAt] = useState('2026-10-16 13:31:00');

  const themeContainer = darkMode ? styles.darkContainer : styles.lightContainer;
  const themeMainText = darkMode ? styles.darkMainText : styles.lightMainText;
  const themeSubText = darkMode ? styles.darkSubText : styles.lightSubText;
  const themeInput = darkMode ? styles.darkInput : styles.lightInput;
  const themeCard = darkMode ? styles.darkCard : styles.lightCard;

  /* ---------------- BACKEND ACCOUNT VALIDATOR ---------------- */
  const loadTeacherProfile = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await getProfile(user.id);
      setRole(profile?.role ?? 'student');
    } catch (error) {
      console.error('Error fetching role in teacher matrix:', error);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadTeacherProfile();
    }, [loadTeacherProfile])
  );

  /* ---------------- BACKEND SUBMIT HANDLER ---------------- */
  const handleCreateEvent = async () => {
    if (!title.trim() || !code.trim()) {
      Alert.alert('Validation Error', 'Please fill in both the Event Title and Event Code fields.');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Error', 'No active teacher session found.');
      return;
    }

    setLoading(true);

    try {
      const eventPayloadCode = code.trim().toUpperCase();
      const eventPayloadTitle = title.trim();

      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            title: eventPayloadTitle,
            event_code: eventPayloadCode, 
            created_by: user.id,     
          }
        ])
        .select();

      if (error) throw error;

      setActiveEventTitle(eventPayloadTitle);
      setGeneratedValue(eventPayloadCode);
      setModalVisible(true);

      setTitle('');
      setCode('');

    } catch (error: any) {
      console.error('Error inserting event context row:', error);
      Alert.alert('Database Operation Failed', error.message || 'Unable to store the event records.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAndRedirect = () => {
    setModalVisible(false);
    router.push('/history');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={[styles.container, themeContainer]} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={[styles.screenHeaderTitle, themeMainText]}>Create Event QR</Text>
        <Text style={[styles.screenHeaderSubtitle, themeSubText]}>
          Fill in the event details, then scan the generated QR with the Scan tab.
        </Text>

        <View style={styles.formContainer}>
          <Text style={[styles.inputLabel, themeMainText]}>Event Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={[styles.inputField, themeInput]}
            placeholder="e.g. Founders Day Assembly"
            placeholderTextColor="#999"
            editable={!loading}
          />

          <Text style={[styles.inputLabel, themeMainText]}>Event Code</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            style={[styles.inputField, themeInput]}
            placeholder="e.g. EVT-2026-0002"
            placeholderTextColor="#999"
            editable={!loading}
            autoCapitalize="characters"
          />

          <Text style={[styles.inputLabel, themeMainText]}>Starts</Text>
          <View style={[styles.timeRowDisplay, themeInput]}>
            <Ionicons name="sunny-outline" size={18} color={darkMode ? '#AAA' : '#555'} />
            <Text style={[styles.timeText, themeMainText]}>Oct 16, 2026 at 12:31</Text>
          </View>

          <Text style={[styles.inputLabel, themeMainText]}>Ends</Text>
          <View style={[styles.timeRowDisplay, themeInput]}>
            <Ionicons name="moon-outline" size={18} color={darkMode ? '#AAA' : '#555'} />
            <Text style={[styles.timeText, themeMainText]}>Oct 16, 2026 at 13:31</Text>
          </View>

          <View style={styles.chipsRow}>
            <View style={[styles.chip, darkMode && styles.darkChip]}><Text style={[styles.chipText, themeMainText]}>+30 min</Text></View>
            <View style={[styles.chip, darkMode && styles.darkChip]}><Text style={[styles.chipText, themeMainText]}>+1 hour</Text></View>
            <View style={[styles.chip, darkMode && styles.darkChip]}><Text style={[styles.chipText, themeMainText]}>+2 hours</Text></View>
          </View>
          <Text style={styles.chipHintText}>Tap a chip to set the end time from start.</Text>

          <Pressable 
            style={[styles.submitButton, loading && styles.disabledButton]} 
            onPress={handleCreateEvent}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>Create Event & Generate QR</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseAndRedirect}
      >
        <View style={styles.modalBlurOverlayShadow}>
          <View style={[styles.modalCardWrapper, themeCard]}>
            <Text style={[styles.modalEventTitle, themeMainText]}>{activeEventTitle}</Text>
            <Text style={[styles.modalEventSubtitle, themeSubText]}>Event Code: {generatedValue}</Text>
            
            <View style={styles.qrCanvasContainerBox}>
              {generatedValue ? (
                <QRCode
                  value={generatedValue}
                  size={190}
                  backgroundColor="#FFFFFF"
                  color="#000000"
                />
              ) : null}
            </View>

            <Text style={styles.modalInstructionText}>
              The QR is securely saved. Let students scan this screen, or tap close to view the tracking summary log.
            </Text>

            <Pressable style={styles.modalDismissActionButton} onPress={handleCloseAndRedirect}>
              <Text style={styles.modalDismissActionText}>Close & View History Records</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },
  lightContainer: { backgroundColor: '#FAF8F5' },
  darkContainer: { backgroundColor: '#121212' },
  screenHeaderTitle: { fontSize: 22, fontWeight: '700', marginTop: 10 },
  screenHeaderSubtitle: { fontSize: 13, marginTop: 6, marginBottom: 25, lineHeight: 18 },
  formContainer: { width: '100%' },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  inputField: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 14 },
  lightInput: { backgroundColor: '#FFFFFF', borderColor: '#EAEAEA', color: '#222' },
  darkInput: { backgroundColor: '#1E1E1E', borderColor: '#2D2D2D', color: '#FFF' },
  timeRowDisplay: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48 },
  timeText: { fontSize: 14, marginLeft: 10 },
  chipsRow: { flexDirection: 'row', marginTop: 12 },
  chip: { backgroundColor: '#EAEAEA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 8 },
  darkChip: { backgroundColor: '#2D2D2D' },
  chipText: { fontSize: 12, fontWeight: '500' },
  chipHintText: { fontSize: 11, color: '#888', fontStyle: 'italic', marginTop: 6, marginBottom: 24 },
  submitButton: { flexDirection: 'row', backgroundColor: '#4aa9db', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center' },
  disabledButton: { opacity: 0.6 },
  submitButtonText: { color: '#FFF', fontSize: 15, fontWeight: '600', marginLeft: 8 },
  lightMainText: { color: '#222' },
  darkMainText: { color: '#FFF' },
  lightSubText: { color: '#666' },
  darkSubText: { color: '#AAA' },
  lightCard: { backgroundColor: '#FFFFFF', borderColor: '#F0EFEF' },
  darkCard: { backgroundColor: '#1E1E1E', borderColor: '#2D2D2D' },
  modalBlurOverlayShadow: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalCardWrapper: { width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  modalEventTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  modalEventSubtitle: { fontSize: 13, marginTop: 4, marginBottom: 20 },
qrCanvasContainerBox: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#EAEAEA', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
modalInstructionText: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 16, paddingHorizontal: 10, lineHeight: 16 },
modalDismissActionButton: { backgroundColor: '#4aa9db', width: '100%', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
modalDismissActionText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});