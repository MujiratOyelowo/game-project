import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  ImageBackground, 
  TouchableOpacity,
  Dimensions,
  View,
  Alert,
  Image
} from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import createBoundaries from '../entities/Boundaries';
import createPlatform from '../entities/Platform';
import createSpike from '../entities/Spike';
import createSpring from '../entities/Spring';
import createTreadmill from '../entities/Treadmill';
import createPlayer from '../entities/Player';
import createFireball from '../entities/Fireball';

const { width, height } = Dimensions.get('window');

// Game constants
const SCROLL_SPEED = -1.8;        // Increased scroll speed from -1.0 to -1.8
const PLATFORM_GAP_MIN = 100;      // 將最小間隔從70調整為100，大於玩家高度（80像素）
const PLATFORM_GAP_MAX = 200;     // 將最大間隔從170調整為200，確保足夠間距
const PLATFORM_WIDTH = 100;       // Platform width
const INITIAL_PLATFORMS = 8;      // Initial number of platforms
const PLATFORM_TYPES = ['platform', 'treadmill', 'spring', 'spike']; // Platform types
const PLATFORM_WEIGHTS = [40, 25, 20, 15]; // Weights for each platform type generation, for more balanced distribution
const FIREBALL_SPAWN_INTERVAL = 2000; // More frequent fireball generation (every 2 seconds)
const FIREBALL_DAMAGE = 3; // Fireball damage - 確保火球傷害為3點
const FIREBALL_MIN_SPEED = 6; // Fireball minimum falling speed
const FIREBALL_MAX_SPEED = 10; // Fireball maximum falling speed

export default function GameScreen({ route, navigation }) {
  const selectedPlayer = route?.params?.selectedPlayer || 'DefaultPlayer';
  const [lives, setLives] = useState(10);
  const [entities, setEntities] = useState(null);
  const [isHoldingLeft, setIsHoldingLeft] = useState(false);
  const [isHoldingRight, setIsHoldingRight] = useState(false);
  const [lastDamageTime, setLastDamageTime] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);  // Added pause state
  
  const engineRef = useRef(null);
  const gameEngineRef = useRef(null);
  const platformsRef = useRef({});
  const scrollPositionRef = useRef(0);
  const lowestPlatformRef = useRef(0);  // Changed from highest platform to lowest platform
  const lastScoreUpdateRef = useRef(Date.now());  // Used for score calculation time reference
  const lastFireballSpawnRef = useRef(0); // Last time a fireball was generated
  const fireballsRef = useRef({}); // Store references to all fireballs
  
  // Add refs for treadmill state
  const treadmillContactedRef = useRef(false);
  const currentTreadmillSpeedRef = useRef(0);
  const [treadmillContacted, setTreadmillContacted] = useState(false);
  const [currentTreadmillSpeed, setCurrentTreadmillSpeed] = useState(0);

  // Handle pause/resume game
  const togglePause = () => {
    setIsPaused(!isPaused);
    console.log('Game state:', isPaused ? 'Resume' : 'Pause');
  };

  useEffect(() => {
    console.log('GameScreen route.params:', route?.params);
    console.log('Selected Player:', selectedPlayer);
  }, [route?.params, selectedPlayer]);

  // Generate random platform type
  const getRandomPlatformType = () => {
    const totalWeight = PLATFORM_WEIGHTS.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < PLATFORM_WEIGHTS.length; i++) {
      if (random < PLATFORM_WEIGHTS[i]) {
        return PLATFORM_TYPES[i];
      }
      random -= PLATFORM_WEIGHTS[i];
    }
    return 'platform';  // Default platform type
  };
  
  // Create a new platform
  const createRandomPlatform = (world, y, isInitial = false) => {
    // Initial platforms should be more stable, not containing spike
    const platformType = isInitial 
      ? (Math.random() < 0.7 ? 'platform' : (Math.random() < 0.5 ? 'treadmill' : 'spring'))
      : getRandomPlatformType();
    
    const x = Math.random() * (width - PLATFORM_WIDTH) + PLATFORM_WIDTH / 2;
    
    let platform;
    switch (platformType) {
      case 'treadmill':
        const direction = Math.random() < 0.5 ? -2 : 2;  // Increased speed size, from ±1 to ±2
        platform = createTreadmill(world, x, y, direction);
        // Ensure treadmill has correct label
        platform.body.label = 'treadmill';
        console.log("Created treadmill, speed:", direction, "Color:", platform.color);
        break;
      case 'spring':
        platform = createSpring(world, x, y);
        // Ensure spring has correct label
        platform.body.label = 'spring';
        console.log("Created spring, color:", platform.color);
        break;
      case 'spike':
        platform = createSpike(world, x, y);
        // Ensure spike has correct label
        platform.body.label = 'spike';
        console.log("Created spike");
        break;
      default:  // 'platform'
        platform = createPlatform(world, x, y);
        // Ensure normal platform has correct label
        platform.body.label = 'platform';
        console.log("Created normal platform, color:", platform.color);
    }
    
    const platformId = `platform_${Date.now()}_${Math.random()}`;
    
    // Store platform reference for later management
    platformsRef.current[platformId] = platform;
    
    // Update lowest platform position
    if (y > lowestPlatformRef.current) {
      lowestPlatformRef.current = y;
    }
    
    return { [platformId]: platform };
  };
  
  // Main physics system
  const Physics = (entities, { time }) => {
    const engine = entities.physics?.engine;
    if (!engine) {
      console.error('Physics system: Engine is undefined!');
      return entities;
    }
    
    const delta = Math.min(time.delta, 16.667);

    // Handle game over
    if (gameOver) {
      return entities;
    }

    // Update score - Changed to score increase per second
    const currentTime = Date.now();
    const elapsedTime = currentTime - lastScoreUpdateRef.current;
    
    // Increase score by 1 point per second
    if (elapsedTime >= 1000) {
      setScore(prev => prev + 1);
      lastScoreUpdateRef.current = currentTime;
    }

    // Fireball generation logic
    const fireballSpawnElapsed = currentTime - lastFireballSpawnRef.current;
    if (fireballSpawnElapsed >= FIREBALL_SPAWN_INTERVAL && !isPaused && !gameOver) {
      try {
        // Choose a random position at the top boundary to spawn a fireball
        const spawnX = Math.random() * (width - 60) + 30; // Avoid spawning at the extreme edges
        const spawnY = 30; // Spawn below the top boundary
        
        // Use the new fireball creation method
        const fireball = createFireball(null, spawnX, spawnY);
        
        // Directly add the fireball to the entities list
        if (fireball) {
          const fireballId = `fireball_${Date.now()}_${Math.random()}`;
          fireballsRef.current[fireballId] = fireball;
          entities[fireballId] = fireball;
          
          // Set random velocity
          fireball.velocity.y = FIREBALL_MIN_SPEED + 
            Math.random() * (FIREBALL_MAX_SPEED - FIREBALL_MIN_SPEED);
          
          // Update the last spawn time
          lastFireballSpawnRef.current = currentTime;
          
          console.log(`Generated new fireball, position: (${spawnX}, ${spawnY}), speed: ${fireball.velocity.y}`);
        }
      } catch (error) {
        console.error('Error generating fireball:', error);
      }
    }
    
    // Update all fireballs and detect collisions
    const fireballKeys = Object.keys(fireballsRef.current || {});
    for (let i = 0; i < fireballKeys.length; i++) {
      const key = fireballKeys[i];
      const fireball = fireballsRef.current[key];
      
      if (!fireball) continue;
      
      // Update fireball position
      fireball.update();
      
      // Check if the fireball is below the screen bottom
      if (fireball.position.y > height + 50) {
        delete fireballsRef.current[key];
        delete entities[key];
        continue;
      }
      
      // Detect collision with player
      if (entities.player1 && fireball.collidesWith(entities.player1)) {
        // Handle collision
        // Check cooldown time
        if (currentTime - lastDamageTime < 1000) continue;
        
        // Update damage time
        setLastDamageTime(currentTime);
        
        // Handle collision consequences
        console.log(`Player hit by fireball ${key}`);
        
        // Deduct lives
        setLives((prev) => {
          const newLives = Math.max(0, prev - FIREBALL_DAMAGE);
          if (newLives <= 0 && !gameOver) {
            setGameOver(true);
            Alert.alert(
              "Game Over",
              `You lost, welcome to hell! Your score: ${score}`,
              [
                { text: "Restart Game", onPress: restartGame },
                { text: "Return to Main Menu", onPress: () => navigation.navigate('MainScreen') }
              ]
            );
          } else if (entities.player1.body) {
            // Visual feedback - player bounces slightly when hit by a fireball
            Matter.Body.setVelocity(entities.player1.body, {
              x: entities.player1.body.velocity.x,
              y: -3 // Enhanced upward bounce effect
            });
          }
          return newLives;
        });
        
        // Remove fireball
        delete fireballsRef.current[key];
        delete entities[key];
        continue;
      }
      
      // Detect collision with platforms
      let platformCollision = false;
      Object.keys(platformsRef.current || {}).forEach(platformKey => {
        const platform = platformsRef.current[platformKey];
        if (platform && fireball.collidesWithPlatform(platform)) {
          // Collision occurred, remove fireball
          delete fireballsRef.current[key];
          delete entities[key];
          platformCollision = true;
          console.log('Fireball hit platform, removed');
        }
      });
      
      if (platformCollision) continue;
    }

    // Check every frame to clear all old devil horns
    const allBodies = Matter.Composite.allBodies(engine.world);
    for (let i = 0; i < allBodies.length; i++) {
      const body = allBodies[i];
      if (body.label === 'devilHorn') {
        // Debug logging
        console.log('Found old devil horn in world, removing...');
        // Remove from physics world
        Matter.World.remove(engine.world, body);
      }
    }

    // Handle screen scrolling
    scrollPositionRef.current += SCROLL_SPEED;
    
    // 處理實體滾動，但確保邊界和固定元素不滾動
    Object.keys(entities).forEach(key => {
      const entity = entities[key];
      
      // 跳過固定在螢幕上的元素
      if (entity.isScreenFixed) {
        return;
      }
      
      // 跳過所有邊界實體 - 確保它們完全不參與滾動
      if (key.includes('Boundary') || 
          (entity.body && 
           (entity.body.label === 'topBoundary' || 
            entity.body.label === 'leftBoundary' || 
            entity.body.label === 'rightBoundary'))) {
        return;
      }
      
      // 跳過火球實體 - 確保火球不受滾動影響
      if (entity.isFireball || (entity.body && entity.body.label === 'fireball')) {
        // 確保火球有正確的向下速度
        if (entity.body) {
          // 如果火球沒有向下移動或速度太慢，施加額外的向下力
          if (entity.body.velocity.y < 3) {
            Matter.Body.setVelocity(entity.body, {
              x: entity.body.velocity.x,
              y: 5 // 確保有足夠的向下速度
            });
          }
        }
        return;
      }
      
      // 清除舊的魔鬼角實體
      if (key.includes('leftHead') || key.includes('rightHead') || entity.isDevilHorn) {
        if (entity.body) {
          Matter.World.remove(engine.world, entity.body);
        }
        delete entities[key];
        return;
      }
      
      // 常規實體滾動
      if (entity.body && key !== 'player1' && key !== 'physics') {
        Matter.Body.translate(entity.body, { x: 0, y: SCROLL_SPEED });
        
        // 如果平台移出螢幕頂部，移除它
        if (entity.body.position.y < -100) {
          delete platformsRef.current[key];
          Matter.World.remove(engine.world, entity.body);
          delete entities[key];
        }
      }
    });
    
    // 確保玩家不滾動
    if (entities.player1) {
      const playerBody = entities.player1.body;
      
      // 檢查玩家是否超出底部螢幕邊界(觸發遊戲結束)
      // 降低檢測門檻，只要玩家位置超過螢幕高度就結束遊戲
      if (playerBody.position.y > height + 50) {
        console.log('Player fell out of bounds, game over!');
        setGameOver(true);
        Alert.alert(
          "Game Over",
          `You fell into the abyss! Your score: ${score}`,
          [
            { text: "Restart Game", onPress: restartGame },
            { text: "Return to Main Menu", onPress: () => navigation.navigate('MainScreen') }
          ]
        );
        return entities;
      }
      
      // Handle long press movement
      const runningSpeed = 2;

      // Check platform contact
      const checkPlatformContact = () => {
        const playerBody = entities.player1.body;
        const playerPosition = playerBody.position;
        const playerWidth = playerBody.bounds.max.x - playerBody.bounds.min.x;
        const playerHeight = playerBody.bounds.max.y - playerBody.bounds.min.y;
        const playerBottom = playerPosition.y + playerHeight / 2;
        const currentPlatforms = Object.values(platformsRef.current);
        
        let onPlatformNow = false;
        let onSpringNow = false;
        let onSpikesNow = false;
        let onTreadmillNow = false;
        let treadmillSpeed = 0;
        let currentPlatformBody = null;
        
        // Reset treadmill contact flag and speed
        treadmillContactedRef.current = false;
        currentTreadmillSpeedRef.current = 0;
        
        for (const platform of currentPlatforms) {
          if (!platform || !platform.body) continue;
          
          const platformBody = platform.body;
          const platformTop = platformBody.bounds.min.y;
          const platformBottom = platformBody.bounds.max.y;
          const platformLeft = platformBody.bounds.min.x;
          const platformRight = platformBody.bounds.max.x;
          const platformWidth = platformRight - platformLeft;
          
          // Calculate horizontal overlap between player and platform
          const overlapLeft = Math.max(playerPosition.x - playerWidth / 2, platformLeft);
          const overlapRight = Math.min(playerPosition.x + playerWidth / 2, platformRight);
          const horizontalOverlap = Math.max(0, overlapRight - overlapLeft);
          const overlapRatio = horizontalOverlap / playerWidth;
          
          // If player's bottom is close to platform's top and there is sufficient overlap
          const verticalDistance = Math.abs(playerBottom - platformTop);
          const isPenetrating = playerBottom > platformTop && playerBottom < platformBottom;
          
          // Detect if player is on the platform - require minimum 50% overlap
          // This ensures player falls when half or more of their body is off the platform
          if ((verticalDistance <= 8 && overlapRatio >= 0.5) || (isPenetrating && overlapRatio >= 0.5)) {
            // If penetrating, correct position
            if (isPenetrating) {
              console.log("Correcting player position - platform penetration detected");
              Matter.Body.setPosition(playerBody, {
                x: playerBody.position.x,
                y: platformTop - playerHeight/2 - 1 // Position 1px above platform
              });
            }
            
            // Store current platform for reference
            currentPlatformBody = platformBody;
            
            // Check platform type
            if (platformBody.label === 'platform') {
              onPlatformNow = true;
              // Ensure zero bounce on platforms
              playerBody.restitution = 0;
              
              // 當碰撞到普通平台時回血1滴 - 只在首次接觸時執行
              const currentTime = Date.now();
              if (currentTime - lastDamageTime > 1000 && !playerBody.lastPlatformId) {
                // 回血1滴，同時確保不超過最大生命值10
                setLives(prev => Math.min(10, prev + 1));
                setLastDamageTime(currentTime);
                console.log("Player landed on platform, healing 1 HP");
                
                // 記錄當前平台ID，防止再次觸發回血
                playerBody.lastPlatformId = platformBody.id || Date.now();
              }
              
            } else if (platformBody.label === 'spring') {
              onSpringNow = true;
              
              // 實現慢速彈跳效果 - 增強彈跳力量確保明顯的彈跳
              // 實現回血效果：每次接觸彈簧回血1滴
              Matter.Body.setVelocity(playerBody, {
                x: playerBody.velocity.x,
                y: -6  // 增加向上力量，確保明顯的彈跳效果
              });
              
              // 確保不會連續多次回血，但使回血機制更明確（即每次彈跳都算一次）
              const currentTime = Date.now();
              // 減少時間間隔到800毫秒，以確保每次彈跳都能觸發回血
              if (currentTime - lastDamageTime > 800) {
                // 回血1滴，同時確保不超過最大生命值10
                setLives(prev => Math.min(10, prev + 1));
                setLastDamageTime(currentTime);
                console.log("Player bounced on spring, healing 1 HP");
                
                // 提供視覺反饋，讓玩家知道已回血
                playerBody.springBounceTime = currentTime;
              }
              
            } else if (platformBody.label === 'spike') {
              onSpikesNow = true;
              playerBody.isTouchingSpike = true; // Ensure spike flag is set
              
              // 碰撞到尖刺時扣2滴血且最多只扣2滴
              const currentTime = Date.now();
              // 確保不是連續扣血，設置冷卻時間1秒
              if (currentTime - lastDamageTime > 1000) {
                // 扣2滴血
                setLives(prev => Math.max(0, prev - 2));
                setLastDamageTime(currentTime);
                console.log("Player hit spike, lost 2 HP");
                
                // 如果生命值降為0，結束遊戲
                if (lives <= 2 && !gameOver) {
                  setGameOver(true);
                  Alert.alert(
                    "Game Over",
                    `You lost, welcome to hell! Your score: ${score}`,
                    [
                      { text: "Restart Game", onPress: restartGame },
                      { text: "Return to Main Menu", onPress: () => navigation.navigate('MainScreen') }
                    ]
                  );
                }
              }
              
            } else if (platformBody.label === 'treadmill') {
              onTreadmillNow = true;
              treadmillSpeed = platformBody.treadmillSpeed || 4; // Use default value 4
              treadmillContactedRef.current = true;
              currentTreadmillSpeedRef.current = treadmillSpeed;
              // Ensure zero bounce on treadmills
              playerBody.restitution = 0;
              
              console.log(`Player contacted treadmill! Speed: ${treadmillSpeed}`);
            }
          } else if (isPenetrating && overlapRatio < 0.5) {
            // Player is penetrating but not enough overlap to be supported
            // Allow them to fall by not setting any platform flags
            console.log(`Player has insufficient overlap (${overlapRatio.toFixed(2)}) to be supported by platform`);
            
            // No pushing force, just let physics handle it naturally
          }
        }
        
        const isOnPlatform = onPlatformNow || onSpringNow || onSpikesNow || onTreadmillNow;
        const currentPlatformType = onPlatformNow ? 'platform' :
                                    onSpringNow ? 'spring' :
                                    onSpikesNow ? 'spike' :
                                    onTreadmillNow ? 'treadmill' : 'none';
        
        // Cut vertical velocity to eliminate bouncing when on a platform
        if (isOnPlatform && currentPlatformType !== 'spring') {
          Matter.Body.setVelocity(playerBody, {
            x: playerBody.velocity.x,
            y: 0 // Zero vertical velocity to eliminate bounce
          });
        }
        
        // Handle treadmill effect if on treadmill
        if (onTreadmillNow && treadmillSpeed !== 0) {
          console.log(`Applying treadmill effect with speed: ${treadmillSpeed}`);
          handleTreadmillEffect(playerBody, currentPlatformBody, treadmillSpeed);
        }
        
        // 如果玩家不在平台上，重置lastPlatformId
        if (!isOnPlatform) {
          playerBody.lastPlatformId = null;
        }
        
        return { isOnPlatform, currentPlatformType, currentPlatformBody };
      };

      const { isOnPlatform, currentPlatformType, currentPlatformBody } = checkPlatformContact();

      // Allow movement on any platform, including spike
      if (isOnPlatform) {
        if (isHoldingLeft) {
          Matter.Body.setVelocity(playerBody, {
            x: -runningSpeed,
            y: playerBody.velocity.y
          });
        } else if (isHoldingRight) {
          Matter.Body.setVelocity(playerBody, {
            x: runningSpeed,
            y: playerBody.velocity.y
          });
        } else {
          // When no keys are pressed, handle based on platform type
          if (currentPlatformType === 'platform') {
            // Completely stop horizontal and vertical movement on normal platform
            Matter.Body.setVelocity(playerBody, {
              x: 0,
              y: 0  // Set vertical velocity to 0 to prevent bounce
            });
          } else if (!playerBody.isTouchingSpike) {
            // Apply friction on non-spike platforms
            const friction = 0.4;  // Increased friction to make stopping more natural
            Matter.Body.setVelocity(playerBody, {
              x: playerBody.velocity.x * (1 - friction),
              y: playerBody.velocity.y
            });
          }
        }
      }
      
      // Dynamic new platform addition - Now added at bottom
      const screenBottomY = -scrollPositionRef.current + height;
      const visibleBottomEdge = screenBottomY + 200;  // Add platform slightly further below visible area
      
      if (lowestPlatformRef.current < visibleBottomEdge) {
        const previousY = lowestPlatformRef.current;
        const newPlatformY = previousY + (PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN));
        
        // 確保新增平台的垂直間距至少是玩家高度的1.2倍，以避免卡住
        const adjustedY = Math.max(newPlatformY, previousY + 100);
        
        const newPlatform = createRandomPlatform(engine.world, adjustedY);
        Object.assign(entities, newPlatform);
        lowestPlatformRef.current = adjustedY;
      }
    }

    Matter.Engine.update(engine, delta);
    return entities;
  };

  useEffect(() => {
    const engine = Matter.Engine.create({ 
      enableSleeping: false
    });
    
    // Set physics world parameters - Increased gravity to make player feel heavier
    engine.gravity.scale = 0.01;  // Increased gravity ratio, from 0.005 to 0.01
    engine.gravity.y = 1;          // Keep gravity downward
    
    engineRef.current = engine;
    
    if (!engine) {
      console.error('Engine creation failed!');
      return;
    }
    
    const world = engine.world;
    
    // 清除所有可能存在的舊魔鬼角實體
    let existingBodies = Matter.Composite.allBodies(world);
    for (let i = 0; i < existingBodies.length; i++) {
      const body = existingBodies[i];
      if (body.label === 'leftHead' || body.label === 'rightHead' || body.isDevilHorn) {
        Matter.World.remove(world, body);
      }
    }
    
    // Initialize platforms and player
    platformsRef.current = {};
    scrollPositionRef.current = 0;
    
    // Create boundaries
    const boundaries = createBoundaries(world);
    
    // Create initial platforms, from top to bottom
    const initialEntities = { 
      physics: { engine, world },
      ...boundaries
    };
    
    // Ensure first platform is above player and wide enough
    const firstPlatformY = height * 0.3;
    const firstPlatform = createPlatform(world, width / 2, firstPlatformY);
    const firstPlatformId = 'platform_initial';
    platformsRef.current[firstPlatformId] = firstPlatform;
    initialEntities[firstPlatformId] = firstPlatform;
    
    // Create more initial platforms, ensure four types are present
    let lastY = firstPlatformY;
    lowestPlatformRef.current = lastY;
    
    // Force creating platforms of four different types in initial stage
    const forcedTypes = ['platform', 'treadmill', 'spring', 'spike'];
    
    // First ensure each type is present at least once
    for (let i = 0; i < forcedTypes.length; i++) {
      const previousY = lastY;
      lastY += (PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN));
      
      // 確保平台垂直間距至少是玩家高度的1.2倍，以避免卡住
      if (i > 0 && lastY - previousY < 100) {
        lastY = previousY + 100; // 確保最小間距為100像素
      }
      
      let platform;
      const x = Math.random() * (width - PLATFORM_WIDTH) + PLATFORM_WIDTH / 2;
      
      switch (forcedTypes[i]) {
        case 'treadmill':
          const direction = Math.random() < 0.5 ? -2 : 2;  // Increased speed size, from ±1 to ±2
          platform = createTreadmill(world, x, lastY, direction);
          break;
        case 'spring':
          platform = createSpring(world, x, lastY);
          break;
        case 'spike':
          platform = createSpike(world, x, lastY);
          break;
        default: // 'platform'
          platform = createPlatform(world, x, lastY);
      }
      
      const platformId = `platform_${forcedTypes[i]}_${i}`;
      platformsRef.current[platformId] = platform;
      initialEntities[platformId] = platform;
      lowestPlatformRef.current = lastY;
      
      console.log(`Created forced type platform: ${forcedTypes[i]}, Color:`, platform.color || 'Using image');
    }
    
    // Create more random platforms
    for (let i = 0; i < INITIAL_PLATFORMS - forcedTypes.length; i++) {
      lastY += (PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN));
      const platformEntities = createRandomPlatform(world, lastY, true);
      Object.assign(initialEntities, platformEntities);
      lowestPlatformRef.current = lastY;
    }
    
    // Create player above first platform, increase mass to make him heavier
    const player = createPlayer(world, width / 2, firstPlatformY - 50, selectedPlayer);
    player.body.mass = player.body.mass * 3;  // Significantly increase player mass, from 1.5x to 3x
    initialEntities.player1 = player;

    setEntities(initialEntities);
    
    return () => {
      // 完全清空世界和引擎
      Matter.World.clear(world);
      Matter.Engine.clear(engine);
    };
  }, [selectedPlayer]);

  // Add collision handling logic
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) {
      console.error('Collision setup: Engine is undefined!');
      return;
    }
    
    const collisionStartHandler = (event) => {
      let pairs = event.pairs;
      
      pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        
        // Skip if one of the bodies is not valid anymore
        if (!bodyA || !bodyB) return;
        
        // Handle player landing on platform
        if ((bodyA.label === 'player' && PLATFORM_TYPES.includes(bodyB.label)) ||
            (PLATFORM_TYPES.includes(bodyA.label) && bodyB.label === 'player')) {
          // ... existing code ...
        }
        
        // Handle fireball collision with player
        if ((bodyA.label === 'player' && bodyB.label === 'fireball') ||
            (bodyA.label === 'fireball' && bodyB.label === 'player')) {
          // No longer handle Matter.js fireball collisions since we use custom system
          console.log('Matter.js fireball collision deprecated, using custom system');
          return;
        }
        
        // Handle fireball collision with platforms
        if ((bodyA.label === 'fireball' && 
             (bodyB.label === 'platform' || bodyB.label === 'spring' || bodyB.label === 'treadmill' || bodyB.label === 'spike')) ||
            ((bodyA.label === 'platform' || bodyA.label === 'spring' || bodyA.label === 'treadmill' || bodyA.label === 'spike') && 
             bodyB.label === 'fireball')) {
          // No longer handle Matter.js fireball collisions since we use custom system
          console.log('Matter.js fireball-platform collision deprecated, using custom system');
          return;
        }
      });
    };
    
    const collisionEndHandler = (event) => {
      if (!event || !event.pairs) return;
      
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        
        // Handle treadmill collision end
        if ((bodyA.label === 'player' && bodyB.label === 'treadmill') ||
            (bodyA.label === 'treadmill' && bodyB.label === 'player')) {
          const playerBody = bodyA.label === 'player' ? bodyA : bodyB;
          
          console.log('Player and treadmill collision ended!');
          
          // Clear treadmill flag
          playerBody.isTouchingTreadmill = false;
          playerBody.currentTreadmill = null;
        }
        
        // Handle spike collision end
        if ((bodyA.label === 'player' && bodyB.label === 'spike') ||
            (bodyA.label === 'spike' && bodyB.label === 'player')) {
          const playerBody = bodyA.label === 'player' ? bodyA : bodyB;
          
          // Only reset spike state when player explicitly leaves spike
          // Check if there is a clear horizontal movement or upward movement
          if ((Math.abs(playerBody.velocity.x) > 3 || playerBody.velocity.y < -1) && 
              playerBody.position.y < playerBody.currentSpike?.position.y - 20) {
            console.log('Player explicitly left spike');
            playerBody.isTouchingSpike = false;
            playerBody.currentSpike = null;
          } else {
            // If physics engine tries to separate them but player is still on spike, maintain spike contact
            console.log('Maintain spike contact state');
          }
        }
      });
    };
    
    Matter.Events.on(engine, 'collisionStart', collisionStartHandler);
    Matter.Events.on(engine, 'collisionEnd', collisionEndHandler);
    
    return () => {
      Matter.Events.off(engine, 'collisionStart', collisionStartHandler);
      Matter.Events.off(engine, 'collisionEnd', collisionEndHandler);
    };
  }, [lastDamageTime, gameOver, score]);

  useEffect(() => {
    if (lives <= 0 && !gameOver) {
      setGameOver(true);
    }
  }, [lives, gameOver]);

  const movePlayer = (direction) => {
    if (!entities || !entities.player1 || !entities.player1.body || gameOver) return;
    
    const playerBody = entities.player1.body;
    const stepSize = 15;

    // Fix long press movement keys, set position and give speed
    Matter.Body.setPosition(playerBody, {
      x: playerBody.position.x + (direction * stepSize),
      y: playerBody.position.y
    });
      
    Matter.Body.setVelocity(playerBody, {
      x: direction * 2,
      y: playerBody.velocity.y
    });
  };

  // Add fireball
  useEffect(() => {
    if (!entities || !entities.physics) return;
    
    const world = entities.physics.world;
    const fireballRadius = 15;
    const fireballY = 60;  // Put above screen
    
    // Create fireball
    const fireball = Matter.Bodies.circle(
      width / 2, 
      fireballY, 
      fireballRadius, 
      { 
        isStatic: true, 
        isSensor: true,
        label: 'fireball',
        render: { fillStyle: '#ff4500' }
      }
    );
    
    Matter.World.add(world, [fireball]);
    
    // Update entities
    setEntities(prevEntities => ({
      ...prevEntities,
      fireball: { body: fireball, size: [fireballRadius*2, fireballRadius*2], color: 'orange', renderer: 'circle' }
    }));
    
  }, [entities?.physics]);

  // Add continuous monitoring mechanism to prevent player from penetrating treadmill
  useEffect(() => {
    if (!entities || !entities.player1 || !entities.player1.body) return;
    
    const playerBody = entities.player1.body;
    const checkInterval = setInterval(() => {
      // Check if player is standing on treadmill
      if (playerBody.isTouchingTreadmill && playerBody.currentTreadmill) {
        const treadmill = playerBody.currentTreadmill;
        if (treadmill) {
          // Calculate player's relative position to treadmill
          const treadmillTop = treadmill.bounds.min.y;
          const playerBottom = playerBody.bounds.max.y;
          const relativePosition = playerBottom - treadmillTop;
          
          // If relative position indicates possible penetration or slide, adjust position
          if (relativePosition > 5 || playerBody.velocity.y > 0) {
            console.log("Prevent penetration: Re-position player to treadmill");
            
            Matter.Body.setPosition(playerBody, {
              x: playerBody.position.x,
              y: treadmillTop - (playerBody.bounds.max.y - playerBody.bounds.min.y) / 2 - 2
            });
            
            Matter.Body.setVelocity(playerBody, {
              x: playerBody.velocity.x,
              y: 0
            });
          }
        }
      }
    }, 50); // Check every 50ms
    
    return () => clearInterval(checkInterval);
  }, [entities]);

  // Modify treadmill effect handling, enhance push force
  const handleTreadmillEffect = (playerBody, treadmill, speed) => {
    // Use direct speed setting to ensure obvious push force effect
    Matter.Body.setVelocity(playerBody, {
      x: playerBody.velocity.x + speed * 0.3, // Significantly increase effect strength, ensure feeling push force
      y: 0 // Ensure vertical speed is 0 to prevent penetration
    });
    
    // Ensure player position only adjusted when necessary
    const treadmillTop = treadmill.bounds.min.y;
    const playerBottom = playerBody.bounds.max.y;
    const playerHeight = playerBody.bounds.max.y - playerBody.bounds.min.y;
    
    // Only adjust position when player visibly slides or penetrates
    if (playerBottom - treadmillTop > 3) {
      Matter.Body.setPosition(playerBody, {
        x: playerBody.position.x,
        y: treadmillTop - playerHeight / 2 - 2
      });
    }
  };

  // 首先在組件頂部，添加一個重新開始遊戲的函數
  const restartGame = () => {
    // 重置遊戲狀態
    setLives(10);
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setLastDamageTime(0);
    
    // 清除所有引用
    platformsRef.current = {};
    scrollPositionRef.current = 0;
    lowestPlatformRef.current = 0;
    lastScoreUpdateRef.current = Date.now();
    lastFireballSpawnRef.current = 0;
    fireballsRef.current = {};
    
    // 重新初始化遊戲引擎和實體
    const engine = Matter.Engine.create({ 
      enableSleeping: false
    });
    
    // 設置物理世界參數
    engine.gravity.scale = 0.01;
    engine.gravity.y = 1;
    
    engineRef.current = engine;
    
    if (!engine) {
      console.error('Engine creation failed!');
      return;
    }
    
    const world = engine.world;
    
    // 初始化平台和玩家
    platformsRef.current = {};
    scrollPositionRef.current = 0;
    
    // 創建邊界
    const boundaries = createBoundaries(world);
    
    // 創建初始實體
    const initialEntities = { 
      physics: { engine, world },
      ...boundaries
    };
    
    // 確保第一個平台在玩家上方並且足夠寬
    const firstPlatformY = height * 0.3;
    const firstPlatform = createPlatform(world, width / 2, firstPlatformY);
    const firstPlatformId = 'platform_initial';
    platformsRef.current[firstPlatformId] = firstPlatform;
    initialEntities[firstPlatformId] = firstPlatform;
    
    // 創建更多初始平台，確保四種類型都存在
    let lastY = firstPlatformY;
    lowestPlatformRef.current = lastY;
    
    // 在初始階段強制創建四種不同類型的平台
    const forcedTypes = ['platform', 'treadmill', 'spring', 'spike'];
    
    // 首先確保每種類型至少存在一次
    for (let i = 0; i < forcedTypes.length; i++) {
      const previousY = lastY;
      lastY += (PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN));
      
      if (i > 0 && lastY - previousY < 100) {
        lastY = previousY + 100;
      }
      
      let platform;
      const x = Math.random() * (width - PLATFORM_WIDTH) + PLATFORM_WIDTH / 2;
      
      switch (forcedTypes[i]) {
        case 'treadmill':
          const direction = Math.random() < 0.5 ? -2 : 2;
          platform = createTreadmill(world, x, lastY, direction);
          break;
        case 'spring':
          platform = createSpring(world, x, lastY);
          break;
        case 'spike':
          platform = createSpike(world, x, lastY);
          break;
        default: // 'platform'
          platform = createPlatform(world, x, lastY);
      }
      
      const platformId = `platform_${forcedTypes[i]}_${i}`;
      platformsRef.current[platformId] = platform;
      initialEntities[platformId] = platform;
      lowestPlatformRef.current = lastY;
    }
    
    // 創建更多隨機平台
    for (let i = 0; i < INITIAL_PLATFORMS - forcedTypes.length; i++) {
      lastY += (PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN));
      const platformEntities = createRandomPlatform(world, lastY, true);
      Object.assign(initialEntities, platformEntities);
      lowestPlatformRef.current = lastY;
    }
    
    // 在第一個平台上方創建玩家
    const player = createPlayer(world, width / 2, firstPlatformY - 50, selectedPlayer);
    player.body.mass = player.body.mass * 3;
    initialEntities.player1 = player;

    setEntities(initialEntities);
    
    console.log('Game restarted!');
  };

  if (!entities) return null;

  return (
    <ImageBackground 
      source={require('../../assets/img/Bg2.png')}
      style={styles.background}
    >
      {/* 不再需要額外的Devil Horns UI元素，因為現在邊界已經使用了Devil Head圖像 */}
      
      <GameEngine 
        ref={gameEngineRef}
        style={styles.gameContainer}
        systems={[Physics]}
        entities={entities}
        running={!gameOver && !isPaused}
      >
        <View style={styles.statsContainer}>
          <View style={styles.statsLeft}>
            <Text style={styles.livesText}>Lives: {lives}</Text>
            <Text style={styles.scoreText}>Score: {score}</Text>
          </View>
          <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
            <Text style={styles.pauseButtonText}>{isPaused ? '▶' : '❚❚'}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => movePlayer(-1)}
            onPressIn={() => setIsHoldingLeft(true)}
            onPressOut={() => setIsHoldingLeft(false)}
          >
            <Text style={styles.controlText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => movePlayer(1)}
            onPressIn={() => setIsHoldingRight(true)}
            onPressOut={() => setIsHoldingRight(false)}
          >
            <Text style={styles.controlText}>→</Text>
          </TouchableOpacity>
        </View>
      </GameEngine>
      
      {/* 遊戲結束畫面 */}
      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>Game Over</Text>
          <Text style={styles.finalScoreText}>Your Score: {score}</Text>
          <View style={styles.gameOverButtons}>
            <TouchableOpacity style={styles.restartButton} onPress={restartGame}>
              <Text style={styles.buttonText}>Restart</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => navigation.navigate('MainScreen')}
            >
              <Text style={styles.buttonText}>Main Menu</Text>
            </TouchableOpacity>
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
  gameContainer: {
    flex: 1,
    zIndex: 1,
  },
  statsContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width - 40, // Subtract left and right 20 padding
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  livesText: {
    fontSize: 20,
    color: '#ffff00',
    marginRight: 20,
  },
  scoreText: {
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
  pauseButton: {
    padding: 8,
    backgroundColor: 'transparent',
  },
  pauseButtonText: {
    fontSize: 24,
    color: '#ffff00',
  },
  gameOverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  gameOverText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  finalScoreText: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 30,
  },
  gameOverButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 250,
  },
  restartButton: {
    backgroundColor: '#008800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  menuButton: {
    backgroundColor: '#880000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#ff0000',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});