import Matter from 'matter-js';
import { View, Image } from 'react-native';
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
    renderer: PlatformRenderer,
  };
};

const PlatformRenderer = (props) => {
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
        source={require('../../assets/img/Platform.jpg')}
        style={{
          width: width,
          height: height,
          resizeMode: 'cover',
        }}
      />
    </View>
  );
};

export default createPlatform;