import { View, Text, StyleSheet } from 'react-native';
import { useRouter, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// Ensure you have this or your project's icon package
import AppButton from '../../components/AppButton'; 

export default function Index() {
  const router = useRouter();

  return (
    <>
      <Tabs.Screen 
        options={{
          tabBarStyle: { display: 'none' },
        }} 
      />

      <View style={styles.container}> 
        {/* Main Branding Section */}
        <View style={styles.headerContainer}>
          <Ionicons name="school" size={60} color="#0284c7" style={styles.icon} />
          <Text style={styles.mainTitle}>QR Attendance</Text>
          <Text style={styles.authorText}>By: Jomar Honoridez</Text>
        </View>

        {/* Informational Section */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>School Event Attendance</Text>
          <Text style={styles.subtitle}>
            Scan QR Codes to record attendance during school activities.
          </Text>
        </View>

        {/* Interactive Action Buttons */}
        <View style={styles.buttonContainer}>
          <AppButton 
            theme="primary"
            title="Sign In"
            icon="log-in-outline"
            onPress={() => router.push('/login')}
          />
          
          <AppButton 
            title="Create Account"
            icon="person-add-outline"
            onPress={() => router.push('/register')}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  icon: {
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  authorText: {
    fontSize: 14,
    color: '#64748b',
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    alignSelf: 'flex-start',
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 16,
    width: '100%',
  },
});
