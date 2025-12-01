import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, layout } from '../utils/theme';
import AccessibleText from '../components/AccessibleText';

export default function CameraScreen() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [flash, setFlash] = useState<'off' | 'on'>('off');
    const [permission, requestPermission] = useCameraPermissions();
    const [isProcessing, setIsProcessing] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const navigation = useNavigation<any>();

    useEffect(() => {
        // Request permissions on mount
        if (!permission?.granted) {
            requestPermission();
        }
    }, []);

    const handlePermissionRequest = async () => {
        const { granted } = await requestPermission();
        if (!granted) {
            Alert.alert(
                'Camera Permission Required',
                'Please enable camera access in your device settings to scan prescriptions.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Open Settings', onPress: () => {
                            // On iOS, this will open app settings
                            // On Android, user needs to do it manually
                        }
                    },
                ]
            );
        }
    };

    const takePicture = async () => {
        if (!cameraRef.current) return;

        try {
            setIsProcessing(true);
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: false,
            });

            if (photo) {
                console.log('📸 Photo captured:', photo.uri);
                // Navigate to review screen
                navigation.navigate('PrescriptionReview', { imageUri: photo.uri });
            }
        } catch (error) {
            console.error('Error taking picture:', error);
            Alert.alert('Error', 'Failed to capture image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const pickFromGallery = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please enable photo library access to select prescription images.'
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: false,
            });

            if (!result.canceled && result.assets[0]) {
                console.log('🖼️ Image selected from gallery:', result.assets[0].uri);
                navigation.navigate('PrescriptionReview', { imageUri: result.assets[0].uri });
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to select image. Please try again.');
        }
    };

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const toggleFlash = () => {
        setFlash(current => (current === 'off' ? 'on' : 'off'));
    };

    if (!permission) {
        // Camera permissions are still loading
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.purple} />
                <AccessibleText variant="body" style={{ marginTop: spacing.m }}>
                    Loading camera...
                </AccessibleText>
            </View>
        );
    }

    if (!permission.granted) {
        // Camera permissions not granted yet
        return (
            <View style={styles.permissionContainer}>
                <Ionicons name="camera-outline" size={64} color={colors.neutral.gray400} />
                <AccessibleText variant="h2" style={styles.permissionTitle}>
                    Camera Access Required
                </AccessibleText>
                <AccessibleText variant="body" color={colors.neutral.gray600} style={styles.permissionText}>
                    To scan prescriptions, we need access to your camera
                </AccessibleText>
                <TouchableOpacity style={styles.permissionButton} onPress={handlePermissionRequest}>
                    <LinearGradient
                        colors={colors.gradients.primary as [string, string, ...string[]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.permissionButtonGradient}
                    >
                        <AccessibleText variant="button" color={colors.neutral.white}>
                            Enable Camera
                        </AccessibleText>
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.galleryAltButton} onPress={pickFromGallery}>
                    <AccessibleText variant="button" color={colors.primary.purple}>
                        Or Choose from Gallery
                    </AccessibleText>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Camera Preview */}
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
                enableTorch={flash === 'on'}
            >
                {/* Top Controls */}
                <View style={styles.topControls}>
                    <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
                        <Ionicons
                            name={flash === 'on' ? 'flash' : 'flash-off'}
                            size={28}
                            color={colors.neutral.white}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
                        <Ionicons name="camera-reverse" size={28} color={colors.neutral.white} />
                    </TouchableOpacity>
                </View>

                {/* Guide Overlay */}
                <View style={styles.guideContainer}>
                    <View style={styles.guideFrame} />
                    <AccessibleText variant="caption" color={colors.neutral.white} style={styles.guideText}>
                        Position prescription within the frame
                    </AccessibleText>
                </View>

                {/* Bottom Controls */}
                <View style={styles.bottomControls}>
                    <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
                        <Ionicons name="images" size={32} color={colors.neutral.white} />
                        <Text style={styles.buttonLabel}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.captureButton}
                        onPress={takePicture}
                        disabled={isProcessing}
                    >
                        <View style={styles.captureButtonOuter}>
                            <View style={styles.captureButtonInner} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="close" size={32} color={colors.neutral.white} />
                        <Text style={styles.buttonLabel}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </CameraView>

            {/* Processing Overlay */}
            {isProcessing && (
                <View style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color={colors.neutral.white} />
                    <AccessibleText variant="body" color={colors.neutral.white} style={{ marginTop: spacing.m }}>
                        Processing...
                    </AccessibleText>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral.black,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.neutral.gray100,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: colors.neutral.gray100,
    },
    permissionTitle: {
        marginTop: spacing.l,
        textAlign: 'center',
    },
    permissionText: {
        marginTop: spacing.m,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    permissionButton: {
        width: '100%',
        marginBottom: spacing.m,
    },
    permissionButtonGradient: {
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.l,
        borderRadius: layout.borderRadius.medium,
        alignItems: 'center',
    },
    galleryAltButton: {
        paddingVertical: spacing.m,
    },
    camera: {
        flex: 1,
    },
    topControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.l,
        paddingTop: spacing.xl + 10,
    },
    controlButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    guideContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    guideFrame: {
        width: '85%',
        aspectRatio: 3 / 4,
        borderWidth: 3,
        borderColor: colors.neutral.white,
        borderRadius: layout.borderRadius.medium,
        borderStyle: 'dashed',
    },
    guideText: {
        marginTop: spacing.m,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.m,
        borderRadius: layout.borderRadius.full,
    },
    bottomControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: spacing.xl + 20,
        paddingHorizontal: spacing.l,
    },
    galleryButton: {
        alignItems: 'center',
    },
    cancelButton: {
        alignItems: 'center',
    },
    buttonLabel: {
        color: colors.neutral.white,
        fontSize: 12,
        marginTop: spacing.xs,
        fontWeight: '500',
    },
    captureButton: {
        padding: spacing.s,
    },
    captureButtonOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.neutral.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    captureButtonInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.neutral.white,
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
