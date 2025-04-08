import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

// Prevent the splash screen from auto-hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function MainScreen({ route }) {
  const navigation = useNavigation();
  const isSoundEnabled = route?.params?.isSoundEnabled ?? true; // Get sound state from WelcomeScreen
  const [fontsLoaded] = useFonts({
    secondary: require('../../assets/fonts/secondary-font.ttf'),
  });

  // State for the chosen player and modal visibility
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Animation values for player 1
  const player1Anim = new Animated.Value(0);
  const player1Rotate = new Animated.Value(0);
  const player1Scale = new Animated.Value(1);
  
  // Animation values for player 2
  const player2Anim = new Animated.Value(0);
  const player2Rotate = new Animated.Value(0);
  const player2Scale = new Animated.Value(1);

  // Animation values for modal player
  const modalPlayerAnim = new Animated.Value(0);
  const modalPlayerRotate = new Animated.Value(0);
  const modalPlayerScale = new Animated.Value(1);

  // Start animations when component mounts
  useEffect(() => {
    // John dancing animation
    Animated.parallel([
      // Up and down movement
      Animated.loop(
        Animated.sequence([
          Animated.timing(player1Anim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(player1Anim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
      // Rotation
      Animated.loop(
        Animated.sequence([
          Animated.timing(player1Rotate, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(player1Rotate, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ),
      // Scale
      Animated.loop(
        Animated.sequence([
          Animated.timing(player1Scale, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(player1Scale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Jane dancing animation (slightly different timing)
    Animated.parallel([
      // Up and down movement
      Animated.loop(
        Animated.sequence([
          Animated.timing(player2Anim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(player2Anim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ),
      // Rotation
      Animated.loop(
        Animated.sequence([
          Animated.timing(player2Rotate, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(player2Rotate, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      ),
      // Scale
      Animated.loop(
        Animated.sequence([
          Animated.timing(player2Scale, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(player2Scale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  // Stop animations when a player is selected
  useEffect(() => {
    if (selectedPlayer) {
      // Stop all animations
      player1Anim.stopAnimation();
      player2Anim.stopAnimation();
      player1Rotate.stopAnimation();
      player2Rotate.stopAnimation();
      player1Scale.stopAnimation();
      player2Scale.stopAnimation();

      // Reset values to default
      player1Anim.setValue(0);
      player2Anim.setValue(0);
      player1Rotate.setValue(0);
      player2Rotate.setValue(0);
      player1Scale.setValue(1);
      player2Scale.setValue(1);

      // Start animation only for selected player
      if (selectedPlayer === 'John') {
        Animated.parallel([
          Animated.loop(
            Animated.sequence([
              Animated.timing(player1Anim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(player1Anim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
              }),
            ])
          ),
          Animated.loop(
            Animated.sequence([
              Animated.timing(player1Rotate, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(player1Rotate, {
                toValue: 0,
                duration: 1500,
                useNativeDriver: true,
              }),
            ])
          ),
          Animated.loop(
            Animated.sequence([
              Animated.timing(player1Scale, {
                toValue: 1.1,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(player1Scale, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
            ])
          ),
        ]).start();
      } else if (selectedPlayer === 'Jane') {
        Animated.parallel([
          Animated.loop(
            Animated.sequence([
              Animated.timing(player2Anim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
              }),
              Animated.timing(player2Anim, {
                toValue: 0,
                duration: 1200,
                useNativeDriver: true,
              }),
            ])
          ),
          Animated.loop(
            Animated.sequence([
              Animated.timing(player2Rotate, {
                toValue: 1,
                duration: 1800,
                useNativeDriver: true,
              }),
              Animated.timing(player2Rotate, {
                toValue: 0,
                duration: 1800,
                useNativeDriver: true,
              }),
            ])
          ),
          Animated.loop(
            Animated.sequence([
              Animated.timing(player2Scale, {
                toValue: 1.1,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(player2Scale, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
            ])
          ),
        ]).start();
      }
    }
  }, [selectedPlayer]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Reset state each time the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setSelectedPlayer(null);
      setShowModal(false);
      setIsLoading(false);
      setLoadingProgress(0);
    }, [])
  );

  // Simulate a loading process when PLAY button is pressed
  useEffect(() => {
    let interval;
    if (isLoading && selectedPlayer) {
      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            console.log('Navigating to GameScreen with selectedPlayer:', selectedPlayer);
            navigation.navigate('GameScreen', { 
              selectedPlayer,
              isSoundEnabled // Pass sound state to GameScreen
            });
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isLoading, selectedPlayer, navigation, isSoundEnabled]);

  // Start modal animation when modal is shown
  useEffect(() => {
    if (showModal) {
      // Reset animation values
      modalPlayerAnim.setValue(0);
      modalPlayerRotate.setValue(0);
      modalPlayerScale.setValue(1);

      // Start modal player dancing animation
      Animated.parallel([
        // Up and down movement
        Animated.loop(
          Animated.sequence([
            Animated.timing(modalPlayerAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(modalPlayerAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
        // Rotation
        Animated.loop(
          Animated.sequence([
            Animated.timing(modalPlayerRotate, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(modalPlayerRotate, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ),
        // Scale
        Animated.loop(
          Animated.sequence([
            Animated.timing(modalPlayerScale, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(modalPlayerScale, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }
  }, [showModal]);

  if (!fontsLoaded) return null;

  return (
    <ImageBackground
      source={require('../../assets/img/bg.png')}
      style={styles.background}
    >
      <View style={styles.overlay}>
        {/* Top Section */}
        <Text style={styles.topTitle}>WELCOME TO HELL!!</Text>
        <Text style={styles.subtitle}>We hope you get there!!</Text>

        {/* Middle Section */}
        <Text style={styles.chooseTitle}>CHOOSE YOUR WARRIOR</Text>
        <View style={styles.playerContainer}>
          <TouchableOpacity
            onPress={() => {
              setSelectedPlayer('John');
              setShowModal(true);
            }}
          >
            <Animated.View
              style={[
                styles.playerImageContainer,
                {
                  transform: [
                    {
                      translateY: player1Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -15],
                      }),
                    },
                    {
                      rotate: player1Rotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-5deg', '5deg'],
                      }),
                    },
                    {
                      scale: player1Scale,
                    },
                  ],
                },
              ]}
            >
              <Image
                source={require('../../assets/img/Player.png')}
                style={[
                  styles.playerImage,
                  selectedPlayer === 'John' && styles.selectedPlayer,
                ]}
              />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setSelectedPlayer('Jane');
              setShowModal(true);
            }}
          >
            <Animated.View
              style={[
                styles.playerImageContainer,
                {
                  transform: [
                    {
                      translateY: player2Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -15],
                      }),
                    },
                    {
                      rotate: player2Rotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-5deg', '5deg'],
                      }),
                    },
                    {
                      scale: player2Scale,
                    },
                  ],
                },
              ]}
            >
              <Image
                source={require('../../assets/img/Player2.png')}
                style={[
                  styles.playerImage,
                  selectedPlayer === 'Jane' && styles.selectedPlayer,
                ]}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Modal to pop up the chosen player */}
        {showModal && selectedPlayer && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedPlayer} Selected!</Text>
              <Animated.View
                style={[
                  styles.modalPlayerContainer,
                  {
                    transform: [
                      {
                        translateY: modalPlayerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -20],
                        }),
                      },
                      {
                        rotate: modalPlayerRotate.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['-8deg', '8deg'],
                        }),
                      },
                      {
                        scale: modalPlayerScale,
                      },
                    ],
                  },
                ]}
              >
                <Image
                  source={
                    selectedPlayer === 'John'
                      ? require('../../assets/img/Player.png')
                      : require('../../assets/img/Player2.png')
                  }
                  style={styles.modalPlayerImage}
                />
              </Animated.View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Section */}
        <TouchableOpacity
          style={[
            styles.playButton,
            selectedPlayer && styles.playButtonActive
          ]}
          onPress={() => {
            if (selectedPlayer) {
              setIsLoading(true);
            } else {
              console.warn('Please select a player before playing!');
            }
          }}
        >
          <Text style={styles.playButtonText}>PLAY</Text>
        </TouchableOpacity>

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading {loadingProgress}%</Text>
          </View>
        )}

        {/* Go Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Welcome')}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 20,
  },
  topTitle: {
    fontFamily: 'secondary',
    fontSize: 40,
    color: '#fff000',
    marginTop: 40,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'secondary',
    fontSize: 18,
    color: '#fff000',
    marginTop: 10,
    textAlign: 'center',
  },
  chooseTitle: {
    fontFamily: 'secondary',
    fontSize: 24,
    color: '#fff000',
    marginTop: 80,
    textAlign: 'center',
  },
  playerContainer: {
    flexDirection: 'row',
    marginTop: 30,
    justifyContent: 'space-around',
    width: '100%',
  },
  playerImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlayer: {
    borderColor: '#fff000',
    borderWidth: 4,
  },
  playButton: {
    backgroundColor: '#930606',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 5,
    marginTop: 60,
  },
  playButtonActive: {
    opacity: 1,
  },
  playButtonText: {
    fontFamily: 'secondary',
    fontSize: 24,
    color: '#fff000',
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  backButtonText: {
    fontFamily: 'secondary',
    fontSize: 36,
    color: '#fff000',
  },
  loadingContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 5,
  },
  loadingText: {
    fontFamily: 'secondary',
    fontSize: 18,
    color: '#fff000',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#191919',
    width: '50%',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'secondary',
    fontSize: 24,
    marginBottom: 10,
    color: '#ffff00',
  },
  modalPlayerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  modalPlayerImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  modalCloseButton: {
    marginTop: 10,
    backgroundColor: '#930606',
    padding: 10,
    borderRadius: 5,
  },
  modalCloseButtonText: {
    fontFamily: 'secondary',
    fontSize: 18,
    color: '#ffff00',
  },
});