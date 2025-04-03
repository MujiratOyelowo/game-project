import Matter from 'matter-js';
import { View, Image } from 'react-native';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const createSpring = (world, x, y) => {
  const spring = Matter.Bodies.rectangle(
    x,
    y,
    200,
    30,
    { isStatic: true, label: 'spring' }
  );

  Matter.World.add(world, spring);

  return {
    body: spring,
    size: [200, 30],
    renderer: SpringRenderer,
  };
};

const SpringRenderer = (props) => {
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
        source={require('../../assets/img/spring.png')}
        style={{
          width: width * 1.2,
          height: height * 1.2,
          resizeMode: 'contain',
        }}
      />
    </View>
  );
};

export default createSpring;