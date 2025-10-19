let canvas, ctx, w, h, thunder, text, particles, input, thunderAudio, electricAudio;
let audioContext, thunderSource, electricSource, masterGain, thunderGain, electricGain;

function Thunder(options) {
  options = options || {};
  this.lifespan = options.lifespan || Math.round(Math.random() * 10 + 10);
  this.maxlife = this.lifespan;
  this.color = options.color || "#fefefe";
  this.glow = options.glow || "#2323fe";
  this.x = options.x || Math.random() * w;
  this.y = options.y || Math.random() * h;
  this.width = options.width || 2;
  this.direct = options.direct || Math.random() * Math.PI * 2;
  this.max = options.max || Math.round(Math.random() * 10 + 20);
  this.segments = [...new Array(this.max)].map(() => {
    return {
      direct: this.direct + (Math.PI * Math.random() * 0.2 - 0.1),
      length: Math.random() * 20 + 80,
      change: Math.random() * 0.04 - 0.02,
    };
  });

  this.update = function (index, array) {
    this.segments.forEach((s) => {
      (s.direct += s.change) && Math.random() > 0.96 && (s.change *= -1);
    });
    (this.lifespan > 0 && this.lifespan--) || this.remove(index, array);
  };

  this.render = function (ctx) {
    if (this.lifespan <= 0) return;
    
    // Sound now autoplays on load; no per-thunder trigger
    
    ctx.beginPath();
    ctx.globalAlpha = this.lifespan / this.maxlife;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.shadowBlur = 32;
    ctx.shadowColor = this.glow;
    ctx.moveTo(this.x, this.y);
    let prev = { x: this.x, y: this.y };
    this.segments.forEach((s) => {
      const x = prev.x + Math.cos(s.direct) * s.length;
      const y = prev.y + Math.sin(s.direct) * s.length;
      prev = { x: x, y: y };
      ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.closePath();
    ctx.shadowBlur = 0;
    const strength = Math.random() * 80 + 40;
    const light = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      strength
    );
    light.addColorStop(0, "rgba(250, 200, 50, 0.6)");
    light.addColorStop(0.1, "rgba(250, 200, 50, 0.2)");
    light.addColorStop(0.4, "rgba(250, 200, 50, 0.06)");
    light.addColorStop(0.65, "rgba(250, 200, 50, 0.01)");
    light.addColorStop(0.8, "rgba(250, 200, 50, 0)");
    ctx.beginPath();
    ctx.fillStyle = light;
    ctx.arc(this.x, this.y, strength, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  };

  this.remove = function (index, array) {
    array.splice(index, 1);
  };
}

function Spark(options) {
  options = options || {};
  this.x = options.x || w * 0.5;
  this.y = options.y || h * 0.5;
  this.v = options.v || {
    direct: Math.random() * Math.PI * 2,
    weight: Math.random() * 14 + 2,
    friction: 0.88,
  };
  this.a = options.a || {
    change: Math.random() * 0.4 - 0.2,
    min: this.v.direct - Math.PI * 0.4,
    max: this.v.direct + Math.PI * 0.4,
  };
  this.g = options.g || {
    direct: Math.PI * 0.5 + (Math.random() * 0.4 - 0.2),
    weight: Math.random() * 10.25 + 10.25,
  };
  this.width = options.width || Math.random() * 3;
  this.lifespan = options.lifespan || Math.round(Math.random() * 20 + 40);
  this.maxlife = this.lifespan;
  this.color = options.color || "#feca32";
  this.prev = { x: this.x, y: this.y };

  this.update = function (index, array) {
    this.prev = { x: this.x, y: this.y };
    this.x += Math.cos(this.v.direct) * this.v.weight;
    this.x += Math.cos(this.g.direct) * this.g.weight;
    this.y += Math.sin(this.v.direct) * this.v.weight;
    this.y += Math.sin(this.g.direct) * this.g.weight;
    this.v.weight > 0.2 && (this.v.weight *= this.v.friction);
    this.v.direct += this.a.change;
    (this.v.direct > this.a.max || this.v.direct < this.a.min) &&
      (this.a.change *= -1);
    this.lifespan > 0 && this.lifespan--;
    this.lifespan <= 0 && this.remove(index, array);
  };

  this.render = function (ctx) {
    if (this.lifespan <= 0) return;
    
    ctx.beginPath();
    ctx.globalAlpha = this.lifespan / this.maxlife;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.prev.x, this.prev.y);
    ctx.stroke();
    ctx.closePath();
  };

  this.remove = function (index, array) {
    array.splice(index, 1);
  };
}

function Particles(options) {
  options = options || {};
  this.max = options.max || Math.round(Math.random() * 10 + 10);
  this.sparks = [...new Array(this.max)].map(() => new Spark(options));
  this.hasPlayedSound = false;

  this.update = function () {
    this.sparks.forEach((s, i) => s.update(i, this.sparks));
  };

  this.render = function (ctx) {
    // Sound now autoplays on load; no per-particle trigger
    this.sparks.forEach((s) => s.render(ctx));
  };
}

function Text(options) {
  options = options || {};
  const pool = document.createElement("canvas");
  const buffer = pool.getContext("2d");
  pool.width = w;
  buffer.fillStyle = "#000000";
  buffer.fillRect(0, 0, pool.width, pool.height);

  // Responsive font size based on screen width
  let baseSize = 100;
  if (w <= 320) baseSize = 30;
  else if (w <= 480) baseSize = 40;
  else if (w <= 768) baseSize = 60;
  else if (w <= 1024) baseSize = 80;
  
  this.size = options.size || baseSize;
  this.copy = (options.copy || `lodu kuch toh likh le`) + " ";
  this.color = options.color || "#cd96fe";
  this.delay = options.delay || 1;
  this.basedelay = this.delay;
  buffer.font = `${this.size}px Comic Sans MS`;
  this.bound = buffer.measureText(this.copy);
  this.bound.height = this.size * 1.5;
  this.x = options.x || w * 0.5 - this.bound.width * 0.5;
  this.y = options.y || h * 0.5 - this.size * 0.5;

  buffer.strokeStyle = this.color;
  buffer.strokeText(this.copy, 0, this.bound.height * 0.8);
  this.data = buffer.getImageData(0, 0, this.bound.width, this.bound.height);
  this.index = 0;

  this.update = function () {
    if (this.index >= this.bound.width) {
      this.index = 0;
      return;
    }
    const data = this.data.data;
    for (let i = this.index * 4; i < data.length; i += 4 * this.data.width) {
      const bitmap = data[i] + data[i + 1] + data[i + 2] + data[i + 3];
      if (bitmap > 255 && Math.random() > 0.96) {
        const x = this.x + this.index;
        const y = this.y + i / this.bound.width / 4;
        thunder.push(
          new Thunder({
            x: x,
            y: y,
          })
        );

        Math.random() > 0.3 &&
          particles.push(
            new Particles({
              x: x,
              y: y,
            })
          );
      }
    }
    if (this.delay-- < 0) {
      this.index++;
      this.delay += this.basedelay;
    }
  };

  this.render = function (ctx) {
    ctx.putImageData(
      this.data,
      this.x,
      this.y,
      0,
      0,
      this.index,
      this.bound.height
    );
  };
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

function update() {
  text.update();
  thunder.forEach((l, i) => l.update(i, thunder));
  particles.forEach((p) => p.update());
}

function render() {
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);
  //
  ctx.globalCompositeOperation = "screen";
  text.render(ctx);
  thunder.forEach((l) => l.render(ctx));
  particles.forEach((p) => p.render(ctx));
}

// Function to handle responsive canvas sizing
function resizeCanvas() {
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  
  // Recreate text with new dimensions
  if (text) {
    text = new Text({
      copy: input.value || "SATWIK ⚡ ",
    });
  }
}

(function () {
  //
  canvas = document.getElementById("canvas");
  input = document.getElementById("input");
  thunderAudio = document.getElementById("thunderAudio");
  electricAudio = document.getElementById("electricAudio");
  ctx = canvas.getContext("2d");
  
  // Initial canvas setup
  resizeCanvas();
  
  thunder = [];
  particles = [];
  
  // Set audio properties
  thunderAudio.volume = 1.0;
  electricAudio.volume = 1.0;
  thunderAudio.loop = true;
  electricAudio.loop = true;
  // Ensure unmuted from the start
  thunderAudio.muted = false;
  electricAudio.muted = false;

  // Web Audio API: create context and boost gains
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioCtx();

    masterGain = audioContext.createGain();
    masterGain.gain.value = 1.0; // master control if needed
    masterGain.connect(audioContext.destination);

    thunderGain = audioContext.createGain();
    electricGain = audioContext.createGain();
    // Boost factors (>1.0 amplifies). Keep moderate to avoid clipping.
    thunderGain.gain.value = 2.0;
    electricGain.gain.value = 2.5;

    thunderSource = audioContext.createMediaElementSource(thunderAudio);
    electricSource = audioContext.createMediaElementSource(electricAudio);

    thunderSource.connect(thunderGain).connect(masterGain);
    electricSource.connect(electricGain).connect(masterGain);

    // Attempt autoplay on load (unmuted as requested; may be blocked by policy)
    const tryPlay = (el) => el.play().catch(() => {});
    tryPlay(thunderAudio);
    tryPlay(electricAudio);

    // Some browsers require a resume after user gesture; attempt resume if suspended
    if (audioContext.state === 'suspended') {
      const resumeOnce = () => {
        audioContext.resume().then(() => {
          thunderAudio.muted = false;
          electricAudio.muted = false;
          thunderAudio.play().catch(() => {});
          electricAudio.play().catch(() => {});
        }).catch(() => {});
        document.removeEventListener('click', resumeOnce);
        document.removeEventListener('touchstart', resumeOnce);
      };
      document.addEventListener('click', resumeOnce, { once: true });
      document.addEventListener('touchstart', resumeOnce, { once: true });
    }
  } catch (e) {
    // Fallback: still try autoplay via media elements
    thunderAudio.play().catch(() => {});
    electricAudio.play().catch(() => {});
  }

  // Helper to ensure audio resumes after a user gesture, without any popup
  const ensureAudio = async () => {
    try {
      if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      thunderAudio.muted = false;
      electricAudio.muted = false;
      await thunderAudio.play().catch(() => {});
      await electricAudio.play().catch(() => {});
    } catch (_) {}
  };
  // Try again shortly after load if needed (no UI shown)
  setTimeout(() => {
    if (thunderAudio.paused || electricAudio.paused) {
      ensureAudio();
    }
  }, 400);

  // Retry on visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      ensureAudio();
    }
  });
  
  // Handle window resize for responsive design
  window.addEventListener('resize', resizeCanvas);
  
  // Handle orientation change on mobile devices
  window.addEventListener('orientationchange', function() {
    setTimeout(resizeCanvas, 100);
  });
  //
  
  text = new Text({
    copy: "satwik ❤️ ",
  });

  // Handle interaction for visuals only (no audio triggers)
  function handleInteraction(e) {
    let x, y;
    
    if (e.type === 'touchstart' || e.type === 'touchmove') {
      e.preventDefault(); // Prevent scrolling on touch
      const touch = e.touches[0];
      x = touch.clientX;
      y = touch.clientY;
    } else {
      x = e.clientX;
      y = e.clientY;
    }
    
    thunder.push(
      new Thunder({
        x: x,
        y: y,
      })
    );

    particles.push(
      new Particles({
        x: x,
        y: y,
      })
    );
  }

  canvas.addEventListener("click", handleInteraction);
  canvas.addEventListener("touchstart", handleInteraction);
  canvas.addEventListener("touchmove", handleInteraction);
  let cb = 0;
  input.addEventListener("keyup", (e) => {
    clearTimeout(cb);
    cb = setTimeout(() => {
      text = new Text({
        copy: input.value,
      });
    }, 300);
  });
  //
  loop();
})();