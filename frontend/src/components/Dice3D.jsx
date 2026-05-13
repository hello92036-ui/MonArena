import { memo, useRef, useEffect, useState } from "react";

export const Dice3D = memo(({ face, rolling, size }) => {
  const tz = size / 2;
  const rot = useRef({ x: 0, y: 0 });
  const [trans, setTrans] = useState(`rotateX(0deg) rotateY(0deg)`);

  useEffect(() => {
    if (rolling) {
      rot.current.x += 720;
      rot.current.y += 1080;
      setTrans(`rotateX(${rot.current.x}deg) rotateY(${rot.current.y}deg)`);
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
      const targetX = tx + Math.floor(rot.current.x / 360) * 360;
      const targetY = ty + Math.floor(rot.current.y / 360) * 360;
      rot.current.x = targetX;
      rot.current.y = targetY;
      setTrans(`rotateX(${targetX}deg) rotateY(${targetY}deg)`);
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
    <div style={{ width: size, height: size, perspective: size * 4, zIndex: 100 }}>
      <div style={{
        width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d',
        transition: 'transform 0.4s ease-out',
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
