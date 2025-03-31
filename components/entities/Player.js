import React from 'react';
import { View, Image } from 'react-native';
import Matter from 'matter-js';

const Player = (world, x, y, selectedPlayer) => {
  const playerWidth = 60;
  const playerHeight = 80;
  const playerBody = Matter.Bodies.rectangle(x, y, playerWidth, playerHeight, {
    frictionAir: 0.001,
    friction: 1,
    restitution: 0,
    density: 0.001,
    inertia: Infinity,
    label: 'player',
  });

  Matter.World.add(world, playerBody);

  return {
    body: playerBody,
    renderer: (props) => PlayerRenderer(props, selectedPlayer),
  };
};

const PlayerRenderer = (props, selectedPlayer) => {
  const width = props.body.bounds.max.x - props.body.bounds.min.x;
  const height = props.body.bounds.max.y - props.body.bounds.min.y;
  const x = props.body.position.x - width / 2;
  const y = props.body.position.y - height / 2;

  // Determine the image based on selectedPlayer
  let playerImageSource;
  switch (selectedPlayer) {
    case 'Player':
      playerImageSource = require('../../assets/img/Player.png');
      break;
    case 'Player2':
      playerImageSource = require('../../assets/img/Player2.png');
      break;
    default:
      playerImageSource = require('../../assets/img/Player.png'); // Default fallback
  }

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
        source={playerImageSource}
        style={{
          width: width,
          height: height,
          resizeMode: 'contain', // Adjust as needed (contain, cover, stretch)
        }}
      />
    </View>
  );
};

export default Player;