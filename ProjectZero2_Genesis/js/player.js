'use strict';
/** PLAYER: movement, attack state machine, damage intake and animation selection. */
class Player {
    constructor(id) {
        const d = this.def = CHARS[id];
        this.id = id; this.isPlayer = true;
        this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; this.w = 24; this.h = 60;
        this.facing = 1; this.grounded = false; this.riding = null; this.onWall = 0;
        this.rig = new Rig(d.style); this.rig.owner = this;
        this.state = 'move'; this.t = 0; this.atk = null; this.atkHits = null; this.atkT = 0;
        this.inv = 0; this.jumps = 0; this.coyote = 0; this.jumpBuf = 0; this.atkBuf = 0; this.heavyBuf = 0;
        this.dodgeT = 0; this.dodgeCd = 0; this.airDash = 1; this.dvx = 0; this.dvy = 0;
        this.cds = { s1: 0, s2: 0 }; this.ult = 0; this.hitT = 0; this.charge = 0; this.heavyHeld = 0;
        this.element = 0; this.shotCd = 0; this.cannonAmmo = 0; this.cannonFired = 0;
        this.shield = 0; this.shieldMax = 0; this.shieldT = 0; this.guarding = false; this.guardT = 0;
        this.counterOpen = 0; this.counterHit = false; this.noGrav = false; this.script = null;
        this.safe = { x: 0, y: 0 }; this.lastHurt = 9999; this.dropThrough = 0; this.trail = []; this.stepAcc = 0;
        this.wallSlide = false; this.deathT = 0; this.locked = false; this.onIce = false; this.inWater = false;
        this.stuck = 0; this.aimOverride = null; this.firing = 0; this.defyT = 0; this.interactT = 0; this.cold = 0;
        this.recalc();
        this.hp = this.maxHp; this.energy = this.maxEnergy;
    }
    up(id) { return Save.hasUpgrade(this.id, id); }
    /** Recomputes stats from level, upgrades, relics and Core shards. */
    recalc() {
        const d = this.def, lvl = Save.charData(this.id).level, M = this.mods = { atk: 0, hp: 0, crit: 0, energy: 0, enReg: 0, killHeal: 0, dr: 0, critDmg: 0, cdr: 0, ultGain: 0, dodgeCd: 0, rate: 1 };
        const add = m => { for (const k in m) { if (k === 'rate') M.rate *= m[k]; else M[k] += m[k]; } };
        d.upgrades.forEach(u => { if (u.mod && this.up(u.id)) add(u.mod); });
        Save.data.equipped.forEach(r => { if (r && RELICS[r]) add(RELICS[r].mod); });
        const S = Save.data.shards;
        if (S.r) M.atk += .1; if (S.g) M.killHeal += 2; if (S.b) M.ultGain += .25;
        const ratio = this.maxHp ? this.hp / this.maxHp : 1;
        this.maxHp = Math.round(d.hp * (1 + .07 * (lvl - 1)) * (1 + M.hp) * Game.diff.playerHp);
        this.hp = Math.max(1, Math.round(this.maxHp * ratio));
        this.maxEnergy = d.energy + M.energy; if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
        this.power = d.atk * (1 + .08 * (lvl - 1)) * (1 + M.atk);
        this.critRate = (this.id === 'sable' ? .2 : .08) + M.crit;
        this.critMult = 1.75 + M.critDmg;
    }
    get cx() { return this.x; }
    get cy() { return this.y - this.h / 2; }
    get hurtBox() { return { x: this.x - this.w * .4, y: this.y - this.h * .88, w: this.w * .8, h: this.h * .82 }; }
    pose(p, frames, ease) { this.rig.custom([[0, {}], [1, p, ease]], frames, frames, '_pose'); this.rig.t = 0; this.rig.setPoseHold = true; }

    /** External forces (wind, currents, gravity wells) go through collision like any other movement. */
    push(dx) {
        const n = Math.max(1, Math.ceil(Math.abs(dx) / 8));
        for (let i = 0; i < n; i++) if (!Phys.stepX(this, dx / n, G.level)) break;
    }

    /* ---- aiming ---- */
    aimAngle() {
        if (this.aimOverride !== null) return this.aimOverride;
        if (Settings.autoAim) {
            // As in the original game, auto-aim tracks targets on either side and turns the shooter.
            const t = Combat.nearest(this.x, this.y - 40, 760, 0, true);
            if (t) { const c = t.aim ? t.aim() : { x: t.x, y: t.y - t.h / 2 }; return Math.atan2(c.y - (this.y - 42), c.x - this.x); }
        }
        const up = Input.down('up'), dn = Input.down('down') && !this.grounded;
        const mx = (Input.down('right') ? 1 : 0) - (Input.down('left') ? 1 : 0);
        const ay = up ? -1 : dn ? 1 : 0, ax = mx !== 0 ? mx : ay ? 0 : this.facing;
        return Math.atan2(ay, ax);
    }

    /* ---- main tick ---- */
    update() {
        const d = this.def, locked = this.locked || G.lockInput;
        const In = locked ? { down: () => false, pressed: () => false, released: () => false } : Input;
        this.tickTimers(In);
        if (this.state === 'dead') { this.deadTick(); return; }
        const mx = (In.down('right') ? 1 : 0) - (In.down('left') ? 1 : 0);
        if (In.pressed('jump')) this.jumpBuf = 9;
        if (In.pressed('attack')) this.atkBuf = 12;

        switch (this.state) {
            case 'move': this.moveState(In, mx); break;
            case 'attack': this.attackState(In, mx); break;
            case 'dodge': this.dodgeState(); break;
            case 'skill': this.skillState(mx); break;
            case 'hit': this.vx *= .88; if (--this.hitT <= 0) this.state = 'move'; break;
            case 'charge': this.chargeState(In); break;
        }
        // Physics
        if (!this.noGrav && this.state !== 'dodge') {
            let g = GRAV;
            if (d.hover && !this.grounded && this.vy > 0 && In.down('jump') && this.energy > 0) { g = .12; this.energy -= .12; if (G.time % 3 === 0) VFX.add(this.x, this.y, U.rand(-1, 1), 1.5, ELEMENTS[this.element].col, 16, 8, 1, 0); }
            if (this.wallSlide && this.vy > 0) g = .12;
            this.vy = Math.min(this.vy + g, this.wallSlide ? 3 : this.inWater ? 6 : 16);
        }
        const wasG = this.grounded, vyB = this.vy, g0 = this.y;
        if (this.dropT > 0) { this.dropT--; this.dropThrough = true; } else this.dropThrough = false;
        Phys.move(this);
        if (this.grounded) {
            this.coyote = 7; this.jumps = 0; this.airDash = 1;
            if (!wasG && vyB > 5) { this.onLand(vyB); }
            const t = G.level.tileAt(this.x, this.y + 4);
            if (t !== T.E && this.y < G.level.ph - 40 && !this.riding && !this.inHazard && !G.level.solidAt(this.x, this.y - 30)) { this.safeT = (this.safeT || 0) + 1; if (this.safeT > 12) this.safe = { x: this.x, y: this.y }; }
        } else { this.coyote--; this.safeT = 0; }
        if (this.y > G.level.ph + 80) this.fallOut();
        this.afterMove();
        this.animate(mx);
    }
    tickTimers(In) {
        for (const k of ['s1', 's2']) if (this.cds[k] > 0) this.cds[k] -= 1 + this.mods.cdr;
        if (this.inv > 0) this.inv--; if (this.dodgeCd > 0) this.dodgeCd--; if (this.jumpBuf > 0) this.jumpBuf--; if (this.atkBuf > 0) this.atkBuf--;
        if (this.shotCd > 0) this.shotCd--; if (this.counterOpen > 0) this.counterOpen--; if (this.defyT > 0) this.defyT--; if (this.firing > 0) this.firing--;
        this.lastHurt++;
        const inCombat = G.inCombat();
        this.energy = Math.min(this.maxEnergy, this.energy + (.07 + (inCombat ? 0 : .22)) * (1 + this.mods.enReg));
        if (this.id === 'ysolde' && !inCombat && this.lastHurt > 240 && this.state !== 'dead' && G.time % 30 === 0) this.heal((this.up('y_regen') ? 2 : 1) * Math.ceil(this.maxHp / 100), true);
        if (this.shieldT > 0 && --this.shieldT <= 0) this.shield = 0;
        if (this.cold > 0) this.cold--;
    }
    moveState(In, mx) {
        const d = this.def;
        const sp = d.speed * (this.buff && this.buff.speed > 0 ? 1.3 : 1) * (this.slow > 0 ? .55 : 1) * (this.inWater ? .7 : 1) * (this.sandSlow ? .55 : 1);
        const accel = this.onIce && this.grounded ? .08 : this.grounded ? .9 : .55;
        const target = this.crouching ? 0 : mx * sp;
        this.vx += U.clamp(target - this.vx, -sp * accel, sp * accel);
        if (mx && !(d.gunner && this.firing && Settings.autoAim)) this.facing = mx;
        this.crouching = In.down('down') && this.grounded && !mx;
        // Drop through one-way platforms
        if (In.down('down') && this.jumpBuf > 0 && this.grounded) { this.dropT = 12; this.jumpBuf = 0; this.grounded = false; this.vy = 1; this.y += 3; }
        // Wall slide / jump
        this.wallSlide = !!(d.canWall && !this.grounded && this.onWallDir(mx));
        if (this.jumpBuf > 0) {
            if (this.wallSlide) {
                this.jumpBuf = 0; this.vy = -d.jump * .95; this.vx = -this.facing * 8; this.facing = -this.facing; this.jumps = 1; this.wallSlide = false;
                Sound.sfx('jump'); VFX.dust(this.x, this.y - 20, 4);
            } else if (this.coyote > 0) this.doJump(false);
            else if (this.jumps < 2) this.doJump(true);
        }
        if (!In.down('jump') && this.vy < -5 && !this.noCut) this.vy *= .9;
        if (In.pressed('dodge')) this.tryDodge(mx, In);
        if (this.tryCombat(In)) return;
        if (In.pressed('interact')) G.interact();
    }
    onWallDir(mx) {
        if (!mx) return false;
        const L = G.level, px = this.x + mx * (this.w / 2 + 3);
        return L.solidAt(px, this.y - 30) && L.solidAt(px, this.y - 10);
    }
    doJump(air) {
        const d = this.def;
        this.jumpBuf = 0; this.vy = -d.jump * (air ? .94 : 1); this.jumps = air ? 2 : 1; this.coyote = 0; this.grounded = false; this.riding = null;
        Sound.sfx('jump', { p: air ? 1.25 : 1 });
        if (air) { VFX.ring(this.x, this.y, 34, d.style.col.glow, 14, 4); this.rig.play('djump', 2); this.flipT = 16; } else VFX.dust(this.x, this.y, 5, G.level.theme.dust);
        this.noCut = air;
    }
    tryDodge(mx, In) {
        const D = this.def.dodge;
        if (this.dodgeCd > 0) return false;
        if (!this.grounded && (!D.air || this.airDash <= 0)) return false;
        let dx = mx, dy = 0;
        if (D.eight) { dy = (In.down('down') ? 1 : 0) - (In.down('up') ? 1 : 0); }
        if (!dx && !dy) dx = this.facing;
        const a = Math.atan2(dy, dx);
        this.dvx = Math.cos(a) * D.spd; this.dvy = Math.sin(a) * D.spd;
        this.state = 'dodge'; this.dodgeT = 0; this.inv = Math.max(this.inv, D.inv); this.vy = 0; this.atk = null;
        if (dx) this.facing = U.sign(dx);
        if (!this.grounded) this.airDash--;
        this.dodgeCd = Math.round(D.cd * (1 - this.mods.dodgeCd));
        this.rig.play(D.clip, 2);
        Sound.sfx('dash'); VFX.dust(this.x, this.y, 5, G.level.theme.dust);
        G.addShake(2);
        return true;
    }
    dodgeState() {
        const D = this.def.dodge;
        this.vx = this.dvx; this.vy = this.dvy;
        if (D.after && this.dodgeT % 2 === 0) G.afterimage(this, D.col || this.def.style.col.glow);
        else if (D.col) VFX.add(this.x, this.y - 30, 0, 0, D.col, 14, 8);
        if (++this.dodgeT >= D.frames) { this.state = 'move'; this.vx = this.dvx * .35; this.vy *= .25; }
    }
    tryCombat(In) {
        const d = this.def;
        if (In.pressed('skill1') || In.pressed('skill2')) {
            const k = In.pressed('skill1') ? 's1' : 's2';
            if (this.startSkill(k)) return true;
        }
        if (In.pressed('ult') && this.ult >= 100) { this.startUlt(); return true; }
        // Guard and heavy share a key on the Warden: tap bashes, hold guards.
        if (d.canGuard) {
            if (In.down('heavy') && this.grounded) {
                this.heavyHeld++;
                if (this.heavyHeld > 9 && this.energy > 0) { if (!this.guarding) this.guardT = 0; this.guarding = true; this.guardT++; this.vx *= .6; if (this.guarding) this.rig.custom([[0, d.guardPose], [1, d.guardPose]], 4, 4, '_guard'); this.state = 'move'; return true; }
            } else {
                if (this.heavyHeld > 0 && this.heavyHeld <= 9 && this.grounded) { this.heavyHeld = 0; this.guarding = false; this.startAttack(d.heavy); return true; }
                this.heavyHeld = 0; this.guarding = false;
            }
        } else if (In.pressed('heavy')) {
            if (d.chargeAtk || d.heavyCharge) { this.state = 'charge'; this.charge = 0; return true; }
            if (d.heavy) { this.startAttack(d.heavy); return true; }
        }
        if (d.ranged) {
            if (In.down('attack') && this.shotCd <= 0) this.fireBasic();
            return false;
        }
        if (this.atkBuf > 0) { this.atkBuf = 0; this.startAttack(d.atks.a1); return true; }
        return false;
    }
    startSkill(k) {
        const s = this.def.skills[k];
        if (this.cds[k] > 0) { VFX.text(this.x, this.y - 74, 'COOLDOWN', '#88a', 13, 24); Sound.sfx('ui_deny', { gap: .2 }); return false; }
        if (this.energy < s.cost) { VFX.text(this.x, this.y - 74, 'NO ENERGY', '#6cf', 13, 24); Sound.sfx('ui_deny', { gap: .2 }); return false; }
        this.energy -= s.cost; this.cds[k] = s.cd;
        this.state = 'skill'; this.script = new Script(s.run(this)); this.scriptKeepVx = false; this.guarding = false;
        this.script.step(); return true;
    }
    startUlt() {
        this.ult = 0; this.state = 'skill'; this.guarding = false;
        Save.stat('ults', 1);
        this.script = new Script(this.def.ult.run(this)); this.script.step();
    }
    skillState(mx) {
        if (this.grounded && !this.guarding) this.vx *= .85;
        this.script.step();
        if (this.script.done) { this.state = 'move'; this.script = null; this.noGrav = false; }
    }
    startAttack(def) {
        this.state = 'attack'; this.atk = def; this.atkT = 0; this.atkHits = new Set(); this.trail.length = 0;
        const tot = def.s + def.a + def.r;
        this.rig.custom([[0, def.wind], [def.s / tot, def.str, 'snap'], [(def.s + def.a) / tot, def.str], [1, {}]], tot, 3);
    }
    attackState(In, mx) {
        const a = this.atk; this.atkT++;
        const t = this.atkT;
        if (this.grounded) this.vx *= .8;
        if (t === a.s) {
            this.vx = (a.move || 0) * this.facing; Sound.sfx(a.sfx);
            if (a.slash) VFX.slash(this.x + this.facing * a.slash[0], this.y + a.slash[1], a.slash[0] + 22, this.facing, a.col, -1.3, 1.3, 11, a.slam ? 1.6 : 1);
            if (a.shake) G.addShake(a.shake);
            if (a.slam) { VFX.dust(this.x + this.facing * 60, this.y, 12, G.level.theme.dust); VFX.groundWave(this.x + this.facing * 60, this.y, 70, a.col); }
        }
        if (t >= a.s && t < a.s + a.a) this.strike(a, this.atkHits, a.dmgOverride);
        if (t >= a.s + a.a) {
            if (a.next && this.atkBuf > 0) { this.atkBuf = 0; this.startAttack(this.def.atks[a.next]); return; }
            if (t >= a.s + a.a + 2) {
                if (In.pressed('dodge')) { this.state = 'move'; this.tryDodge(mx, In); return; }
                if (this.jumpBuf > 0 && (this.coyote > 0 || this.jumps < 2)) { this.state = 'move'; this.doJump(this.coyote <= 0); return; }
            }
            if (t >= a.s + a.a + a.r) { this.state = 'move'; this.atk = null; }
        } else if (t > 2 && In.pressed('dodge') && this.tryDodge(mx, In)) return;
        if (In.pressed('skill1') || In.pressed('skill2')) { if (t >= a.s + a.a && this.tryCombat(In)) return; }
    }
    /** Charged heavies: Rook's hammer, Zero's rail shot, Mirae's orb. Mirae's short tap swaps element. */
    chargeState(In) {
        const d = this.def, full = (d.chargeAtk || d.heavyCharge).full;
        this.charge++; this.vx *= .82;
        if (this.charge === 10 && d.id !== 'mirae' || (this.charge === 12 && d.id === 'mirae')) Sound.sfx('charge');
        if (this.charge % 3 === 0) { const c = d.id === 'mirae' ? ELEMENTS[this.element].col : d.style.col.glow; const a = U.rand(0, TAU); VFX.add(this.x + Math.cos(a) * 42, this.y - 34 + Math.sin(a) * 42, -Math.cos(a) * 2.5, -Math.sin(a) * 2.5, c, 16, 7, 1, 0); }
        if (d.chargeAtk && this.charge === 2) this.rig.custom([[0, d.chargeAtk.windPose], [1, d.chargeAtk.windPose]], 8, 8, '_chg');
        if (In.released('heavy') || !In.down('heavy') || this.charge > full + 90) {
            const k = Math.min(1, this.charge / full);
            if (d.id === 'mirae' && this.charge < 12) {
                this.element = (this.element + 1) % 3; Sound.sfx('ui_select', { v: .5 }); VFX.text(this.x, this.y - 78, ELEMENTS[this.element].name, ELEMENTS[this.element].col, 15, 30);
                this.state = 'move'; this.charge = 0; return;
            }
            if (d.chargeAtk) {
                const c = d.chargeAtk, dmg = U.lerp(c.dmgMin, c.dmgMax, k) * (this.up('r_chg') && k >= 1 ? 1.4 : 1);
                this.startAttack({ s: c.s, a: c.a, r: c.r, box: c.box, dmg, kb: c.kb, kby: c.kby, stag: c.stag, sfx: c.sfx, hit: c.hit, col: c.col, slam: c.slam, slash: [58, -40], wind: c.windPose, str: c.str, shake: 6 + k * 8, trail: 1 });
            } else if (d.id === 'mirae') {
                const a = this.aimAngle(), el = this.element;
                this.castFx(); Sound.sfx(ELEMENTS[el].sfx);
                Combat.shoot(this, 'orb', this.x + Math.cos(a) * 22, this.y - 44 + Math.sin(a) * 22, Math.cos(a) * 8, Math.sin(a) * 8, { dmg: 1.2 + k * 2.2, r: 12 + k * 14, life: 90, element: el, explode: 60 + k * 70, stag: 34 });
                this.state = 'move';
            } else {
                const a = this.aimAngle();
                this.castFx(); Sound.sfx('cannon'); G.addShake(4 + k * 5);
                const mul = this.up('z_chg') ? 1.4 : 1;
                Combat.shoot(this, 'rail', this.x + Math.cos(a) * 26, this.y - 42 + Math.sin(a) * 26, Math.cos(a) * 26, Math.sin(a) * 26, { dmg: (2.5 + k * 9) * mul, pierce: this.up('z_chg') ? 9 : k >= 1 ? 4 : 1, r: 8 + k * 8, life: 50, stag: 16 + k * 40 });
                this.vx -= Math.cos(a) * (2 + k * 4); this.state = 'move';
            }
            this.charge = 0;
        }
    }
    castFx() { this.firing = 14; }
    fireBasic() {
        const d = this.def, a = this.aimAngle();
        this.firing = 12; this.aimLast = a;
        if (Math.cos(a) !== 0 && Math.abs(Math.cos(a)) > .05 && !this.crouchAim) this.facing = Math.cos(a) > 0 ? 1 : -1;
        const mx = this.x + Math.cos(a) * 26, my = this.y - 42 + Math.sin(a) * 26;
        if (d.gunner) {
            const recoil = U.rand(-.035, .035), ang = a + recoil;
            this.shotCd = Math.round(d.rate * this.mods.rate);
            const lifesteal = this.shield > 0;
            if (this.cannonAmmo > 0) {
                this.cannonFired++; this.cannonAmmo--;
                const ramp = this.up('z_s1') ? .22 : .15, dmg = 1 + this.cannonFired * ramp, s = this.cannonFired;
                Combat.shoot(this, 'bolt', mx, my, Math.cos(ang) * 22, Math.sin(ang) * 22, { dmg, col: s > 20 ? '#ff2000' : '#ff9900', r: 5 + s * .15, len: 18 + s * .7, life: 50, stag: 8, lifesteal });
                Sound.sfx('cannon', { v: .45, p: 1 + s * .01 }); G.addShake(Math.min(5, s * .25));
                this.vx -= Math.cos(ang) * (.5 + s * .04); VFX.add(mx, my, 0, 0, '#ff9900', 8, 16, 1, 0);
            } else {
                Combat.shoot(this, 'bolt', mx, my, Math.cos(ang) * 21, Math.sin(ang) * 21, { dmg: 1, col: lifesteal ? '#ffcc00' : '#00ffff', r: 4, len: 18, life: 44, stag: 5, lifesteal });
                Sound.sfx('gun', { v: .5 }); VFX.add(mx, my, 0, 0, lifesteal ? '#ffcc00' : '#00ffff', 7, 11, 1, 0);
            }
        } else {
            const el = ELEMENTS[this.element];
            this.shotCd = d.rate;
            Combat.shoot(this, 'spark', mx, my, Math.cos(a) * 12.5, Math.sin(a) * 12.5, { dmg: 1, col: el.col, r: 7, life: 62, element: this.element, stag: 8 });
            Sound.sfx(el.sfx, { v: .55 });
        }
    }
    /** Applies an attack box, once per target per swing. */
    strike(a, hits, dmgOverride) {
        const f = this.facing, b = a.box;
        const x1 = f > 0 ? this.x + b[0] : this.x - b[0] - b[2];
        const R = { x: x1, y: this.y + b[1], w: b[2], h: b[3] };
        if (G.debugBoxes) G.debugBoxes.push(R);
        for (const t of Combat.targetsIn(R)) {
            if (hits.has && hits.has(t)) continue;
            if (hits.add) hits.add(t);
            Combat.hit(this, t, a);
        }
        for (const dyn of G.level.dyn) if (dyn.kind === 'breakable' && dyn.active && U.overlap(R, dyn) && !(hits.has && hits.has(dyn))) { if (hits.add) hits.add(dyn); dyn.damage(1); G.addShake(3); Sound.at('hit_h', dyn.x); }
    }

    /* ---- damage intake ---- */
    hurt(dmg, src = {}) {
        if (this.state === 'dead' || G.lockInput && !src.script) return false;
        if (this.inv > 0 || this.defyT > 0) {
            if (this.state === 'dodge' && this.dodgeT < 8 && !src.tick) this.perfectDodge(src);
            return false;
        }
        const fromFront = src.x === undefined || U.sign(src.x - this.x) === this.facing;
        if (this.counterOpen > 0 && !src.tick) { this.counterHit = true; return false; }
        if (this.guarding && fromFront && !src.unblockable) return this.block(dmg, src);
        if (G.inBastion(this)) dmg *= .3;
        dmg = dmg * (1 - this.mods.dr) * Game.diff.dmgTaken;
        if (this.id === 'rook') dmg *= .85;
        if (this.shield > 0) {
            if (dmg >= this.shield) {
                const over = dmg - this.shield; this.shield = 0; this.shieldT = 0;
                VFX.burst(this.x, this.y - 30, '#ffcc00', 20, 9, 30, 4);
                if (this.hp - over <= 0) { this.hp = 1; this.defyT = 60; VFX.text(this.x, this.y - 80, 'DEATH DEFIED!', '#ffcc00', 22, 60); G.addShake(12); Sound.sfx('parry'); return true; }
                dmg = over;
            } else { this.shield -= dmg; VFX.burst(this.x, this.y - 30, '#ffcc00', 8, 5, 18, 3); Sound.sfx('block'); this.inv = 10; return true; }
        }
        dmg = Math.max(1, Math.round(dmg));
        this.hp -= dmg; this.lastHurt = 0; this.rig.flash = 8;
        this.ult = Math.min(100, this.ult + dmg / this.maxHp * 30);
        Save.run.damageTaken += dmg;
        VFX.text(this.x, this.y - 70, '-' + dmg, '#ff5a4a', 18);
        VFX.hit(this.x, this.y - 34, '#ff3322', 10); Sound.sfx('hurt'); G.addShake(Math.min(14, 4 + dmg * .4)); G.hurtFlash = Math.min(.6, G.hurtFlash + .35);
        if (this.hp <= 0) { this.hp = 0; this.die(); return true; }
        this.inv = src.tick ? 16 : 42;
        const heavy = this.id === 'rook' ? dmg > this.maxHp * .25 : true;
        if (heavy && this.state !== 'skill') {
            this.state = 'hit'; this.hitT = src.tick ? 6 : 14; this.atk = null; this.charge = 0; this.guarding = false;
            const kb = src.kb === undefined ? 5 : src.kb;
            if (src.x !== undefined) this.vx = U.sign(this.x - src.x) * kb;
            this.vy = Math.min(this.vy, src.kby === undefined ? -3.5 : src.kby);
            this.rig.play('hit', 2);
        }
        return true;
    }
    block(dmg, src) {
        const perfect = this.guardT <= 10, D = this.def;
        if (perfect) {
            Sound.sfx('parry'); G.slowmo = 14; VFX.ring(this.x + this.facing * 26, this.y - 34, 60, '#ffd86b'); this.energy = Math.min(this.maxEnergy, this.energy + 15); this.ult = Math.min(100, this.ult + 5); VFX.text(this.x, this.y - 80, 'PERFECT GUARD', '#ffd86b', 16, 34);
            if (src.owner && src.owner.stagger) src.owner.stagger(60);
            if (src.proj) { const P = src.proj; P.owner = this; P.friendly = true; P.vx *= -1.2; P.vy *= -1.2; P.life = 70; P.dmg = this.power * 1.6; P.hitSet = new Set(); }
            return false;
        }
        const full = this.up('y_guard');
        const dd = full ? 0 : Math.round(dmg * .2 * Game.diff.dmgTaken);
        this.energy -= (full ? .5 : 1) * Math.max(6, dmg * .5); this.energy = Math.max(0, this.energy);
        this.energy = Math.min(this.maxEnergy, this.energy + 2);
        Sound.sfx('block'); VFX.hit(this.x + this.facing * 24, this.y - 34, '#ffd86b', 6); this.vx = -this.facing * 3; this.inv = 8; this.ult = Math.min(100, this.ult + 2);
        if (dd) { this.hp -= dd; VFX.text(this.x, this.y - 70, '-' + dd, '#ffb0a0', 14); if (this.hp <= 0) { this.hp = 0; this.die(); } }
        if (this.energy <= 0) { this.guarding = false; this.state = 'hit'; this.hitT = 30; this.rig.play('hit', 2); VFX.text(this.x, this.y - 80, 'GUARD BROKEN', '#ff8866', 16, 36); }
        return false;
    }
    perfectDodge(src) {
        if (this.perfCd && G.time - this.perfCd < 30) return;
        this.perfCd = G.time;
        G.slowmo = 26; this.ult = Math.min(100, this.ult + 6); this.energy = Math.min(this.maxEnergy, this.energy + 10);
        VFX.text(this.x, this.y - 84, 'PERFECT', '#ffffff', 17, 30); VFX.ring(this.x, this.y - 30, 70, '#ffffff', 16, 3);
        if (this.id === 'sable') { this.dodgeCd = 0; this.airDash = 1; }
        Save.stat('perfects', 1);
    }
    heal(n, quiet) {
        if (this.hp >= this.maxHp || this.state === 'dead') return;
        this.hp = Math.min(this.maxHp, this.hp + n);
        if (!quiet) { VFX.text(this.x, this.y - 70, '+' + Math.round(n), '#00ff88', 15, 32); VFX.burst(this.x, this.y - 30, '#00ff88', 7, 3, 24, 5, 1); }
    }
    gainUlt(n) { this.ult = Math.min(100, this.ult + n * (1 + this.mods.ultGain)); }
    die() {
        this.state = 'dead'; this.deathT = 0; this.vx = 0; this.inv = 0; this.script = null; this.noGrav = false; this.guarding = false;
        this.rig.ground = false; this.rig.play('death', 4); Sound.sfx('hurt', { p: .6 }); G.slowmo = 50; Save.stat('deaths', 1); Music.setState('calm');
    }
    deadTick() {
        this.deathT++; this.vy = Math.min(this.vy + GRAV, 14); this.dropThrough = false; Phys.move(this); this.rig.tick(); this.rig.updateChain(this.x, this.y, this.facing);
        if (this.deathT === 100) Game.onPlayerDead();
    }
    fallOut() {
        Sound.sfx('hurt'); this.hp -= Math.ceil(this.maxHp * .12 * Game.diff.dmgTaken);
        if (this.hp <= 0) { this.hp = 1; this.die(); this.y = this.safe.y; this.x = this.safe.x; return; }
        this.returnToSafe();
    }
    returnToSafe() {
        this.x = this.safe.x; this.y = this.safe.y; this.vx = this.vy = 0; this.inv = 90; this.state = 'move'; this.atk = null; this.grounded = true; this.script = null; this.noGrav = false;
        G.fade = 1; VFX.burst(this.x, this.y - 30, '#ffffff', 16, 4, 26, 6, 1);
    }
    onLand(v) {
        Sound.sfx('land', { v: U.clamp(v / 16, .3, 1) }); VFX.dust(this.x, this.y, 6, G.level.theme.dust);
        if (this.state === 'move' && v > 9) this.rig.play('land', 2);
        if (v >= 15 && this.id === 'rook') { G.addShake(4); VFX.groundWave(this.x, this.y, 80, '#ffaa33', 18); }
    }
    afterMove() {
        const L = G.level; const me = { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h };
        this.onIce = false; this.inWater = false; this.sandSlow = false; this.slow = Math.max(0, (this.slow || 0) - 1); this.inHazard = false; let heatMax = 0;
        for (const hz of L.hazards) {
            if (hz.kind === 'lava' || hz.kind === 'steam') { const d = Math.max(0, me.y + me.h < hz.y ? hz.y - me.y - me.h : 0); if (me.x + me.w > hz.x - 120 && me.x < hz.x + hz.w + 120) heatMax = Math.max(heatMax, 1 - d / 240); }
            if (!U.overlap(me, hz)) continue;
            Hazards.touch(this, hz);
        }
        G.heat = U.lerp(G.heat, Math.max(heatMax, 0), .08);
        // Last line of defence: a body inside solid rock is returned to its last safe footing.
        if (L.solidAt(this.x, this.y - 22) && L.solidAt(this.x, this.y - 46)) { if (++this.stuck > 12) { this.stuck = 0; this.returnToSafe(); } } else this.stuck = 0;
    }

    /* ---- animation ---- */
    animate(mx) {
        const R = this.rig, d = this.def, spd = Math.abs(this.vx);
        R.ground = this.grounded;
        R.gaitAmt = U.clamp(spd / d.speed, .2, 1.1);
        R.gaitSwing = U.clamp(-this.vx * .8, -7, 7);
        R.phase += spd * this.facing * (U.sign(this.vx) * this.facing) / (d.speed > 5.8 ? 14 : 12);
        if (this.state === 'move') {
            if (this.flipT > 0) this.flipT--;
            if (this.guarding) { /* guard pose is held from tryCombat */ }
            else if (this.grounded) {
                if (this.rig.name === 'land' && !R.done) { /* let the landing finish */ }
                else if (this.crouching) R.play('crouch', 5);
                else if (spd > .7 && mx !== 0 || spd > 2) R.play('run', 6);
                else R.play('idle', 9);
                if (R.name === 'run') this.footsteps(spd);
            } else if (this.wallSlide) R.play('wall', 4);
            else if (this.flipT > 0) { /* air flip */ }
            else if (this.vy < 0) R.play('jump', 5);
            else R.play('fall', 8);
        }
        R.tick();
        // Upper body aims independently while firing, over whatever the legs are doing.
        if ((this.firing > 0 || this.state === 'charge') && (d.ranged)) {
            const a = (this.state === 'charge' ? this.aimAngle() : this.aimLast === undefined ? 0 : this.aimLast);
            const rel = this.facing > 0 ? a : Math.PI - a;
            const lean = R.out[PI.lean];
            R.out[PI.aF] = 90 - rel * 180 / Math.PI - lean; R.out[PI.fF] = 2;
        }
        if (this.state === 'attack' && this.atk.trail) {
            this.trail.push({ x: R.tip.x, y: R.tip.y, bx: R.tip.bx, by: R.tip.by });
            if (this.trail.length > 6) this.trail.shift();
            if (this.atkT >= this.atk.s - 1 && this.atkT <= this.atk.s + this.atk.a && this.trail.length > 2) VFX.trail(this.trail, this.atk.col);
        }
        R.updateChain(this.x, this.y, this.facing, -this.vx * .25 + (G.wind || 0));
    }
    footsteps(spd) {
        this.stepAcc += spd;
        if (this.stepAcc > 56) { this.stepAcc = 0; const s = G.level.theme.step; Sound.sfx('step_' + s, { v: .5, gap: .08 }); if (G.level.theme.dust) VFX.dust(this.x, this.y, 1, G.level.theme.dust); }
    }
    draw(ctx) {
        const a = this.inv > 0 && this.state !== 'dodge' && this.state !== 'skill' && G.time % 6 < 3 ? .55 : 1;
        const R = this.rig;
        if (this.defyT > 0) Paint.glow(ctx, this.x, this.y - 30, 46, '#ffcc00');
        // The chain paints in world space, the rig in local space.
        R.draw(ctx, this.x, this.y, this.facing, a);
        if (this.shield > 0) {
            ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 3; ctx.globalAlpha = .9; ctx.beginPath();
            for (let i = 0; i < 6; i++) { const aa = TAU / 6 * i + G.time * .05, px = this.x + Math.cos(aa) * 46, py = this.y - 32 + Math.sin(aa) * 46; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
            ctx.closePath(); ctx.stroke(); ctx.fillStyle = U.rgba('#ffcc00', .28 * this.shield / this.shieldMax); ctx.fill(); ctx.globalAlpha = 1;
        }
        if (this.charge > 8) { const k = Math.min(1, this.charge / (this.def.chargeAtk || this.def.heavyCharge).full); ctx.strokeStyle = k >= 1 ? '#fff' : this.def.style.col.glow; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(this.x, this.y - 72, 9, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke(); }
    }
}
