// components/RenderEntity.js
import React from 'react';
import { View } from 'react-native';

const RenderEntity = ({ body, size, color }) => {
  const { position } = body;
  const width = size[0];
  const height = size[1];
  const x = body.position.x - width / 2;
  const y = body.position.y - height / 2;

  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: width,
        height: height,
        backgroundColor: color,
      }}
    />
  );
};

export default RenderEntity;