import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

// Prevent the splash screen from auto-hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({
    secondary: require('../../assets/fonts/secondary-font.ttf'),
  });
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ImageBackground
      source={require('../../assets/img/bg.png')}
      style={styles.background}
    >
      {/* Overlay for the welcome screen */}
      <View style={styles.overlay}>
        <Text style={styles.title}>WAY TO HELL!!</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              console.log('Go to GAME pressed');
              navigation.navigate("MainScreen");
            }}
          >
            <Text style={styles.buttonText}>Go to GAME</Text>
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
              • Dodge Obstacles: Watch out for fireballs falling from above and devils’ horns coming from the sides.{'\n'}
              • Controls: Use the left and right buttons to navigate.{'\n'}
              • Scoring: Earn points every second as long as you’re alive.{'\n'}
              <Text style={styles.emoji}></Text>☠ Warning: If you fall, you’re sent straight to Hell!{'\n'}
              <Text style={styles.emoji}>👹</Text>Good luck—we hope you don’t make it!
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
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  title: {
    fontFamily: 'secondary',
    fontSize: 60,
    color: '#ffff00',
    textShadowColor: '#8F351D',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 5,
    marginBottom: 20,
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
});