import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  Modal,
  Switch
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const [isReady, setIsReady] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [sound, setSound] = useState();
  const [showSettings, setShowSettings] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const [fontsLoaded] = useFonts({
    secondary: require('../../assets/fonts/secondary-font.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        await Promise.all([
        ]);
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (isReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isReady, fontsLoaded]);

  // Load and play background music
  useEffect(() => {
    let isMounted = true;
    
    async function loadSound() {
      try {
        const { sound: soundObject } = await Audio.Sound.createAsync(
          require('../../assets/sounds/background.wav'),
          { isLooping: true }
        );
        
        if (isMounted) {
          setSound(soundObject);
          if (isSoundEnabled) {
            await soundObject.playAsync();
          }
        }
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    }

    loadSound();

    return () => {
      isMounted = false;
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [isSoundEnabled]);

  // Handle sound cleanup when screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (sound) {
          sound.stopAsync();
        }
      };
    }, [sound])
  );

  const toggleSound = async () => {
    try {
      if (sound) {
        if (isSoundEnabled) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
        setIsSoundEnabled(!isSoundEnabled);
      }
    } catch (error) {
      console.error('Error toggling sound:', error);
    }
  };

  // Navigate to MainScreen with sound state
  const handlePlayPress = () => {
    navigation.navigate('MainScreen', { isSoundEnabled });
  };

  if (!isReady || !fontsLoaded) {
    return null;
  }

  return (
    <ImageBackground
      source={require('../../assets/img/bg.png')}
      style={styles.background}
    >
      {/* Overlay for the welcome screen */}
      <View style={styles.overlay}>
        {/* Settings Button*/}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Text style={styles.settingsButtonText}>SETTINGS⚙️</Text>
        </TouchableOpacity>

        <Text style={styles.title}>WELCOME TO HELL!!</Text>
        <Text style={styles.subtitle}>We hope you get there!!</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPress}
          >
            <Text style={styles.playButtonText}>GO TO GAME</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              console.log('INSTRUCTIONS pressed');
              setModalVisible(true);
            }}
          >
            <Text style={styles.buttonText}>INSTRUCTIONS</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.developedBy}>
          Developed By:{'\n'}Binita Maharjan{'\n'}Peitong Tsai{'\n'}Mujirat oyelowo
        </Text>
      </View>

      {/* Modal for game instructions */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          console.log('Modal close requested');
          setModalVisible(false);
        }}
      >
        <LinearGradient
          colors={['rgba(147,6,6,0.8)', 'rgba(0,0,0,0.8)']}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Instructions</Text>
            <Text style={styles.modalText}>
              How to Play:{'\n'}
              • Swipe to Move: Slide in the direction you want to go.{'\n'}
              • Avoid the Spikes: Jumping on spikes will cost you two lives (you start with 10 lives).{'\n'}
              • Regain Lives: Land on the regular platforms to regain one life.{'\n'}
              • Dodge Obstacles: Watch out for fireballs falling from above and devils' horns coming from the sides.{'\n'}
              • Controls: Use the left and right buttons to navigate.{'\n'}
              • Scoring: Earn points every second as long as you're alive.{'\n'}
              <Text style={styles.emoji}></Text>☠ Warning: If you fall, you're sent straight to Hell!{'\n'}
              <Text style={styles.emoji}>👹</Text>Good luck—we hope you don't make it!
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                console.log('Close modal pressed');
                setModalVisible(false);
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settings</Text>
            
            <View style={styles.soundToggleContainer}>
              <Text style={styles.soundToggleText}>Sound</Text>
              <Switch
                value={isSoundEnabled}
                onValueChange={toggleSound}
                trackColor={{ false: '#767577', true: '#930606' }}
                thumbColor={isSoundEnabled ? '#ffff00' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'secondary',
    fontSize: 40,
    color: '#ffff00',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'secondary',
    fontSize: 24,
    color: '#ffff00',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    margin: 20,
  },
  button: {
    backgroundColor: '#930606',
    borderWidth: 2,
    borderColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 5,
  },
  buttonText: {
    fontFamily: 'secondary',
    fontSize: 20,
    color: '#ffff00',
    textAlign: 'center',
  },
  developedBy: {
    fontFamily: 'secondary',
    fontSize: 24,
    color: '#ffff00',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginTop: 40,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#191919',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'secondary',
    fontSize: 30,
    marginBottom: 10,
    color: '#ffff00',
  },
  modalText: {
    fontFamily: 'secondary',
    fontSize: 19,
    marginBottom: 20,
    fontWeight: '300',
    color: '#ffff00',
  },
  emoji: {
    fontSize: 20,
  },
  closeButton: {
    backgroundColor: '#930606',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    fontFamily: 'secondary',
    fontSize: 20,
    color: '#ffff00',
  },
  settingsButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#930606',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#000',
  },
  settingsButtonText: {
    color: '#ffff00',
    fontSize: 24,
    fontFamily: 'secondary',
  },
  soundToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '87%',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#191919',
    borderRadius: 5,
  },
  soundToggleText: {
    color: '#ffff00',
    fontSize: 18,
    fontFamily: 'secondary',
  },
  playButton: {
    backgroundColor: '#930606',
    borderWidth: 2,
    borderColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 5,
  },
  playButtonText: {
    fontFamily: 'secondary',
    fontSize: 20,
    color: '#ffff00',
    textAlign: 'center',
  },
});