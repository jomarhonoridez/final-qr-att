import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { supabase } from '../../lib/supabase'; // Adjust this path if necessary
import Ionicons from '@expo/vector-icons/Ionicons';

interface EventItem {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
}

interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<'events' | 'students'>('events');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form Inputs for Events
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    await Promise.all([fetchEvents(), fetchStudents()]);
    setLoading(false);
  };

  // Fetch Events List
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events') 
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching events:', error.message);
    }
  };

  // Fetch Students List from Profiles
  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('role', 'student') // Filters to only show accounts registered as students
        .order('full_name', { ascending: true });
      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error fetching students:', error.message);
    }
  };

  // Create & Update Handler
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Title field is required.');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('events')
          .update({ title, description })
          .eq('id', editingId);
        if (error) throw error;
        Alert.alert('Success', 'Event updated successfully!');
      } else {
        const { error } = await supabase
          .from('events')
          .insert([{ title, description }]);
        if (error) throw error;
        Alert.alert('Success', 'Event created successfully!');
      }

      setTitle('');
      setDescription('');
      setEditingId(null);
      fetchEvents();
    } catch (error: any) {
      Alert.alert('Save Error', error.message);
    }
  };

  // Delete Handler for Events
  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirm Removal',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('events').delete().eq('id', id);
              if (error) throw error;
              fetchEvents();
            } catch (error: any) {
              Alert.alert('Delete Error', error.message);
            }
          },
        },
      ]
    );
  };

    // Hard Delete Handler to remove the student completely from the profiles table
  const handleDeleteStudentAccount = (studentId: string, studentName: string) => {
    Alert.alert(
      'Permanently Delete Account',
      `Are you sure you want to completely remove ${studentName || 'this student'} from the system? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .delete() // Changed from .update() to a real .delete() purge
                .eq('id', studentId);

              if (error) throw error;

              Alert.alert('Deleted!', 'The student record has been completely removed from Supabase.');
              fetchStudents(); // Refresh your roster list view instantly
            } catch (error: any) {
              Alert.alert('Delete Error', error.message);
            }
          },
        },
      ]
    );
  };

  const startEdit = (item: EventItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description || '');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4aa9db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Admin Control Dashboard</Text>

      {/* Segmented Navigation Tab Controls */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'events' && styles.activeTabButton]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'events' && styles.activeTabButtonText]}>
            Manage Events
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'students' && styles.activeTabButton]}
          onPress={() => setActiveTab('students')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'students' && styles.activeTabButtonText]}>
            Student Roster ({students.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* RENDER VIEW 1: MANAGE EVENTS */}
      {activeTab === 'events' && (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Event Title (e.g. BSIT-4B Attendance)"
                placeholderTextColor="#777"
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Event Description (Optional)"
                placeholderTextColor="#777"
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.buttonText}>{editingId ? 'Save Changes' : 'Create Event'}</Text>
              </TouchableOpacity>
              {editingId && (
                <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: '#444', marginTop: 8 }]} 
                  onPress={() => { setEditingId(null); setTitle(''); setDescription(''); }}
                >
                  <Text style={styles.buttonText}>Cancel Edit</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}
              </View>
              <View style={styles.actionColumn}>
                <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(item)}>
                  <Text style={styles.btnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                  <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

           {/* RENDER VIEW 2: STUDENT ROSTER */}
      {activeTab === 'students' && (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No registered student accounts found.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.studentCard}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={20} color="#4aa9db" />
              </View>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.studentName}>{item.full_name || 'Unnamed Student'}</Text>
                <Text style={styles.studentEmail}>{item.email}</Text>
              </View>
              
              {/* THIS IS THE TRASH CAN BUTTON FOR ACCOUNT REMOVAL */}
              <TouchableOpacity 
                style={styles.deleteAccountBtn} 
                onPress={() => handleDeleteStudentAccount(item.id, item.full_name)}

              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16, paddingTop: 40 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 15, textAlign: 'center' },
  
  // Tab Styling
  tabContainer: { flexDirection: 'row', backgroundColor: '#1e1e1e', borderRadius: 8, padding: 4, marginBottom: 20 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
activeTabButton: { backgroundColor: '#4aa9db' },
tabButtonText: { color: '#aaa', fontWeight: '600', fontSize: 14 },
activeTabButtonText: { color: '#fff', fontWeight: 'bold' },
// Form Styling
formContainer: { backgroundColor: '#1e1e1e', padding: 16, borderRadius: 8, marginBottom: 20 },
input: { backgroundColor: '#2a2a2a', color: '#fff', padding: 12, borderRadius: 6, marginBottom: 10 },
textArea: { height: 60, textAlignVertical: 'top' },
saveButton: { backgroundColor: '#4aa9db', padding: 12, borderRadius: 6, alignItems: 'center' },
buttonText: { color: '#fff', fontWeight: 'bold' },
// Event Card Styling
card: { backgroundColor: '#1e1e1e', padding: 16, borderRadius: 8, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
cardDesc: { fontSize: 14, color: '#aaa', marginTop: 4 },
actionColumn: { flexDirection: 'row', gap: 8 },
editBtn: { backgroundColor: '#f39c12', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4 },
deleteBtn: { backgroundColor: '#e74c3c', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4 },
btnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
// Student Card Styling
studentCard: { backgroundColor: '#1e1e1e', padding: 14, borderRadius: 8, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' },
studentName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
studentEmail: { fontSize: 13, color: '#888', marginTop: 2 },
emptyText: { color: '#aaa', textAlign: 'center', marginTop: 30, fontSize: 14 },
// Student Delete Button Styling
deleteAccountBtn: {
backgroundColor: '#e74c3c',
padding: 10,
borderRadius: 8,
justifyContent: 'center',
alignItems: 'center',
},
});