from app.env.env import LEOEnv
from app.models.api_dict.pj import ProjectDict
from sb3_contrib import MaskablePPO
from sb3_contrib.common.wrappers import ActionMasker
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.vec_env import DummyVecEnv, VecNormalize
import os
import argparse

def make_env(input: ProjectDict, seed: int = 0):
    def _init():
        env = LEOEnv(input)
        try:
            env.reset(seed=seed)
        except TypeError:
            try:
                env.seed(seed)
            except Exception:
                pass
        # Monitor the base env, then wrap Monitor with ActionMasker so the resulting
        # top-level env exposes `action_masks()` to VecEnv and MaskablePPO.
        mon = Monitor(env)
        def mask_fn(mon_env):
            # mon_env is the Monitor wrapper; try to access the underlying env's action_masks
            try:
                # common case: Monitor.env is the wrapped env with action_masks()
                if hasattr(mon_env, 'env') and hasattr(mon_env.env, 'action_masks'):
                    return mon_env.env.action_masks()
                # fallback if monitor already delegates
                if hasattr(mon_env, 'action_masks'):
                    return mon_env.action_masks()
            except Exception:
                return None
            return None

        wrapped = ActionMasker(mon, mask_fn)
        return wrapped
    
    return _init


def train_model(input: ProjectDict):
    # Configuration constants (use these instead of CLI)
    POLICY_CHOICE = "MultiInputPolicy"
    MODEL_PATH = "ai_model/ppo_leoenv"
    TIMESTEPS = 50000
    NUM_ENVS = 1
    LR = 1e-4

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    
    # pass the provided `input` into each env factory
    env_fns = [make_env(input, seed=i) for i in range(NUM_ENVS)]
    venv = DummyVecEnv(env_fns)

    # Wrap VecNormalize but exclude the action_mask key from normalization
    venv = VecNormalize(
        venv,
        norm_obs=True,
        norm_reward=True,
        clip_obs=10.0,
        # explicitly list numeric keys; do NOT include 'action_mask'
        norm_obs_keys=["energy", "sunlight", "comm", "location", "progress", "size", "workload"],
    )

    # policy kwargs: slightly larger nets for stability
    policy_kwargs = {
        "net_arch": {"pi": [256, 256], "vf": [256, 256]},
    }

    # choose MaskablePPO when available so the action_mask emitted by the env is used
    model = MaskablePPO(
        policy=POLICY_CHOICE,
        env=venv,
        verbose=1,
        learning_rate=LR,
        n_steps=2048,
        batch_size=64,
        n_epochs=10,
        ent_coef=0.01,
        vf_coef=0.5,
        policy_kwargs=policy_kwargs,
    )

    model.learn(total_timesteps=TIMESTEPS)
    model.save(MODEL_PATH)
    try:
        venv.save(MODEL_PATH + '.vecnormalize')
    except Exception:
        # saving VecNormalize sometimes fails if path missing; ignore non-fatal
        pass


if __name__ == '__main__':
    train_model()
