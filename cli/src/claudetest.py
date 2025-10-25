from dotenv import load_dotenv
import os
import subprocess
import requests
import typer
from typing import Optional

load_dotenv()

app = typer.Typer(help="AI-powered git commit CLI")

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "anthropic/claude-4.5-sonnet"

def get_staged_diff() -> str:
    # Fast check: are there staged changes?
    # `git diff --cached --quiet` returns 1 if there are differences, 0 if none.
    chk = subprocess.run(["git", "diff", "--cached", "--quiet"])
    if chk.returncode == 0:
        return ""
    # Capture the staged diff
    diff = subprocess.run(
        ["git", "diff", "--cached"],
        capture_output=True,
        text=True,
        check=False,
    ).stdout
    return diff

def summarize_with_openrouter(prompt: str, model: str) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENROUTER_API_KEY in environment or .env file.")

    resp = requests.post(
        OPENROUTER_API_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            # These are optional, but recommended by OpenRouter:
            "HTTP-Referer": "http://localhost",
            "X-Title": "git-summary-cli",
        },
        json={
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a precise commit assistant. Produce a high-quality git commit "
                        "message with: (1) a concise, imperative subject (<=72 chars), then "
                        "(2) a blank line, (3) a brief body grouped by file explaining WHAT and WHY. "
                        "Avoid code fences. No markdown headers."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        },
        timeout=120,
    )

    if resp.status_code != 200:
        raise RuntimeError(f"OpenRouter error {resp.status_code}: {resp.text}")

    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()

def split_subject_body(message: str) -> tuple[str, str]:
    # First non-empty line = subject; rest = body
    lines = [ln.rstrip() for ln in message.splitlines()]
    # Drop leading empties
    while lines and not lines[0]:
        lines.pop(0)
    if not lines:
        return ("chore: update", "")
    subject = lines[0][:72]  # keep within conventional limit
    body = "\n".join(lines[1:]).strip()
    return subject, body

@app.command()
def test(model: str = typer.Option(MODEL, help="OpenRouter model id")):
    """
    Print an AI summary of the currently STAGED changes (no commit)."""
    diff = get_staged_diff()
    if not diff:
        typer.echo("No staged changes. Use `git add` first.")
        raise typer.Exit(code=1)

    prompt = (
        "Summarize this staged git diff. Provide a commit-style message:\n\n"
        f"{diff}"
    )
    summary = summarize_with_openrouter(prompt, model)
    typer.echo(summary)

@app.command()
def commit(
    model: str = typer.Option(MODEL, help="OpenRouter model id"),
    add_all: bool = typer.Option(False, help="Run `git add -A` before summarizing."),
    dry_run: bool = typer.Option(False, help="Show the AI message but do not commit."),
    allow_empty: bool = typer.Option(False, help="Allow empty commit if nothing staged."),
):
    """
    Generate a commit message with AI and run `git commit -m` automatically.
    """
    if add_all:
        subprocess.run(["git", "add", "-A"], check=False)

    diff = get_staged_diff()
    if not diff and not allow_empty:
        typer.echo("No staged changes. Use `--add-all` or `git add` first.")
        raise typer.Exit(code=1)

    prompt = (
        "Generate a high-quality git commit message for the following staged diff. "
        "Use an imperative, concise subject (<=72 chars), then a blank line, then "
        "a short, readable body grouped by file explaining WHAT and WHY. "
        "No code fences, no markdown headers.\n\n"
        f"{diff if diff else '(empty diff)'}"
    )
    summary = summarize_with_openrouter(prompt, model)
    subject, body = split_subject_body(summary)

    # Always show the message we’re about to use
    typer.echo("\n----- AI Commit Message -----\n")
    typer.echo(subject)
    if body:
        typer.echo("\n" + body)
    typer.echo("\n-----------------------------\n")

    if dry_run:
        typer.echo("Dry run: not committing.")
        raise typer.Exit()

    # Build git commit command
    commit_cmd = ["git", "commit"]
    if allow_empty and not diff:
        commit_cmd.append("--allow-empty")

    commit_cmd += ["-m", subject]
    if body:
        # Pass body as another -m so git treats it as the message body
        commit_cmd += ["-m", body]

    result = subprocess.run(commit_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        typer.echo("git commit failed:")
        typer.echo(result.stderr)
        raise typer.Exit(code=result.returncode)

    typer.echo(result.stdout.strip())

@app.command()
def doc():
    print("placeholder")

if __name__ == "__main__":
    app()
