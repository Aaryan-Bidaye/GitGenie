from dotenv import load_dotenv
import os
import time
import re
from pathlib import Path
import subprocess
import requests
import typer
from typing import Union

load_dotenv()

app = typer.Typer(help="AI-powered git commit CLI")

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "anthropic/claude-4.5-sonnet"

def ensure_openrouter_key() -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        api_key = input("Enter API Key: ")
        create_env_api(api_key)
        # return the key directly instead of raising
        return api_key
    return api_key



def create_env_api(api_key):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(script_dir, ".env")

    with open(env_path, "w") as f:
        f.write(f"OPENROUTER_API_KEY={api_key}\n")

def ensure_dir(p: Union[str, Path]) -> Path:
    path = Path(p)
    path.mkdir(parents=True, exist_ok=True)
    return path

def now_slug() -> str:
    # e.g. 2025-10-25_05-22-11
    return time.strftime("%Y-%m-%d_%H-%M-%S")

def sanitize_heading(text: str) -> str:
    # Ensure a neat single-line heading from first line of model output
    first = text.strip().splitlines()[0] if text.strip() else "Update"
    return re.sub(r"[#\s]+", " ", first).strip()

def get_staged_diff() -> str:
    # Fast check: are there staged changes?
    check = subprocess.run(["git", "diff", "--cached", "--quiet"])
    if check.returncode == 0:
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
    api_key = ensure_openrouter_key()

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
    showcase: bool = typer.Option(False, help="Show the AI message but do not commit."),
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

    if showcase:
        typer.echo("Not committing.")
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
def doc(
    model: str = typer.Option("anthropic/claude-4.5-sonnet", help="OpenRouter model id"),
    add_all: bool = typer.Option(False, help="Run `git add -A` before generating docs."),
    stage_output: bool = typer.Option(False, help="Stage the generated docs after writing."),
    title: str = typer.Option("", help="Optional custom title for the CHANGELOG entry."),
):
    """
    Generate Markdown docs for the currently STAGED changes:
    - Writes docs/changes/<timestamp>.md
    - Prepends an entry to CHANGELOG.md
    """
    if add_all:
        subprocess.run(["git", "add", "-A"], check=False)

    diff = get_staged_diff()
    if not diff:
        typer.echo("No staged changes to document. Stage files or use --add-all.")
        raise typer.Exit(code=1)

    # Build the docs prompt
    docs_prompt = (
        "Create release-style documentation for the following staged git diff. "
        "Write high-quality Markdown with these sections if applicable:\n\n"
        "## Overview\n"
        "Briefly describe WHAT changed and WHY.\n\n"
        "## Key Changes by File\n"
        "Bullet points grouped by file with short explanations.\n\n"
        "## Breaking Changes\n"
        "Call out any breaking changes and how to address them.\n\n"
        "## Migration / Upgrade Notes\n"
        "Provide steps to adapt.\n\n"
        "## Usage Examples\n"
        "Minimal examples or updated CLI usage.\n\n"
        "## Next Steps / Follow-ups\n"
        "Any TODOs, tests, docs to add later.\n\n"
        "Avoid adding huge code blocks. Keep it concise and actionable.\n\n"
        f"---\n\nDIFF STARTS\n{diff}\nDIFF ENDS"
    )

    typer.echo("Generating docs from staged diff...")
    md = summarize_with_openrouter(docs_prompt, model)

    # Prepare paths
    changes_dir = ensure_dir("docs/changes")
    stamp = now_slug()
    changes_file = changes_dir / f"{stamp}.md"

    # If user provided a title, we’ll ensure it leads the page; otherwise infer from first line
    doc_title = title.strip() or sanitize_heading(md)
    if not md.lower().lstrip().startswith("# "):
        md = f"# {doc_title}\n\n" + md

    # Write the per-change page
    changes_file.write_text(md, encoding="utf-8")

    # Update CHANGELOG.md (prepend)
    changelog_path = Path("CHANGELOG.md")
    link_line = f"- {time.strftime('%Y-%m-%d %H:%M:%S')} — {doc_title} ([details]({changes_file.as_posix()}))\n"
    if changelog_path.exists():
        old = changelog_path.read_text(encoding="utf-8")
        # Ensure top-level title exists
        if not old.lstrip().lower().startswith("# changelog"):
            new = "# Changelog\n\n" + link_line + "\n" + old
        else:
            # Insert after the first heading line
            lines = old.splitlines()
            if lines and lines[0].strip().lower().startswith("# changelog"):
                new = "\n".join([lines[0], "", link_line] + lines[1:]) + ("\n" if not old.endswith("\n") else "")
            else:
                new = "# Changelog\n\n" + link_line + "\n" + old
        changelog_path.write_text(new, encoding="utf-8")
    else:
        changelog_path.write_text("# Changelog\n\n" + link_line, encoding="utf-8")

    # Optionally stage the generated files
    if stage_output:
        subprocess.run(["git", "add", changelog_path.as_posix(), changes_file.as_posix()], check=False)

    typer.echo(f"Wrote: {changes_file}")
    typer.echo(f"Updated: {changelog_path}")
    if stage_output:
        typer.echo("Staged generated docs.")

if __name__ == "__main__":
    app()
