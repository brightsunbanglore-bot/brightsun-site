import { warpT, unwarpT } from "./journeyTiming";
import { gsap } from "@/lib/gsap";
import { BALL_Y, REST, SIT_Y, type Expression, type Pose } from "./sunnyPose";
import { hopSunny, mascotState, sunnyEvent } from "./mascotState";
import { startSnore, stopSnore, sunnyFun } from "./sunnyAudio";

type SetExpr = (e: Expression) => void;

const TAU = Math.PI * 2;

/** Ease every limb and body value back to the standing rest pose. */
export function toRest(tl: gsap.core.Timeline, pose: Pose, at: gsap.Position, dur = 0.55) {
  const ease = "power2.inOut";
  tl.to(pose, { y: 0, roll: 0, tilt: 0, turn: 0, squash: 1, limbs: 1, shades: REST.shades, brush: 0, comb: 0, foam: 0, walk: 0, run: 0, moon: 0, peek: 0, shush: 0, point: 0, wrist: 0, wristX: 0, zip: 0, rope: 0, duration: dur, ease }, at)
    .to(pose.armL, { ...REST.armL, duration: dur, ease }, "<")
    .to(pose.armR, { ...REST.armR, duration: dur, ease }, "<")
    .to(pose.legL, { ...REST.legL, duration: dur, ease }, "<")
    .to(pose.legR, { ...REST.legR, duration: dur, ease }, "<");
  return tl;
}

/** Land with a squashy bounce. */
function land(tl: gsap.core.Timeline, pose: Pose, at?: gsap.Position) {
  tl.to(pose, { squash: 0.8, duration: 0.09, ease: "power2.out" }, at).to(pose, {
    squash: 1,
    duration: 0.55,
    ease: "elastic.out(1, 0.4)",
  });
}

/**
 * Entrance: curled up like a ball, Sunny rolls in from the right, pops
 * its arms and legs out, wobbles dizzily, shakes it off and says "ta-da!".
 */
export function rollIn(pose: Pose, setExpr: SetExpr, from: number) {
  const tl = gsap.timeline();
  pose.x = from;
  pose.y = BALL_Y;
  pose.limbs = 0;
  pose.roll = -TAU * 1.25;
  tl.call(() => setExpr("happy"))
    .call(() => sunnyEvent("rollin"))
    .to(pose, { x: 0, roll: 0, duration: 1.9, ease: "power2.out" })
    // pop up
    .call(() => setExpr("surprised"))
    .to(pose, { y: 0.55, squash: 1.12, duration: 0.32, ease: "power2.out" })
    .to(pose, { limbs: 1, duration: 0.45, ease: "back.out(2.4)" }, "<")
    .to(pose, { y: 0, duration: 0.28, ease: "power2.in" });
  land(tl, pose);
  // dizzy wobble, then shake it off
  tl.call(() => setExpr("dizzy"), [], "-=0.45")
    .to(pose, { tilt: 0.22, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: 3 }, "<")
    .to(pose.armL, { raise: 0.9, bend: 0.9, duration: 0.3 }, "<")
    .to(pose.armR, { raise: 0.9, bend: 0.9, duration: 0.3 }, "<")
    .to(pose, { turn: 0.35, duration: 0.09, yoyo: true, repeat: 5, ease: "sine.inOut" })
    .call(() => setExpr("happy"))
    // ta-da!
    .to(pose.armL, { raise: 2.5, bend: 0.15, grip: 0, duration: 0.35, ease: "back.out(2)" })
    .to(pose.armR, { raise: 2.5, bend: 0.15, grip: 0, duration: 0.35, ease: "back.out(2)" }, "<")
    .to(pose, { squash: 1.06, y: 0.12, duration: 0.25, ease: "power2.out" }, "<")
    .to(pose, { y: 0, duration: 0.2, ease: "power2.in" });
  land(tl, pose);
  tl.call(() => sunnyEvent("arrive"));
  tl.to({}, { duration: 0.5 });
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Plops down on the ground, swings its little legs and looks around. */
export function sitAndSwing(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.to(pose, { squash: 0.9, duration: 0.15, ease: "power2.out" })
    .to(pose, { y: SIT_Y, squash: 1, duration: 0.45, ease: "power2.in" })
    .to(pose.legL, { hip: -1.45, knee: 0.15, duration: 0.45, ease: "power2.out" }, "<")
    .to(pose.legR, { hip: -1.45, knee: 0.15, duration: 0.45, ease: "power2.out" }, "<")
    .to(pose.armL, { raise: 0.55, fwd: 0.35, bend: 0.4, duration: 0.45 }, "<")
    .to(pose.armR, { raise: 0.55, fwd: 0.35, bend: 0.4, duration: 0.45 }, "<");
  land(tl, pose);
  tl.call(() => setExpr("happy"), [], "<")
    .addLabel("swing")
    .to(pose.legL, { hip: -1.9, knee: 0.45, duration: 0.32, ease: "sine.inOut", yoyo: true, repeat: 9 }, "swing")
    .to(pose.legR, { hip: -1.05, knee: 0.05, duration: 0.32, ease: "sine.inOut", yoyo: true, repeat: 9 }, "swing")
    .to(pose, { turn: 0.45, tilt: 0.08, duration: 0.8, ease: "sine.inOut" }, "swing+=0.2")
    .call(() => setExpr("normal"), [], "swing+=1.2")
    .to(pose, { turn: -0.45, tilt: -0.08, duration: 1, ease: "sine.inOut" }, "swing+=1.3")
    .call(() => setExpr("happy"), [], "swing+=2.4")
    .to(pose, { turn: 0, tilt: 0, duration: 0.6, ease: "sine.inOut" }, "swing+=2.4")
    // hop back up
    .to(pose, { squash: 0.88, duration: 0.15 }, "swing+=3.3")
    .to(pose, { y: 0.35, squash: 1.08, duration: 0.3, ease: "power2.out" })
    .to(pose.legL, { ...REST.legL, duration: 0.3 }, "<")
    .to(pose.legR, { ...REST.legR, duration: 0.3 }, "<")
    .to(pose, { y: 0, duration: 0.25, ease: "power2.in" });
  land(tl, pose);
  toRest(tl, pose, "<0.1");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Two happy hops, a little dance, then a spin. */
export function jumpAndDance(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"))
    // tip the sunglasses up for a peek, then drop them back down
    .to(pose.armR, { raise: 2.3, bend: 1.9, grip: 0.6, duration: 0.3, ease: "power2.out" })
    .to(pose, { shades: 0.7, duration: 0.25, ease: "power2.out" }, "-=0.1")
    .to(pose, { shades: 1, duration: 0.45, ease: "bounce.out" }, "+=0.25")
    .to(pose.armR, { ...REST.armR, duration: 0.3 });
  for (let i = 0; i < 2; i++) {
    tl.to(pose, { squash: 0.82, y: -0.05, duration: 0.14, ease: "power2.out" })
      .to(pose, { y: 0.62, squash: 1.14, duration: 0.32, ease: "power2.out" })
      .to(pose.armL, { raise: 2.4, bend: 0.2, duration: 0.25 }, "<")
      .to(pose.armR, { raise: 2.4, bend: 0.2, duration: 0.25 }, "<")
      .to(pose.legL, { hip: -0.5, knee: 0.9, duration: 0.25 }, "<")
      .to(pose.legR, { hip: -0.5, knee: 0.9, duration: 0.25 }, "<")
      .to(pose, { y: 0, squash: 1, duration: 0.3, ease: "power2.in" })
      .to(pose.legL, { ...REST.legL, duration: 0.25 }, "<")
      .to(pose.legR, { ...REST.legR, duration: 0.25 }, "<");
    land(tl, pose, ">-0.02");
  }
  // dance: sway with alternating arms
  for (let beat = 0; beat < 4; beat++) {
    const s = beat % 2 === 0 ? 1 : -1;
    tl.to(pose, { tilt: 0.16 * s, y: 0.06, duration: 0.18, ease: "power2.out" })
      .to(pose.armL, { raise: s > 0 ? 2.6 : 0.4, bend: s > 0 ? 0.2 : 0.9, duration: 0.18 }, "<")
      .to(pose.armR, { raise: s > 0 ? 0.4 : 2.6, bend: s > 0 ? 0.9 : 0.2, duration: 0.18 }, "<")
      .to(pose.legL, { hip: s > 0 ? -0.35 : 0, duration: 0.18 }, "<")
      .to(pose.legR, { hip: s > 0 ? 0 : -0.35, duration: 0.18 }, "<")
      .to(pose, { y: 0, duration: 0.16, ease: "power2.in" });
  }
  // spin with arms out
  tl.to(pose.armL, { raise: 1.45, bend: 0.1, duration: 0.2 })
    .to(pose.armR, { raise: 1.45, bend: 0.1, duration: 0.2 }, "<")
    .to(pose, { tilt: 0, turn: TAU, duration: 0.8, ease: "power2.inOut" })
    .set(pose, { turn: 0 });
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Big friendly wave. */
export function wave(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"))
    .to(pose.armR, { raise: 2.7, bend: 0.5, grip: 0, duration: 0.35, ease: "back.out(1.8)" })
    .to(pose, { tilt: -0.08, duration: 0.35 }, "<")
    .to(pose.armR, { bend: 1.1, duration: 0.18, yoyo: true, repeat: 5, ease: "sine.inOut" });
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Poke reaction: giggle and wiggle. */
export function giggle(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"))
    .to(pose, { squash: 0.86, duration: 0.08 })
    .to(pose, { squash: 1.1, y: 0.28, duration: 0.18, ease: "power2.out" })
    .to(pose.armL, { raise: 1.0, fwd: 0.6, bend: 1.7, grip: 0.1, duration: 0.18 }, "<")
    .to(pose.armR, { raise: 1.0, fwd: 0.6, bend: 1.7, grip: 0.1, duration: 0.18 }, "<")
    .to(pose, { y: 0, duration: 0.18, ease: "power2.in" });
  land(tl, pose);
  tl.to(pose, { tilt: 0.12, duration: 0.08, yoyo: true, repeat: 5, ease: "sine.inOut" }, "<");
  toRest(tl, pose, ">0.1");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Too many pokes: spins, gets dizzy, wobbles, then recovers. */
export function dizzy(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("surprised"))
    .to(pose, { turn: TAU * 2, duration: 1.1, ease: "power3.out" })
    .to(pose.armL, { raise: 1.5, bend: 0.1, duration: 0.3 }, "<")
    .to(pose.armR, { raise: 1.5, bend: 0.1, duration: 0.3 }, "<")
    .set(pose, { turn: 0 })
    .call(() => setExpr("dizzy"))
    .to(pose, { tilt: 0.25, duration: 0.3, yoyo: true, repeat: 5, ease: "sine.inOut" })
    .to(pose.armL, { raise: 0.8, bend: 1.2, duration: 0.4 }, "<")
    .to(pose.armR, { raise: 0.8, bend: 1.2, duration: 0.4 }, "<")
    .to(pose, { x: 0.15, duration: 0.45, yoyo: true, repeat: 3, ease: "sine.inOut" }, "<")
    .to(pose, { turn: 0.3, duration: 0.08, yoyo: true, repeat: 5, ease: "sine.inOut" })
    .call(() => setExpr("happy"));
  toRest(tl, pose, ">");
  tl.to(pose, { x: 0, duration: 0.4 }, "<");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Pulls out a toothbrush, scrubs with a big grin, foams up, then a sparkly clean smile. */
export function brushTeeth(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"))
    .to(pose.armR, { raise: 0.95, fwd: 1.4, bend: 2.3, grip: 0.85, duration: 0.45, ease: "power2.out" })
    .to(pose, { brush: 1, duration: 0.3, ease: "back.out(2.5)" }, "<0.15")
    .to(pose, { tilt: 0.05, duration: 0.3 }, "<")
    // scrub-a-dub
    .addLabel("scrub")
    .to(pose.armR, { raise: 1.15, duration: 0.11, yoyo: true, repeat: 15, ease: "sine.inOut" }, "scrub")
    .to(pose, { foam: 1, duration: 1.4, ease: "power1.in" }, "scrub")
    .to(pose, { squash: 1.03, duration: 0.22, yoyo: true, repeat: 7, ease: "sine.inOut" }, "scrub")
    .to(pose, { tilt: -0.06, duration: 0.45, yoyo: true, repeat: 3, ease: "sine.inOut" }, "scrub")
    // rinse: foam pops away, then a sparkly clean grin
    .call(() => setExpr("surprised"))
    .to(pose, { foam: 0, duration: 0.25, ease: "back.in(2)" })
    .to(pose, { brush: 0, duration: 0.25, ease: "back.in(2)" }, "<")
    .call(() => setExpr("happy"))
    .to(pose.armR, { raise: 2.3, bend: 0.3, grip: 0.1, duration: 0.3, ease: "back.out(2)" })
    .to(pose, { squash: 0.88, duration: 0.1 }, "<")
    .to(pose, { y: 0.25, squash: 1.08, duration: 0.2, ease: "power2.out" })
    .to(pose, { y: 0, duration: 0.18, ease: "power2.in" });
  land(tl, pose);
  tl.to({}, { duration: 0.4 });
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Bed-head! Shakes its messy tuft, then combs it neat stroke by stroke. */
export function combHair(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("surprised"))
    .to(pose, { hair: 1, duration: 0.35, ease: "back.out(3)" })
    .to(pose, { turn: 0.25, duration: 0.1, yoyo: true, repeat: 5, ease: "sine.inOut" }, "<")
    .call(() => setExpr("normal"))
    .to(pose.armR, { raise: 2.55, fwd: 0.25, bend: 1.0, grip: 0.85, duration: 0.45, ease: "power2.out" })
    .to(pose, { comb: 1, duration: 0.3, ease: "back.out(2.5)" }, "<0.15")
    .to(pose, { tilt: 0.1, duration: 0.4 }, "<");
  for (let i = 0; i < 4; i++) {
    tl.to(pose.armR, { bend: 0.55, raise: 2.7, duration: 0.24, ease: "power1.inOut" })
      .to(pose, { hair: 1 - (i + 1) / 4, duration: 0.24, ease: "power1.out" }, "<")
      .to(pose.armR, { bend: 1.0, raise: 2.55, duration: 0.2, ease: "power1.inOut" });
  }
  tl.call(() => setExpr("happy"))
    .to(pose, { comb: 0, duration: 0.25, ease: "back.in(2)" })
    // proud little pose
    .to(pose.armR, { raise: 0.5, fwd: 0, bend: 1.4, grip: 0.6, duration: 0.3 })
    .to(pose.armL, { raise: 0.5, bend: 1.4, grip: 0.6, duration: 0.3 }, "<")
    .to(pose, { tilt: -0.08, squash: 1.04, duration: 0.3 }, "<")
    .to({}, { duration: 0.8 });
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** World x just beyond the stage's right edge (Sunny fully hidden). */
const OFFSTAGE_X = 4.7;

/**
 * Peek-a-boo: Sunny sprints off the right edge of the stage, sneaks back and
 * peeks in from behind the edge (half hidden, cool smirk, no hands), ducks
 * out, then moonwalks back to centre stage and spins to face the front.
 */
export function peekaboo(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"))
    // anticipation: snap round to face right, dip, push off
    .to(pose, { turn: 1.3, duration: 0.22, ease: "power2.out" })
    .to(pose, { squash: 0.9, y: -0.05, duration: 0.16, ease: "power2.out" }, "<0.05")
    .to(pose, { squash: 1, y: 0, duration: 0.14, ease: "power2.in" })
    // sprint off-stage, accelerating (strides follow the speed)
    .to(pose, { run: 1, duration: 0.3, ease: "power1.out" }, "<")
    .to(pose, { x: OFFSTAGE_X + 0.4, duration: 1.6, ease: "power2.in" }, "<")
    // out of sight: tuck the limbs and line up behind the edge
    .set(pose, { run: 0, limbs: 0, turn: -0.45, tilt: 0, y: 0.05, x: OFFSTAGE_X }, "+=0.6")
    .call(() => setExpr("normal"))
    // sneak in slowly, leaning in
    .to(pose, { x: 2.05, duration: 1.7, ease: "power2.out" })
    .to(pose, { tilt: 0.12, duration: 1.2, ease: "sine.inOut" }, "<0.3")
    .set(pose, { peek: 1 }, "<")
    // cool little glasses wiggle + bob
    .to(pose, { shades: 0.88, duration: 0.14, yoyo: true, repeat: 3, ease: "sine.inOut" }, "+=0.35")
    .to(pose, { y: 0.14, duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut" }, ">0.2")
    .to(pose, { x: 1.95, tilt: 0.18, duration: 0.6, ease: "sine.inOut" }, ">0.3")
    .to({}, { duration: 1.0 })
    // whoops — duck back out
    .call(() => setExpr("surprised"))
    .to(pose, { x: OFFSTAGE_X, tilt: 0, duration: 0.45, ease: "power2.in" })
    // moonwalk back in: facing right, gliding left at a steady pace
    .set(pose, { peek: 0, limbs: 1, y: 0, x: OFFSTAGE_X, turn: 1.25 }, "+=0.5")
    .call(() => setExpr("happy"))
    .to(pose, { moon: 1, duration: 0.25, ease: "power1.out" })
    .to(pose, { x: 0, duration: 4.3, ease: "none" }, "<")
    .to(pose, { moon: 0, duration: 0.3, ease: "power1.in" }, ">-0.3")
    // spin round to face the audience with a little pop
    .to(pose, { turn: -TAU, duration: 0.55, ease: "power2.out" })
    .set(pose, { turn: 0 })
    .to(pose.armR, { raise: 2.4, bend: 0.3, grip: 0, duration: 0.25, ease: "back.out(2)" }, "<")
    .to(pose, { squash: 1.06, duration: 0.2, yoyo: true, repeat: 1 }, "<");
  toRest(tl, pose, ">0.3");
  tl.call(() => setExpr("normal"));
  return tl;
}


/**
 * Roll-in timed to the recorded hero voice (public/sunny/hero.mp3). Seconds are from the start of the clip:
 * "Wooohooo!" 0–1.1 · "Whoa, whoa, okay," 1.5–2.8 · "I'm here!" 3.0–3.5 · "Hi," 3.9 · "I'm Sunny!" 4.7–5.1 ·
 * then the pitch until ~18 s ("Scroll down and let me show you!" at 16.6).
 */
export function rollInSynced(pose: Pose, setExpr: SetExpr, from: number) {
  const tl = gsap.timeline();
  pose.x = from;
  pose.y = BALL_Y;
  pose.limbs = 0;
  pose.roll = -TAU * 1.25;
  const A = (arm: Pose["armL"], v: Partial<Pose["armL"]>, d: number, at: number, extra: gsap.TweenVars = {}) => tl.to(arm, { ...v, duration: d, ...extra }, at);
  // "Wooohooo!" — the roll-in lasts exactly as long as the whoop (voice starts with the "rollin" event)
  tl.call(() => setExpr("happy"), [], 0)
    .call(() => sunnyEvent("rollin"), [], 0)
    .to(pose, { x: 0, roll: 0, duration: 1.1, ease: "power2.out" }, 0)
    // pops up as the whoop ends
    .call(() => setExpr("surprised"), [], 1.1)
    .to(pose, { y: 0.55, squash: 1.12, duration: 0.3, ease: "power2.out" }, 1.1)
    .to(pose, { limbs: 1, duration: 0.4, ease: "back.out(2.4)" }, 1.1)
    .to(pose, { y: 0, duration: 0.2, ease: "power2.in" }, 1.4);
  land(tl, pose, 1.6);
  // "Whoa, whoa, okay," — dizzy wobble, then a head-shake on "okay"
  tl.call(() => setExpr("dizzy"), [], 1.5)
    .to(pose, { tilt: 0.22, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: 5 }, 1.5);
  A(pose.armL, { raise: 0.9, bend: 0.9 }, 0.3, 1.5);
  A(pose.armR, { raise: 0.9, bend: 0.9 }, 0.3, 1.5);
  tl.to(pose, { turn: 0.32, duration: 0.12, yoyo: true, repeat: 7, ease: "sine.inOut" }, 2.4)
    // "I'm here!" — ta-da!
    .call(() => setExpr("happy"), [], 2.98);
  A(pose.armL, { raise: 2.5, bend: 0.15, grip: 0 }, 0.35, 3.0, { ease: "back.out(2)" });
  A(pose.armR, { raise: 2.5, bend: 0.15, grip: 0 }, 0.35, 3.0, { ease: "back.out(2)" });
  tl.to(pose, { squash: 1.06, y: 0.14, duration: 0.25, ease: "power2.out" }, 3.0).to(pose, { y: 0, duration: 0.2, ease: "power2.in" }, 3.28);
  // "Hi, I'm Sunny!" — a friendly wave
  A(pose.armL, { ...REST.armL }, 0.35, 3.6);
  A(pose.armR, { raise: 2.3, fwd: 0.1, bend: 0.3, grip: 0 }, 0.25, 3.8);
  A(pose.armR, { raise: 2.0, bend: 0.5 }, 0.2, 3.95, { yoyo: true, repeat: 5, ease: "sine.inOut" });
  tl.to(pose, { tilt: 0.1, duration: 0.5, ease: "sine.inOut" }, 3.8).to(pose, { tilt: 0, duration: 0.4 }, 4.7);
  // talks with his hands for the rest of the pitch, keyed to the sentences
  A(pose.armR, { ...REST.armR }, 0.4, 5.1);
  const talking = 5.2;
  // gentle breathing bob while he talks
  tl.to(pose, { squash: 1.025, duration: 0.34, yoyo: true, repeat: 36, ease: "sine.inOut" }, talking);
  // "Yes, the actual sun." — open palm
  A(pose.armL, { raise: 0.9, fwd: 0.5, bend: 0.3, grip: 0 }, 0.3, 5.3);
  A(pose.armL, { ...REST.armL }, 0.4, 6.3);
  // "Well, the S E O kind." — wry little tilt + shrug
  tl.to(pose, { tilt: -0.12, duration: 0.3, ease: "sine.inOut" }, 7.15).to(pose, { tilt: 0, duration: 0.4 }, 8.1);
  A(pose.armR, { raise: 0.8, fwd: 0.3, bend: 0.6, grip: 0.2 }, 0.3, 7.2);
  A(pose.armR, { ...REST.armR }, 0.4, 8.1);
  // "We help your brand get found on Google and in A I search," — arms spread, hop on "found"
  A(pose.armL, { raise: 1.1, fwd: 0.2, bend: 0.2, grip: 0 }, 0.35, 10.4);
  A(pose.armR, { raise: 1.1, fwd: 0.2, bend: 0.2, grip: 0 }, 0.35, 10.4);
  tl.to(pose, { y: 0.25, squash: 1.05, duration: 0.2, ease: "power2.out" }, 11.0).to(pose, { y: 0, duration: 0.2, ease: "power2.in" }, 11.2);
  A(pose.armL, { raise: 2.2 }, 0.4, 11.5);
  A(pose.armR, { raise: 2.2 }, 0.4, 11.5);
  A(pose.armL, { ...REST.armL }, 0.4, 12.5);
  A(pose.armR, { ...REST.armR }, 0.4, 12.5);
  // "so people stop asking who are you?" — big shrug
  tl.to(pose, { tilt: 0.14, turn: 0.2, duration: 0.4, ease: "sine.inOut" }, 13.0).to(pose, { tilt: 0, turn: 0, duration: 0.5 }, 14.0);
  A(pose.armL, { raise: 0.7, bend: 1.0, grip: 0 }, 0.3, 13.0);
  A(pose.armR, { raise: 0.7, bend: 1.0, grip: 0 }, 0.3, 13.0);
  A(pose.armL, { ...REST.armL }, 0.4, 14.5);
  A(pose.armR, { ...REST.armR }, 0.4, 14.5);
  // "...a lot of brands..." keep nodding along
  tl.to(pose, { tilt: 0.06, duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut" }, 14.6);
  // "Scroll down and let me show you!" — points down, bounces
  tl.call(() => setExpr("surprised"), [], 16.55).call(() => setExpr("happy"), [], 16.9);
  A(pose.armR, { raise: -0.2, fwd: 1.2, bend: 0.1, grip: 0.1 }, 0.3, 16.6, { ease: "back.out(2)" });
  A(pose.armR, { raise: -0.5 }, 0.25, 17.0, { yoyo: true, repeat: 3, ease: "sine.inOut" });
  tl.to(pose, { y: 0.2, duration: 0.18, ease: "power2.out", yoyo: true, repeat: 3 }, 17.0);
  tl.call(() => sunnyEvent("arrive"), [], 18.1);
  tl.to({}, { duration: 0.3 }, 18.4);
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}


/** Phrase times (seconds) of public/sunny/services.mp3, merged from its pauses. */
const SERVICES_PHRASES: [number, number][] = [[0.1, 1.57], [1.78, 2.52], [2.85, 4.4], [4.95, 6.25], [6.6, 8.62], [8.83, 10.2], [10.8, 12.05], [12.35, 15.45], [16.18, 16.88], [17.4, 17.95], [18.3, 19.32], [19.65, 20.32], [20.98, 21.62], [22.23, 23.6], [23.78, 26.05], [26.5, 27.88], [28.12, 29.8], [30.28, 30.93], [31.12, 31.6], [32.25, 33.45], [33.62, 34.35], [34.8, 36.35], [36.8, 37.4]];

/**
 * "Bouncy, like he's showing off a menu": a hop and a presenting gesture on every phrase of the
 * services voice (alternating left / right hand, both hands up, "holding the menu"), with a
 * constant happy bounce between them. Locked so the card-change nods wait until he is done.
 */
export function menuShow(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.data = "locked";
  const end = SERVICES_PHRASES[SERVICES_PHRASES.length - 1][1];
  tl.call(() => setExpr("happy"), [], 0);
  // constant happy sway
  tl.to(pose, { tilt: 0.07, duration: 0.42, ease: "sine.inOut", yoyo: true, repeat: Math.ceil(end / 0.42) }, 0);
  const open = { grip: 0, bend: 0.2 };
  SERVICES_PHRASES.forEach(([s, e], i) => {
    const d = Math.max(0.25, e - s);
    const g = i % 5;
    // a hop on the first word of every phrase
    tl.to(pose, { y: 0.2, squash: 1.06, duration: 0.14, ease: "power2.out" }, s)
      .to(pose, { y: 0, squash: 1, duration: 0.14, ease: "power2.in" }, s + 0.14);
    if (g === 0) {
      tl.to(pose.armL, { raise: 1.3, fwd: 0.7, ...open, duration: 0.25, ease: "back.out(2)" }, s)
        .to(pose, { turn: -0.3, duration: 0.3, ease: "sine.inOut" }, s);
    } else if (g === 1) {
      tl.to(pose.armR, { raise: 1.3, fwd: 0.7, ...open, duration: 0.25, ease: "back.out(2)" }, s)
        .to(pose, { turn: 0.3, duration: 0.3, ease: "sine.inOut" }, s);
    } else if (g === 2) {
      tl.to([pose.armL, pose.armR], { raise: 2.4, fwd: 0, ...open, duration: 0.3, ease: "back.out(2)" }, s)
        .to(pose, { y: 0.3, duration: 0.18, ease: "power2.out" }, s + 0.05);
    } else if (g === 3) {
      // "holding the menu": both hands out front, little nods
      tl.to([pose.armL, pose.armR], { raise: 0.6, fwd: 1.1, bend: 0.8, grip: 0.4, duration: 0.3 }, s)
        .to(pose, { tilt: -0.08, duration: 0.25, yoyo: true, repeat: 3, ease: "sine.inOut" }, s + 0.1);
    } else {
      // ta-da point with the other hand + wiggle
      tl.to(pose.armR, { raise: 1.8, fwd: 0.4, ...open, duration: 0.25, ease: "back.out(2)" }, s)
        .to(pose.armL, { raise: 0.8, fwd: 0.3, ...open, duration: 0.25 }, s)
        .to(pose, { turn: 0.2, duration: 0.18, yoyo: true, repeat: 3, ease: "sine.inOut" }, s + 0.1);
    }
    // arms relax between phrases
    tl.to([pose.armL, pose.armR], { ...REST.armL, duration: 0.25, ease: "sine.inOut" }, s + Math.min(d, 2.0) + 0.05)
      .to(pose, { turn: 0, duration: 0.3 }, s + Math.min(d, 2.0) + 0.05);
  });
  // final flourish: big ta-da on the last word ("Kidding!")
  const last = SERVICES_PHRASES[SERVICES_PHRASES.length - 1][0];
  tl.to([pose.armL, pose.armR], { raise: 2.5, fwd: 0, grip: 0, bend: 0.15, duration: 0.3, ease: "back.out(2)" }, last)
    .to(pose, { y: 0.35, squash: 1.08, duration: 0.2, ease: "power2.out" }, last)
    .to(pose, { y: 0, duration: 0.22, ease: "power2.in" }, last + 0.2);
  land(tl, pose, last + 0.42);
  tl.to({}, { duration: 0.2 }, end + 0.3);
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}


/** Phrase times (seconds) of public/sunny/work.mp3 (pauses shorter than 0.35 s are merged). */
const WORK_SEGMENTS: [number, number][] = [[0.08, 1.48], [1.75, 2.6], [2.78, 3.85], [4.35, 5.38], [5.65, 6.35], [6.7, 6.93], [7.1, 7.45], [7.65, 8.48], [8.7, 9.48], [9.88, 11.88], [12.35, 13.1], [13.33, 14.0], [14.25, 15.08], [15.55, 16.18], [16.48, 17.62], [18.0, 18.27], [18.5, 19.35], [19.75, 20.15], [20.38, 21.9], [22.28, 22.68], [22.93, 23.9], [24.3, 24.7], [24.95, 25.43], [25.65, 25.95]];
const mergePhrases = (list: [number, number][], gap = 0.35) =>
  list.reduce<[number, number][]>((out, [s, e]) => {
    const last = out[out.length - 1];
    if (last && s - last[1] < gap) last[1] = e;
    else out.push([s, e]);
    return out;
  }, []);

/**
 * "Proud, a little bragging": chest out, hands on hips, pointing at himself, a cool shades-adjust,
 * a smug lean-back and a big ta-da — one on every phrase of the work voice, with a slow proud sway
 * between them. Locked so other cues wait until he is done.
 */
export function prideShow(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.data = "locked";
  const phrases = mergePhrases(WORK_SEGMENTS);
  const end = phrases[phrases.length - 1][1];
  tl.call(() => setExpr("happy"), [], 0);
  // slow, smug sway and a chest that stays puffed out
  tl.to(pose, { tilt: -0.05, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: Math.ceil(end / 0.9) }, 0)
    .to(pose, { squash: 1.04, duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: Math.ceil(end / 0.7) }, 0);
  const hips = { raise: 0.5, fwd: 0, bend: 1.4, grip: 0.6 };
  phrases.forEach(([s, e], i) => {
    const hold = Math.min(Math.max(0.4, e - s), 2.2);
    const g = i % 5;
    if (g === 0) {
      // hands on hips, chin up
      tl.to([pose.armL, pose.armR], { ...hips, duration: 0.3, ease: "back.out(2)" }, s)
        .to(pose, { tilt: -0.1, turn: 0.18, y: 0.1, duration: 0.3, ease: "power2.out" }, s)
        .to(pose, { y: 0, duration: 0.25, ease: "power2.in" }, s + 0.3);
    } else if (g === 1) {
      // points proudly at himself
      tl.to(pose.armR, { raise: 1.0, fwd: 0.9, bend: 1.7, grip: 0.8, duration: 0.3, ease: "back.out(2)" }, s)
        .to(pose.armR, { raise: 1.15, duration: 0.2, yoyo: true, repeat: 3, ease: "sine.inOut" }, s + 0.35)
        .to(pose, { turn: -0.15, duration: 0.3, ease: "sine.inOut" }, s);
    } else if (g === 2) {
      // cool: pushes his shades up and leans back
      tl.to(pose.armR, { raise: 2.3, fwd: 0.2, bend: 1.2, grip: 0.5, duration: 0.3, ease: "back.out(2)" }, s)
        .to(pose, { shades: 0.86, duration: 0.14, yoyo: true, repeat: 3, ease: "sine.inOut" }, s + 0.2)
        .to(pose, { tilt: -0.14, duration: 0.35, ease: "sine.inOut" }, s);
    } else if (g === 3) {
      // arms folded, smug little rock
      tl.to([pose.armL, pose.armR], { raise: 0.3, fwd: 0.7, bend: 1.7, grip: 0.7, duration: 0.3 }, s)
        .to(pose, { squash: 1.07, y: 0.06, duration: 0.3, ease: "power2.out" }, s)
        .to(pose, { turn: 0.2, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, s + 0.2);
    } else {
      // big grin, arms up, hop
      tl.to([pose.armL, pose.armR], { raise: 2.4, fwd: 0, bend: 0.2, grip: 0, duration: 0.3, ease: "back.out(2)" }, s)
        .to(pose, { y: 0.3, squash: 1.08, duration: 0.2, ease: "power2.out" }, s + 0.05)
        .to(pose, { y: 0, duration: 0.22, ease: "power2.in" }, s + 0.25);
    }
    tl.to([pose.armL, pose.armR], { ...REST.armL, duration: 0.3, ease: "sine.inOut" }, s + hold)
      .to(pose, { turn: 0, y: 0, duration: 0.3 }, s + hold);
  });
  // finish: "Anyway, go on, tap!" — points to the dots
  const lastStart = phrases[phrases.length - 1][0];
  tl.to(pose.armR, { raise: 0.1, fwd: 1.3, bend: 0.1, grip: 0.1, duration: 0.3, ease: "back.out(2)" }, lastStart)
    .to(pose, { turn: 0.3, duration: 0.3 }, lastStart)
    .to(pose.armR, { raise: -0.2, duration: 0.2, yoyo: true, repeat: 3, ease: "sine.inOut" }, lastStart + 0.4);
  tl.to({}, { duration: 0.2 }, end + 0.3);
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}


/**
 * Finale, timed to public/sunny/finale.mp3 (seconds from the start of the clip):
 * "Aaaand we made it!" 0 · "ready to shine?" 2.8 · "hiding in the shade" 4.4 · "Here's the easy part" 8 ·
 * "See this little form right here?" 10 · "Pop in your name… tap… hit send" 11.5–15 · "That's it!" 15.5 ·
 * laugh 16.3 · "No long forms…" 16.9 · "less time than I roll" 20.6 · "no spam, ever" 24 · "Sunny's honor!" 27 ·
 * "Prefer to chat?" 28 · "WhatsApp button" 29 · "thanks" 30.6 · "glowing" 33 · "Bye for now!" 35.
 */
export function finaleShow(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.data = "locked";
  const arm = (a: Pose["armL"], v: Partial<Pose["armL"]>, d: number, at: number, extra: gsap.TweenVars = {}) => tl.to(a, { ...v, duration: d, ...extra }, at);
  const both = (v: Partial<Pose["armL"]>, d: number, at: number, extra: gsap.TweenVars = {}) => tl.to([pose.armL, pose.armR], { ...v, duration: d, ...extra }, at);
  const rest = (at: number, d = 0.3) => {
    tl.to([pose.armL, pose.armR], { ...REST.armL, duration: d, ease: "sine.inOut" }, at).to(pose, { turn: 0, tilt: 0, y: 0, roll: 0, duration: d }, at);
  };
  const hop = (at: number, h = 0.25) => tl.to(pose, { y: h, squash: 1.06, duration: 0.18, ease: "power2.out" }, at).to(pose, { y: 0, squash: 1, duration: 0.2, ease: "power2.in" }, at + 0.18);
  tl.call(() => setExpr("happy"), [], 0);
  // gentle happy sway all the way through
  tl.to(pose, { squash: 1.025, duration: 0.5, yoyo: true, repeat: 75, ease: "sine.inOut" }, 0);

  // "Aaaand we made it to the end!" — arms up, hop
  both({ raise: 2.5, fwd: 0, bend: 0.2, grip: 0 }, 0.3, 0.1, { ease: "back.out(2)" });
  hop(0.3, 0.35);
  rest(2.3);
  // "So, ready to shine?" — hands out like rays, shades flick
  both({ raise: 1.3, fwd: 0.3, bend: 0.2, grip: 0 }, 0.3, 2.85, { ease: "back.out(2)" });
  tl.to(pose, { shades: 0.86, duration: 0.14, yoyo: true, repeat: 3, ease: "sine.inOut" }, 3.2);
  rest(4.2);
  // "Your brand has been hiding in the shade for way too long." — little shrug, head tilt
  both({ raise: 0.7, bend: 1.0, grip: 0 }, 0.3, 4.5);
  tl.to(pose, { tilt: 0.14, turn: 0.15, duration: 0.5, ease: "sine.inOut" }, 4.5).to(pose, { tilt: -0.1, duration: 0.8, ease: "sine.inOut" }, 5.6);
  rest(7.6, 0.4);
  // "Here's the easy part." — beckons with one hand
  arm(pose.armR, { raise: 1.4, fwd: 0.8, bend: 0.6, grip: 0.2 }, 0.3, 8.05, { ease: "back.out(2)" });
  arm(pose.armR, { bend: 1.3 }, 0.25, 8.4, { yoyo: true, repeat: 3, ease: "sine.inOut" });
  rest(9.4);
  // "See this little form right here?" — points down at the form, bouncing
  arm(pose.armR, { raise: -0.5, fwd: 1.1, bend: 0.1, grip: 0.1 }, 0.3, 10.0, { ease: "back.out(2)" });
  arm(pose.armR, { raise: -0.8 }, 0.22, 10.35, { yoyo: true, repeat: 5, ease: "sine.inOut" });
  tl.to(pose, { turn: -0.25, duration: 0.3 }, 10.0);
  // "Pop in your name and your number, tap what you need help with, and hit send." — air-typing, then a big press
  rest(11.3, 0.2);
  both({ raise: 0.2, fwd: 0.9, bend: 1.2, grip: 0.7 }, 0.25, 11.55);
  arm(pose.armL, { fwd: 0.6 }, 0.17, 11.8, { yoyo: true, repeat: 9, ease: "sine.inOut" });
  arm(pose.armR, { fwd: 1.1 }, 0.17, 11.9, { yoyo: true, repeat: 9, ease: "sine.inOut" });
  tl.to(pose, { tilt: 0.06, duration: 0.3, yoyo: true, repeat: 7, ease: "sine.inOut" }, 11.6);
  arm(pose.armR, { raise: 0.5, fwd: 1.5, bend: 0.2, grip: 0.1 }, 0.14, 14.5, { ease: "power2.out" }); // SEND
  hop(14.55, 0.2);
  // "That's it!" — ta-da
  both({ raise: 2.5, fwd: 0, bend: 0.2, grip: 0 }, 0.3, 15.5, { ease: "back.out(2)" });
  hop(15.55, 0.35);
  // "Ha!" — shoulders shaking with laughter
  tl.to(pose, { squash: 0.96, tilt: 0.08, duration: 0.09, yoyo: true, repeat: 7 }, 16.3);
  rest(16.8, 0.2);
  // "No long forms, no boring paperwork, I promise." — palms out, head shake "no"
  both({ raise: 1.2, fwd: 0.6, bend: 0.3, grip: 0 }, 0.3, 16.95, { ease: "back.out(2)" });
  tl.to(pose, { turn: 0.28, duration: 0.2, yoyo: true, repeat: 7, ease: "sine.inOut" }, 17.1);
  arm(pose.armL, { raise: 1.0 }, 0.3, 18.5, { yoyo: true, repeat: 3, ease: "sine.inOut" });
  rest(20.2);
  // "It takes less time than it takes me to roll across the screen." — a quick roll
  tl.call(() => setExpr("surprised"), [], 21.5)
    .to(pose, { limbs: 0, y: -0.4, duration: 0.2 }, 21.6)
    .to(pose, { roll: -Math.PI * 2, duration: 0.8, ease: "power1.inOut" }, 21.7)
    .set(pose, { roll: 0 }, 22.5)
    .to(pose, { limbs: 1, y: 0.3, squash: 1.1, duration: 0.3, ease: "back.out(2.4)" }, 22.5)
    .to(pose, { y: 0, squash: 1, duration: 0.25, ease: "power2.in" }, 22.8)
    .call(() => setExpr("happy"), [], 23.1);
  // "And don't worry, no spam, ever." — hand on heart, firm head shake on "no spam"
  arm(pose.armR, { raise: 0.5, fwd: 0.6, bend: 1.5, grip: 0.8 }, 0.3, 23.95, { ease: "back.out(2)" });
  tl.to(pose, { turn: 0.3, duration: 0.14, yoyo: true, repeat: 3, ease: "sine.inOut" }, 25.5);
  rest(26.6, 0.25);
  // "Sunny's honor!" — salute + shades flick
  arm(pose.armR, { raise: 2.3, fwd: 0.3, bend: 1.7, grip: 0.4 }, 0.25, 26.95, { ease: "back.out(2)" });
  tl.to(pose, { shades: 0.84, duration: 0.14, yoyo: true, repeat: 3, ease: "sine.inOut" }, 27.1);
  hop(27.2, 0.2);
  rest(27.9, 0.25);
  // "Prefer to chat? There's a WhatsApp button, too." — phone to the ear, then points to the button
  arm(pose.armR, { raise: 2.3, fwd: 0.2, bend: 1.8, grip: 0.7 }, 0.3, 28.05, { ease: "back.out(2)" });
  tl.to(pose, { tilt: -0.14, duration: 0.3 }, 28.1);
  rest(28.8, 0.25);
  arm(pose.armR, { raise: -0.2, fwd: 1.2, bend: 0.1, grip: 0.1 }, 0.3, 29.0, { ease: "back.out(2)" });
  arm(pose.armR, { raise: -0.5 }, 0.22, 29.4, { yoyo: true, repeat: 3, ease: "sine.inOut" });
  rest(30.3);
  // "Okay, thanks for hanging out with me." — warm little bow, hands on chest
  both({ raise: 0.5, fwd: 0.5, bend: 1.5, grip: 0.7 }, 0.3, 30.6);
  tl.to(pose, { squash: 0.93, tilt: 0.1, duration: 0.5, ease: "sine.inOut" }, 31.4).to(pose, { squash: 1, tilt: 0, duration: 0.5 }, 32.0);
  // "I'll be right here, glowing." — arms wide, shades on, sway
  both({ raise: 1.6, fwd: 0, bend: 0.15, grip: 0 }, 0.4, 32.95, { ease: "back.out(2)" });
  tl.to(pose, { tilt: 0.08, duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut" }, 33.0).to(pose, { shades: 1, duration: 0.3 }, 33.0);
  // "Bye for now!" — big goodbye wave and a hop
  arm(pose.armL, { ...REST.armL }, 0.2, 34.9);
  arm(pose.armR, { raise: 2.4, fwd: 0.1, bend: 0.3, grip: 0 }, 0.25, 35.0, { ease: "back.out(2)" });
  arm(pose.armR, { raise: 2.0, bend: 0.6 }, 0.2, 35.25, { yoyo: true, repeat: 7, ease: "sine.inOut" });
  hop(35.1, 0.3);
  tl.to({}, { duration: 0.2 }, 36.8);
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}


/**
 * SEO journey, timed to public/sunny/journey.mp3 (seconds from the start of the clip; the moments are
 * estimated from the sentence pauses): "watch this" 0 · "types a search" 4 · "tap, tap, tap" 8.6 ·
 * "where's your brand?" 9.8 · "hiding" 11.5 · "not even my mom" 15 · "don't panic" 16.2 · "Step one, Discover" 18.6 ·
 * "Step two, Optimise" 24.8 · "ooooh" 32 · "Step three, Grow" 33.3 · "climbing, one, two, three" 35.4–38.5 ·
 * "visibility line" 39.2 · "no tricks" 42.2 · "research… links… properly" 44–48.5 · "Cheering. Loudly." 51.
 */
function journeyShowRaw(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline({ paused: true });
  tl.data = "locked";
  const arm = (a: Pose["armL"], v: Partial<Pose["armL"]>, d: number, at: number, extra: gsap.TweenVars = {}) => tl.to(a, { ...v, duration: d, ...extra }, at);
  const both = (v: Partial<Pose["armL"]>, d: number, at: number, extra: gsap.TweenVars = {}) => tl.to([pose.armL, pose.armR], { ...v, duration: d, ...extra }, at);
  const rest = (at: number, d = 0.3) => {
    tl.to([pose.armL, pose.armR], { ...REST.armL, duration: d, ease: "sine.inOut" }, at).to(pose, { turn: 0, tilt: 0, y: 0, roll: 0, squash: 1, duration: d }, at);
  };
  const hop = (at: number, h = 0.25) => tl.to(pose, { y: h, squash: 1.06, duration: 0.16, ease: "power2.out" }, at).to(pose, { y: 0, squash: 1, duration: 0.18, ease: "power2.in" }, at + 0.16);
  tl.call(() => setExpr("happy"), [], 0);
  tl.to(pose, { squash: 1.02, duration: 0.5, yoyo: true, repeat: 110, ease: "sine.inOut" }, 0);

  // "Okay, okay, watch this, this is my favorite trick!" — rubs his hands, leans in
  both({ raise: 0.6, fwd: 0.8, bend: 1.2, grip: 0.5 }, 0.3, 0.2);
  arm(pose.armL, { fwd: 0.5 }, 0.12, 0.5, { yoyo: true, repeat: 9, ease: "sine.inOut" });
  arm(pose.armR, { fwd: 1.1 }, 0.12, 0.5, { yoyo: true, repeat: 9, ease: "sine.inOut" });
  tl.to(pose, { tilt: 0.1, duration: 0.5, ease: "sine.inOut" }, 0.4);
  rest(3.4, 0.3);
  // "Somebody types a search. Wedding photographer near me." — air-typing
  both({ raise: 0.2, fwd: 0.9, bend: 1.2, grip: 0.7 }, 0.25, 4.0);
  arm(pose.armL, { fwd: 0.6 }, 0.16, 4.3, { yoyo: true, repeat: 17, ease: "sine.inOut" });
  arm(pose.armR, { fwd: 1.1 }, 0.16, 4.4, { yoyo: true, repeat: 17, ease: "sine.inOut" });
  tl.to(pose, { tilt: 0.05, duration: 0.3, yoyo: true, repeat: 13, ease: "sine.inOut" }, 4.2);
  // "Tap, tap, tap." — three firm key taps
  [8.6, 9.0, 9.4].forEach((t) => arm(pose.armR, { raise: 0.5, fwd: 1.5 }, 0.12, t, { yoyo: true, repeat: 1, ease: "power2.out" }));
  rest(9.75, 0.25);
  // "And where's your brand?" — hand over the eyes, looking around
  arm(pose.armR, { raise: 2.2, fwd: 0.4, bend: 1.4, grip: 0.2 }, 0.3, 9.9, { ease: "back.out(2)" });
  tl.call(() => setExpr("surprised"), [], 10.0)
    .to(pose, { turn: 0.4, duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut" }, 10.2);
  // "Way down here. Hiding." — points down, sad shrug
  arm(pose.armR, { raise: -0.5, fwd: 1.1, bend: 0.1, grip: 0.1 }, 0.3, 11.5, { ease: "back.out(2)" });
  arm(pose.armR, { raise: -0.8 }, 0.22, 11.9, { yoyo: true, repeat: 3, ease: "sine.inOut" });
  tl.call(() => setExpr("normal"), [], 12.2).to(pose, { squash: 0.94, tilt: 0.12, duration: 0.5, ease: "sine.inOut" }, 12.3);
  rest(13.0, 0.25);
  // "Nobody scrolls that far! Not even my mom!" — head shake, arms wide
  both({ raise: 1.1, fwd: 0.2, bend: 0.3, grip: 0 }, 0.3, 13.1, { ease: "back.out(2)" });
  tl.call(() => setExpr("surprised"), [], 13.1).to(pose, { turn: 0.3, duration: 0.18, yoyo: true, repeat: 7, ease: "sine.inOut" }, 13.3);
  rest(16.0, 0.25);
  // "But don't panic, we've got a plan." — calming palms, then a fist pump
  tl.call(() => setExpr("happy"), [], 16.1);
  both({ raise: 0.9, fwd: 0.7, bend: 0.2, grip: 0 }, 0.3, 16.2, { ease: "back.out(2)" });
  both({ raise: 0.6 }, 0.3, 16.6, { yoyo: true, repeat: 1, ease: "sine.inOut" });
  arm(pose.armR, { raise: 2.0, fwd: 0.2, bend: 1.2, grip: 1 }, 0.25, 17.8, { ease: "back.out(2)" });
  hop(18.0, 0.28);
  rest(18.5, 0.2);
  // "Step one... Discover." — one finger up, then peers through a magnifier
  arm(pose.armR, { raise: 2.4, fwd: 0, bend: 0.2, grip: 0.9 }, 0.3, 18.6, { ease: "back.out(2)" });
  arm(pose.armR, { raise: 1.4, fwd: 0.7, bend: 1.6, grip: 0.5 }, 0.3, 20.0);
  tl.to(pose, { shades: 0.75, duration: 0.25 }, 20.0).to(pose, { turn: 0.35, duration: 0.6, yoyo: true, repeat: 5, ease: "sine.inOut" }, 20.8);
  tl.to(pose, { shades: 1, duration: 0.25 }, 24.4);
  rest(24.5, 0.25);
  // "Step two... Optimise." — two arms up, then twiddles a dial
  both({ raise: 2.2, fwd: 0, bend: 0.2, grip: 0.9 }, 0.3, 24.8, { ease: "back.out(2)" });
  arm(pose.armR, { raise: 0.5, fwd: 1.1, bend: 1.3, grip: 0.8 }, 0.3, 26.3);
  arm(pose.armL, { raise: 0.5, fwd: 1.0, bend: 1.3, grip: 0.8 }, 0.3, 26.3);
  arm(pose.armR, { bend: 1.9 }, 0.22, 27.2, { yoyo: true, repeat: 9, ease: "sine.inOut" });
  tl.to(pose, { tilt: 0.06, duration: 0.3, yoyo: true, repeat: 9, ease: "sine.inOut" }, 27.2);
  rest(31.0, 0.2);
  // "until Google goes... ooooh!" — wide-eyed wow, steps back, shades slip
  tl.call(() => setExpr("surprised"), [], 31.8);
  both({ raise: 2.0, fwd: 0.2, bend: 0.2, grip: 0 }, 0.3, 31.9, { ease: "back.out(2)" });
  tl.to(pose, { shades: 0.82, duration: 0.2, yoyo: true, repeat: 3 }, 32.2).to(pose, { squash: 1.07, duration: 0.3 }, 32.1);
  rest(33.0, 0.25);
  // "And step three... Grow!" — crouches, then shoots up tall
  tl.call(() => setExpr("happy"), [], 33.3);
  tl.to(pose, { squash: 0.8, duration: 0.7, ease: "power2.in" }, 33.4);
  both({ raise: 0.3, fwd: 0.3, bend: 0.8, grip: 0.5 }, 0.5, 33.5);
  tl.to(pose, { squash: 1.14, y: 0.3, duration: 0.3, ease: "back.out(2)" }, 34.55);
  both({ raise: 2.6, fwd: 0, bend: 0.1, grip: 0 }, 0.3, 34.55, { ease: "back.out(2)" });
  tl.to(pose, { squash: 1, y: 0, duration: 0.4, ease: "power2.in" }, 35.0);
  // "Look! Your brand starts climbing!" — climbs an invisible ladder, hand over hand
  arm(pose.armL, { raise: 2.4, fwd: 0.3, bend: 0.4, grip: 0.8 }, 0.25, 35.3);
  arm(pose.armR, { raise: 1.2, fwd: 0.3, bend: 0.4, grip: 0.8 }, 0.25, 35.3);
  arm(pose.armL, { raise: 1.2 }, 0.3, 35.9, { yoyo: true, repeat: 5, ease: "sine.inOut" });
  arm(pose.armR, { raise: 2.4 }, 0.3, 35.9, { yoyo: true, repeat: 5, ease: "sine.inOut" });
  // "One step up! Two! Three!" — three rising hops
  hop(37.1, 0.3);
  hop(37.9, 0.4);
  hop(38.3, 0.55);
  rest(38.9, 0.25);
  // "Ha! Whoa, look at that visibility line go!" — laughs, points up at the card as the line climbs
  tl.to(pose, { squash: 0.96, tilt: 0.07, duration: 0.09, yoyo: true, repeat: 5 }, 39.0);
  tl.to(pose, { turn: 0.4, duration: 0.3 }, 39.5);
  arm(pose.armR, { raise: 0.3, fwd: 1.3, bend: 0.1, grip: 0.1 }, 0.3, 39.6, { ease: "back.out(2)" });
  arm(pose.armR, { raise: 2.1 }, 1.8, 40.4, { ease: "power1.inOut" });
  hop(42.0, 0.35);
  rest(42.1, 0.2);
  // "No tricks, no shortcuts." — palms out, head shake
  both({ raise: 1.2, fwd: 0.6, bend: 0.3, grip: 0 }, 0.3, 42.2, { ease: "back.out(2)" });
  tl.to(pose, { turn: 0.28, duration: 0.2, yoyo: true, repeat: 5, ease: "sine.inOut" }, 42.3);
  rest(43.7, 0.25);
  // "Just research, a user-friendly site, and good links, done properly." — counts the three off, then a thumbs-up
  arm(pose.armL, { raise: 1.2, fwd: 0.7, bend: 0.3, grip: 0 }, 0.3, 44.4, { ease: "back.out(2)" });
  arm(pose.armR, { raise: 1.2, fwd: 0.7, bend: 0.3, grip: 0 }, 0.3, 45.6, { ease: "back.out(2)" });
  both({ raise: 2.0, fwd: 0.2, bend: 0.3, grip: 0 }, 0.3, 47.2, { ease: "back.out(2)" });
  arm(pose.armR, { raise: 1.6, fwd: 0.5, bend: 0.8, grip: 1 }, 0.3, 47.9, { ease: "back.out(2)" });
  hop(48.2, 0.28);
  rest(48.9, 0.25);
  // "Okay, I'll be right here. Cheering. Loudly." — proud stance, then full-on cheering
  both({ raise: 0.5, fwd: 0, bend: 1.4, grip: 0.6 }, 0.3, 49.2);
  both({ raise: 2.5, fwd: 0, bend: 0.1, grip: 0 }, 0.25, 51.1, { ease: "back.out(2)" });
  arm(pose.armL, { raise: 1.9 }, 0.18, 51.4, { yoyo: true, repeat: 5, ease: "sine.inOut" });
  arm(pose.armR, { raise: 1.9 }, 0.18, 51.5, { yoyo: true, repeat: 5, ease: "sine.inOut" });
  hop(51.15, 0.35);
  hop(51.75, 0.35);
  tl.to({}, { duration: 0.2 }, 53.2);
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}

/**
 * The journey act, retimed to the current recording: the gestures were written against the first
 * take, so a driver timeline plays them through the old→new time map (see journeyTiming).
 */
export function journeyShow(pose: Pose, setExpr: SetExpr) {
  const inner = journeyShowRaw(pose, setExpr);
  const total = warpT(inner.duration());
  const clock = { t: 0 };
  const outer = gsap.timeline();
  outer.data = "locked";
  outer.to(clock, { t: total, duration: total, ease: "none", onUpdate: () => inner.time(unwarpT(clock.t), false) }, 0);
  outer.eventCallback("onInterrupt", () => inner.kill());
  return outer;
}

/** Entrance timed to the recorded voice, then straight into the peek-a-boo. */
export function entranceSynced(pose: Pose, setExpr: SetExpr, from: number) {
  const tl = gsap.timeline();
  tl.add(rollInSynced(pose, setExpr, from)); // no off-stage peek-a-boo: the stage edge would cut him in half
  return tl;
}

/** Entrance: roll in and stand up, then go straight into the peek-a-boo. */
export function entrance(pose: Pose, setExpr: SetExpr, from: number) {
  const tl = gsap.timeline();
  tl.add(rollIn(pose, setExpr, from));
  return tl;
}

// ---------------------------------------------------------------------------
// Scroll-journey acts (homepage companion). Each one is short and ends at rest.

export type Act = (pose: Pose, setExpr: SetExpr) => gsap.core.Timeline;

/**
 * Bring Sunny back to a clean standing pose before a new act — e.g. when a
 * scroll cue interrupts the peek-a-boo while Sunny is off-stage.
 */
export function recover(tl: gsap.core.Timeline, pose: Pose) {
  const away = Math.abs(pose.x) > 1.2 || pose.limbs < 0.99 || pose.peek > 0 || pose.y < -0.2;
  if (away) {
    // pop back in place rather than sliding across the stage
    tl.set(pose, { x: 0, y: 0, roll: 0, limbs: 1, peek: 0, run: 0, moon: 0, walk: 0, turn: 0, tilt: 0, squash: 0.55, shush: 0, point: 0, wrist: 0, wristX: 0, zip: 0, rope: 0 });
    tl.to(pose, { squash: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" });
  }
  toRest(tl, pose, ">", 0.3);
  tl.to(pose, { x: 0, duration: 0.3, ease: "power2.inOut" }, "<");
  return tl;
}

/** Run any act after a quick recovery to the rest pose. */
export function withRecover(act: Act, pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  recover(tl, pose);
  tl.add(act(pose, setExpr));
  return tl;
}

/** Quick, happy little hop — reacting to something new on screen. */
export function nod(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"))
    .to(pose, { squash: 0.9, duration: 0.1, ease: "power2.out" })
    .to(pose, { y: 0.22, squash: 1.05, duration: 0.2, ease: "power2.out" })
    .to(pose, { y: 0, duration: 0.18, ease: "power2.in" });
  land(tl, pose);
  tl.to(pose, { tilt: 0.08, duration: 0.18, yoyo: true, repeat: 1, ease: "sine.inOut" }, "<");
  toRest(tl, pose, ">0.2");
  tl.call(() => setExpr("normal"));
  return tl;
}

/**
 * Gesture towards one side of the screen (open hand, arm out, a few eager
 * pumps) — "look over there!". dir 1 = screen-right, -1 = screen-left.
 * (The glove has no separate index finger, so this is an open-hand point.)
 */
export function pointTo(dir: 1 | -1): Act {
  return (pose, setExpr) => {
    const arm = dir > 0 ? pose.armR : pose.armL;
    const tl = gsap.timeline();
    tl.call(() => setExpr("happy"))
      .to(pose, { turn: 0.35 * dir, tilt: -0.06 * dir, duration: 0.3, ease: "power2.out" })
      .to(arm, { raise: 1.3, fwd: 0.35, bend: 0.1, grip: 0, duration: 0.35, ease: "back.out(2)" }, "<")
      .to(arm, { raise: 1.48, duration: 0.22, yoyo: true, repeat: 3, ease: "sine.inOut" }, ">0.15")
      .to(pose, { y: 0.06, duration: 0.22, yoyo: true, repeat: 3, ease: "sine.inOut" }, "<")
      .to({}, { duration: 0.5 });
    toRest(tl, pose, ">");
    tl.call(() => setExpr("normal"));
    return tl;
  };
}

/** Two bouncy hops with both arms up. */
export function celebrate(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"));
  for (let i = 0; i < 2; i++) {
    tl.to(pose, { squash: 0.82, y: -0.05, duration: 0.13, ease: "power2.out" })
      .to(pose, { y: 0.6, squash: 1.12, duration: 0.3, ease: "power2.out" })
      .to(pose.armL, { raise: 2.5, bend: 0.2, grip: 0, duration: 0.22 }, "<")
      .to(pose.armR, { raise: 2.5, bend: 0.2, grip: 0, duration: 0.22 }, "<")
      .to(pose.legL, { hip: -0.45, knee: 0.85, duration: 0.22 }, "<")
      .to(pose.legR, { hip: -0.45, knee: 0.85, duration: 0.22 }, "<")
      .to(pose, { y: 0, squash: 1, duration: 0.28, ease: "power2.in" })
      .to(pose.legL, { ...REST.legL, duration: 0.24 }, "<")
      .to(pose.legR, { ...REST.legR, duration: 0.24 }, "<");
    land(tl, pose, ">-0.02");
  }
  toRest(tl, pose, ">0.1");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Long, friendly goodbye wave with a little lean. */
export function goodbye(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"))
    .to(pose.armR, { raise: 2.75, bend: 0.45, grip: 0, duration: 0.35, ease: "back.out(1.8)" })
    .to(pose, { tilt: -0.1, duration: 0.4 }, "<")
    .to(pose.armR, { bend: 1.15, duration: 0.2, yoyo: true, repeat: 7, ease: "sine.inOut" })
    .to(pose, { tilt: 0.06, duration: 0.8, yoyo: true, repeat: 1, ease: "sine.inOut" }, "<");
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Lifts the sunglasses for a closer look, taps at the chart, hand on hip, then approves. */
export function examine(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("surprised"))
    .to(pose, { turn: -0.35, tilt: 0.08, duration: 0.35, ease: "power2.out" })
    .to(pose, { shades: 0.7, duration: 0.3, ease: "back.out(2)" }, "<0.1")
    .to(pose.armL, { raise: 0.45, fwd: -0.15, bend: 2.0, grip: 0.6, duration: 0.35 }, "<")
    .to(pose.armR, { raise: 1.15, fwd: 0.5, bend: 0.5, grip: 0.3, duration: 0.35 }, "<")
    .to(pose.armR, { bend: 0.8, duration: 0.16, yoyo: true, repeat: 5, ease: "sine.inOut" }, ">0.1")
    .call(() => setExpr("happy"))
    .to(pose, { shades: REST.shades, duration: 0.4, ease: "bounce.out" }, ">0.15")
    .to(pose, { y: 0.1, duration: 0.18, yoyo: true, repeat: 3, ease: "sine.inOut" }, "<");
  toRest(tl, pose, ">0.2");
  tl.call(() => setExpr("normal"));
  return tl;
}

/**
 * Surprise moment: Sunny dashes behind the edge (out of sight), sneaks a
 * peek back in, then leaps out with a somersault — the companion hops to
 * `spot` mid-air — lands and celebrates.
 */
export function surpriseHop(spot: string): Act {
  return (pose, setExpr) => {
    const tl = gsap.timeline();
    tl.call(() => setExpr("happy"))
      // give the companion a moment to arrive beside the frame
      .to({}, { duration: 0.8 })
      .to(pose, { turn: 1.3, duration: 0.2, ease: "power2.out" })
      .to(pose, { run: 1, duration: 0.2 }, "<")
      .to(pose, { x: OFFSTAGE_X + 0.4, duration: 0.95, ease: "power2.in" }, "<")
      .set(pose, { run: 0, limbs: 0, turn: -0.45, y: 0.05, x: OFFSTAGE_X }, "+=0.45")
      .call(() => setExpr("normal"))
      .to(pose, { x: 2.05, tilt: 0.12, duration: 1.1, ease: "power2.out" })
      .set(pose, { peek: 1 }, "<")
      .to(pose, { shades: 0.88, duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut" }, ">0.2")
      // leap out!
      .call(() => setExpr("surprised"), [], ">0.3")
      .call(() => hopSunny(spot))
      .set(pose, { peek: 0, turn: 0 })
      .to(pose, { limbs: 1, duration: 0.3, ease: "back.out(2.4)" })
      .to(pose, { x: 0, tilt: 0, duration: 0.75, ease: "power1.inOut" }, "<")
      .to(pose, { y: 1.0, squash: 1.1, duration: 0.38, ease: "power2.out" }, "<")
      .to(pose, { roll: -TAU, duration: 0.75, ease: "power1.inOut" }, "<")
      .to(pose, { y: 0, squash: 1, duration: 0.37, ease: "power2.in" }, "<0.38")
      .set(pose, { roll: 0 })
      .call(() => setExpr("happy"));
    land(tl, pose);
    tl.to(pose.armL, { raise: 2.5, bend: 0.2, grip: 0, duration: 0.3, ease: "back.out(2)" }, "<")
      .to(pose.armR, { raise: 2.5, bend: 0.2, grip: 0, duration: 0.3, ease: "back.out(2)" }, "<")
      .to({}, { duration: 0.6 });
    toRest(tl, pose, ">");
    tl.call(() => setExpr("normal"));
    return tl;
  };
}

// ---- Extreme idle tricks + sleeping on a cloud ------------------------------------------

/** Big forward backflip with a landing pose. */
export function backflip(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("effort"))
    .to(pose, { squash: 0.7, duration: 0.25, ease: "power2.out" })
    .to([pose.armL, pose.armR], { raise: -0.4, fwd: 0, bend: 0.2, duration: 0.25 }, "<")
    .call(() => setExpr("happy"))
    .to(pose, { y: 0.8, squash: 1.1, duration: 0.45, ease: "power2.out" })
    .to(pose, { roll: -TAU, duration: 0.9, ease: "power1.inOut" }, "<")
    .to(pose.armL, { raise: 2.4, bend: 0.1, duration: 0.3 }, "<")
    .to(pose.armR, { raise: 2.4, bend: 0.1, duration: 0.3 }, "<")
    .to(pose, { y: 0, duration: 0.45, ease: "power2.in" }, "-=0.45")
    .set(pose, { roll: 0 });
  land(tl, pose);
  tl.to([pose.armL, pose.armR], { raise: 2.6, duration: 0.2 }, "<").to(pose, { shades: 0.7, duration: 0.2, yoyo: true, repeat: 1 }, "<");
  toRest(tl, pose, ">0.4");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Breakdance: headstand, spinning with kicking legs. */
export function breakdance(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("effort"))
    .to(pose, { squash: 0.8, duration: 0.2 })
    .to(pose, { roll: Math.PI, y: -0.2, squash: 1, duration: 0.45, ease: "back.out(1.4)" })
    .call(() => setExpr("happy"))
    .to(pose, { turn: TAU * 3, duration: 2.2, ease: "power1.inOut" })
    .to(pose.legL, { hip: 1.6, knee: 0.1, duration: 0.2, yoyo: true, repeat: 9, ease: "sine.inOut" }, "<")
    .to(pose.legR, { hip: -1.6, knee: 0.1, duration: 0.2, yoyo: true, repeat: 9, ease: "sine.inOut" }, "<0.1")
    .to([pose.armL, pose.armR], { raise: 1.4, bend: 0.1, duration: 0.3 }, "<")
    .set(pose, { turn: 0 })
    .to(pose, { roll: TAU, y: 0, duration: 0.5, ease: "power2.inOut" })
    .set(pose, { roll: 0 });
  land(tl, pose);
  toRest(tl, pose, ">0.2");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Curls into a ball, shoots up spinning like a rocket, bounces back down. */
export function rocketBall(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("surprised"))
    .to(pose, { squash: 0.6, duration: 0.3 })
    .to(pose, { limbs: 0, y: BALL_Y + 1.3, squash: 1, duration: 0.5, ease: "power3.out" })
    .to(pose, { roll: -TAU * 4, duration: 1.3, ease: "power1.inOut" }, "<")
    .to(pose, { y: BALL_Y, duration: 0.5, ease: "bounce.out" }, "+=0.1");
  for (let i = 0; i < 2; i++) tl.to(pose, { y: BALL_Y + 0.6 - i * 0.3, duration: 0.2, ease: "power2.out" }).to(pose, { y: BALL_Y, duration: 0.25, ease: "bounce.out" });
  tl.set(pose, { roll: 0 })
    .to(pose, { limbs: 1, y: 0, squash: 1.1, duration: 0.4, ease: "back.out(2)" })
    .call(() => setExpr("dizzy"))
    .to(pose, { tilt: 0.2, duration: 0.2, yoyo: true, repeat: 5, ease: "sine.inOut" });
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Wild disco boogie: hips, hair and arms everywhere. */
export function boogie(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"))
    .to(pose, { hair: 1, duration: 0.2 })
    .to(pose, { tilt: 0.2, squash: 0.92, duration: 0.18, yoyo: true, repeat: 15, ease: "sine.inOut" }, 0.1)
    .to(pose, { y: 0.15, duration: 0.18, yoyo: true, repeat: 15, ease: "sine.inOut" }, 0.1)
    .to(pose.armL, { raise: 2.4, fwd: 0.3, bend: 0.2, duration: 0.36, yoyo: true, repeat: 7, ease: "sine.inOut" }, 0.1)
    .to(pose.armR, { raise: 0.2, fwd: 0.8, bend: 0.3, duration: 0.36, yoyo: true, repeat: 7, ease: "sine.inOut" }, 0.1)
    .to(pose.legL, { hip: -0.6, knee: 0.4, duration: 0.18, yoyo: true, repeat: 15, ease: "sine.inOut" }, 0.1)
    .to(pose.legR, { hip: 0.5, knee: 0.1, duration: 0.18, yoyo: true, repeat: 15, ease: "sine.inOut" }, 0.28)
    .to(pose, { turn: TAU, duration: 0.9, ease: "power2.inOut" }, 1.6)
    .to(pose, { hair: 0, duration: 0.4 }, 3.2);
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Giant sneeze: shades fly off, blown backwards, embarrassed recovery. */
let sneezes = 0;
let lastSneeze = 0;
/** Small apology that pops up after a sneeze. */
function sneezeText() {
  if (typeof document === "undefined") return;
  const el = document.createElement("div");
  el.textContent = Math.random() < 0.5 ? "Excuse me!" : "Sorry!";
  el.setAttribute("aria-live", "polite");
  const hx = mascotState.headX;
  const hy = mascotState.headY;
  const near = hx >= 0 && hy >= 0;
  const left = near ? Math.max(90, Math.min(window.innerWidth - 90, hx)) : window.innerWidth / 2;
  const top = near ? Math.max(40, hy - 6) : window.innerHeight * 0.85;
  const from = near ? "translate(-50%,-90%) scale(.8)" : "translate(-50%,10px) scale(.9)";
  const to = near ? "translate(-50%,-110%) scale(1)" : "translate(-50%,0) scale(1)";
  el.style.cssText =
    `position:fixed;left:${left}px;top:${top}px;transform:${from};opacity:0;white-space:nowrap;z-index:90;padding:9px 20px;border-radius:999px;background:#fff7e6;color:#2a1a08;font:700 19px/1.1 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25);border:2px solid #f5a623;pointer-events:none;transition:all .25s cubic-bezier(.2,1.4,.4,1)`;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = to;
  });
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = near ? "translate(-50%,-130%) scale(.95)" : "translate(-50%,-8px) scale(.95)";
  }, 2200);
  setTimeout(() => el.remove(), 2600);
}

/** Sneezes at most twice per visit, and never twice in a row. */
export function sneezeRare(pose: Pose, setExpr: SetExpr) {
  const now = Date.now();
  if (sneezes >= 2 || now - lastSneeze < 60000) return boogie(pose, setExpr);
  sneezes += 1;
  lastSneeze = now;
  return sneeze(pose, setExpr);
}

export function sneeze(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => sunnyFun("sneeze"))
    .call(() => setExpr("surprised"))
    .to(pose, { squash: 1.18, tilt: -0.2, duration: 0.75, ease: "sine.out" })
    .to([pose.armL, pose.armR], { raise: 0.9, fwd: 0.5, bend: 1.7, duration: 0.75 }, "<")
    .to(pose, { squash: 1.28, tilt: -0.3, duration: 0.7 })
    .call(() => setExpr("effort"))
    .to(pose, { squash: 0.7, tilt: 0.45, y: 0.3, shades: 0, hair: 1, duration: 0.12, ease: "power4.out" })
    .to([pose.armL, pose.armR], { raise: 2.2, fwd: 0, bend: 0.1, duration: 0.12 }, "<")
    .to(pose, { roll: 0.35, duration: 0.1, yoyo: true, repeat: 3 })
    .to(pose, { y: 0, tilt: 0, duration: 0.3, ease: "bounce.out" })
    .call(() => setExpr("happy"))
    .call(sneezeText)
    .to(pose, { shades: 1, hair: 0, duration: 0.5, ease: "bounce.out" }, "+=0.5")
    .to(pose, { squash: 0.94, duration: 0.2, yoyo: true, repeat: 3 });
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Dramatic fainting on the spot, then springs back up as if nothing happened. */
export function faintDrama(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("surprised"))
    .to(pose.armR, { raise: 2.3, bend: 1.5, duration: 0.3 })
    .to(pose, { tilt: -0.25, duration: 0.3 }, "<")
    .call(() => setExpr("dizzy"))
    .to(pose, { roll: 1.45, y: -0.9, squash: 0.95, duration: 0.7, ease: "power2.in" })
    .to([pose.armL, pose.armR], { raise: -0.3, fwd: 0, bend: 0.1, duration: 0.4 }, "<")
    .call(() => setExpr("sleep"))
    .to(pose, { squash: 0.97, duration: 0.3, yoyo: true, repeat: 5 }, "+=0.1")
    .call(() => setExpr("surprised"))
    .to(pose, { roll: 0, y: 0.6, squash: 1.1, duration: 0.4, ease: "back.out(2)" })
    .to(pose, { y: 0, duration: 0.25, ease: "power2.in" })
    .call(() => setExpr("happy"));
  land(tl, pose);
  toRest(tl, pose, ">0.1");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** 30 s of nothing: yawns, a cloud puffs in, he lies down on it and sleeps (never completes; wake() ends it). */
export function sleepOnCloud(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.data = "sleep";
  tl.call(() => setExpr("effort"))
    .to([pose.armL, pose.armR], { raise: 2.5, fwd: 0, bend: 0.1, grip: 0, duration: 0.7, ease: "sine.inOut" })
    .to(pose, { squash: 1.14, duration: 0.7, ease: "sine.inOut" }, "<")
    .call(() => setExpr("sleep"))
    .to(pose, { squash: 0.95, duration: 0.4 })
    .to(pose, { cloud: 1, duration: 1.1, ease: "back.out(1.6)" })
    .to(pose, { shades: 0, duration: 0.4 }, "<")
    .to(pose, { roll: 1.35, y: -0.55, squash: 1, duration: 1.1, ease: "sine.inOut" })
    .to([pose.armL, pose.armR], { raise: -0.2, fwd: 0.1, bend: 0.5, grip: 0.3, duration: 0.8 }, "<")
    .to(pose.legL, { hip: 0.1, knee: 0.1, duration: 0.8 }, "<")
    .to(pose.legR, { hip: 0.1, knee: 0.1, duration: 0.8 }, "<")
    .to(pose, { zzz: 1, duration: 0.6 })
    .call(() => startSnore(() => tl.isActive()))
    .to(pose, { squash: 1.035, y: -0.5, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1 });
  return tl;
}

/** Wakes with a start, cloud pops away, stretch and a shake. */
export function wakeUp(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => stopSnore())
    .call(() => setExpr("surprised"))
    .to(pose, { zzz: 0, shades: 1, duration: 0.2 })
    .to(pose, { roll: 0, y: 0.5, squash: 1.1, duration: 0.4, ease: "back.out(2)" })
    .to(pose, { cloud: 0, duration: 0.5, ease: "back.in(2)" }, "<0.1")
    .to([pose.armL, pose.armR], { raise: 2.2, bend: 0.2, duration: 0.3 }, "<")
    .to(pose, { y: 0, duration: 0.25, ease: "power2.in" });
  land(tl, pose);
  tl.call(() => setExpr("happy"), [], "<")
    .to(pose, { tilt: 0.12, duration: 0.1, yoyo: true, repeat: 3 }, "<");
  toRest(tl, pose, ">0.1", 0.35);
  tl.call(() => setExpr("normal"));
  return tl;
}

export const EXTREME_IDLE = [backflip, breakdance, rocketBall, boogie, sneezeRare, faintDrama];


// ---- Muted Sunny: finger on his lips, other arm folded, quiet silly things ---------------

// muted look = silent mime (checked by rendering): mouth zipped shut, a little black beret (pose.rope), arms free for mime tricks
const SHUSH_R = { ...REST.armR };
const SHUSH_L = { ...REST.armL };

/** Tweens straight to the "shhh" pose: right finger on lips, left arm folded across the tummy. */
function toShush(tl: gsap.core.Timeline, pose: Pose, at: gsap.Position, dur = 0.4) {
  tl.to(pose, { y: 0, roll: 0, tilt: 0, turn: 0, squash: 1, limbs: 1, shades: 1, walk: 0, run: 0, moon: 0, peek: 0, hair: 0, shush: 0, point: 0, wrist: 0, wristX: 0, zip: 1, rope: 1, duration: dur, ease: "power2.inOut" }, at)
    .to(pose.armR, { ...SHUSH_R, duration: dur, ease: "power2.inOut" }, "<")
    .to(pose.armL, { ...SHUSH_L, duration: dur, ease: "power2.inOut" }, "<")
    .to(pose.legL, { ...REST.legL, duration: dur }, "<")
    .to(pose.legR, { ...REST.legR, duration: dur }, "<");
  return tl;
}

/** Just got muted: a quick "oops" squeeze, then the school-kid pose. */
export function shushIn(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.data = "shush";
  tl.call(() => setExpr("surprised"))
    .to(pose, { squash: 0.9, duration: 0.12 })
    .to(pose, { squash: 1.06, y: 0.15, duration: 0.15, ease: "power2.out" });
  toShush(tl, pose, ">", 0.35);
  tl.fromTo(pose, { zip: 0, rope: 0 }, { zip: 1, rope: 1, duration: 0.45, ease: "power2.inOut" }, "<");
  tl.call(() => setExpr("normal"))
    .to(pose, { tilt: 0.07, duration: 0.4, yoyo: true, repeat: 1, ease: "sine.inOut" });
  return tl;
}

/** Back to the finger-on-lips pose after any other act. */
export function shushHold(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.data = "shush";
  tl.call(() => setExpr("normal"));
  toShush(tl, pose, 0, 0.4);
  return tl;
}

/** Tiptoes away, hides off-screen for a moment, then sneaks back in. (Not used: the stage edge cuts him in half.) */
export function hideAndReturn(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  const dir = Math.random() < 0.5 ? 1 : -1;
  tl.to(pose, { turn: 0.9 * dir, duration: 0.3, ease: "power2.out" })
    .to(pose, { walk: 0.7, duration: 0.2 }, "<")
    .to(pose, { x: (OFFSTAGE_X + 0.4) * dir, duration: 2.8, ease: "sine.in" }, "<0.1")
    .to(pose, { tilt: 0.06, duration: 0.35, yoyo: true, repeat: 7, ease: "sine.inOut" }, "<")
    .set(pose, { walk: 0, turn: -0.7 * dir })
    .to({}, { duration: 1.4 }) // hiding behind the screen edge
    .call(() => setExpr("surprised"))
    .set(pose, { x: OFFSTAGE_X * dir, peek: 1 })
    .to(pose, { x: (OFFSTAGE_X - 1.1) * dir, duration: 0.7, ease: "sine.out" }) // peeks in
    .to({}, { duration: 0.6 })
    .to(pose, { x: (OFFSTAGE_X + 0.4) * dir, duration: 0.5, ease: "sine.in" }) // gets shy, hides again
    .to({}, { duration: 0.7 })
    .set(pose, { peek: 0, walk: 0.7, turn: 0.9 * -dir })
    .to(pose, { x: 0, duration: 2.6, ease: "sine.out" })
    .set(pose, { walk: 0, turn: 0 });
  toShush(tl, pose, ">", 0.3);
  return tl;
}

/** Slow, sad little walk — head down, shoulders dropped — and back. */
function sadWalk(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("sleep"))
    .to(pose, { tilt: 0.18, squash: 0.95, duration: 0.5, ease: "sine.inOut" })
    .to(pose, { walk: 0.45, turn: 0.6, duration: 0.3 }, "<")
    .to(pose, { x: -1.0, duration: 4.2, ease: "none" }, "<")
    .to(pose, { y: -0.04, duration: 0.6, yoyo: true, repeat: 6, ease: "sine.inOut" }, "<")
    .to(pose, { walk: 0, duration: 0.3 })
    .to(pose, { squash: 0.88, y: -0.1, duration: 0.9, ease: "sine.inOut" }) // big silent sigh
    .to(pose, { squash: 1, y: 0, duration: 0.8, ease: "sine.inOut" })
    .set(pose, { turn: -0.6 })
    .to(pose, { walk: 0.45, duration: 0.3 })
    .to(pose, { x: 0, duration: 3.6, ease: "none" }, "<")
    .to(pose, { walk: 0, turn: 0, duration: 0.3 });
  toShush(tl, pose, ">", 0.4);
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Sulks on the floor, legs swinging slowly. */
function sulkSit(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("sleep"))
    .to(pose, { y: SIT_Y, squash: 0.97, tilt: 0.16, duration: 0.5, ease: "power2.in" })
    .to([pose.legL, pose.legR], { hip: -1.45, knee: 0.15, duration: 0.5 }, "<")
    .to(pose.legL, { hip: -1.8, knee: 0.4, duration: 0.7, yoyo: true, repeat: 5, ease: "sine.inOut" }, ">")
    .to(pose.legR, { hip: -1.1, knee: 0.1, duration: 0.7, yoyo: true, repeat: 5, ease: "sine.inOut" }, "<")
    .to(pose, { turn: 0.5, duration: 1.2, yoyo: true, repeat: 3, ease: "sine.inOut" }, "<")
    .to(pose, { squash: 0.9, duration: 0.8, yoyo: true, repeat: 1 }, "<1")
    .to(pose, { y: 0.35, squash: 1.08, duration: 0.3, ease: "power2.out" })
    .call(() => setExpr("normal"));
  toShush(tl, pose, ">", 0.4);
  return tl;
}

/** Silent crying: shaking shoulders, wipes his eye with the folded arm, peeks to see if anyone noticed. */
function silentCry(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("sleep"))
    .to(pose, { tilt: 0.14, squash: 0.95, duration: 0.4 })
    .to(pose, { squash: 0.93, duration: 0.07, yoyo: true, repeat: 23, ease: "sine.inOut" }, ">")
    .to(pose, { tilt: -0.14, duration: 0.6, yoyo: true, repeat: 1, ease: "sine.inOut" }) // can't wipe his eyes: hands are tied
    .call(() => setExpr("surprised"))
    .to(pose, { turn: 0.5, tilt: 0, duration: 0.3 }, ">0.2")
    .to({}, { duration: 0.6 })
    .to(pose, { turn: -0.5, duration: 0.3 })
    .to({}, { duration: 0.4 });
  toShush(tl, pose, ">", 0.35);
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Trying not to laugh: finger pressed on lips, body shaking. */
function silentLaugh(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"))
    .to(pose, { squash: 0.92, tilt: 0.1, duration: 0.09, yoyo: true, repeat: 29, ease: "sine.inOut" }, "<")
    .to(pose, { turn: 0.7, duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut" }, "<")
    .to(pose, { y: 0.1, duration: 0.18, yoyo: true, repeat: 7 }, "<0.2");
  toShush(tl, pose, ">", 0.3);
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Tries to say something: the zipper pops half open, he panics and zips it shut again with a shake. */
function zipLips(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"))
    .to(pose, { squash: 1.08, tilt: -0.08, duration: 0.3, ease: "sine.out" }) // takes a breath to talk
    .to(pose, { zip: 0.45, duration: 0.25, ease: "power2.out" }, "<0.1")
    .call(() => setExpr("surprised"))
    .to(pose, { squash: 0.94, duration: 0.15 })
    .to(pose, { zip: 1, duration: 0.18, ease: "power3.in" }) // zzzip!
    .to(pose, { turn: 0.35, duration: 0.12, yoyo: true, repeat: 5, ease: "sine.inOut" })
    .call(() => setExpr("normal"))
    .to(pose, { tilt: 0.12, duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut" });
  toShush(tl, pose, ">", 0.3);
  return tl;
}

/** Tiptoes about, glancing left and right like he's sneaking past the teacher. */
function sneak(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("surprised"))
    .to(pose, { squash: 0.92, tilt: 0.1, duration: 0.25 })
    .to(pose, { walk: 0.4, turn: 0.8, duration: 0.2 }, "<")
    .to(pose, { x: 1.0, duration: 2.0, ease: "none" }, "<")
    .to(pose, { y: 0.05, duration: 0.25, yoyo: true, repeat: 7, ease: "sine.inOut" }, "<")
    .to(pose, { walk: 0, turn: -0.9, duration: 0.2 })
    .to({}, { duration: 0.4 })
    .to(pose, { turn: 0.9, duration: 0.2 })
    .to({}, { duration: 0.4 })
    .set(pose, { turn: -0.8 })
    .to(pose, { walk: 0.4, duration: 0.2 })
    .to(pose, { x: 0, duration: 2.0, ease: "none" }, "<")
    .to(pose, { y: 0.05, duration: 0.25, yoyo: true, repeat: 7, ease: "sine.inOut" }, "<")
    .to(pose, { walk: 0, turn: 0, duration: 0.2 });
  toShush(tl, pose, ">", 0.3);
  tl.call(() => setExpr("normal"));
  return tl;
}

/** A silent tantrum: stomps without a sound, huffs, folds the arm tighter. */
function silentStomp(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("effort"))
    .to(pose.legL, { hip: -0.8, knee: 0.6, duration: 0.18, yoyo: true, repeat: 5, ease: "power2.out" })
    .to(pose.legR, { hip: -0.8, knee: 0.6, duration: 0.18, yoyo: true, repeat: 5, ease: "power2.out" }, "<0.18")
    .to(pose, { y: 0.1, squash: 0.94, duration: 0.18, yoyo: true, repeat: 11, ease: "power2.out" }, "<")
    .to(pose, { turn: 0.45, duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut" }, "<")
    .to(pose, { squash: 1.12, duration: 0.5, yoyo: true, repeat: 1 }); // big silent huff
  toShush(tl, pose, ">", 0.3);
  tl.call(() => setExpr("normal"));
  return tl;
}

// ---- Mime tricks (arms free) --------------------------------------------------------------
const WALL = { raise: 1.0, fwd: 0.3, bend: -1.4, grip: 0 }; // open palms up at shoulder height, as if on glass

/** Trapped behind an invisible wall: palms flat on the glass, feeling his way along it. */
function invisibleWall(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("surprised"))
    .to([pose.armL, pose.armR], { ...WALL, duration: 0.35, ease: "back.out(1.6)" })
    .to(pose, { squash: 0.96, duration: 0.2 }, "<");
  // hands slide along the glass in little "stuck" steps
  [[1.4, 0.7], [0.7, 1.4], [1.5, 1.0], [0.9, 1.6]].forEach(([l, r], i) => {
    tl.to(pose.armL, { raise: l, duration: 0.25, ease: "power3.out" }, `+=${i ? 0.25 : 0.2}`).to(pose.armR, { raise: r, duration: 0.25, ease: "power3.out" }, "<0.12");
  });
  tl.to(pose, { x: -0.6, duration: 0.9, ease: "sine.inOut" }) // slides along the wall
    .to(pose, { x: 0.6, duration: 1.4, ease: "sine.inOut" })
    .to(pose, { x: 0, duration: 0.8, ease: "sine.inOut" })
    .call(() => setExpr("normal"))
    .to(pose, { tilt: 0.12, duration: 0.3, yoyo: true, repeat: 1 }); // shrugs at the audience
  toShush(tl, pose, ">", 0.35);
  return tl;
}

/** Stuck inside an invisible box: walls left and right, then the lid pushes him down. */
function invisibleBox(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("surprised"))
    .to([pose.armL, pose.armR], { ...WALL, duration: 0.3, ease: "back.out(1.6)" })
    .to(pose, { turn: 0.5, duration: 0.3 }, "+=0.3")
    .to(pose, { turn: -0.5, duration: 0.4 }, "+=0.3")
    .to(pose, { turn: 0, duration: 0.3 }, "+=0.3")
    .call(() => setExpr("effort"))
    .to([pose.armL, pose.armR], { raise: 2.3, fwd: 0.1, bend: -0.5, grip: 0, duration: 0.3, ease: "back.out(1.6)" }) // the lid!
    .to(pose, { squash: 0.84, y: -0.12, duration: 0.6, ease: "power2.in" })
    .to(pose, { squash: 0.88, duration: 0.25, yoyo: true, repeat: 3, ease: "sine.inOut" })
    .call(() => setExpr("surprised"))
    .to(pose, { squash: 1.1, y: 0.25, duration: 0.25, ease: "power2.out" }) // bursts free
    .to(pose, { squash: 1, y: 0, duration: 0.2, ease: "power2.in" });
  toShush(tl, pose, ">", 0.35);
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Pulls an invisible rope hand over hand, leaning back — then it snaps and he tumbles. */
function pullRope(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("effort"))
    .to(pose, { turn: 0.85, tilt: 0.18, duration: 0.35 })
    .to(pose.armL, { raise: 0.5, fwd: 1.3, bend: 0.3, grip: 1, duration: 0.3 }, "<")
    .to(pose.armR, { raise: 0.1, fwd: 1.3, bend: 0.3, grip: 1, duration: 0.3 }, "<");
  for (let i = 0; i < 4; i++) {
    tl.to(pose.armL, { raise: i % 2 ? 0.5 : 0.0, duration: 0.35, ease: "power2.inOut" })
      .to(pose.armR, { raise: i % 2 ? 0.0 : 0.5, duration: 0.35, ease: "power2.inOut" }, "<")
      .to(pose, { x: `-=${0.12}`, duration: 0.35 }, "<");
  }
  tl.call(() => setExpr("surprised"))
    .to(pose, { x: "-=0.5", tilt: 0.45, y: 0.15, duration: 0.25, ease: "power2.out" }) // snap!
    .to([pose.armL, pose.armR], { raise: 2.2, fwd: 0.2, grip: 0, duration: 0.2 }, "<")
    .to(pose, { y: 0, duration: 0.2, ease: "power2.in" })
    .call(() => setExpr("dizzy"))
    .to(pose, { tilt: 0.2, duration: 0.2, yoyo: true, repeat: 3 })
    .to(pose, { x: 0, turn: 0, tilt: 0, duration: 0.8, ease: "sine.inOut" });
  toShush(tl, pose, ">", 0.3);
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Walks into a howling invisible wind: leans in, shields his face, gets blown back. */
function againstWind(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("effort"))
    .to(pose, { turn: 0.85, tilt: -0.22, hair: 1, duration: 0.35 })
    .to(pose.armR, { raise: 1.6, fwd: 0.9, bend: 1.7, grip: 0.4, duration: 0.3 }, "<")
    .to(pose.armL, { raise: 0.5, fwd: -0.5, bend: 0.4, duration: 0.3 }, "<")
    .to(pose, { walk: 0.8, duration: 0.2 })
    .to(pose, { x: 0.7, duration: 2.6, ease: "sine.inOut" }, "<")
    .call(() => setExpr("surprised"))
    .to(pose, { x: -0.5, tilt: 0.15, walk: 0, duration: 0.45, ease: "power2.out" }) // whoosh, blown back
    .call(() => setExpr("effort"))
    .to(pose, { tilt: -0.22, walk: 0.8, duration: 0.25 })
    .to(pose, { x: 0.3, duration: 2.0, ease: "sine.inOut" })
    .to(pose, { x: 0, walk: 0, turn: 0, tilt: 0, hair: 0, duration: 0.6 });
  toShush(tl, pose, ">", 0.3);
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Climbs an invisible ladder on the spot. */
function climbLadder(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"))
    .to(pose.armL, { raise: 2.4, fwd: 0.3, bend: 0.3, grip: 1, duration: 0.3 })
    .to(pose.armR, { raise: 1.3, fwd: 0.3, bend: 0.3, grip: 1, duration: 0.3 }, "<");
  for (let i = 0; i < 6; i++) {
    const up = i % 2 === 0;
    tl.to(pose.armL, { raise: up ? 1.3 : 2.4, duration: 0.4, ease: "sine.inOut" })
      .to(pose.armR, { raise: up ? 2.4 : 1.3, duration: 0.4, ease: "sine.inOut" }, "<")
      .to(pose.legL, { hip: up ? -0.7 : 0, knee: up ? 0.9 : 0, duration: 0.4 }, "<")
      .to(pose.legR, { hip: up ? 0 : -0.7, knee: up ? 0 : 0.9, duration: 0.4 }, "<")
      .to(pose, { y: 0.06, duration: 0.2, yoyo: true, repeat: 1 }, "<");
  }
  tl.call(() => setExpr("surprised"))
    .to(pose, { turn: 0.5, duration: 0.25 }) // looks down... too high!
    .to(pose, { squash: 0.94, duration: 0.15, yoyo: true, repeat: 3 });
  toShush(tl, pose, ">", 0.35);
  tl.call(() => setExpr("normal"));
  return tl;
}

export const MUTED_ACTS: Act[] = [invisibleWall, sadWalk, pullRope, silentLaugh, againstWind, invisibleBox, zipLips, climbLadder, sulkSit, sneak, silentCry, silentStomp];


// ---- Services page: one silent, extra-funny act per service --------------------------------

/** AI SEO — stiff robot dance with jerky right angles. */
export function svcRobot(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("effort")).set(pose, { shades: 1 });
  const beats: [number, number, number, number, number][] = [
    // armL raise, armL bend, armR raise, armR bend, turn
    [1.57, -1.57, 0, 0.3, 0.6],
    [0, 0.3, 1.57, -1.57, -0.6],
    [1.57, 1.57, 1.57, 1.57, 0],
    [2.6, 0, 0.2, 0, 0.6],
    [0.2, 0, 2.6, 0, -0.6],
    [1.57, -1.57, 1.57, -1.57, 0],
  ];
  beats.forEach(([lr, lb, rr, rb, turn]) => {
    tl.to(pose.armL, { raise: lr, bend: lb, fwd: 0, grip: 1, duration: 0.09, ease: "steps(2)" }, "+=0.22")
      .to(pose.armR, { raise: rr, bend: rb, fwd: 0, grip: 1, duration: 0.09, ease: "steps(2)" }, "<")
      .to(pose, { turn, duration: 0.09, ease: "steps(2)" }, "<")
      .to(pose, { y: 0.06, duration: 0.05, yoyo: true, repeat: 1 }, "<");
  });
  // "malfunction": shake, then reboot with a hop
  tl.call(() => setExpr("dizzy"))
    .to(pose, { tilt: 0.08, duration: 0.04, yoyo: true, repeat: 11 }, "+=0.15")
    .call(() => setExpr("surprised"))
    .to(pose, { y: 0.4, squash: 1.1, turn: TAU, duration: 0.45, ease: "power2.out" })
    .set(pose, { turn: 0 })
    .to(pose, { y: 0, duration: 0.2, ease: "power2.in" })
    .call(() => setExpr("happy"));
  land(tl, pose);
  toRest(tl, pose, ">0.1");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** AEO — quiz-show buzzer: slams an invisible buzzer, shoots his hand up, bounces with the answer. */
export function svcBuzzer(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("effort"))
    .to(pose, { squash: 0.86, tilt: 0.08, duration: 0.25 })
    .to(pose.armR, { raise: 1.6, fwd: 1.0, bend: 1.4, grip: 1, duration: 0.2 }, "<")
    .to(pose.armR, { raise: 0.4, duration: 0.1, ease: "power4.in" }) // BZZT
    .to(pose, { squash: 0.8, duration: 0.08 }, "<0.05")
    .call(() => setExpr("surprised"))
    .to(pose, { squash: 1.12, y: 0.45, tilt: 0, duration: 0.25, ease: "power2.out" })
    .to(pose.armR, { raise: 2.7, fwd: 0, bend: 0.1, grip: 0.6, duration: 0.2, ease: "back.out(2)" }, "<")
    .to(pose.armR, { raise: 2.4, duration: 0.12, yoyo: true, repeat: 5 }) // "me! me! me!"
    .to(pose, { y: 0.3, duration: 0.12, yoyo: true, repeat: 5 }, "<")
    .to(pose, { y: 0, duration: 0.2, ease: "power2.in" })
    .call(() => setExpr("happy"));
  land(tl, pose);
  tl.to(pose.armL, { raise: 1.8, fwd: 0.6, bend: 0.4, grip: 1, duration: 0.25, ease: "back.out(2)" }) // thumbs up
    .to(pose, { turn: 0.4, duration: 0.3, yoyo: true, repeat: 1 }, "<");
  toRest(tl, pose, ">0.2");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** GEO — wizard: swirls a magic wand, spins, and the spell makes him float. */
export function svcWizard(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"))
    .to(pose.armR, { raise: 2.2, fwd: 0.5, bend: 0.4, grip: 1, duration: 0.3 })
    .to(pose.armR, { fwd: 1.2, duration: 0.18, yoyo: true, repeat: 7, ease: "sine.inOut" }) // swirl swirl
    .to(pose.armR, { bend: 1.0, duration: 0.18, yoyo: true, repeat: 7, ease: "sine.inOut" }, "<0.09")
    .to(pose, { hair: 1, duration: 0.3 }, "<")
    .call(() => setExpr("surprised"))
    .to(pose, { turn: TAU * 2, y: 0.6, duration: 1.0, ease: "power2.inOut" }) // levitates while spinning
    .to(pose.armL, { raise: 2.5, bend: 0.1, grip: 0, duration: 0.3 }, "<")
    .set(pose, { turn: 0 })
    .to(pose, { y: 0.5, duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut" })
    .to(pose, { y: 0, hair: 0, duration: 0.5, ease: "power2.in" })
    .call(() => setExpr("happy"));
  land(tl, pose);
  tl.to(pose, { squash: 0.92, duration: 0.15, yoyo: true, repeat: 1 }); // takes a bow
  toRest(tl, pose, ">0.1");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** SEO — detective with a magnifying glass, sneaking, then "found it!" */
export function svcDetective(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("normal"))
    .to(pose, { shades: 0.7, squash: 0.92, tilt: 0.12, duration: 0.3 })
    .to(pose.armR, { raise: 1.3, fwd: 1.1, bend: 1.5, grip: 0.8, duration: 0.3 }, "<")
    .to(pose, { walk: 0.5, turn: 0.8, duration: 0.2 })
    .to(pose, { x: 0.8, duration: 1.3, ease: "none" }, "<")
    .to(pose, { walk: 0, turn: -0.8, duration: 0.25 })
    .to(pose, { walk: 0.5, duration: 0.2 })
    .to(pose, { x: -0.6, duration: 1.6, ease: "none" }, "<")
    .to(pose, { walk: 0, turn: 0, duration: 0.25 })
    .to(pose, { tilt: -0.1, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" }) // squints closer...
    .call(() => setExpr("surprised"))
    .to(pose, { shades: 0, y: 0.45, squash: 1.12, duration: 0.25, ease: "power2.out" }) // FOUND IT!
    .to(pose.armR, { raise: 2.6, fwd: 0, bend: 0.1, duration: 0.2 }, "<")
    .to(pose, { y: 0, x: 0, duration: 0.3, ease: "power2.in" })
    .call(() => setExpr("happy"));
  land(tl, pose);
  toRest(tl, pose, ">0.3");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Local SEO — becomes a map pin: rockets up, flips upside down, slams into the ground, wobbles. */
export function svcPinDrop(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("effort"))
    .to(pose, { squash: 0.7, duration: 0.25 })
    .call(() => setExpr("surprised"))
    .to(pose, { y: 1.1, squash: 1.15, duration: 0.4, ease: "power3.out" })
    .to([pose.armL, pose.armR], { raise: 2.6, bend: 0, grip: 0, duration: 0.3 }, "<")
    .to(pose, { roll: Math.PI, duration: 0.35, ease: "power2.inOut" }) // upside down like a pin
    .to(pose, { y: 0.2, duration: 0.25, ease: "power3.in" })
    .to(pose, { squash: 0.75, duration: 0.08 }) // THUNK
    .call(() => setExpr("dizzy"))
    .to(pose, { tilt: 0.25, duration: 0.12, yoyo: true, repeat: 7, ease: "sine.inOut" }) // wobbling pin
    .to(pose, { squash: 1, duration: 0.2 }, "<")
    .call(() => setExpr("happy"))
    .to(pose, { roll: TAU, y: 0.5, tilt: 0, duration: 0.5, ease: "power2.out" })
    .set(pose, { roll: 0 })
    .to(pose, { y: 0, duration: 0.25, ease: "power2.in" });
  land(tl, pose);
  toRest(tl, pose, ">0.2");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Technical SEO — frantic mechanic tightening bolts, then a speed-test sprint on the spot. */
export function svcMechanic(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("effort"))
    .to(pose, { squash: 0.9, tilt: 0.1, duration: 0.2 })
    .to(pose.armR, { raise: 0.6, fwd: 1.2, bend: 1.2, grip: 1, duration: 0.2 }, "<")
    .to(pose.armL, { raise: 0.4, fwd: 1.0, bend: 1.0, grip: 1, duration: 0.2 }, "<")
    .to(pose.armR, { bend: 2.0, duration: 0.08, yoyo: true, repeat: 15, ease: "none" }) // wrench wrench wrench
    .to(pose, { tilt: 0.16, duration: 0.08, yoyo: true, repeat: 15 }, "<")
    .call(() => setExpr("surprised"))
    .to(pose, { squash: 1, tilt: 0, turn: 0.9, duration: 0.2 })
    .to(pose, { run: 1, duration: 0.2 })
    .to(pose, { x: 0.9, duration: 0.7, ease: "power2.in" }, "<")
    .to(pose, { hair: 1, duration: 0.2 }, "<")
    .set(pose, { turn: -0.9 })
    .to(pose, { x: -0.9, duration: 0.9, ease: "power1.inOut" })
    .set(pose, { turn: 0.9 })
    .to(pose, { x: 0, duration: 0.6, ease: "power2.out" })
    .to(pose, { run: 0, turn: 0, hair: 0, duration: 0.25 })
    .call(() => setExpr("happy"))
    .to(pose.armR, { raise: 1.8, fwd: 0.6, bend: 0.5, grip: 1, duration: 0.25, ease: "back.out(2)" }); // thumbs up
  toRest(tl, pose, ">0.4");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Google Ads — juggling invisible balls faster and faster, then drops them all. */
export function svcJuggle(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"))
    .to([pose.armL, pose.armR], { raise: 0.7, fwd: 0.9, bend: 1.2, grip: 0.3, duration: 0.25 });
  let at = 0.3;
  for (let i = 0; i < 12; i++) {
    const d = Math.max(0.09, 0.22 - i * 0.012);
    tl.to(pose.armL, { raise: i % 2 ? 0.7 : 1.5, duration: d, ease: "sine.inOut" }, at)
      .to(pose.armR, { raise: i % 2 ? 1.5 : 0.7, duration: d, ease: "sine.inOut" }, at)
      .to(pose, { turn: i % 2 ? 0.25 : -0.25, duration: d }, at);
    at += d;
  }
  tl.call(() => setExpr("surprised"), [], at)
    .to(pose, { y: 0.2, squash: 1.08, duration: 0.15 }, at)
    .to([pose.armL, pose.armR], { raise: 2.4, bend: 0.2, grip: 0, duration: 0.15 }, at)
    .to(pose, { y: 0, squash: 0.9, duration: 0.15 }, at + 0.15)
    .call(() => setExpr("dizzy"), [], at + 0.3)
    .to(pose, { tilt: 0.14, duration: 0.15, yoyo: true, repeat: 3 }, at + 0.3) // bonk bonk bonk on the head
    .call(() => setExpr("happy"), [], at + 1.0);
  toRest(tl, pose, at + 1.0);
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Meta Ads — selfie poses: phone up, peace sign, duck face lean, heart hop. */
export function svcSelfie(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"))
    .to(pose.armR, { raise: 2.2, fwd: 0.9, bend: 0.6, grip: 1, duration: 0.3 }) // phone up
    .to(pose, { tilt: 0.15, turn: -0.2, duration: 0.3 }, "<")
    .to(pose.armL, { raise: 1.6, fwd: 0.3, bend: 1.2, grip: 0.4, duration: 0.25 }) // peace
    .to(pose, { squash: 0.95, duration: 0.08, yoyo: true, repeat: 1 }) // *click*
    .to(pose, { tilt: -0.15, turn: 0.25, duration: 0.25 })
    .to(pose.armL, { raise: 0.4, fwd: 0.8, bend: 1.6, duration: 0.25 }, "<") // hand on cheek
    .to(pose, { squash: 0.95, duration: 0.08, yoyo: true, repeat: 1 })
    .to(pose, { tilt: 0, turn: 0, shades: 0.75, duration: 0.25 })
    .to(pose, { shades: 1, duration: 0.3, ease: "bounce.out" }) // cool shades flip
    .to(pose, { squash: 0.95, duration: 0.08, yoyo: true, repeat: 1 })
    .call(() => setExpr("surprised"))
    .to(pose, { y: 0.4, squash: 1.1, duration: 0.25, ease: "power2.out" }) // heart hop
    .to([pose.armL, pose.armR], { raise: 2.3, fwd: 0.3, bend: 1.4, grip: 0, duration: 0.2 }, "<") // arms make a heart
    .to(pose, { y: 0, duration: 0.25, ease: "power2.in" })
    .call(() => setExpr("happy"));
  land(tl, pose);
  toRest(tl, pose, ">0.3");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Email — postman: winds up, throws a letter, shields his eyes to watch it fly, jumps when it lands. */
export function svcPostman(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("effort"))
    .to(pose, { turn: 0.7, tilt: -0.15, duration: 0.3 })
    .to(pose.armR, { raise: 2.4, fwd: -0.6, bend: 1.2, grip: 0.9, duration: 0.3 }, "<") // wind up
    .to(pose.armR, { raise: 1.4, fwd: 1.4, bend: 0.1, grip: 0, duration: 0.14, ease: "power4.out" }) // THROW
    .to(pose, { tilt: 0.12, squash: 0.92, duration: 0.14 }, "<")
    .call(() => setExpr("normal"))
    .to(pose, { turn: 0.5, tilt: 0, squash: 1, duration: 0.3 })
    .to(pose.armL, { raise: 2.2, fwd: 0.4, bend: 1.7, grip: 0.2, duration: 0.3 }, "<") // shields eyes
    .to(pose, { turn: 0.1, duration: 1.2, ease: "sine.inOut" }) // follows it across the sky
    .call(() => setExpr("surprised"))
    .to(pose, { y: 0.4, squash: 1.1, duration: 0.2, ease: "power2.out" }) // delivered!
    .to(pose, { y: 0, duration: 0.2, ease: "power2.in" })
    .call(() => setExpr("happy"));
  land(tl, pose);
  tl.to(pose.armR, { raise: 2.3, fwd: 0, bend: 0.3, duration: 0.2 }).to(pose.armR, { raise: 1.9, duration: 0.15, yoyo: true, repeat: 3 }); // wave bye
  toRest(tl, pose, ">0.1");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** CRO — catches falling coins left and right, stuffs them in his pockets, money dance. */
export function svcCoins(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("surprised"));
  [0.6, -0.6, 0.9, -0.9, 0.3].forEach((x, i) => {
    tl.to(pose, { x, turn: x > 0 ? 0.6 : -0.6, walk: 0.6, duration: 0.3, ease: "power2.out" })
      .to(x > 0 ? pose.armR : pose.armL, { raise: 2.3, fwd: 0.6, bend: 0.4, grip: 0, duration: 0.15 }, "<0.1")
      .to(x > 0 ? pose.armR : pose.armL, { raise: 0.5, grip: 1, duration: 0.15 }) // caught!
      .to(pose, { y: 0.15, duration: 0.08, yoyo: true, repeat: 1 }, "<");
    if (i === 1) tl.call(() => setExpr("happy"));
  });
  tl.to(pose, { x: 0, turn: 0, walk: 0, duration: 0.3 })
    // money dance
    .to(pose, { hair: 1, duration: 0.2 })
    .to(pose, { tilt: 0.18, squash: 0.92, duration: 0.16, yoyo: true, repeat: 9, ease: "sine.inOut" })
    .to([pose.armL, pose.armR], { raise: 2.4, bend: 0.3, grip: 0, duration: 0.16, yoyo: true, repeat: 9 }, "<")
    .to(pose, { turn: TAU, duration: 0.7, ease: "power2.inOut" })
    .set(pose, { turn: 0 });
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}

export const SERVICE_ACTS = {
  "svc-ai": svcRobot,
  "svc-aeo": svcBuzzer,
  "svc-geo": svcWizard,
  "svc-seo": svcDetective,
  "svc-local": svcPinDrop,
  "svc-tech": svcMechanic,
  "svc-gads": svcJuggle,
  "svc-meta": svcSelfie,
  "svc-email": svcPostman,
  "svc-cro": svcCoins,
} as const;

/* ---------- Our Work page: silent, proud, celebrating each case study ---------- */

/** Applause: claps in front of him, little hops. */
export function wkApplaud(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"));
  tl.to([pose.armL, pose.armR], { raise: 0.5, fwd: 1.25, bend: 1.3, grip: 0.3, duration: 0.25, ease: "back.out(2)" });
  tl.to(pose.armL, { fwd: 1.6, bend: 0.9, duration: 0.1, yoyo: true, repeat: 15, ease: "power1.inOut" }, ">");
  tl.to(pose.armR, { fwd: 1.6, bend: 0.9, duration: 0.1, yoyo: true, repeat: 15, ease: "power1.inOut" }, "<");
  tl.to(pose, { y: 0.16, squash: 1.05, duration: 0.2, yoyo: true, repeat: 5, ease: "sine.inOut" }, "<");
  tl.to(pose, { tilt: 0.08, duration: 0.4, yoyo: true, repeat: 3, ease: "sine.inOut" }, "<");
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Trophy: lifts an invisible cup overhead, shakes it, shades slip down in awe. */
export function wkTrophy(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("surprised"));
  tl.to([pose.armL, pose.armR], { raise: 0.4, fwd: 0.9, bend: 1.2, grip: 0.8, duration: 0.3 });
  tl.to([pose.armL, pose.armR], { raise: 2.5, fwd: 0.1, bend: 0.2, grip: 0.9, duration: 0.45, ease: "back.out(2.2)" }, ">0.1");
  tl.to(pose, { y: 0.25, squash: 1.1, duration: 0.3, ease: "power2.out" }, "<");
  tl.call(() => setExpr("happy"));
  tl.to([pose.armL, pose.armR], { raise: 2.2, duration: 0.12, yoyo: true, repeat: 9, ease: "sine.inOut" }, ">");
  tl.to(pose, { turn: 0.35, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" }, "<");
  tl.to(pose, { shades: 0.82, duration: 0.2, yoyo: true, repeat: 1 }, "<0.3");
  tl.to(pose, { y: 0, squash: 1, duration: 0.3, ease: "bounce.out" }, ">");
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Bow: sweeping bow, then a ta-da with both arms. */
export function wkBow(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"));
  tl.to(pose.armR, { raise: 0.2, fwd: 1.2, bend: 1.5, grip: 0, duration: 0.3 });
  tl.to(pose, { tilt: 0.45, squash: 0.92, duration: 0.5, ease: "power2.inOut" }, "<");
  tl.to({}, { duration: 0.4 });
  tl.to(pose, { tilt: 0, squash: 1.05, duration: 0.35, ease: "back.out(2)" });
  tl.to([pose.armL, pose.armR], { raise: 1.5, fwd: 0.1, bend: 0.1, grip: 0, duration: 0.3, ease: "back.out(2.4)" }, "<");
  tl.to(pose, { y: 0.2, duration: 0.2, yoyo: true, repeat: 1 }, "<");
  tl.to({}, { duration: 0.6 });
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Thumbs-up: cool nod, one arm out, shades flick. */
export function wkThumbs(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"));
  tl.to(pose.armR, { raise: 1.5, fwd: 0.9, bend: 0.5, grip: 1, duration: 0.3, ease: "back.out(2)" });
  tl.to(pose, { tilt: 0.12, turn: -0.25, duration: 0.3 }, "<");
  tl.to(pose.armR, { raise: 1.7, duration: 0.14, yoyo: true, repeat: 5, ease: "sine.inOut" }, ">");
  tl.to(pose, { shades: 0.7, duration: 0.15, yoyo: true, repeat: 1 }, "<");
  tl.to(pose, { y: 0.18, duration: 0.18, yoyo: true, repeat: 3, ease: "sine.inOut" }, "<");
  toRest(tl, pose, ">0.2");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Flex: strong-arm pose, a little strut and a triumphant spin. */
export function wkFlex(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("effort"));
  tl.to([pose.armL, pose.armR], { raise: 1.6, fwd: 0.1, bend: 2.0, grip: 1, duration: 0.3, ease: "back.out(2)" });
  tl.to(pose, { squash: 0.94, duration: 0.2, yoyo: true, repeat: 5, ease: "sine.inOut" }, "<");
  tl.call(() => setExpr("happy"));
  tl.to(pose, { turn: TAU, duration: 0.8, ease: "power2.inOut" }, ">0.2");
  tl.set(pose, { turn: 0 });
  tl.to([pose.armL, pose.armR], { raise: 2.5, bend: 0.1, grip: 0, duration: 0.3, ease: "back.out(2)" }, ">");
  tl.to(pose, { y: 0.3, duration: 0.2, yoyo: true, repeat: 1 }, "<");
  toRest(tl, pose, ">0.3");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Happy dance: arms swing side to side with a hip sway. */
export function wkGroove(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("happy"));
  tl.to(pose.armL, { raise: 2.2, fwd: 0.2, bend: 0.4, grip: 0, duration: 0.2 });
  tl.to(pose.armR, { raise: 0.3, fwd: 0.4, bend: 0.6, grip: 0, duration: 0.2 }, "<");
  tl.to(pose.armL, { raise: 0.3, duration: 0.28, yoyo: true, repeat: 11, ease: "sine.inOut" }, ">");
  tl.to(pose.armR, { raise: 2.2, duration: 0.28, yoyo: true, repeat: 11, ease: "sine.inOut" }, "<");
  tl.to(pose, { roll: 0.14, tilt: 0.06, duration: 0.28, yoyo: true, repeat: 11, ease: "sine.inOut" }, "<");
  tl.to(pose, { y: 0.1, duration: 0.14, yoyo: true, repeat: 23, ease: "sine.inOut" }, "<");
  toRest(tl, pose, ">");
  tl.call(() => setExpr("normal"));
  return tl;
}

/* ---------- Our Work: the funny ones (all silent) ---------- */

/** Dizzy: spins like a top, wobbles, flops over, pops back up. */
export function wkDizzy(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("surprised"));
  tl.to([pose.armL, pose.armR], { raise: 1.5, fwd: 0.1, bend: 0.2, grip: 0, duration: 0.25, ease: "back.out(2)" });
  tl.to(pose, { turn: TAU * 3, duration: 1.2, ease: "power2.in" }, ">");
  tl.set(pose, { turn: 0 });
  tl.call(() => setExpr("dizzy"));
  tl.to(pose, { roll: 0.28, tilt: 0.14, duration: 0.22, yoyo: true, repeat: 5, ease: "sine.inOut" }, ">");
  tl.to(pose, { roll: -1.45, y: -0.35, duration: 0.35, ease: "power2.in" }, ">");
  tl.to({}, { duration: 0.7 });
  tl.to(pose, { roll: 0, y: 0.35, duration: 0.4, ease: "back.out(2.4)" }, ">");
  tl.call(() => setExpr("happy"));
  tl.to(pose, { y: 0, duration: 0.3, ease: "bounce.out" }, ">");
  toRest(tl, pose, ">0.2");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Banana slip: feet fly up, hangs in the air, lands with a squash. */
export function wkSlip(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("normal"));
  tl.to(pose, { tilt: -0.12, duration: 0.3 });
  tl.call(() => setExpr("surprised"));
  tl.to([pose.armL, pose.armR], { raise: 2.6, fwd: 0, bend: 0.1, grip: 0, duration: 0.15 }, ">");
  tl.to(pose, { roll: 0.9, y: 0.7, duration: 0.3, ease: "power2.out" }, "<");
  tl.to(pose.legL, { hip: -1.2, knee: 0.3, duration: 0.25 }, "<");
  tl.to(pose.legR, { hip: -0.8, knee: 0.9, duration: 0.25 }, "<");
  tl.to([pose.armL, pose.armR], { raise: 2.2, duration: 0.1, yoyo: true, repeat: 5 }, ">");
  tl.to(pose, { roll: 0, y: -0.2, squash: 0.7, duration: 0.25, ease: "power3.in" }, ">0.1");
  tl.call(() => setExpr("dizzy"));
  tl.to({}, { duration: 0.5 });
  tl.to(pose, { y: 0, squash: 1.12, duration: 0.3, ease: "back.out(3)" }, ">");
  tl.call(() => setExpr("happy"));
  tl.to(pose, { squash: 1, duration: 0.2 }, ">");
  toRest(tl, pose, ">0.2");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Double take: glances left, right, left again, shades pop up in disbelief. */
export function wkDoubleTake(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.to(pose, { turn: -0.7, duration: 0.25, ease: "power2.out" });
  tl.to(pose, { turn: 0.7, duration: 0.25, ease: "power2.inOut" }, ">0.25");
  tl.call(() => setExpr("surprised"));
  tl.to(pose, { turn: -0.7, squash: 1.18, shades: 0.2, duration: 0.18, ease: "back.out(3)" }, ">0.15");
  tl.to([pose.armL, pose.armR], { raise: 0.9, fwd: 0.6, bend: 0.4, grip: 0, duration: 0.2 }, "<");
  tl.to(pose, { y: 0.35, duration: 0.2, yoyo: true, repeat: 1 }, "<");
  tl.to({}, { duration: 0.5 });
  tl.call(() => setExpr("happy"));
  tl.to(pose, { turn: 0, squash: 1, shades: 1, duration: 0.3 }, ">");
  tl.to([pose.armL, pose.armR], { raise: 0.6, fwd: 0.2, bend: 1.2, grip: 0, duration: 0.2, yoyo: true, repeat: 3 }, ">");
  toRest(tl, pose, ">0.2");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Big sneeze: winds up, blasts forward, shades go flying and bounce back. */
export function wkSneeze(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.call(() => setExpr("surprised"));
  tl.to(pose, { tilt: -0.3, squash: 1.1, duration: 0.5, ease: "power1.in" });
  tl.to(pose, { tilt: -0.4, squash: 1.14, duration: 0.25 }, ">");
  tl.call(() => setExpr("effort"));
  tl.to(pose, { tilt: 0.5, squash: 0.8, shades: 0, y: 0.1, duration: 0.12, ease: "power4.out" }, ">");
  tl.to([pose.armL, pose.armR], { raise: 1.8, fwd: 0.2, bend: 0.2, grip: 0, duration: 0.12 }, "<");
  tl.to({}, { duration: 0.4 });
  tl.to(pose, { tilt: 0, squash: 1, duration: 0.3, ease: "elastic.out(1,0.5)" }, ">");
  tl.to(pose, { shades: 1, duration: 0.35, ease: "bounce.out" }, "<0.1");
  tl.call(() => setExpr("happy"));
  toRest(tl, pose, ">0.3");
  tl.call(() => setExpr("normal"));
  return tl;
}

/** Snooze: nods off mid-show, jolts awake, pretends nothing happened. */
export function wkSnooze(pose: Pose, setExpr: SetExpr) {
  const tl = gsap.timeline();
  tl.to(pose, { tilt: 0.12, squash: 0.97, duration: 0.5 });
  tl.call(() => setExpr("sleep"));
  tl.to(pose, { tilt: 0.3, squash: 0.94, duration: 0.9, ease: "sine.inOut" }, ">");
  tl.to(pose, { tilt: 0.1, duration: 0.5, ease: "sine.inOut" }, ">");
  tl.to(pose, { tilt: 0.34, duration: 0.7, ease: "sine.inOut" }, ">");
  tl.call(() => setExpr("surprised"));
  tl.to(pose, { tilt: 0, squash: 1.2, y: 0.5, duration: 0.15, ease: "power4.out" }, ">");
  tl.to([pose.armL, pose.armR], { raise: 2.5, fwd: 0, bend: 0.1, grip: 0, duration: 0.15 }, "<");
  tl.to(pose, { y: 0, squash: 1, duration: 0.3, ease: "bounce.out" }, ">");
  tl.call(() => setExpr("normal"));
  tl.to(pose.armR, { raise: 0.4, fwd: 0.9, bend: 1.6, grip: 0, duration: 0.3 }, ">0.3");
  tl.to(pose, { turn: 0.3, duration: 0.3, yoyo: true, repeat: 1 }, "<");
  toRest(tl, pose, ">0.3");
  tl.call(() => setExpr("normal"));
  return tl;
}

export const WORK_ACTS = {
  "wk-dizzy": wkDizzy,
  "wk-slip": wkSlip,
  "wk-doubletake": wkDoubleTake,
  "wk-sneeze": wkSneeze,
  "wk-snooze": wkSnooze,
  "wk-applaud": wkApplaud,
  "wk-trophy": wkTrophy,
  "wk-bow": wkBow,
  "wk-thumbs": wkThumbs,
  "wk-flex": wkFlex,
  "wk-groove": wkGroove,
} as const;
