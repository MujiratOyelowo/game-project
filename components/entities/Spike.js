import React from 'react';
import { View, Image } from 'react-native';
import Matter from 'matter-js';

const Spike = (world, x, y, options) => {
  const spikeWidth = 100;
  const spikeHeight = 50;
  const spikeBody = Matter.Bodies.rectangle(x, y, spikeWidth, spikeHeight, {
    isStatic: true,
    label: 'spike',
    friction: 0.1,
    restitution: 0.1,
    ...options,
  });

  Matter.World.add(world, spikeBody);

  return {
    body: spikeBody,
    renderer: SpikeRenderer,
  };
};

const SpikeRenderer = (props) => {
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
        source={require('../../assets/img/Spikes.png')}
        style={{
          width: width,
          height: height,
          resizeMode: 'contain', 
        }}
      />
    </View>
  );
};

export default Spike;