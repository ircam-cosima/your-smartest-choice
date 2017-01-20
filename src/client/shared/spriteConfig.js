const spriteConfig = {
  // file: 'images/sprite-875x875.png',
  clipSize: { width: 231, height: 233 }, // 1750 X 1750 - be carefull with image size must be consistent (iOS...)
  // clipSize: { width: 115, height: 117 }, // 875 X 875

  //
  smallSizeRatio: 0.25,
  largeSizeRatio: 0.7,
  minSizeScoreRatio: 0.5,
  // number of frames an image is used during the explosion
  animationRate: 2,

  groups: {
    // blue : {
    //   label: 'blue',
    //   hex: '#4770c4',
    //   clipPositions: [[0, 0], [249, 0], [514, 0], [784, 0], [1047, 0], [1312, 0]]
    // },
    // pink : {
    //   label: 'pink',
    //   hex: '#ff0098',
    //   clipPositions: [[0, 322], [249, 322], [514, 322], [784, 322], [1047, 322], [1312, 322]]
    // },
    // yellow : {
    //   label: 'yellow',
    //   hex: '#d0cf00',
    //   clipPositions: [[0, 645], [249, 645], [514, 645], [784, 645], [1047, 645], [1312, 645]]
    // },
    // red : {
    //   label: 'red',
    //   hex: '#e70300',
    //   clipPositions: [[0, 968], [249, 968], [514, 968], [784, 968], [1047, 968], [1312, 968]]
    // },
    // 875 X 875
    // blue : {
    //   label: 'blue',
    //   hex: '#4770c4',
    //   clipPositions: [[0, 0], [125, 0], [257, 0], [392, 0], [523, 0], [656, 0]]
    // },
    // pink : {
    //   label: 'pink',
    //   hex: '#ff0098',
    //   clipPositions: [[0, 161], [125, 161], [257, 161], [392, 161], [523, 161], [656, 161]]
    // },
    // yellow : {
    //   label: 'yellow',
    //   hex: '#d0cf00',
    //   clipPositions: [[0, 322], [125, 322], [257, 322], [392, 322], [523, 322], [656, 322]]
    // },
    // red : {
    //   label: 'red',
    //   hex: '#e70300',
    //   clipPositions: [[0, 484], [125, 484], [257, 484], [392, 484], [523, 484], [656, 484]]
    // },

    blue : {
      label: 'blue',
      hex: '#4770c4',
      file: 'images/sprite-blue.png',
      clipPositions: [[0, 0], [249, 0], [514, 0], [784, 0], [1047, 0], [1312, 0]]
    },
    pink : {
      label: 'pink',
      hex: '#ff0098',
      file: 'images/sprite-pink.png',
      clipPositions: [[0, 0], [249, 0], [514, 0], [784, 0], [1047, 0], [1312, 0]]
    },
    yellow : {
      label: 'yellow',
      hex: '#d0cf00',
      file: 'images/sprite-yellow.png',
      clipPositions: [[0, 0], [249, 0], [514, 0], [784, 0], [1047, 0], [1312, 0]]
    },
    red : {
      label: 'red',
      hex: '#e70300',
      file: 'images/sprite-red.png',
      clipPositions: [[0, 0], [249, 0], [514, 0], [784, 0], [1047, 0], [1312, 0]]
    },
  },
};

export default spriteConfig;
