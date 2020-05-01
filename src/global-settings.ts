export default {
  sphere: {
    radius: 1.0,
    color: 0xffffff,
    opacity: 0.2
  },
  vertex: {
    size: 0.02,
    color: 0x004080,
    glowColor: 0xff0000
  },
  layers: {
    /* Seperate Mesh objects into different layers so it will be easier to filter Raycaster intersection */
    sphere: 2,
    vertex: 3
  }
  // INTERSECTION_LAYER: 2
};
