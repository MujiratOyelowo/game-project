import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ImageBackground, 
  TouchableOpacity,
  Dimensions,
  PanResponder
} from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import createBoundaries from '../entities/Boundaries';
import createPlatform from '../entities/Platform';
import createSpike from '../entities/Spike';
import createSpring from '../entities/Spring';
import createTreadmill from '../entities/Treadmill';
import createPlayer from '../entities/Player';
import Boundary from '../entities/Boundary';
import Physics from '../systems/Physics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import createFireball from '../entities/Fireball';
import createHead from '../entities/Head';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

export default function GameScreen({ route, navigation }) {
  const selectedPlayer = route?.params?.selectedPlayer || 'DefaultPlayer';
  const isSoundEnabled = route?.params?.isSoundEnabled ?? true; // Default to true if not provided
  const [lives, setLives] = useState(10);
  const [score, setScore] = useState(0);
  const [entities, setEntities] = useState(null);
  const [cameraOffset, setCameraOffset] = useState(0);
  const [lastBoundarySpawnY, setLastBoundarySpawnY] = useState(height);
  const [lastCleanupY, setLastCleanupY] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [lastScoreUpdateY, setLastScoreUpdateY] = useState(0);
  const [headSound, setHeadSound] = useState();
  const [gameOverSound, setGameOverSound] = useState();

  const engineRef = useRef(null);
  const gameEngineRef = useRef(null);

  // Add pan responder for swipe controls
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Reset any existing movement when touch starts
        if (gameEngineRef.current) {
          gameEngineRef.current.dispatch({ type: "stop" });
        }
      },
      onPanResponderMove: (_, gestureState) => {
        // Handle swipe movement
        if (gameEngineRef.current) {
          gameEngineRef.current.dispatch({ 
            type: "swipe", 
            gestureState 
          });
        }
      },
      onPanResponderRelease: () => {
        // Stop movement when touch ends
        if (gameEngineRef.current) {
          gameEngineRef.current.dispatch({ type: "stop" });
        }
      },
      onPanResponderTerminate: () => {
        // Stop movement if touch is interrupted
        if (gameEngineRef.current) {
          gameEngineRef.current.dispatch({ type: "stop" });
        }
      },
      onPanResponderTerminationRequest: () => true,
      onShouldBlockNativeResponder: () => false,
    })
  ).current;

  // Function to spawn new obstacles
  const spawnObstacles = (world, startY, numObstacles) => {
    const obstacles = {};
    let currentY = startY;
    
    for (let i = 0; i < numObstacles; i++) {
      const gap = 60 + Math.random() * 100;
      currentY += gap;
      
      const numObstaclesAtY = 1;
      const isLeftSide = i % 2 === 0;
      const xPosition = isLeftSide ? 
        50 + Math.random() * 100 :
        width - 150 + Math.random() * 100;
      
      const r = Math.random();
      
      if (r < 0.3) {
        obstacles[`platform_${currentY}_${i}`] = createPlatform(world, xPosition, currentY);
      } else if (r < 0.4) {
        obstacles[`spike_${currentY}_${i}`] = createSpike(world, xPosition, currentY);
      } else if (r < 0.5) {
        obstacles[`spring_${currentY}_${i}`] = createSpring(world, xPosition, currentY);
      } else if (r < 0.6) {
        obstacles[`treadmill_${currentY}_${i}`] = createTreadmill(world, xPosition, currentY, -1);
      } else if (r < 0.7) {
        // Spawn fireball
        const fireballX = 50 + Math.random() * (width - 100);
        obstacles[`fireball_${currentY}_${i}`] = createFireball(world, fireballX, currentY - 200);
      } else {
        // Spawn head
        const headX = isLeftSide ? 50 : width - 50;
        const headDirection = isLeftSide ? 1 : -1;
        obstacles[`head_${currentY}_${i}`] = createHead(world, headX, currentY, headDirection);
      }
    }
    return { obstacles, lastY: currentY };
  };

  // Function to spawn new boundary segments
  const spawnBoundaries = (world, startY, endY) => {
    const boundaries = {};
    const tileHeight = 50;
    const boundaryWidth = 20;
    let currentY = startY;

    while (currentY < endY) {
      // Left boundary
      const leftSegment = Matter.Bodies.rectangle(
        10, 
        currentY,
        boundaryWidth,
        tileHeight,
        { isStatic: true }
      );
      Matter.World.add(world, leftSegment);
      boundaries[`leftBoundary_${currentY}`] = {
        body: leftSegment,
        renderer: Boundary,
      };

      // Right boundary
      const rightSegment = Matter.Bodies.rectangle(
        width - 10,
        currentY,
        boundaryWidth,
        tileHeight,
        { isStatic: true }
      );
      Matter.World.add(world, rightSegment);
      boundaries[`rightBoundary_${currentY}`] = {
        body: rightSegment,
        renderer: Boundary,
      };

      currentY += tileHeight;
    }
    return { boundaries, lastY: currentY };
  };

  // Function to clean up old entities
  const cleanupOldEntities = (world, entities, cleanupY) => {
    const newEntities = { ...entities };
    Object.entries(entities).forEach(([key, entity]) => {
      if (key !== 'physics' && key !== 'player1' && !key.startsWith('topBoundary')) {
        const y = entity.body.position.y;
        if (y < cleanupY) {
          Matter.World.remove(world, entity.body);
          delete newEntities[key];
        }
      }
    });
    return newEntities;
  };

  // Function to reset the game
  const resetGame = () => {
    // Clean up the old physics engine
    if (engineRef.current) {
      Matter.World.clear(engineRef.current.world);
      Matter.Engine.clear(engineRef.current);
    }

    // Reset all state variables
    setLives(10);
    setScore(0);
    setCameraOffset(0);
    setLastBoundarySpawnY(height);
    setLastCleanupY(0);
    setIsGameOver(false);
    setLastScoreUpdateY(0);

    // Create a new physics engine
    const engine = Matter.Engine.create({ enableSleeping: false });
    engineRef.current = engine;
    const world = engine.world;

    // Create initial boundaries
    const boundaries = createBoundaries(world);

    // Create a top platform
    const topPlatformY = 100;
    const topPlatform = createPlatform(world, width / 2, topPlatformY);

    // Place the player randomly on the top platform
    const playerX = 50 + Math.random() * (width - 100);
    const player = createPlayer(world, playerX, topPlatformY - 30, selectedPlayer);

    // Generate initial obstacles and boundaries
    const { obstacles, lastY: lastObstacleY } = spawnObstacles(world, topPlatformY, 25);
    const { boundaries: initialBoundaries, lastY: lastBoundaryY } = spawnBoundaries(world, height, lastObstacleY + 1800);

    setLastBoundarySpawnY(lastBoundaryY);
    setLastCleanupY(topPlatformY - 200);

    const gameEntities = {
      physics: { engine, world },
      ...boundaries,
      ...initialBoundaries,
      topPlatform: topPlatform || {},
      ...obstacles,
      player1: player || {},
    };

    setEntities(gameEntities);

    // Reset the game engine
    if (gameEngineRef.current) {
      gameEngineRef.current.swap(gameEntities);
    }
  };

  // Load both sounds
  useEffect(() => {
    let isMounted = true;
    let headSoundObj = null;
    let gameOverSoundObj = null;

    async function loadSounds() {
      try {
        // Load head sound for background gameplay
        const { sound: headSound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/head.wav'),
          { isLooping: true }
        );
        headSoundObj = headSound;
        
        if (isMounted) {
          setHeadSound(headSound);
          if (isSoundEnabled) {
            await headSound.playAsync();
          }
        }

        // Load game over sound
        const { sound: gameOverSound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/gameover.wav')
        );
        gameOverSoundObj = gameOverSound;
        
        if (isMounted) {
          setGameOverSound(gameOverSound);
        }
      } catch (error) {
        console.error('Error loading sounds:', error);
      }
    }

    loadSounds();

    return () => {
      isMounted = false;
      if (headSoundObj) {
        headSoundObj.unloadAsync();
      }
      if (gameOverSoundObj) {
        gameOverSoundObj.unloadAsync();
      }
    };
  }, [isSoundEnabled]);

  // Handle sound cleanup when screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (headSound) {
          headSound.stopAsync();
        }
        if (gameOverSound) {
          gameOverSound.stopAsync();
        }
      };
    }, [headSound, gameOverSound])
  );

  // Check for game over and play appropriate sound
  useEffect(() => {
    if (lives <= 0 && isSoundEnabled) {
      if (headSound) {
        headSound.stopAsync();
      }
      if (gameOverSound) {
        gameOverSound.playAsync();
      }
      setIsGameOver(true);
    }
  }, [lives, headSound, gameOverSound, isSoundEnabled]);

  // Initial entity creation
  useEffect(() => {
    const engine = Matter.Engine.create({ enableSleeping: false });
    engineRef.current = engine;
    const world = engine.world;

    // Create initial boundaries
    const boundaries = createBoundaries(world);

    // Create a top platform
    const topPlatformY = 100;
    const topPlatform = createPlatform(world, width / 2, topPlatformY);

    // Place the player randomly on the top platform
    const playerX = 50 + Math.random() * (width - 100);
    const player = createPlayer(world, playerX, topPlatformY - 30, selectedPlayer);

    // Generate initial obstacles and boundaries
    const { obstacles, lastY: lastObstacleY } = spawnObstacles(world, topPlatformY, 25); // Increased initial obstacles
    const { boundaries: initialBoundaries, lastY: lastBoundaryY } = spawnBoundaries(world, height, lastObstacleY + 1800);

    setLastBoundarySpawnY(lastBoundaryY);
    setLastCleanupY(topPlatformY - 200);

    const gameEntities = {
      physics: { engine, world },
      ...boundaries,
      ...initialBoundaries,
      topPlatform: topPlatform || {},
      ...obstacles,
      player1: player || {},
    };

    setEntities(gameEntities);

    return () => {
      Matter.World.clear(world);
      Matter.Engine.clear(engine);
    };
  }, [selectedPlayer]);

  // Update camera offset based on the player's position
  useEffect(() => {
    const interval = setInterval(() => {
      if (entities?.player1) {
        const playerY = entities.player1.body.position.y;
        setCameraOffset(playerY - 100);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [entities?.player1]);

  // Dynamic spawning and cleanup for infinite game world
  useEffect(() => {
    if (!entities || !engineRef.current) return;

        const world = engineRef.current.world;
    const visibleBottom = cameraOffset + height;
    const spawnThreshold = visibleBottom + 400;
    const cleanupThreshold = cameraOffset - 800;

    // Only perform cleanup if we've moved far enough
    if (cleanupThreshold > lastCleanupY) {
      const cleanedEntities = cleanupOldEntities(world, entities, cleanupThreshold);
      setLastCleanupY(cleanupThreshold);
      setEntities(cleanedEntities);
    }

    // Only spawn new entities if we've moved far enough
    if (spawnThreshold > lastBoundarySpawnY) {
      const { obstacles, lastY: newObstacleY } = spawnObstacles(world, lastBoundarySpawnY, 20); // Increased spawn amount
      const { boundaries, lastY: newBoundaryY } = spawnBoundaries(world, lastBoundarySpawnY, newObstacleY + 1800);

      setLastBoundarySpawnY(newBoundaryY);
      setEntities(prev => ({ ...prev, ...obstacles, ...boundaries }));
    }
  }, [cameraOffset]); // Only depend on cameraOffset to prevent infinite loop

  // Setup collision handler
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const cleanup = Physics.setupCollisionHandler(engine, (lifeChange) => {
      setLives((prevLives) => {
        // Calculate new lives, ensuring it doesn't exceed 10
        const newLives = Math.min(10, prevLives + lifeChange);
        return Math.max(0, newLives); // Ensure lives don't go below 0
      });
    });
    return cleanup;
  }, []);

  // Handle player movement
  const handleMovePlayer = (direction) => {
    if (gameEngineRef.current) {
      gameEngineRef.current.dispatch({ 
        type: "move", 
        direction 
      });
    }
  };

  // Handle jump
  const handleJump = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.dispatch({ type: "jump" });
    }
  };

  // Function to render life bars
  const renderLifeBars = () => {
    const bars = [];
    for (let i = 0; i < 10; i++) {
      bars.push(
        <View 
          key={i}
          style={[
            styles.lifeBar,
            i < lives ? styles.lifeBarActive : styles.lifeBarInactive
          ]}
        />
      );
    }
    return bars;
  };

  // Update score based on player movement
  useEffect(() => {
    if (entities?.player1) {
      const playerY = entities.player1.body.position.y;
      // Update score when player moves down (increases Y position)
      if (playerY > lastScoreUpdateY) {
        setScore(prevScore => prevScore + 1);
        setLastScoreUpdateY(playerY);
      }
    }
  }, [entities?.player1?.body?.position.y]);

  if (!entities) return null;

  // Separate fixed boundaries from moving entities
  const fixedBoundaries = {};
  const movingEntities = { ...entities };

  // Find and separate boundary segments
  Object.entries(entities).forEach(([key, entity]) => {
    if (key.startsWith('topBoundary') || key.startsWith('leftBoundary') || key.startsWith('rightBoundary')) {
      fixedBoundaries[key] = entity;
      delete movingEntities[key];
    }
  });

  return (
    <ImageBackground 
      source={require('../../assets/img/bg2.png')}
      style={styles.background}
      {...panResponder.panHandlers}
    >
      {/* Fixed boundaries that don't move with the camera */}
      <View style={styles.fixedBoundaries}>
        <GameEngine 
          style={styles.gameContainer}
          systems={[Physics.update]}
          entities={fixedBoundaries}
          running={!isGameOver}
        />
      </View>
      
      {/* Moving game world */}
      <View style={[styles.cameraContainer, { transform: [{ translateY: -cameraOffset }] }]}>
        <GameEngine 
          ref={gameEngineRef}
          style={styles.gameContainer}
          systems={[Physics.update]}
          entities={movingEntities}
          running={!isGameOver}
        />
      </View>

      <View style={styles.fixedUI}>
        <View style={styles.livesContainer}>
          {renderLifeBars()}
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
        <Text style={styles.playerText}>Player: {selectedPlayer}</Text>
        <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => handleMovePlayer(-1)}>
            <Text style={styles.controlText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleJump}>
            <Text style={styles.controlText}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => handleMovePlayer(1)}>
            <Text style={styles.controlText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Over Overlay */}
      {isGameOver && (
        <View style={styles.gameOverOverlay}>
          <View style={styles.gameOverContent}>
            <Text style={styles.gameOverText}>Game Over!</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.restartButton}
                onPress={resetGame}
              >
                <Text style={styles.restartButtonText}>Restart</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuButton}
                onPress={() => navigation.navigate('MainScreen')}
              >
                <Text style={styles.menuButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  fixedBoundaries: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  cameraContainer: {
    flex: 1,
    zIndex: 1,
  },
  gameContainer: {
    flex: 1,
  },
  fixedUI: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
    zIndex: 3,
  },
  livesContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 10,
  },
  lifeBar: {
    width: 10,
    height: 20,
    marginHorizontal: 2,
  },
  lifeBarActive: {
    backgroundColor: '#ffff00',
  },
  lifeBarInactive: {
    backgroundColor: '#000',
  },
  playerText: {
    position: 'absolute',
    top: 50,
    left: 20,
    fontSize: 20,
    color: '#ffff00',
  },
  backArrow: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    padding: 10,
  },
  backArrowText: {
    fontSize: 28,
    color: '#ffff00',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
  },
  controlButton: {
    backgroundColor: '#930606',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
  },
  controlText: {
    fontSize: 24,
    color: '#ffff00',
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  gameOverContent: {
    backgroundColor: '#930606',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  gameOverText: {
    fontSize: 32,
    color: '#ffff00',
    marginBottom: 20,
    fontFamily: 'secondary',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  restartButton: {
    backgroundColor: '#ffff00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  restartButtonText: {
    fontSize: 24,
    color: '#930606',
    fontFamily: 'secondary',
  },
  menuButton: {
    backgroundColor: '#ffff00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  menuButtonText: {
    fontSize: 24,
    color: '#930606',
    fontFamily: 'secondary',
  },
  scoreContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 20,
    color: '#ffff00',
    fontFamily: 'secondary',
  },
});

