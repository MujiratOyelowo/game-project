import Matter from 'matter-js';
import { Dimensions } from 'react-native';
import Boundary from './Boundary';

const { width, height } = Dimensions.get('window');

export default (world) => {
  const segments = [];

  // ---- Top Boundary (horizontal connected segments) ----
  const tileWidth = 30;       // Width of each tile
  const boundaryHeight = 20;  // Height (thickness) for the top boundary tile
  let currentX = tileWidth / 2;  // Center of first tile at half tileWidth
  let previousTopSegment = null;
  
  while (currentX <= width - tileWidth / 2) {
    const segment = Matter.Bodies.rectangle(
      currentX, 
      10,  // Y position near the top edge
      tileWidth, 
      boundaryHeight, 
      { isStatic: true } // dynamic so constraints can work
    );
    Matter.World.add(world, segment);
    segments.push({
      body: segment,
      renderer: (props) => <Boundary {...props} type="top" />,
    });
    
    if (previousTopSegment) {
      const constraint = Matter.Constraint.create({
        bodyA: previousTopSegment,
        bodyB: segment,
        pointA: { x: tileWidth / 2, y: 0 },
        pointB: { x: -tileWidth / 2, y: 0 },
        stiffness: 1,
        length: 0,
      });
      Matter.World.add(world, constraint);
    }
    
    previousTopSegment = segment;
    currentX += tileWidth;
  }

  // ---- Left Boundary (vertical connected segments) ----
  const tileHeight = 20;      // Height of each tile for vertical boundaries
  const boundaryWidth = 20;   // Width of each tile on the side
  let currentY = tileHeight / 2;  // Center of first tile vertically
  let previousLeftSegment = null;
  
  while (currentY <= height - tileHeight / 2) {
    const leftSegment = Matter.Bodies.rectangle(
      10,   // X position near left edge
      currentY, 
      boundaryWidth, 
      tileHeight, 
      { isStatic: true }
    );
    Matter.World.add(world, leftSegment);
    segments.push({
      body: leftSegment,
      renderer: (props) => <Boundary {...props} type="side" />,
    });
    
    if (previousLeftSegment) {
      const constraint = Matter.Constraint.create({
        bodyA: previousLeftSegment,
        bodyB: leftSegment,
        pointA: { x: 0, y: tileHeight / 2 },
        pointB: { x: 0, y: -tileHeight / 2 },
        stiffness: 1,
        length: 0,
      });
      Matter.World.add(world, constraint);
    }
    
    previousLeftSegment = leftSegment;
    currentY += tileHeight;
  }

  // ---- Right Boundary (vertical connected segments) ----
  currentY = tileHeight / 2;
  let previousRightSegment = null;
  
  while (currentY <= height - tileHeight / 2) {
    const rightSegment = Matter.Bodies.rectangle(
      width - 10,   // X position near right edge
      currentY, 
      boundaryWidth, 
      tileHeight, 
      { isStatic: true }
    );
    Matter.World.add(world, rightSegment);
    segments.push({
      body: rightSegment,
      renderer: (props) => <Boundary {...props} type="side" />,
    });
    
    if (previousRightSegment) {
      const constraint = Matter.Constraint.create({
        bodyA: previousRightSegment,
        bodyB: rightSegment,
        pointA: { x: 0, y: tileHeight / 2 },
        pointB: { x: 0, y: -tileHeight / 2 },
        stiffness: 1,
        length: 0,
      });
      Matter.World.add(world, constraint);
    }
    
    previousRightSegment = rightSegment;
    currentY += tileHeight;
  }

  return segments;
};
