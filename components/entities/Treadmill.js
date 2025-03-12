import Matter from 'matter-js';
import RenderEntity from '../RenderEntity';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const createTreadmill = (world, x, y, direction = 1) => {
  const treadmill = Matter.Bodies.rectangle(
    x, y, 100, 20,
    { isStatic: true, label: 'treadmill', friction: 0.1 }
  );
  
  Matter.World.add(world, treadmill);
  
  // Get the engine from world
  const engine = world.engine;
  
  if (engine) {
    Matter.Events.on(engine, 'beforeUpdate', () => {
      Matter.Body.translate(treadmill, { x: 0.5 * direction, y: 0 });
    });
  }
  
  return {
    body: treadmill,
    size: [100, 20],
    color: 'yellow',
    renderer: RenderEntity,
  };
};

export default createTreadmill;