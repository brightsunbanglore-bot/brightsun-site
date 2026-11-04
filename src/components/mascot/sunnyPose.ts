/**
 * Sunny's pose — plain numbers that GSAP tweens and the render loop
 * applies to the rig every frame. Keeping the pose as data (instead of
 * baked clips) is what lets Sunny roll, sit, dance and react on the fly.
 */
export type Arm = { raise: number; fwd: number; bend: number; /** 0 = open hand, 1 = fist */ grip: number };
export type Leg = { hip: number; knee: number };
export type Expression = "normal" | "happy" | "surprised" | "dizzy" | "effort" | "sleep";

export function makePose() {
  return {
    x: 0,
    /** Vertical offset of the whole character (jumps, sitting). */
    y: 0,
    /** Roll around the body centre (radians). */
    roll: 0,
    /** Side lean / head tilt. */
    tilt: 0,
    /** Turn around the vertical axis. */
    turn: 0,
    /** Squash & stretch (1 = neutral), pivoting at the feet. */
    squash: 1,
    /** 0 = arms and legs tucked inside (rolling ball), 1 = out. */
    limbs: 1,
    /** Sunglasses: 0 = off (hidden above), 1 = on (Sunny's default cool look). */
    shades: 1,
    /** Props in the right hand (0 = hidden, 1 = shown). */
    brush: 0,
    comb: 0,
    /** Toothpaste foam around the mouth. */
    foam: 0,
    /** Hair tuft: 0 = neat, 1 = messy. */
    hair: 0,
    /** Walk-cycle weight (0 = still, 1 = full stride). Strides follow x movement. */
    walk: 0,
    /** Run-cycle weight (sprint with flight phase, pumping arms). */
    run: 0,
    /** Moonwalk weight (glides backwards while "walking" forwards). */
    moon: 0,
    /** 1 while peeking in from the stage edge (mutes the cursor turn). */
    peek: 0,
    /** Cloud bed under a sleeping Sunny (0 = gone, 1 = full) and the floating Zs. */
    cloud: 0,
    /** 0 → 1: right shoulder slides forward so the hand can reach the lips ("shhh"), and the index finger points. */
    shush: 0,
    point: 0,
    /** Right wrist roll (radians): turns the hand so the finger points up at the lips. */
    wrist: 0,
    wristX: 0,
    /** Muted: zipper closed over the mouth (0 = open, 1 = zipped). */
    zip: 0,
    /** Muted: rope tying his arms behind his back (0 = none, 1 = tied). */
    rope: 0,
    zzz: 0,
    armL: { raise: 0, fwd: 0, bend: 0.3, grip: 0.35 } as Arm,
    armR: { raise: 0, fwd: 0, bend: 0.3, grip: 0.35 } as Arm,
    legL: { hip: 0, knee: 0 } as Leg,
    legR: { hip: 0, knee: 0 } as Leg,
  };
}

export type Pose = ReturnType<typeof makePose>;

/** Standing rest pose. */
export const REST = makePose();

/** Feet sit this far below the body centre when standing. */
export const GROUND = -1.68;

/** Body-centre height when curled into a ball (rays touch the ground). */
export const BALL_Y = GROUND + 1.27;

/** Height drop that puts Sunny's bottom on the ground when sitting. */
export const SIT_Y = GROUND + 1;

/** Handed to a scripted ("manual") Sunny: the pose to tween and the face setter. */
export type RigApi = { pose: Pose; setExpr: (e: Expression) => void };
/** A scripted scene (e.g. the logo intro) drives Sunny; returns a cleanup. */
export type Rig = (api: RigApi) => void | (() => void);
