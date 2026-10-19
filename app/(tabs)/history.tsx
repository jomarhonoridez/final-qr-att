import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View, ActivityIndicator } from 'react-native';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { useGlobalTheme } from '@/lib/theme';
import { getProfile, type Role } from '@/lib/profiles';
import {
  getAttendanceHistory,
  getTeacherEventAttendance,
  type AttendanceRecord,
  type TeacherEventAttendance,
} from '@/lib/attendance';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { darkMode } = useGlobalTheme();

  const [role, setRole] = useState<Role | null>(null);
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [teacherEvents, setTeacherEvents] = useState<TeacherEventAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const themeContainer = darkMode ? styles.darkContainer : styles.lightContainer;
  const themeCard = darkMode ? styles.darkCard : styles.lightCard;
  const themeMainText = darkMode ? styles.darkMainText : styles.lightMainText;
  const themeSubText = darkMode ? styles.darkSubText : styles.lightSubText;
  const themeBorderColor = darkMode ? '#2D2D2D' : '#F3F2F2';

  /* ---------------- BACKEND DATA FETCH LOGGER ---------------- */
  const loadHistoryPayload = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profile = await getProfile(user.id);
      const currentRole: Role = profile?.role ?? 'student';
      setRole(currentRole);

      if (currentRole === 'teacher') {
        const events = await getTeacherEventAttendance(user.id);
        setTeacherEvents(events);
        setStudentRecords([]);
      } else {
        const records = await getAttendanceHistory(user.id);
        setStudentRecords(records);
        setTeacherEvents([]);
      }
    } catch (error) {
      console.error('Failed to load history metrics rows:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadHistoryPayload();
    }, [loadHistoryPayload])
  );

  /* ---------------- RENDER METHOD: TEACHER DATA ---------------- */
  if (role === 'teacher') {
    return (
      <View style={[styles.container, themeContainer]}>
        <Text style={[styles.pageTitle, themeMainText]}>Attendance History</Text>
        <Text style={[styles.pageSubtitle, themeSubText]}>Track created event check-ins</Text>

        {loading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="small" color="#4aa9db" />
            <Text style={[styles.subtitle, themeSubText]}>Loading events...</Text>
          </View>
        ) : teacherEvents.length === 0 ? (
          <Text style={[styles.subtitle, themeSubText]}>
            No events yet. Create an event from the Teacher tab.
          </Text>
        ) : (
          <FlatList
            data={teacherEvents}
            keyExtractor={(item) => item.eventId}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const eventWithEndTime = item as TeacherEventAttendance & { endTime?: string };

              return (
                <View style={[styles.historyCard, themeCard]}>
                  <View style={styles.eventHeader}>
                    <Text style={[styles.eventTitle, themeMainText]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{item.attendeeCount}</Text>
                    </View>
                  </View>

                  <View style={[styles.innerDivider, { backgroundColor: themeBorderColor }]} />

                  <Text style={[styles.infoText, themeSubText]}>Event Code: {item.eventCode}</Text>
                  
                  {item.startTime && (
                    <Text style={[styles.infoText, themeSubText]}>Start: {formatDate(item.startTime)}</Text>
                  )}
                  {eventWithEndTime.endTime && (
                    <Text style={[styles.infoText, themeSubText]}>End: {formatDate(eventWithEndTime.endTime)}</Text>
                  )}

                  {item.attendees.length === 0 ? (
                    <Text style={styles.noAttendees}>No students have scanned yet.</Text>
                  ) : (
                    <View style={styles.attendeeList}>
                      {item.attendees.map((attendee) => (
                        <View key={`${attendee.studentId}-${attendee.scannedAt}`} style={styles.attendeeRow}>
                          <Text style={[styles.studentIdText, themeMainText]}>{attendee.studentId}</Text>
                          <Text style={[styles.scanTimeText, themeSubText]}> - {formatDate(attendee.scannedAt)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}
      </View>
    );
  }

  /* ---------------- RENDER METHOD: STUDENT DATA ---------------- */
  return (
    <View style={[styles.container, themeContainer]}>
      <Text style={[styles.pageTitle, themeMainText]}>Attendance History</Text>
      <Text style={[styles.pageSubtitle, themeSubText]}>Your check-in log records</Text>

      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="small" color="#4aa9db" />
          <Text style={[styles.subtitle, themeSubText]}>Loading records...</Text>
        </View>
      ) : studentRecords.length === 0 ? (
        <Text style={[styles.subtitle, themeSubText]}>
          No records yet. Scan a QR code to register your attendance.
        </Text>
      ) : (
        <FlatList
          data={studentRecords}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.historyCard, themeCard]}>
              <Text style={[styles.eventTitle, themeMainText]} numberOfLines={2}>
                {item.eventTitle}
              </Text>
              <View style={[styles.innerDivider, { backgroundColor: themeBorderColor }]} />
              <Text style={[styles.infoText, themeSubText]}>Event Code: {item.eventId}</Text>
              <Text style={[styles.infoText, themeSubText]}>Attended: {formatDate(item.scannedAt)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

/* ---------------- DATE UTILS FORMATTER ---------------- */
function formatDate(iso: string) {
  if (!iso) return 'Unknown date';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

/* ---------------- CENTRAL APPLICATION STYLESHEET ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  lightContainer: { backgroundColor: '#FAF8F5' },
  darkContainer: { backgroundColor: '#121212' },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  pageSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  centeredState: {
    marginTop: 40,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  list: {
    paddingBottom: 30,
  },
  historyCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  lightCard: { backgroundColor: '#FFFFFF', borderColor: '#F0EFEF' },
  darkCard: { backgroundColor: '#1E1E1E', borderColor: '#2D2D2D' },
  lightMainText: { color: '#222' },
  darkMainText: { color: '#FFF' },
  lightSubText: { color: '#777' },
  darkSubText: { color: '#AAA' },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  countBadge: {
    backgroundColor: '#4aa9db',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  innerDivider: {
    height: 1,
    marginVertical: 12,
  },
  infoText: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  noAttendees: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 12,
  },
  attendeeList: {
    marginTop: 12,
    paddingTop: 8,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  studentIdText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scanTimeText: {
    fontSize: 12,
  },
});
