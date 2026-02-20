import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '../hooks/use-theme-color';

interface ProfilePictureSectionProps {
  user: any;
  username: string | null;
  profilePicture: string | null;
  onProfilePictureUpdate: (url: string) => void;
  db: any;
  storage: any;
}

export default function ProfilePictureSection({
  user,
  username,
  profilePicture,
  onProfilePictureUpdate,
  db,
  storage,
}: ProfilePictureSectionProps) {
  const [uploadingImage, setUploadingImage] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  const handleProfilePictureUpload = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload a profile picture.');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setUploadingImage(true);
        const imageUri = result.assets[0].uri;

        // Convert image to blob
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // Upload to Firebase Storage
        const storageRef = ref(storage, `profilePictures/${user?.uid}`);
        await uploadBytes(storageRef, blob);

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);

        // Update Firestore
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), {
            profilePicture: downloadURL,
          });
          onProfilePictureUpdate(downloadURL);
          Alert.alert('Success', 'Profile picture updated successfully!');
        }
      }
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload profile picture.');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: cardBackground,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <TouchableOpacity onPress={handleProfilePictureUpload} disabled={uploadingImage}>
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: profilePicture || 'https://i.pravatar.cc/100' }}
            style={{ width: 64, height: 64, borderRadius: 32, marginRight: 16 }}
          />
          {uploadingImage && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 16,
                bottom: 0,
                borderRadius: 32,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ActivityIndicator color="#fff" />
            </View>
          )}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 16,
              backgroundColor: tintColor,
              width: 24,
              height: 24,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: cardBackground,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>+</Text>
          </View>
        </View>
      </TouchableOpacity>
      <View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>
          {username || user?.displayName || user?.email?.split('@')[0] || 'User'}
        </Text>
        <Text style={{ fontSize: 14, color: iconColor, marginTop: 4 }}>
          {user?.email || 'email@example.com'}
        </Text>
      </View>
    </View>
  );
}
