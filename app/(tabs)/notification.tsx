import React, { useState, useEffect } from 'react';
// Look at line 2 and change it to include Platform at the end:
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';

import { useGlobalTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';

type VerificationRequest = {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  status: string;
  created_at: string;
};

export default function NotificationScreen() {
  const { user } = useAuth();
  const { darkMode } = useGlobalTheme();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Fetch all pending student requests from Supabase
  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching verification requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPendingRequests();
    }
  }, [user]);

  // Handle Approve or Deny actions
    const handleVerificationAction = async (requestId: string, studentId: string, approve: boolean) => {
    setActioningId(requestId);
    try {
      if (approve) {
        // 1. Activate the student profile account instantly
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('id', studentId);

        if (profileError) throw profileError;

        // 2. Update the card status to approved immediately 
        const { error: requestError } = await supabase
          .from('verification_requests')
          .update({ status: 'approved' })
          .eq('id', requestId);

        if (requestError) throw requestError;

        // Platform-safe message reporting
        if (Platform.OS === 'web') {
          alert('Student Approved! The student can now log in and fully access their account.');
        } else {
          Alert.alert('Student Approved', 'The student can now log in and fully access their account.');
        }
      } else {
        // Mark the request card as rejected
        const { error: rejectError } = await supabase
          .from('verification_requests')
          .update({ status: 'rejected' })
          .eq('id', requestId);

        if (rejectError) throw rejectError;

        if (Platform.OS === 'web') {
          alert('Request Denied. The registration request was declined.');
        } else {
          Alert.alert('Request Denied', 'The registration request was declined.');
        }
      }

      // Force a clean reload of the dashboard list
      await fetchPendingRequests();
    } catch (error: any) {
      console.error('Action execution failed:', error);
      if (Platform.OS === 'web') {
        alert('Operation Failed: ' + (error.message || 'Unable to update status.'));
      } else {
        Alert.alert('Operation Failed', error.message || 'Unable to update status.');
      }
    } finally {
      setActioningId(null);
    }
  };


  const themeContainer = darkMode ? styles.darkContainer : styles.lightContainer;
  const themeMainText = darkMode ? styles.darkMainText : styles.lightMainText;
  const themeSubText = darkMode ? styles.darkSubText : styles.lightSubText;
  const themeCard = darkMode ? styles.darkCard : styles.lightCard;

  return (
    <View style={[styles.screenWrapper, themeContainer]}>
      <ScrollView style={[styles.container, themeContainer]} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.screenHeaderTitle, themeMainText]}>Approvals</Text>
            <Text style={[styles.screenHeaderSubtitle, themeSubText]}>Confirm new student registrations</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 50 }} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark-outline" size={54} color={darkMode ? '#444' : '#ccc'} />
            <Text style={[styles.emptyText, themeSubText]}>All caught up! No pending verifications.</Text>
          </View>
        ) : (
          requests.map((item) => (
            <View key={item.id} style={[styles.notificationCard, themeCard]}>
              <View style={styles.iconWrapper}>
                <Ionicons name="person-add-outline" size={24} color="#3498db" />
              </View>
              
              <View style={styles.textWrapper}>
                <Text style={[styles.cardTitle, themeMainText]}>Account Activation Requested</Text>
                <Text style={[styles.cardDescription, themeSubText]}>
                  <Text style={{ fontWeight: '600' }}>{item.student_name}</Text> ({item.student_email}) is waiting to be verified.
                </Text>

                {actioningId === item.id ? (
                  <ActivityIndicator size="small" color="#3498db" style={{ marginTop: 12, alignSelf: 'flex-start' }} />
                ) : (
                  <View style={styles.actionButtonsRow}>
                    <Pressable 
                      onPress={() => handleVerificationAction(item.id, item.student_id, true)} 
                      style={[styles.actionButton, styles.approveButton]}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
                      <Text style={styles.buttonText}>Approve</Text>
                    </Pressable>

                    <Pressable 
                      onPress={() => handleVerificationAction(item.id, item.student_id, false)} 
                      style={[styles.actionButton, styles.denyButton]}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#FFF" />
                      <Text style={styles.buttonText}>Deny</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, width: '100%', minHeight: '100%' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },
  lightContainer: { backgroundColor: '#FAF8F5' },
  darkContainer: { backgroundColor: '#121212' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
  screenHeaderTitle: { fontSize: 24, fontWeight: '700' },
  screenHeaderSubtitle: { fontSize: 13, marginTop: 4 },
  notificationCard: { flexDirection: 'row', padding: 18, borderRadius: 16, marginBottom: 14, borderWidth: 1, elevation: 1 },
  lightCard: { backgroundColor: '#FFFFFF', borderColor: '#EBF0F5' },
  darkCard: { backgroundColor: '#1E1E1E', borderColor: '#2D2D2D' },
  iconWrapper: { marginRight: 14, justifyContent: 'flex-start', paddingTop: 2 },
  textWrapper: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  cardDescription: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  actionButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  approveButton: { backgroundColor: '#2ecc71' },
  denyButton: { backgroundColor: '#e74c3c' },
  buttonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 100, gap: 14 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  darkMainText: { color: '#FFF' },
  lightMainText: { color: '#222' },
  darkSubText: { color: '#AAA' },
  lightSubText: { color: '#666' }
});
