'use strict';
/**
 * G2 CORE: Project Zero II: Genesis extends the Part I engine in place.
 * Own save slot, new key bindings (third skill, form, weapon, Nyx), story flags,
 * and the Part I save bonus. Loaded after ui.js and before main.js.
 */
const G2 = {
    VERSION: '2.0.0-M1',
    P1_KEY: 'pz_aocalyst_save_v1',
    hasPart1() { try { const r = localStorage.getItem(this.P1_KEY); if (!r) return null; const d = JSON.parse(r); return d && d.v === 1 ? d : null; } catch (e) { return null; } },
    flags() { return Save.data.g2; },
    spareCount() { return Object.keys(Save.data.g2.spared).length; },
    ending() { const g = Save.data.g2; return Object.keys(g.shards).length >= 7 && Object.keys(g.spared).length >= 5 ? 'rest' : 'judgment'; }
};

/* Part II has its own save and settings, so a Part I save is never overwritten. */
Store.KEY = 'pz2_genesis_save_v1';
Store.SKEY = 'pz2_genesis_settings_v1';
// skills 1, 2, 3 on keys 1, 2, 3 and the ultimate on 4, in the order the skill bar shows them
Object.assign(DEFAULT_BINDS, { skill3: 'Digit3', ult: 'Digit4', form: 'KeyF', weapon: 'KeyQ', nyx: 'KeyN' });
(function () { const ls = Store.loadSettings; if (ls) Store.loadSettings = function () { ls.call(this); const B = Settings.binds; if (B.skill3 === 'Digit4' && B.ult === 'Digit3') { B.skill3 = 'Digit3'; B.ult = 'Digit4'; } }; })();
Object.assign(ALT_BINDS, { skill3: 'KeyY', form: 'Tab' });
Object.assign(Settings, { binds: Object.assign({}, DEFAULT_BINDS), soundHints: true });

/* Gamepad: RB is the third skill (dodge stays on B), Back switches weapon, R3 switches form, L3 interacts. */
(function () {
    const base = Input.pollPad.bind(Input);
    Input.pollPad = function () {
        base();
        if (HEADLESS || !navigator.getGamepads) return;
        const gp = Array.from(navigator.getGamepads()).find(p => p); if (!gp) return;
        const b = i => gp.buttons[i] && gp.buttons[i].pressed, p = this.pad;
        p.dodge = b(1); p.skill3 = b(5); p.weapon = b(8); p.form = b(11); p.interact = b(10);
    };
})();

/* Save data gains the Part II record: mercy and blood, peace shards, pages, weapon tiers. */
(function () {
    const fresh = Save.fresh.bind(Save);
    Save.fresh = function (diff) {
        const d = fresh(diff);
        d.v = 1; d.g2 = { chapter: 1, spared: {}, killed: {}, shards: {}, pages: {}, wTier: {}, wIdx: {}, seen: {}, nyxMode: 'follow', p1bonus: false, intro: false };
        d.equipped = [null, null, null]; d.cells = 0; d.activeChar = 'nyx'; d.unlocked = ['nyx']; d.g2.named = false; d.g2.zeroMode = 'follow';
        return d;
    };
    const load = Save.load.bind(Save);
    Save.load = function () {
        const ok = load(); if (!ok) return false;
        const f = Save.fresh(this.data.diff);
        this.data.g2 = Object.assign(f.g2, this.data.g2 || {});
        while (this.data.equipped.length < 3) this.data.equipped.push(null);
        return true;
    };
})();

/** Applies the Part I bonus once per save: a relic and a line from Ysolde. */
G2.grantPart1Bonus = function () {
    const D = Save.data; if (!D || D.g2.p1bonus) return false;
    const p1 = G2.hasPart1(); if (!p1) return false;
    D.g2.p1bonus = true;
    if (!D.relics.includes('ticket3')) D.relics.push('ticket3');
    Save.write();
    return true;
};

Object.assign(ACHIEVEMENTS, {
    g2_named: { name: 'Night', desc: 'Be given a name.' },
    knight: { name: 'Some Shade', desc: 'Defeat the Shadowless Knight.' },
    seraphina: { name: 'The First Night', desc: 'Bring the First Day its night.' },
    g2_spare1: { name: 'Only Tired', desc: 'Spare Seraphina.' },
    g2_shard1: { name: 'Shade', desc: 'Find the first Shard of Peace.' },
    g2_pages1: { name: 'Reader of the Second Book', desc: 'Find every page of the First Day.' },
    g2_p1: { name: 'Line 3, Still Running', desc: 'Bring a Part I journey into Part II.' }
});
