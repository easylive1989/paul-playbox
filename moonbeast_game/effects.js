/* Procedural battle VFX inspired by LinearAbiltyCastingThreeJS (MIT).
 * Adapted to the game's dependency-free, non-module Three.js runtime. */
class MoonVFX {
  constructor(scene, roots) {
    this.scene = scene;
    this.roots = roots;
    this.active = [];
    this.clock = 0;
    this.palette = {
      neutral: [0xd9fbff, 0x8debf3], thunder: [0xf7ffff, 0x52d9ff],
      tide: [0xc5fbff, 0x3c9dff], ember: [0xfff1a6, 0xff542e],
      bloom: [0xeaffab, 0x69cc62]
    };
  }

  point(fighter, height = 1.7) {
    const p = new THREE.Vector3();
    this.roots[fighter.side].getWorldPosition(p);
    p.y += height;
    return p;
  }

  material(color, opacity = 1) {
    return new THREE.MeshBasicMaterial({
      color, transparent: true, opacity, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
  }

  track(object, duration, animate) {
    this.scene.add(object);
    return new Promise(resolve => this.active.push({ object, age: 0, duration, animate, resolve }));
  }

  dispose(object) {
    object.traverse?.(node => {
      node.geometry?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach(m => m.dispose());
      else node.material?.dispose?.();
    });
    object.removeFromParent();
  }

  update(dt) {
    this.clock += dt;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const fx = this.active[i];
      fx.age += dt;
      const t = Math.min(1, fx.age / fx.duration);
      fx.animate(t, fx.age);
      if (t >= 1) {
        this.dispose(fx.object);
        fx.resolve();
        this.active.splice(i, 1);
      }
    }
  }

  async cast(attacker, defender, skill) {
    if (skill.cat === 'status') return this.status(attacker, defender, skill);
    const start = this.point(attacker), end = this.point(defender);
    switch (skill.element) {
      case 'thunder': return this.lightning(start, end);
      case 'tide': return this.tide(start, end);
      case 'ember': return this.fireball(start, end);
      case 'bloom': return this.thorns(start, end);
      default: return this.slash(start, end);
    }
  }

  projectile(start, end, color, geometry, duration = .48, trail = true) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(geometry, this.material(color[0]));
    const halo = new THREE.Mesh(geometry.clone(), this.material(color[1], .35));
    halo.scale.setScalar(2.4);
    group.add(halo, core);
    const motes = [];
    if (trail) for (let i = 0; i < 14; i++) {
      const mote = new THREE.Mesh(new THREE.SphereGeometry(.035 + Math.random() * .055, 5, 4), this.material(color[1], .7));
      mote.userData.delay = i / 20;
      group.add(mote); motes.push(mote);
    }
    group.position.copy(start);
    return this.track(group, duration, (t, age) => {
      const travel = 1 - Math.pow(1 - Math.min(1, t * 1.35), 3);
      group.position.lerpVectors(start, end, travel);
      core.rotation.x += .18; core.rotation.y += .25;
      halo.rotation.y -= .12;
      motes.forEach((m, i) => {
        const lag = Math.max(0, travel - m.userData.delay);
        const local = start.clone().lerp(end, lag).sub(group.position);
        m.position.copy(local);
        m.position.y += Math.sin(age * 13 + i) * .12;
        m.material.opacity = (1 - t) * .65;
      });
      if (t > .72) {
        const impact = (t - .72) / .28;
        core.scale.setScalar(1 + impact * 3);
        core.material.opacity = 1 - impact;
        halo.scale.setScalar(2.4 + impact * 5);
        halo.material.opacity = (1 - impact) * .35;
      }
    });
  }

  fireball(start, end) {
    const p = this.projectile(start, end, this.palette.ember, new THREE.IcosahedronGeometry(.22, 1), .58);
    return p;
  }

  tide(start, end) {
    const group = new THREE.Group();
    const direction = end.clone().sub(start), length = direction.length();
    const blade = new THREE.Mesh(new THREE.ConeGeometry(.34, 1.5, 4, 1, true), this.material(this.palette.tide[0], .85));
    blade.rotation.z = -Math.PI / 2;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.42, .045, 6, 24), this.material(this.palette.tide[1], .7));
    ring.rotation.y = Math.PI / 2;
    group.add(blade, ring); group.position.copy(start);
    return this.track(group, .55, (t, age) => {
      const u = 1 - Math.pow(1 - Math.min(1, t * 1.3), 2);
      group.position.copy(start).addScaledVector(direction, u);
      group.position.y += Math.sin(u * Math.PI) * .65;
      group.lookAt(end);
      ring.rotation.z = age * 8;
      group.scale.setScalar(t > .78 ? 1 + (t - .78) * 5 : 1);
      group.children.forEach(x => x.material.opacity *= t > .8 ? .78 : 1);
    });
  }

  lightning(start, end) {
    const group = new THREE.Group(), bolts = [];
    for (let strand = 0; strand < 4; strand++) {
      const points = [];
      for (let i = 0; i <= 18; i++) {
        const t = i / 18, p = start.clone().lerp(end, t);
        const fade = Math.sin(t * Math.PI), seed = strand * 7.31 + i * 2.17;
        p.y += Math.sin(seed * 2.3) * .22 * fade;
        p.z += Math.cos(seed * 1.7) * (.12 + strand * .035) * fade;
        points.push(p);
      }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({
        color: strand ? this.palette.thunder[1] : this.palette.thunder[0], transparent: true,
        opacity: strand ? .58 : 1, blending: THREE.AdditiveBlending, depthWrite: false
      }));
      group.add(line); bolts.push(line);
    }
    return this.track(group, .5, (t, age) => {
      group.visible = Math.floor(age * 34) % 3 !== 1;
      bolts.forEach((line, i) => { line.material.opacity = (i ? .58 : 1) * (1 - Math.max(0, (t - .65) / .35)); });
      group.scale.y = .96 + Math.sin(age * 60) * .04;
    });
  }

  thorns(start, end) {
    const group = new THREE.Group(), count = 13;
    for (let i = 0; i < count; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(.12 + i * .008, .65 + i * .055, 5), this.material(i % 3 ? this.palette.bloom[1] : this.palette.bloom[0], .9));
      spike.position.lerpVectors(start, end, (i + 1) / count);
      spike.position.z += Math.sin(i * 4.7) * .28;
      spike.position.y = .05;
      spike.userData.birth = i / count * .55;
      spike.scale.y = .01;
      group.add(spike);
    }
    return this.track(group, .75, t => group.children.forEach(spike => {
      const u = Math.max(0, Math.min(1, (t - spike.userData.birth) * 4));
      spike.scale.y = Math.sin(u * Math.PI) * 1.25;
      spike.material.opacity = Math.sin(u * Math.PI) * .9;
    }));
  }

  slash(start, end) {
    const group = new THREE.Group();
    const direction = end.clone().sub(start), mid = start.clone().lerp(end, .78);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(.78, .065, 6, 30, Math.PI * 1.25), this.material(this.palette.neutral[0], .9));
    arc.rotation.set(Math.PI / 2, direction.x > 0 ? -.45 : .45, -.55);
    arc.position.copy(mid); group.add(arc);
    return this.track(group, .42, t => {
      const u = Math.sin(t * Math.PI);
      arc.scale.setScalar(.35 + t * 1.4);
      arc.material.opacity = u;
      arc.rotation.z += .16;
    });
  }

  status(attacker, defender, skill) {
    const self = ['shield', 'heal', 'atk', 'arc'].includes(skill.effect?.type);
    const target = this.point(self ? attacker : defender, .15);
    const type = skill.effect?.type;
    const color = type === 'heal' ? this.palette.bloom : type === 'shield' ? this.palette.tide :
      skill.element === 'neutral' ? [0xe4ddff, 0x9e83ff] : this.palette[skill.element];
    const group = new THREE.Group(); group.position.copy(target);
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.7 + i * .23, .035, 5, 36), this.material(color[i % 2], .72));
      ring.rotation.x = Math.PI / 2; ring.userData.phase = i * .18; group.add(ring);
    }
    if (type === 'shield') {
      const shell = new THREE.Mesh(new THREE.SphereGeometry(1.12, 20, 12), this.material(color[0], .14));
      shell.position.y = 1.45; group.add(shell);
    }
    return this.track(group, .7, (t, age) => group.children.forEach((x, i) => {
      x.rotation.z += .025 * (i % 2 ? -1 : 1);
      if (x.geometry.type === 'TorusGeometry') x.position.y = Math.max(0, (t - x.userData.phase) * 2.5);
      x.material.opacity = Math.sin(t * Math.PI) * (x.geometry.type === 'SphereGeometry' ? .22 : .78);
      x.scale.setScalar(.75 + t * .55 + Math.sin(age * 8 + i) * .04);
    }));
  }
}

window.MoonVFX = MoonVFX;
