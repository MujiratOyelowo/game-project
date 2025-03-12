import { Dimensions } from 'react-native';
import Matter from 'matter-js';
import Boundary from './Boundary';

const { width, height } = Dimensions.get('window');

export default (world) => {
  let leftWall = Matter.Bodies.rectangle(10, height / 2, 20, height, { isStatic: true });
  let rightWall = Matter.Bodies.rectangle(width-10, height / 2, 20, height, { isStatic: true });
  let topWall = Matter.Bodies.rectangle(width / 2, 10, width, 20, { isStatic: true });

  Matter.World.add(world, [leftWall, rightWall, topWall]);

  return {
    leftWall: { body: leftWall, renderer: Boundary },
    rightWall: { body: rightWall, renderer: Boundary },
    topWall: { body: topWall, renderer: Boundary },
  };
};