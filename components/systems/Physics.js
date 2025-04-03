import Matter, { Sleeping } from "matter-js";
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Constants for player movement
const PLAYER_SPEED = 15;
const PLAYER_JUMP_FORCE = -16;
const MAX_HORIZONTAL_SPEED = 8;

const Physics = {
  // Main physics system
  update: (entities, { touches, dispatch, events, time }) => {
    // Check if entities and physics engine exist
    if (!entities || !entities.physics || !entities.physics.engine) {
      return entities;
    }

    let engine = entities.physics.engine;
    
    // Handle jump events
    if (events && events.length) {
      for (let i = 0; i < events.length; i++) {
        if (events[i].type === "jump" && entities.player1 && entities.player1.body) {
          Matter.Body.setVelocity(entities.player1.body, { 
            x: entities.player1.body.velocity.x, 
            y: PLAYER_JUMP_FORCE 
          });
        }
      }
    }

    // Handle movement events
    if (events && events.length) {
      for (let i = 0; i < events.length; i++) {
        if (events[i].type === "move" && entities.player1 && entities.player1.body) {
          const direction = events[i].direction;
          Matter.Body.setVelocity(entities.player1.body, { 
            x: direction * PLAYER_SPEED, 
            y: entities.player1.body.velocity.y 
          });
        }
      }
    }

    // Handle swipe movement
    if (events && events.length) {
      for (let i = 0; i < events.length; i++) {
        if (events[i].type === "swipe" && entities.player1 && entities.player1.body) {
          const gestureState = events[i].gestureState;
          if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
            const direction = gestureState.dx > 0 ? 1 : -1;
            Matter.Body.setVelocity(entities.player1.body, { 
              x: direction * PLAYER_SPEED, 
              y: entities.player1.body.velocity.y 
            });
          }
        }
      }
    }

    // Handle stop movement events
    if (events && events.length) {
      for (let i = 0; i < events.length; i++) {
        if (events[i].type === "stop" && entities.player1 && entities.player1.body) {
          Matter.Body.setVelocity(entities.player1.body, { 
            x: 0, 
            y: entities.player1.body.velocity.y 
          });
        }
      }
    }

    // Update head movement (bounce off walls)
    Object.entries(entities).forEach(([key, entity]) => {
      if (key.startsWith('head_')) {
        const head = entity.body;
        const direction = entity.direction;
        
        // Check if head hits screen boundaries
        if (head.position.x <= 20 || head.position.x >= width - 20) {
          // Reverse direction and add slight vertical movement
          Matter.Body.setVelocity(head, { 
            x: -direction * 8,
            y: head.velocity.y + 1
          });
          entity.direction = -direction;
        }
      }
    });

    // Ensure delta is within reasonable limits
    const delta = Math.min(time.delta, 16.667);
    Matter.Engine.update(engine, delta);
    return entities;
  },

  // Setup collision handler
  setupCollisionHandler: (engine, onLifeChange) => {
    if (!engine) return () => {};

    Matter.Events.on(engine, "collisionStart", (event) => {
      const pairs = event.pairs;
      if (!pairs || !pairs[0]) return;

      const objA = pairs[0].bodyA;
      const objB = pairs[0].bodyB;
      const objALabel = pairs[0].bodyA.label;
      const objBLabel = pairs[0].bodyB.label;

      // Only process player collisions
      if (objALabel !== "player" && objBLabel !== "player") return;

      const player = objALabel === "player" ? objA : objB;
      const obstacle = objALabel === "player" ? objB : objA;
      const obstacleLabel = objALabel === "player" ? objBLabel : objALabel;

      // Calculate collision angle
      const collisionAngle = Math.atan2(
        player.position.y - obstacle.position.y,
        player.position.x - obstacle.position.x
      );

      // Convert angle to degrees and normalize to 0-360
      let angle = (collisionAngle * 180) / Math.PI;
      if (angle < 0) angle += 360;

      // Only process collisions where player is landing on top (angle between 135 and 225 degrees)
      if (angle >= 135 && angle <= 225) {
        // Spring collision - gain 1 life (max 10)
        if (obstacleLabel === "spring") {
          Matter.Body.setVelocity(player, { 
            x: player.velocity.x, 
            y: PLAYER_JUMP_FORCE * 2 
          });
          onLifeChange(1);
        }

        // Spike collision - lose 2 lives
        if (obstacleLabel === "spike") {
          onLifeChange(-2);
        }

        // Treadmill collision - gain 1 life and increase speed
        if (obstacleLabel === "treadmill") {
          const treadmill = obstacle;
          Matter.Body.setVelocity(player, { 
            x: player.velocity.x + (treadmill.velocity.x * 1.5), 
            y: player.velocity.y 
          });
          onLifeChange(1);
        }

        // Fireball collision - lose 3 lives
        if (obstacleLabel === "fireball") {
          onLifeChange(-3);
        }

        // Head collision - lose 4 lives
        if (obstacleLabel === "head") {
          onLifeChange(-4);
        }
      }
    });

    return () => {
      Matter.Events.off(engine, "collisionStart");
    };
  }
};

export default Physics; 