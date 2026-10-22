
export function overlaps(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function resolveCollisions(player, platforms, dt) {
  const p = player;
  const oldX = p.previousX;
  const oldY = p.previousY;

  p.onGround = false;

  for (const platform of platforms) {
    if (!overlaps(p, platform)) continue;

    const oldBottom = oldY + p.h;
    const oldRight = oldX + p.w;
    const oldLeft = oldX;
    const oldTop = oldY;

    const horizontalOverlap =
      p.x < platform.x + platform.w &&
      p.x + p.w > platform.x;

    const verticalOverlap =
      p.y < platform.y + platform.h &&
      p.y + p.h > platform.y;

    // Приземление на верхнюю поверхность.
    if (
      p.vy >= 0 &&
      oldBottom <= platform.y + 5 &&
      p.y + p.h >= platform.y &&
      horizontalOverlap
    ) {
      p.y = platform.y - p.h;
      p.vy = 0;
      p.onGround = true;
      continue;
    }

    // Удар головой о нижнюю поверхность.
    if (
      p.vy < 0 &&
      oldTop >= platform.y + platform.h - 5 &&
      p.y <= platform.y + platform.h &&
      horizontalOverlap
    ) {
      p.y = platform.y + platform.h;
      p.vy = 0;
      continue;
    }

    // Боковые столкновения.
    if (!verticalOverlap) continue;

    if (p.vx > 0 && oldRight <= platform.x + 5) {
      p.x = platform.x - p.w;
      p.vx = 0;
    } else if (
      p.vx < 0 &&
      oldLeft >= platform.x + platform.w - 5
    ) {
      p.x = platform.x + platform.w;
      p.vx = 0;
    }
  }

  // Защита от небольшого проникновения в землю из-за округления.
  if (p.y + p.h > p.groundY && p.vy >= 0) {
    p.y = p.groundY - p.h;
    p.vy = 0;
    p.onGround = true;
  }
}
