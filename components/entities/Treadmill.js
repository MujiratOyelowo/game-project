import Matter from 'matter-js';
import { View, Image } from 'react-native';
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
    renderer: TreadmillRenderer,
  };
};

const TreadmillRenderer = (props) => {
  const width = props.body.bounds.max.x - props.body.bounds.min.x;
  const height = props.body.bounds.max.y - props.body.bounds.min.y;
  const x = props.body.position.x - width / 2;
  const y = props.body.position.y - height / 2;

  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: width,
        height: height,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={require('../../assets/img/mill.png')}
        style={{
          width: width,
          height: height,
          resizeMode: 'contain',
        }}
      />
    </View>
  );
};

export default createTreadmill;