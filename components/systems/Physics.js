import Matter from 'matter-js';

// Physics system
const Physics = (entities, { time }) => {
  const engine = entities.physics?.engine;
  if (!engine) return entities;
  const delta = Math.min(time.delta, 16.667);
  Matter.Engine.update(engine, delta);
  return entities;
};

// Move player left/right
const movePlayer = (entities, direction) => {
  if (!entities || !entities.player1 || !entities.player1.body) return entities;
  const playerBody = entities.player1.body;
  const speed = 5;
  Matter.Body.setVelocity(playerBody, {
    x: direction * speed,
    y: playerBody.velocity.y,
  });
  return entities;
};

// Handle collisions
const setupCollisionHandler = (engine, onCollision) => {
  const collisionHandler = (event) => {
    event.pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair;
      if ((bodyA.label === 'player' && bodyB.label === 'spike') ||
          (bodyA.label === 'spike' && bodyB.label === 'player')) {
        onCollision();
      }
    });
  };
  Matter.Events.on(engine, 'collisionStart', collisionHandler);
  return () => {
    Matter.Events.off(engine, 'collisionStart', collisionHandler);
  };
};

export { Physics, movePlayer, setupCollisionHandler }; 