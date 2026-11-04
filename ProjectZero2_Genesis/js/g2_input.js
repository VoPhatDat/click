'use strict';
/**
 * G2 INPUT: skills come out when you press them.
 *   1. Presses survive hitstop and slow-motion frames. Those frames skip the player's update but the
 *      frame still ended by clearing what was pressed, so a skill pressed right after landing a hit
 *      was lost.
 *   2. A skill pressed while busy (mid-swing, mid-dodge, in another skill, on a cooldown about to end)
 *      is held for a quarter of a second and comes out as soon as the player can act.
 *   3. Every skill key (1, 2, 3) and the ultimate (4) cancels the end of a swing, not just 1 and 2.
 */
(function () {
    // 1. keep this frame's presses when the frame did not get to the player
    const tick = G.tick.bind(G);
    G.tick = function () { G._skipInput = G.hitstop > 0 || (G.slowmo > 0 && (G.slowmo - 1) % 2 === 0); return tick(); };
    const end = Input.endTick.bind(Input);
    Input.endTick = function () { if (G._skipInput && Game.state === 'play') { G._skipInput = false; return; } G._skipInput = false; return end(); };

    // 2 and 3. a short buffer for the skill keys
    const SK = { skill1: 's1', skill2: 's2', skill3: 's3' }, KEYS = ['skill1', 'skill2', 'skill3', 'ult'], HOLD = 16;
    const upd = Player.prototype.update;
    Player.prototype.update = function () {
        if (this !== G.player || this.isAlly) return upd.call(this);
        const before = { s1: this.cds.s1, s2: this.cds.s2, s3: this.cds.s3, ult: this.ult };
        for (const k of KEYS) if (Input.pressed(k)) this.skBuf = { k, t: HOLD };
        upd.call(this);
        const B = this.skBuf; if (!B) return;
        const sk = SK[B.k];
        if (sk ? this.cds[sk] > (before[sk] || 0) : this.ult < before.ult) { this.skBuf = null; return; } // the game already took it
        if (--B.t <= 0) { this.skBuf = null; return; }
        const can = this.state === 'move' || (this.state === 'attack' && this.atk && this.atkT >= this.atk.s + this.atk.a);
        if (!can || G.lockInput || this.state === 'dead') return;
        if (sk) { const s = this.def.skills && this.def.skills[sk]; if (!s || this.cds[sk] > 0 || this.energy < s.cost) return; if (this.startSkill(sk)) this.skBuf = null; }
        else if (this.ult >= 100 && this.startUlt) { this.startUlt(); this.skBuf = null; }
    };
})();
