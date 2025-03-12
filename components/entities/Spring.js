import Matter from 'matter-js';
import RenderEntity from '../RenderEntity';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const createSpring = (world, x, y) => {
  const spring = Matter.Bodies.rectangle(
    x,
    y,
    100,
    20,
    { isStatic: true, label: 'spring' }
  );

  Matter.World.add(world, spring);

  return {
    body: spring,
    size: [100, 20],
    color: 'green',
    renderer: RenderEntity,
  };
};

export default createSpring;