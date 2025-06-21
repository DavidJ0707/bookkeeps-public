import React from 'react';
import { Svg, Defs, LinearGradient, Stop, Path } from 'react-native-svg';

const GradientIcon = ({ name, size, colors }) => {
  const icons = {
    "keyboard-backspace": "M20,11H7.83l5.59-5.59L12,4l-8,8l8,8l1.41-1.41L7.83,13H20V11z",
    "account": "M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,3a3,3,0,1,1-3,3A3,3,0,0,1,12,5Zm0,14.2A7.19,7.19,0,0,1,5.31,16c.06-2.06,4.13-3.2,6.69-3.2s6.63,1.14,6.69,3.2A7.19,7.19,0,0,1,12,19.2Z",
    "calendar": "M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM19 20H5V9h14v11zM7 11h5v5H7z",
    "compass": "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-4.01-.49-7.17-3.88-7.44-7.93H9v2h4v-2h2.93c-.27 4.05-3.43 7.44-7.44 7.93zm6.44-4.24l-4.06-1.45L11 12.62 9.62 14.24 7 16.69l1.45-4.06 1.62-1.62 1.62-1.62 4.06 1.45-1.45 4.06z",
    "magnify": "M15.5,14h-.79l-.28-.27A6.471,6.471,0,0,0,16,9.5,6.5,6.5,0,1,0,9.5,16a6.471,6.471,0,0,0,4.23-1.57l.27.28v.79L20,20.49,20.49,20l-4.99-4.99M9.5,14A4.5,4.5,0,1,1,14,9.5,4.5,4.5,0,0,1,9.5,14Z",
    "message-text": "M20 2H4a2 2 0 00-2 2v16l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm-2 10H6V9h12v3zm0-4H6V5h12v3z"
    // Add more icons as needed
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          {colors.map((color, index) => (
            <Stop key={index} offset={`${index / (colors.length - 1)}`} stopColor={color} />
          ))}
        </LinearGradient>
      </Defs>
      <Path d={icons[name]} fill="url(#grad)" />
    </Svg>
  );
};

export default GradientIcon;
