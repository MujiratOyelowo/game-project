import Matter from 'matter-js';
import { View, Image } from 'react-native';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const createFireball = (world, x, y) => {
  const fireball = Matter.Bodies.rectangle(
    x,
    y,
    30,
    30,
    { 
      isStatic: false,
      label: 'fireball',
      friction: 0,
      frictionAir: 0.01,
      restitution: 0.3,
      density: 0.001
    }
  );

  // Add initial downward velocity
  Matter.Body.setVelocity(fireball, { x: 0, y: 5 });

  Matter.World.add(world, fireball);

  return {
    body: fireball,
    size: [30, 30],
    renderer: FireballRenderer,
  };
};

const FireballRenderer = (props) => {
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
        source={require('../../assets/img/Fireball.png')}
        style={{
          width: width,
          height: height,
          resizeMode: 'contain',
        }}
      />
    </View>
  );
};

export default createFireball; 