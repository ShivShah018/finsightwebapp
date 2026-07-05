"""Loads .env file for configuration."""
import os
from dotenv import load_dotenv


def load_env():
    """Load .env file from project root. Safe to call multiple times."""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(project_root, ".env")
    if os.path.isfile(env_path):
        load_dotenv(env_path)
    else:
        load_dotenv()
