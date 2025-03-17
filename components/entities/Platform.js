import Matter from 'matter-js';
import RenderEntity from '../RenderEntity';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const createPlatform = (world, x, y) => {
  const platform = Matter.Bodies.rectangle(
    x, 
    y,
    100,
    20,
    { isStatic: true }
  );

  Matter.World.add(world, platform);

  return {
    body: platform,
    size: [100, 20],
    color: 'grey',
    renderer: RenderEntity,
  };
};

export default createPlatform;