import React from 'react';
import { Image } from 'react-native';

export default function Boundary(props) {
  const width = props.body.bounds.max.x - props.body.bounds.min.x;
  const height = props.body.bounds.max.y - props.body.bounds.min.y;
  const x = props.body.position.x - width / 2;
  const y = props.body.position.y - height / 2;

  let imageSource;
  if (props.type === 'top') {
    // imageSource = require('../../assets/img/Fireball.png');
  } else if (props.type === 'side') {
    // imageSource = require('../../assets/img/Head.png');
  } else {
    // imageSource = require('../../assets/img/Head.png');
  }

  return (
    <Image
      source={imageSource}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: width,
        height: height,
      }}
      resizeMode="cover"
    />
  );
}
