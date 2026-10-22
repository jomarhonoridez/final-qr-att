import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { useGlobalTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { getProfile, type Role } from '@/lib/profiles';
import Ionicons from '@expo/vector-icons/Ionicons';
import QRCode from 'react-native-qrcode-svg';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

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

  // Live Date Objects States
  const [startsAt, setStartsAt] = useState<Date>(new Date());
  const [endsAt, setEndsAt] = useState<Date>(() => {
    const defaultEnd = new Date();
    defaultEnd.setHours(defaultEnd.getHours() + 1);
    return defaultEnd;
  });

  // Modal Picker Toggles
  const [isStartPickerVisible, setStartPickerVisibility] = useState(false);
  const [isEndPickerVisible, setEndPickerVisibility] = useState(false);

  // Time preset configuration chips
  const handleExtendEndTime = (minutes: number) => {
    const freshStart = new Date();
    setStartsAt(freshStart);
    const prospectiveEnd = new Date(freshStart.getTime() + minutes * 60 * 1000);
    setEndsAt(prospectiveEnd);
  };

  // Start Date Picker Handlers
  const handleConfirmStart = (date: Date) => {
    setStartsAt(date);
    // Push the default end time out by 1 hour automatically
    const defaultEnd = new Date(date.getTime() + 60 * 60 * 1000);
    setEndsAt(defaultEnd);
    setStartPickerVisibility(false);
  };

  // End Date Picker Handlers
  const handleConfirmEnd = (date: Date) => {
    if (date <= startsAt) {
      setEndPickerVisibility(false);
      setTimeout(() => {
        Alert.alert('Invalid Time Scope', 'The event end window must occur after your scheduled start time.');
      }, 400);
      return;
    }
    setEndsAt(date);
    setEndPickerVisibility(false);
  };

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
      console.error('Error fetching role context profile matrix:', error);
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
      Alert.alert('Validation Error', 'Please complete both fields.');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Error', 'No valid user active session found.');
      return;
    }

    setLoading(true);

        try {
      const eventPayloadCode = code.trim().toUpperCase();
      const eventPayloadTitle = title.trim();

      const { data, error } = await supabase
        .from('events')
        .upsert(
          [
            {
              title: eventPayloadTitle,
              event_code: eventPayloadCode, 
              created_by: user.id,     
              start_time: startsAt.toISOString(), // CHANGED: matches database column
              end_time: endsAt.toISOString(),     // CHANGED: matches database column
            }
          ],
          { onConflict: 'event_code' } 
        )
        .select();

      if (error) throw error;


      setActiveEventTitle(eventPayloadTitle);
      setGeneratedValue(eventPayloadCode);
      setModalVisible(true);

      setTitle('');
      setCode('');

    } catch (error: any) {
      console.error('Database payload error:', error);
      Alert.alert('Database Operation Failed', error.message || 'Unable to store the event records.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAndRedirect = () => {
    setModalVisible(false);
    router.push('/history');
  };

  const formatDisplayTime = (dateObj: Date) => {
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
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
          <Pressable onPress={() => setStartPickerVisibility(true)} style={[styles.timeRowDisplay, themeInput]}>
            <Ionicons name="sunny-outline" size={18} color={darkMode ? '#AAA' : '#555'} />
            <Text style={[styles.timeText, themeMainText]}>
              {formatDisplayTime(startsAt)}
            </Text>
          </Pressable>

          <Text style={[styles.inputLabel, themeMainText]}>Ends</Text>
          <Pressable onPress={() => setEndPickerVisibility(true)} style={[styles.timeRowDisplay, themeInput]}>
            <Ionicons name="moon-outline" size={18} color={darkMode ? '#AAA' : '#555'} />
            <Text style={[styles.timeText, themeMainText]}>
              {formatDisplayTime(endsAt)}
            </Text>
          </Pressable>

          {/* Pure JS Universal Modal Pickers */}
          <DateTimePickerModal
            isVisible={isStartPickerVisible}
            mode="datetime"
            date={startsAt}
            onConfirm={handleConfirmStart}
            onCancel={() => setStartPickerVisibility(false)}
          />

          <DateTimePickerModal
            isVisible={isEndPickerVisible}
            mode="datetime"
            date={endsAt}
            onConfirm={handleConfirmEnd}
            onCancel={() => setEndPickerVisibility(false)}
          />

          <View style={styles.chipsRow}>
            <Pressable onPress={() => handleExtendEndTime(30)} style={[styles.chip, darkMode && styles.darkChip]}>
              <Text style={[styles.chipText, themeMainText]}>+30 min</Text>
            </Pressable>
            <Pressable onPress={() => handleExtendEndTime(60)} style={[styles.chip, darkMode && styles.darkChip]}>
              <Text style={[styles.chipText, themeMainText]}>+1 hour</Text>
            </Pressable>
            <Pressable onPress={() => handleExtendEndTime(120)} style={[styles.chip, darkMode && styles.darkChip]}>
              <Text style={[styles.chipText, themeMainText]}>+2 hours</Text>
            </Pressable>
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
              Share this code with participants to allow them to scan and join the event.
            </Text>
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
inputField: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 14, borderColor: '#DDD', backgroundColor: '#FFF' },
lightInput: { backgroundColor: '#FFFFFF', borderColor: '#E2E2E2' },
darkInput: { backgroundColor: '#1E1E1E', borderColor: '#333', color: '#FFF' },
timeRowDisplay: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48 },
timeText: { fontSize: 14, marginLeft: 10 },
chipsRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 6 },
chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EAEAEA', borderWidth: 1, borderColor: '#DDD' },
darkChip: { backgroundColor: '#2A2A2A', borderColor: '#444' },
chipText: { fontSize: 13, fontWeight: '500' },
chipHintText: { fontSize: 12, color: '#888', marginBottom: 20 },
submitButton: { backgroundColor: '#3498db', height: 50, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 10 },
disabledButton: { opacity: 0.6 },
submitButtonText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
modalBlurOverlayShadow: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
modalCardWrapper: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', backgroundColor: '#FFF' },
lightCard: { backgroundColor: '#FFF' },
darkCard: { backgroundColor: '#1E1E1E' },
modalEventTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
modalEventSubtitle: { fontSize: 13, marginTop: 4, marginBottom: 20 },
qrCanvasContainerBox: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#EAEAFA', backgroundColor: '#FFF', marginBottom: 16 },
modalInstructionText: { fontSize: 12, color: '#888', textAlign: 'center', marginHorizontal: 10, lineHeight: 16 },
modalDismissActionButton: { backgroundColor: '#4aa9db', width: '100%', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
modalDismissActionText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
darkMainText: { color: '#FFF' },
lightMainText: { color: '#222' },
darkSubText: { color: '#AAA' },
lightSubText: { color: '#666' }
});