from app.env.env import LEOEnv
from app.models.api_dict.pj import ProjectDict
from stable_baselines3 import PPO
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
        # Monitor the base env; no action mask wrapper
        mon = Monitor(env)
        return mon
    
    return _init


def train_model(input: ProjectDict):
    # Configuration constants (use these instead of CLI)
    POLICY_CHOICE = "MultiInputPolicy"
    MODEL_PATH = "ai_model/ppo_leoenv"
    TIMESTEPS = 10000
    NUM_ENVS = 1
    LR = 1e-4

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    
    # pass the provided `input` into each env factory
    env_fns = [make_env(input, seed=i) for i in range(NUM_ENVS)]
    venv = DummyVecEnv(env_fns)

    # Wrap VecNormalize for numeric keys
    venv = VecNormalize(
        venv,
        norm_obs=True,
        norm_reward=True,
        clip_obs=10.0,
        norm_obs_keys=["energy", "sunlight", "comm", "location", "progress", "size", "workload"],
    )

    # policy kwargs: slightly larger nets for stability
    policy_kwargs = {
        "net_arch": {"pi": [256, 256], "vf": [256, 256]},
    }

    # Use standard PPO (no action masks)
    # Increase PPO entropy coefficient to promote exploration and help discover compute action
    # Updated ent_coef from 0.03 to 0.05
    
    model = PPO(
        policy=POLICY_CHOICE,
        env=venv,
        verbose=1,
        learning_rate=LR,
        n_steps=2048,
        batch_size=64,
        n_epochs=10,
        ent_coef=0.05,
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
