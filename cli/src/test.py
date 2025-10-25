from dotenv import load_dotenv
from pathlib import Path

# Explicitly point to project-level .env
project_env = Path.cwd() / ".env"
print(project_env)
load_dotenv(dotenv_path=project_env, override=False)
