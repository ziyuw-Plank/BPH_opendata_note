(function() {
  if (!window.requestAnimationFrame) return;

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = cb;
    s.onerror = function() { console.warn('Three.js CDN load failed, skipping WebGL background.'); };
    document.head.appendChild(s);
  }

  var THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

  loadScript(THREE_CDN, function() {
    init();
  });

  function init() {
    var canvas = document.createElement('canvas');
    canvas.id = 'webgl-bg-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
    document.body.prepend(canvas);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    var PARTICLE_COUNT = 120;
    var CONNECT_DIST = 8;
    var MOUSE_RADIUS = 10;
    var mouse = new THREE.Vector2(9999, 9999);
    var mouse3D = new THREE.Vector3(9999, 9999, 0);
    var clock = new THREE.Clock();

    var mouseOnCanvas = false;
    document.addEventListener('mousemove', function(e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouse3D.x = (e.clientX / window.innerWidth) * 40 - 20;
      mouse3D.y = -(e.clientY / window.innerHeight) * 30 + 15;
      mouseOnCanvas = true;

      clearTimeout(mouse._timeout);
      mouse._timeout = setTimeout(function() { mouseOnCanvas = false; }, 3000);
    });

    var raycaster = new THREE.Raycaster();
    var mouseNDC = new THREE.Vector2();

    function toScreenPos(vec3) {
      var v = vec3.clone().project(camera);
      return { x: (v.x + 1) / 2 * window.innerWidth, y: (-v.y + 1) / 2 * window.innerHeight };
    }

    var palette = [
      new THREE.Color('#667eea'),
      new THREE.Color('#764ba2'),
      new THREE.Color('#f093fb'),
      new THREE.Color('#f5576c'),
      new THREE.Color('#4facfe'),
      new THREE.Color('#00f2fe'),
      new THREE.Color('#43e97b'),
      new THREE.Color('#38f9d7')
    ];

    var particleGeo = new THREE.SphereGeometry(0.08, 8, 8);
    var positions = [];
    var velocities = [];
    var basePositions = [];
    var particles = [];
    var lineMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: palette[0] },
        uColor2: { value: palette[4] },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec2 vUv;',
        'uniform vec3 uColor1;',
        'uniform vec3 uColor2;',
        'void main() {',
        '  float alpha = smoothstep(0.3, 0.0, length(vUv - 0.5) * 2.0);',
        '  vec3 col = mix(uColor1, uColor2, vUv.x);',
        '  gl_FragColor = vec4(col, alpha * 0.6);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false
    });

    var particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: palette[0] }
      },
      vertexShader: [
        'varying float vAlpha;',
        'void main() {',
        '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = 6.0 * (300.0 / -mvPosition.z);',
        '  gl_Position = projectionMatrix * mvPosition;',
        '  vAlpha = 1.0 - abs(position.z) / 25.0;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying float vAlpha;',
        'uniform vec3 uColor;',
        'void main() {',
        '  float d = length(gl_PointCoord - 0.5) * 2.0;',
        '  float alpha = smoothstep(1.0, 0.2, d) * vAlpha * 0.8;',
        '  gl_FragColor = vec4(uColor, alpha);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false
    });

    var group = new THREE.Group();

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var mesh = new THREE.Mesh(particleGeo, particleMaterial.clone());
      var x = (Math.random() - 0.5) * 40;
      var y = (Math.random() - 0.5) * 30;
      var z = (Math.random() - 0.5) * 20;

      mesh.position.set(x, y, z);
      mesh.userData = {
        basePos: mesh.position.clone(),
        velocity: new THREE.Vector3(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.5,
        amplitude: 0.3 + Math.random() * 1.5,
        colorIndex: Math.floor(Math.random() * palette.length)
      };
      mesh.material.uniforms.uColor.value = palette[mesh.userData.colorIndex];
      group.add(mesh);
      particles.push(mesh);
      positions.push(mesh.position);
      basePositions.push(mesh.userData.basePos.clone());
    }

    scene.add(group);

    var linesGroup = new THREE.Group();
    var MAX_LINES = 300;
    var linePool = [];

    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));

    for (var l = 0; l < MAX_LINES; l++) {
      var mat = lineMaterial.clone();
      var line = new THREE.Line(lineGeo.clone(), mat);
      line.visible = false;
      line.userData = { a: -1, b: -1 };
      linesGroup.add(line);
      linePool.push(line);
    }

    scene.add(linesGroup);

    var fogColor = document.documentElement.getAttribute('data-color-scheme') === 'dark'
      ? new THREE.Color('#1a1a2e')
      : new THREE.Color('#f8f9fa');

    scene.fog = new THREE.FogExp2(fogColor, 0.0008);

    function updateFog() {
      var isDark = document.documentElement.getAttribute('data-color-scheme') === 'dark';
      scene.fog.color.set(isDark ? '#1a1a2e' : '#f8f9fa');
    }

    var observer = new MutationObserver(updateFog);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-scheme'] });

    function updateLines(time) {
      for (var i = 0; i < MAX_LINES; i++) {
        linePool[i].visible = false;
      }

      var lineIdx = 0;

      for (var i = 0; i < PARTICLE_COUNT; i++) {
        for (var j = i + 1; j < PARTICLE_COUNT; j++) {
          if (lineIdx >= MAX_LINES) break;
          var dist = positions[i].distanceTo(positions[j]);
          if (dist < CONNECT_DIST) {
            var line = linePool[lineIdx];
            var pos = line.geometry.attributes.position;
            pos.setXYZ(0, positions[i].x, positions[i].y, positions[i].z);
            pos.setXYZ(1, positions[j].x, positions[j].y, positions[j].z);
            pos.needsUpdate = true;

            var alpha = 1 - dist / CONNECT_DIST;
            line.material.uniforms.uTime.value = time;
            line.material.uniforms.uColor1.value = palette[particles[i].userData.colorIndex];
            line.material.uniforms.uColor2.value = palette[particles[j].userData.colorIndex];
            line.material.opacity = alpha * 0.35;
            line.visible = true;
            lineIdx++;
          }
        }
      }
    }

    function animate() {
      requestAnimationFrame(animate);

      var time = clock.getElapsedTime();
      var dt = Math.min(time - (animate._lastTime || time), 0.1);
      animate._lastTime = time;

      for (var i = 0; i < PARTICLE_COUNT; i++) {
        var p = particles[i];
        var base = p.userData.basePos;

        p.userData.phase += p.userData.speed * dt;
        var phase = p.userData.phase;

        var waveX = Math.sin(phase * 0.7) * p.userData.amplitude;
        var waveY = Math.cos(phase * 0.5) * p.userData.amplitude;
        var waveZ = Math.sin(phase * 0.6 + 1) * p.userData.amplitude * 0.7;

        var targetX = base.x + waveX;
        var targetY = base.y + waveY;
        var targetZ = base.z + waveZ;

        if (mouseOnCanvas) {
          var dist = new THREE.Vector3(targetX, targetY, targetZ).distanceTo(mouse3D);
          if (dist < MOUSE_RADIUS) {
            var force = (1 - dist / MOUSE_RADIUS) * 4;
            targetX += (mouse3D.x - targetX) * force * 0.02;
            targetY += (mouse3D.y - targetY) * force * 0.02;
          }
        }

        var dx = targetX - p.position.x;
        var dy = targetY - p.position.y;
        var dz = targetZ - p.position.z;

        p.position.x += dx * 0.04;
        p.position.y += dy * 0.04;
        p.position.z += dz * 0.04;

        positions[i] = p.position.clone();

        p.rotation.x += 0.005 * dt;
        p.rotation.y += 0.008 * dt;
      }

      group.rotation.y += 0.0003 * dt;
      group.rotation.x += 0.0001 * dt;

      updateLines(time);

      var lua = linesGroup.children[0].material.uniforms;
      if (lua && lua.uTime) lua.uTime.value = time;

      renderer.render(scene, camera);
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onResize);
    animate._lastTime = 0;
    animate();
  }
})();
