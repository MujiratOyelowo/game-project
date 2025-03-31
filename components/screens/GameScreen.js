import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ImageBackground, 
  TouchableOpacity,
  Dimensions
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
import { Physics, movePlayer, setupCollisionHandler } from '../systems/Physics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function GameScreen({ route, navigation }) {
  const selectedPlayer = route?.params?.selectedPlayer || 'DefaultPlayer';
  const [lives, setLives] = useState(10);
  const [entities, setEntities] = useState(null);
  const [cameraOffset, setCameraOffset] = useState(0);
  const [lastBoundarySpawnY, setLastBoundarySpawnY] = useState(height);
  const [lastCleanupY, setLastCleanupY] = useState(0);

  const engineRef = useRef(null);
  const gameEngineRef = useRef(null);

  // Function to spawn new obstacles
  const spawnObstacles = (world, startY, numObstacles) => {
    const obstacles = {};
    let currentY = startY;
    
    for (let i = 0; i < numObstacles; i++) {
      const gap = 60 + Math.random() * 100; // Adjusted gap for NS-SHAFT style
      currentY += gap;
      
      // Spawn single obstacle at each Y position for NS-SHAFT style
      const numObstaclesAtY = 1; // One obstacle per Y position
      
      // Calculate position for alternating left/right placement
      const isLeftSide = i % 2 === 0; // Alternate between left and right
      const xPosition = isLeftSide ? 
        50 + Math.random() * 100 : // Left side: 50-150
        width - 150 + Math.random() * 100; // Right side: width-150 to width-50
      
      const r = Math.random();
      
      if (r < 0.4) {
        obstacles[`platform_${currentY}_${i}`] = createPlatform(world, xPosition, currentY);
      } else if (r < 0.6) {
        obstacles[`spike_${currentY}_${i}`] = createSpike(world, xPosition, currentY);
      } else if (r < 0.75) {
        obstacles[`spring_${currentY}_${i}`] = createSpring(world, xPosition, currentY);
      } else {
        obstacles[`treadmill_${currentY}_${i}`] = createTreadmill(world, xPosition, currentY, -1);
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
    const { boundaries: initialBoundaries, lastY: lastBoundaryY } = spawnBoundaries(world, height, lastObstacleY + 800);

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
      const { boundaries, lastY: newBoundaryY } = spawnBoundaries(world, lastBoundarySpawnY, newObstacleY + 800);

      setLastBoundarySpawnY(newBoundaryY);
      setEntities(prev => ({ ...prev, ...obstacles, ...boundaries }));
    }
  }, [cameraOffset]); // Only depend on cameraOffset to prevent infinite loop

  // Collision handling: reduce lives if player hits spike
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const cleanup = setupCollisionHandler(engine, () => {
          setLives((prev) => Math.max(0, prev - 2));
    });
    return cleanup;
  }, []);

  // Navigate back if lives run out
  useEffect(() => {
    if (lives <= 0) {
      navigation.navigate('MainScreen');
    }
  }, [lives, navigation]);

  // Handle player movement
  const handleMovePlayer = (direction) => {
    if (!entities) return;
    setEntities(prev => movePlayer(prev, direction));
  };

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
      source={require('../../assets/img/Bg2.png')}
      style={styles.background}
    >
      {/* Fixed boundaries that don't move with the camera */}
      <View style={styles.fixedBoundaries}>
        <GameEngine 
          style={styles.gameContainer}
          systems={[Physics]}
          entities={fixedBoundaries}
          running={true}
        />
      </View>
      
      {/* Moving game world */}
      <View style={[styles.cameraContainer, { transform: [{ translateY: -cameraOffset }] }]}>
        <GameEngine 
          ref={gameEngineRef}
          style={styles.gameContainer}
          systems={[Physics]}
          entities={movingEntities}
          running={true}
        />
      </View>

      <View style={styles.fixedUI}>
        <Text style={styles.livesText}>Lives: {lives}</Text>
        <Text style={styles.playerText}>Player: {selectedPlayer}</Text>
        <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => handleMovePlayer(-1)}>
            <Text style={styles.controlText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => handleMovePlayer(1)}>
            <Text style={styles.controlText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  livesText: {
    position: 'absolute',
    top: 20,
    left: 20,
    fontSize: 20,
    color: '#ffff00',
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
});
