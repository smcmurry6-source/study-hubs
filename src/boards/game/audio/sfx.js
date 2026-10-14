/* Optional WebAudio UI cues. AudioContext is created only by enable(true), after a user gesture. */
(function () {
  'use strict';
  function createSfx(host) {
    var env = host || (typeof window !== 'undefined' ? window : null);
    var context = null, master = null, enabled = false, tapCount = 0;
    function calmMode() {
      try { return !!(env && env.matchMedia && env.matchMedia('(prefers-reduced-motion: reduce)').matches); }
      catch (_) { return false; }
    }
    function prepare() {
      var AudioCtor = env && (env.AudioContext || env.webkitAudioContext);
      if (!AudioCtor) return false;
      if (context) return true;
      try {
        context = new AudioCtor();
        var compressor = context.createDynamicsCompressor ? context.createDynamicsCompressor() : null;
        master = context.createGain();
        master.gain.value = 0.16;
        if (compressor) {
          compressor.threshold.value = -18;
          compressor.ratio.value = 3;
          master.connect(compressor);
          compressor.connect(context.destination);
        } else master.connect(context.destination);
        if (env.navigator && env.navigator.audioSession) {
          try { env.navigator.audioSession.type = 'ambient'; } catch (_) {}
        }
        return true;
      } catch (_) { context = null; master = null; return false; }
    }
    function tone(freq, start, duration, wave, level, endFreq, calm) {
      var osc = context.createOscillator(), gain = context.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, start);
      if (endFreq && !calm) osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(level, start + Math.min(0.012, duration / 3));
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain); gain.connect(master);
      osc.start(start); osc.stop(start + duration + 0.02);
    }
    function enable(on) {
      if (!on) {
        enabled = false;
        if (context && context.state === 'running' && context.suspend) {
          try { context.suspend().catch(function () {}); } catch (_) {}
        }
        return false;
      }
      if (!prepare()) return false;
      enabled = true;
      if (context.state === 'suspended' && context.resume) {
        try { context.resume().catch(function () {}); } catch (_) {}
      }
      return true;
    }
    function play(name, options) {
      if (!enabled || !context || !master || context.state === 'closed' || context.state === 'suspended') return false;
      options = options && typeof options === 'object' ? options : {};
      var calm = calmMode() || options.reducedMotion === true;
      var now = context.currentTime + 0.012;
      var tier = Math.max(0, Math.min(4, Number(options.tier) || 0));
      var step = [0, 2, 4, 7, 9][tier];
      if (name === 'tap' || name === 'select') {
        tone(1200 * (1 + ((tapCount++ % 7) - 3) * 0.01), now, 0.035, 'sine', 0.055);
      } else if (name === 'lock') {
        tone(940, now, 0.018, 'triangle', 0.045);
        tone(720, now + 0.035, 0.022, 'triangle', 0.04);
      } else if (name === 'correct') {
        var base = 523.25 * Math.pow(2, (calm ? 0 : step) / 12);
        tone(base, now, 0.22, 'sine', 0.055);
        tone(base * 1.25, now + 0.13, 0.3, 'sine', 0.045);
      } else if (name === 'wrong') {
        tone(110, now, 0.18, 'triangle', 0.06, 88, calm);
      } else if (name === 'flow') {
        if (calm) tone(659.25, now, 0.22, 'sine', 0.045);
        else [523.25, 587.33, 659.25, 783.99].forEach(function (freq, i) {
          tone(freq * Math.pow(2, step / 12), now + i * 0.09, 0.22, 'sine', 0.035);
        });
      } else if (name === 'window') {
        tone(880, now, 1.8, 'sine', 0.025);
        tone(880.5, now, 1.8, 'sine', 0.018);
      } else return false;
      return true;
    }
    return { enable:enable, play:play, get enabled() { return enabled; } };
  }
  var sfx = createSfx();
  var api = { play:sfx.play, enable:sfx.enable, createSfx:createSfx, get enabled() { return sfx.enabled; } };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.BoardsGameSfx = api;
}());
