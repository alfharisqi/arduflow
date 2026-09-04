import { NODE_SPRITE_IMAGE, NODE_SPRITE_MAP, NODE_SPRITE_SHEET } from '../config/nodeSpriteMap.js';

export function NodeSprite({
  name,
  scale = 1,
  maxWidth = 0,
  maxHeight = 0,
  className = '',
  title = '',
}) {
  const sprite = NODE_SPRITE_MAP[name];

  if (!sprite) {
    return (
      <span
        className={`node-sprite node-sprite--missing ${className}`.trim()}
        aria-label={title || name || 'Node ArduFlow'}
      />
    );
  }

  const requestedScale = Number.isFinite(Number(scale)) ? Number(scale) : 1;
  const fitScale = Math.min(
    requestedScale,
    maxWidth ? maxWidth / sprite.width : requestedScale,
    maxHeight ? maxHeight / sprite.height : requestedScale
  );
  const width = sprite.width * fitScale;
  const height = sprite.height * fitScale;

  return (
    <span
      className={`node-sprite ${className}`.trim()}
      role="img"
      aria-label={title || name}
      style={{
        width,
        height,
        backgroundImage: `url(${NODE_SPRITE_IMAGE})`,
        backgroundPosition: `-${sprite.x * fitScale}px -${sprite.y * fitScale}px`,
        backgroundSize: `${NODE_SPRITE_SHEET.width * fitScale}px ${NODE_SPRITE_SHEET.height * fitScale}px`,
      }}
    />
  );
}

export default NodeSprite;
