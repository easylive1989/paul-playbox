export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 720;

export const BOTTLE = {
  TOP_WIDTH: 40,
  BOTTOM_WIDTH: 60,
  HEIGHT: 160,
  LAYER_HEIGHT: 30,
  MAX_LAYERS: 4,
  OUTLINE_WIDTH: 2,
  NECK_HEIGHT: 20,
} as const;

export const ANIM = {
  LIFT_Y: 40,
  LIFT_MS: 200,
  MOVE_MS: 300,
  TILT_ANGLE: 80,
  TILT_MS: 400,
  POUR_LAYER_MS: 300,
  UNTILT_MS: 300,
  RETURN_MS: 300,
  STREAM_WIDTH: 7,
} as const;
