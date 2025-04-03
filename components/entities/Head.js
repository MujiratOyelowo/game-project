import Matter from 'matter-js';
import { View, Image } from 'react-native';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const createHead = (world, x, y, direction = 1) => {
  const head = Matter.Bodies.rectangle(
    x,
    y,
    40,
    40,
    { 
      isStatic: false,
      label: 'head',
      friction: 0,
      frictionAir: 0.01,
      restitution: 0.3,
      density: 0.001
    }
  );

  // Add initial horizontal velocity based on direction
  Matter.Body.setVelocity(head, { x: direction * 8, y: 0 });

  Matter.World.add(world, head);

  return {
    body: head,
    size: [40, 40],
    renderer: HeadRenderer,
    direction: direction,
  };
};

const HeadRenderer = (props) => {
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
        source={require('../../assets/img/Head.png')}
        style={{
          width: width,
          height: height,
          resizeMode: 'contain',
        }}
      />
    </View>
  );
};

export default createHead; 