(() => {
  const canvas = document.getElementById("netCanvas");
  if(!canvas) return;

  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1;

  // densidade (calculada uma vez; suficiente)
  const base = (window.innerWidth * window.innerHeight) / 42000;
  const N = Math.max(32, Math.min(130, Math.round(base)));

  // pontos
  const pts = Array.from({length:N}, () => ({
    x: 0, y: 0,
    vx: 0, vy: 0
  }));

  // cursor
  let mx = 0, my = 0;

  function seedPoints(){
    for(const p of pts){
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.vx = (Math.random()*2-1) * 0.18 * dpr;
      p.vy = (Math.random()*2-1) * 0.18 * dpr;
    }
    mx = w * 0.5;
    my = h * 0.5;
  }

  function resize(){
    const oldW = w || 1;
    const oldH = h || 1;

    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = canvas.width = Math.floor(window.innerWidth * dpr);
    h = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    // primeira vez
    if(oldW === 1 && oldH === 1 && pts[0].vx === 0 && pts[0].vy === 0){
      seedPoints();
      return;
    }

    // reajuste proporcional
    const sx = w / oldW;
    const sy = h / oldH;
    for(const p of pts){
      p.x *= sx;
      p.y *= sy;
      // velocidade acompanha dpr
      p.vx = Math.sign(p.vx || 1) * Math.abs(p.vx) * (dpr / (window.devicePixelRatio || 1));
      p.vy = Math.sign(p.vy || 1) * Math.abs(p.vy) * (dpr / (window.devicePixelRatio || 1));
    }

    mx = Math.min(mx * sx, w);
    my = Math.min(my * sy, h);
  }

  window.addEventListener("resize", resize);
  resize();

  window.addEventListener("mousemove", (e)=>{
    mx = e.clientX * dpr;
    my = e.clientY * dpr;
  });

  function draw(){
    // fundo com gradiente
    ctx.clearRect(0,0,w,h);
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, Math.max(w,h)*0.8);
    g.addColorStop(0, "rgba(0,255,200,0.06)");
    g.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    // update pontos
    for(const p of pts){
      p.x += p.vx; p.y += p.vy;
      if(p.x < 0 || p.x > w) p.vx *= -1;
      if(p.y < 0 || p.y > h) p.vy *= -1;
    }

    const maxDist = 170 * dpr;
    const maxLinksPerPoint = 10;

    // linhas (limitadas para performance)
    for(let i=0;i<pts.length;i++){
      let links = 0;
      for(let j=i+1;j<pts.length;j++){
        if(links >= maxLinksPerPoint) break;

        const a = pts[i], b = pts[j];
        const dx = a.x-b.x, dy = a.y-b.y;
        const dist = Math.hypot(dx,dy);

        if(dist < maxDist){
          links++;
          const alpha = (1 - dist/maxDist) * 0.30;
          ctx.strokeStyle = `rgba(120,255,214,${alpha})`;
          ctx.lineWidth = 1 * dpr;
          ctx.beginPath();
          ctx.moveTo(a.x,a.y);
          ctx.lineTo(b.x,b.y);
          ctx.stroke();
        }
      }
    }

    // nós (brilho perto do cursor)
    for(const p of pts){
      const md = Math.hypot(p.x-mx, p.y-my);
      const glow = md < 220*dpr ? (1 - md/(220*dpr)) : 0;
      const r = (1.0 + glow*2.2) * dpr;

      ctx.fillStyle = `rgba(120,255,214,${0.35 + glow*0.55})`;
      ctx.beginPath();
      ctx.arc(p.x,p.y,r,0,Math.PI*2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
