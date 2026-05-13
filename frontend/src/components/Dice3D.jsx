import { memo, useRef, useEffect, useState } from "react";

export const Dice3D = memo(({ face, rolling, size }) => {
  const tz = size / 2;
  const rot = useRef({ x: 0, y: 0 });
  const [trans, setTrans] = useState(`scale(1) translateY(0px) rotateX(0deg) rotateY(0deg)`);

  useEffect(() => {
    if (rolling) {
      rot.current.x += 1080;
      rot.current.y += 1440;
      // Pops up and scales during the roll
      setTrans(`scale(1.5) translateY(-20px) rotateX(${rot.current.x}deg) rotateY(${rot.current.y}deg)`);
    } else {
      let tx = 0, ty = 0;
      switch(face) {
        case 1: tx = 0; ty = 0; break;
        case 6: tx = 180; ty = 0; break;
        case 3: tx = 0; ty = -90; break;
        case 4: tx = 0; ty = 90; break;
        case 5: tx = -90; ty = 0; break;
        case 2: tx = 90; ty = 0; break;
      }
      
      // Strict forward-only rotation math
      const baseXP = Math.floor(rot.current.x / 360) * 360;
      const baseYP = Math.floor(rot.current.y / 360) * 360;
      let nextX = baseXP + tx;
      let nextY = baseYP + ty;
      if (nextX < rot.current.x) nextX += 360;
      if (nextY < rot.current.y) nextY += 360;
      
      rot.current.x = nextX;
      rot.current.y = nextY;
      
      // Slams back down to the board
      setTrans(`scale(1) translateY(0px) rotateX(${nextX}deg) rotateY(${nextY}deg)`);
    }
  }, [face, rolling]);

  const dots = {
    1: [{ x: '42%', y: '42%' }],
    2: [{ x: '20%', y: '20%' }, { x: '64%', y: '64%' }],
    3: [{ x: '20%', y: '20%' }, { x: '42%', y: '42%' }, { x: '64%', y: '64%' }],
    4: [{ x: '20%', y: '20%' }, { x: '64%', y: '20%' }, { x: '20%', y: '64%' }, { x: '64%', y: '64%' }],
    5: [{ x: '20%', y: '20%' }, { x: '64%', y: '20%' }, { x: '42%', y: '42%' }, { x: '20%', y: '64%' }, { x: '64%', y: '64%' }],
    6: [{ x: '20%', y: '12%' }, { x: '64%', y: '12%' }, { x: '20%', y: '42%' }, { x: '64%', y: '42%' }, { x: '20%', y: '72%' }, { x: '64%', y: '72%' }]
  };

  return (
    <div style={{ width: size, height: size, perspective: size * 4 }}>
      <div style={{
        width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d',
        transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: trans
      }}>
        {[
          { f: 1, t: `translateZ(${tz}px)` }, { f: 6, t: `rotateX(180deg) translateZ(${tz}px)` },
          { f: 3, t: `rotateY(90deg) translateZ(${tz}px)` }, { f: 4, t: `rotateY(-90deg) translateZ(${tz}px)` },
          { f: 5, t: `rotateX(90deg) translateZ(${tz}px)` }, { f: 2, t: `rotateX(-90deg) translateZ(${tz}px)` }
        ].map(({ f, t }) => (
          <div key={f} style={{
            position: 'absolute', width: '100%', height: '100%', background: '#fff',
            border: '1.5px solid #D9CDB1', borderRadius: '15%', transform: t, backfaceVisibility: 'hidden',
            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ position: 'absolute', inset: '2px', background: '#FFF8EC', borderRadius: '12%' }}>
              {dots[f].map((pos, i) => (
                <div key={i} style={{
                  position: 'absolute', width: '16%', height: '16%', background: '#1a1f3a', 
                  borderRadius: '50%', left: pos.x, top: pos.y
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
