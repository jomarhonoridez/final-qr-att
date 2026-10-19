import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Alert, TextInput, Pressable, ActivityIndicator, Switch } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth, signOut } from '@/lib/auth';
import { getProfile, updateProfile, type Profile } from '@/lib/profiles';
import { useGlobalTheme } from '@/lib/theme'; // Hooked to our global theme file

export default function ProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  
  
  // Connect explicitly to the global theme controller state
  const { darkMode, toggleDarkMode } = useGlobalTheme();

  const router = useRouter();

  /* ---------------- LOAD PROFILE ---------------- */
  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      const p = await getProfile(user.id);
      setProfile(p);
      setDraftName(p?.full_name || user.user_metadata?.full_name || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      setDraftName(user.user_metadata?.full_name || '');
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  /* ---------------- SAVE NAME ---------------- */
  const handleSaveName = async () => {
    if (!user) return;
    const name = draftName.trim();

    if (!name) {
      Alert.alert('Invalid Name', 'Please enter your full name.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await updateProfile(user.id, { full_name: name });

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      setProfile((prev) => (prev ? { ...prev, full_name: name } : prev));
      setDraftName(name);
      setEditing(false);
      Alert.alert('Saved', 'Your name has been updated.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Unable to save your name.');
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- SIGN OUT ---------------- */
  const handleSignOut = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await signOut();
      if (error) {
        Alert.alert('Sign Out Failed', error);
        return;
      }
      router.replace('/login');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  const role = profile?.role || user?.user_metadata?.role || 'teacher';
  const displayName = profile?.full_name || user?.user_metadata?.full_name || '';
  const displayEmail = profile?.email || user?.email || 'No email';
  const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  const themeContainer = darkMode ? styles.darkContainer : styles.lightContainer;
  const themeCard = darkMode ? styles.darkCard : styles.lightCard;
  const themeMainText = darkMode ? styles.darkMainText : styles.lightMainText;
  const themeSubText = darkMode ? styles.darkSubText : styles.lightSubText;
  const themeBorderColor = darkMode ? '#2D2D2D' : '#F3F2F2';

  return (
    <View style={[styles.baseContainer, themeContainer]}>
      <Text style={[styles.screenHeaderTitle, themeMainText]}>My Profile</Text>
      <Text style={[styles.screenHeaderSubtitle, themeSubText]}>Manage your account information</Text>

      {user && (
        <View style={[styles.cardContainer, themeCard]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.circleAvatar}>
              <Text style={styles.avatarText}>{firstLetter}</Text>
            </View>
            <View style={styles.cardHeaderDetails}>
              <Text style={[styles.cardMainHeading, themeMainText]}>Account Information</Text>
              <Text style={[styles.cardSubHeading, themeSubText]}>Your registered details</Text>
            </View>
          </View>

          <View style={[styles.dataFieldWrapper, { borderTopColor: themeBorderColor }]}>
            <Text style={styles.fieldLabelText}>ROLE</Text>
            <View style={[styles.roleBadgeBubble, role === 'teacher' ? styles.teacherBadge : styles.studentBadge]}>
              <Text style={styles.roleBadgeText}>
                {role === 'teacher' ? 'Teacher' : 'Student'}
              </Text>
            </View>
          </View>

          <View style={[styles.dataFieldWrapper, { borderTopColor: themeBorderColor }]}>
            <Text style={styles.fieldLabelText}>FULL NAME</Text>
            {editing ? (
              <View style={styles.inputFormContainer}>
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  style={[styles.nameInput, darkMode && styles.darkInputText]}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  editable={!saving}
                />
                <View style={styles.editButtonRow}>
                  <Pressable onPress={handleSaveName} disabled={saving} style={[styles.saveButton, saving && styles.disabledButton]}>
                    <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
                  </Pressable>
                  <Pressable onPress={() => setEditing(false)} disabled={saving} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => setEditing(true)} style={styles.interactiveRowView}>
                <Text style={[styles.fieldValueText, themeMainText, !displayName && styles.placeholderText]} numberOfLines={1}>
                  {displayName || 'Tap to add your name'}
                </Text>
                <Text style={styles.inlineEditActionLink}>Edit</Text>
              </Pressable>
            )}
          </View>

          <View style={[styles.dataFieldWrapper, { borderTopColor: themeBorderColor }]}>
            <Text style={styles.fieldLabelText}>EMAIL</Text>
            <Text style={[styles.fieldValueText, themeMainText]}>{displayEmail}</Text>
          </View>

          <View style={[styles.dataFieldWrapper, { borderTopColor: themeBorderColor }]}>
            <Text style={styles.fieldLabelText}>USER ID</Text>
            <Text style={styles.monospacedUuidText} numberOfLines={1}>
              {user.id}
            </Text>
          </View>

          

          <View style={[styles.dataFieldWrapperLast, { borderTopColor: themeBorderColor }]}>
            <Text style={styles.fieldLabelText}>PREFERENCES</Text>
            <View style={styles.interactiveRowView}>
              <Text style={[styles.fieldValueText, themeMainText]}>Enable Dark Mode Menu</Text>
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode} // Drives global state updates instantly
                trackColor={{ false: '#dcdcdc', true: '#4aa9db' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>
      )}

      <Pressable style={[styles.signOutButtonWrapper, darkMode ? styles.darkSignOutBtn : styles.lightSignOutBtn]} onPress={handleSignOut} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color={darkMode ? '#FFF' : '#333'} />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={22} color={darkMode ? '#AAA' : '#555'} style={styles.signOutIconSpace} />
            <Text style={[styles.signOutButtonLabel, themeMainText]}>Sign Out</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  lightContainer: {
    backgroundColor: '#FAF8F5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  screenHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  screenHeaderSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  cardContainer: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  lightCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F0EFEF',
  },
  darkCard: {
    backgroundColor: '#1E1E1E',
    borderColor: '#2D2D2D',
  },
  lightMainText: {
    color: '#222222',
  },
  darkMainText: {
    color: '#FFFFFF',
  },
  lightSubText: {
    color: '#888888',
  },
  darkSubText: {
    color: '#AAAAAA',
  },
cardHeaderRow: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 20,
},
circleAvatar: {
width: 52,
height: 52,
borderRadius: 26,
backgroundColor: '#4aa9db',
justifyContent: 'center',
alignItems: 'center',
},
avatarText: {
color: '#FFFFFF',
fontSize: 20,
fontWeight: '700',
},
cardHeaderDetails: {
marginLeft: 14,
},
cardMainHeading: {
fontSize: 16,
fontWeight: '700',
},
cardSubHeading: {
fontSize: 12,
marginTop: 1,
},
dataFieldWrapper: {
borderTopWidth: 1,
paddingVertical: 12,
},
dataFieldWrapperLast: {
borderTopWidth: 1,
paddingTop: 12,
paddingBottom: 4,
},
fieldLabelText: {
fontSize: 10,
fontWeight: '700',
color: '#999',
letterSpacing: 0.5,
marginBottom: 6,
},
fieldValueText: {
fontSize: 14,
fontWeight: '500',
},
placeholderText: {
color: '#999',
fontStyle: 'italic',
},
interactiveRowView: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},
inlineEditActionLink: {
color: '#4aa9db',
fontSize: 13,
fontWeight: '600',
},
roleBadgeBubble: {
alignSelf: 'flex-start',
paddingHorizontal: 16,
paddingVertical: 6,
borderRadius: 14,
},
teacherBadge: {
backgroundColor: '#4aa9db',
},
studentBadge: {
backgroundColor: '#2ecc71',
},
roleBadgeText: {
color: '#FFFFFF',
fontSize: 12,
fontWeight: '600',
},
monospacedUuidText: {
fontSize: 11,
color: '#AFAFAF',
fontFamily: 'System',
},
statsContainerRow: {
flexDirection: 'row',
borderRadius: 12,
paddingVertical: 10,
borderWidth: 1,
marginTop: 4,
},
lightStatsRow: {
backgroundColor: '#FAFAFA',
borderColor: '#F0EFEF',
},
darkStatsRow: {
backgroundColor: '#252525',
borderColor: '#2D2D2D',
},
statBoxColumn: {
flex: 1,
alignItems: 'center',
},
statBoxDividerLine: {
width: 1,
},
statValueNumber: {
fontSize: 16,
fontWeight: '700',
},
statLabelDescription: {
fontSize: 11,
marginTop: 2,
},
inputFormContainer: {
marginTop: 4,
},
nameInput: {
borderWidth: 1,
borderColor: '#EAEAEA',
borderRadius: 8,
paddingHorizontal: 12,
paddingVertical: 8,
fontSize: 14,
color: '#222',
backgroundColor: '#FAFAFA',
},
darkInputText: {
backgroundColor: '#2A2A2A',
borderColor: '#3D3D3D',
color: '#FFF',
},
editButtonRow: {
flexDirection: 'row',
marginTop: 8,
},
saveButton: {
backgroundColor: '#4aa9db',
paddingHorizontal: 16,
paddingVertical: 6,
borderRadius: 6,
marginRight: 8,
},
disabledButton: {
opacity: 0.5,
},
saveButtonText: {
color: '#FFF',
fontSize: 12,
fontWeight: '600',
},
cancelButton: {
backgroundColor: '#EAEAEA',
paddingHorizontal: 16,
paddingVertical: 6,
borderRadius: 6,
},
cancelButtonText: {
color: '#555',
fontSize: 12,
fontWeight: '600',
},
signOutButtonWrapper: {
flexDirection: 'row',
borderRadius: 16,
borderWidth: 1,
height: 54,
justifyContent: 'center',
alignItems: 'center',
marginTop: 'auto',
marginBottom: 30,
},
lightSignOutBtn: {
backgroundColor: '#FFFFFF',
borderColor: '#EAEAEA',
},
darkSignOutBtn: {
backgroundColor: '#1E1E1E',
borderColor: '#2D2D2D',
},
signOutIconSpace: {
marginRight: 8,
},
signOutButtonLabel: {
fontSize: 15,
fontWeight: '600',
},
});