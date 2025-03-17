import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  ImageBackground, 
  TouchableOpacity,
  Dimensions,
  View
} from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import createBoundaries from '../entities/Boundaries';
import createPlatform from '../entities/Platform';
import createSpike from '../entities/Spike';
import createSpring from '../entities/Spring';
import createTreadmill from '../entities/Treadmill';
import createPlayer from '../entities/Player'; // Updated Player entity

const { width, height } = Dimensions.get('window');

export default function GameScreen({ route, navigation }) {
  // Safely handle route.params with a fallback
  const selectedPlayer = route?.params?.selectedPlayer || 'DefaultPlayer';
  const [lives, setLives] = useState(10);
  const [entities, setEntities] = useState(null);
  
  const engineRef = useRef(null);
  const gameEngineRef = useRef(null);

  useEffect(() => {
    console.log('GameScreen route.params:', route?.params);
    console.log('Selected Player:', selectedPlayer);
  }, [route?.params, selectedPlayer]);

  const Physics = (entities, { time }) => {
    const engine = entities.physics?.engine;
    if (!engine) {
      console.error('Physics system: Engine is undefined!');
      return entities;
    }
    
    const delta = Math.min(time.delta, 16.667);

    if (entities.player1 && entities.spring1) {
      const playerBody = entities.player1.body;
      const springBody = entities.spring1.body;
      if (Matter.Bounds.overlaps(playerBody.bounds, springBody.bounds)) {
        Matter.Body.applyForce(playerBody, playerBody.position, { x: 0, y: -0.1 });
      }
    }

    Matter.Engine.update(engine, delta);
    return entities;
  };

  useEffect(() => {
    const engine = Matter.Engine.create({ enableSleeping: false });
    engineRef.current = engine;
    
    if (!engine) {
      console.error('Engine creation failed!');
      return;
    }
    
    const world = engine.world;
    
    const boundaries = createBoundaries(world);
    const platform = createPlatform(world, width / 2, height - 200);
    const spike = createSpike(world, width / 2, height - 230);
    const spring = createSpring(world, width / 2 - 100, height - 250);
    const treadmill = createTreadmill(world, width / 2 + 100, height - 180, -1);
    const player = createPlayer(world, width / 2, height - 300, selectedPlayer); // Pass selectedPlayer
    
    const gameEntities = {
      physics: { engine, world },
      ...boundaries,
      platform1: platform || {},
      spike1: spike || {},
      spring1: spring || {},
      treadmill1: treadmill || {},
      player1: player || {},
    };
    
    setEntities(gameEntities);
    
    return () => {
      Matter.World.clear(world);
      Matter.Engine.clear(engine);
    };
  }, [selectedPlayer]); // Re-run if selectedPlayer changes

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) {
      console.error('Collision setup: Engine is undefined!');
      return;
    }
    
    const collisionHandler = (event) => {
      if (!event || !event.pairs) {
        console.error('Event or event.pairs is undefined!');
        return;
      }
      
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        if ((bodyA.label === 'player' && bodyB.label === 'spike') ||
            (bodyA.label === 'spike' && bodyB.label === 'player')) {
          setLives((prev) => Math.max(0, prev - 2));
        }
      });
    };
    
    Matter.Events.on(engine, 'collisionStart', collisionHandler);
    
    return () => {
      Matter.Events.off(engine, 'collisionStart', collisionHandler);
    };
  }, []);

  useEffect(() => {
    if (lives <= 0) {
      navigation.navigate('MainScreen');
    }
  }, [lives, navigation]);

  const movePlayer = (direction) => {
    if (!entities || !entities.player1 || !entities.player1.body) return;
    
    const playerBody = entities.player1.body;
    const speed = 5;
    Matter.Body.setVelocity(playerBody, {
      x: direction * speed,
      y: playerBody.velocity.y,
    });
  };

  if (!entities) return null;

  return (
    <ImageBackground 
      source={require('../../assets/img/Bg2.png')}
      style={styles.background}
    >
      <GameEngine 
        ref={gameEngineRef}
        style={styles.gameContainer}
        systems={[Physics]}
        entities={entities}
        running={true}
      >
        <Text style={styles.livesText}>Lives: {lives}</Text>
        <Text style={styles.playerText}>Player: {selectedPlayer}</Text>
        <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => movePlayer(-1)}
          >
            <Text style={styles.controlText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => movePlayer(1)}
          >
            <Text style={styles.controlText}>→</Text>
          </TouchableOpacity>
        </View>
      </GameEngine>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  gameContainer: {
    flex: 1,
    zIndex: 1,
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