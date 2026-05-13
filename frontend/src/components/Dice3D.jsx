import { memo } from "react";

export const Dice3D = memo(({ face, rolling, size }) => {
  const tz = size / 2;
  
  const getTransform = () => {
    if (rolling) return `rotateX(720deg) rotateY(720deg) rotateZ(360deg)`;
    switch(face) {
      case 1: return 'rotateX(0deg) rotateY(0deg)';
      case 6: return 'rotateX(180deg) rotateY(0deg)';
      case 3: return 'rotateX(0deg) rotateY(-90deg)';
      case 4: return 'rotateX(0deg) rotateY(90deg)';
      case 5: return 'rotateX(-90deg) rotateY(0deg)';
      case 2: return 'rotateX(90deg) rotateY(0deg)';
      default: return 'rotateX(0deg) rotateY(0deg)';
    }
  };

  return (
    <div style={{ width: size, height: size, perspective: size * 4 }}>
      <div style={{
        width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d',
        transition: rolling ? 'transform 0.4s linear' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transform: getTransform()
      }}>
        {[
          { f: 1, t: `translateZ(${tz}px)` }, { f: 6, t: `rotateX(180deg) translateZ(${tz}px)` },
          { f: 3, t: `rotateY(90deg) translateZ(${tz}px)` }, { f: 4, t: `rotateY(-90deg) translateZ(${tz}px)` },
          { f: 5, t: `rotateX(90deg) translateZ(${tz}px)` }, { f: 2, t: `rotateX(-90deg) translateZ(${tz}px)` }
        ].map(({ f, t }) => (
          <div key={f} style={{
            position: 'absolute', width: '100%', height: '100%', background: '#fff',
            border: '2px solid #D9CDB1', borderRadius: '15%', display: 'flex',
            justifyContent: 'center', alignItems: 'center', fontSize: size * 0.4,
            fontWeight: 'bold', color: '#1a1f3a', transform: t, backfaceVisibility: 'hidden'
          }}>{f}</div>
        ))}
      </div>
    </div>
  );
});
