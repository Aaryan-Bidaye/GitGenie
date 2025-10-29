import os
import time
import re
from pathlib import Path
import subprocess
import requests
import typer
from typing import Union
from pymongo import MongoClient, errors


app = typer.Typer(help="AI-powered git commit CLI")
from pymongo import MongoClient

#connection string

def ensure_anthropic_key() -> str:
    # same Mongo doc, still reading field "key"
    uri = "mongodb+srv://tester:calhacks@maincluster.d7eonc4.mongodb.net/SUPER_SECRET"
    client = MongoClient(uri)
    db = client["SUPER_SECRET"]
    coll = db["keys"]

    docu = coll.find_one()
    if not docu or not docu.get("key"):
        print("No Anthropic API key found in Mongo.")
        api_key = input("Enter Anthropic API Key: ").strip()
        return api_key
    return docu["key"]

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

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
MODEL = "claude-sonnet-4-5"  # or a pinned date variant

def summarize_with_anthropic(prompt: str, model: str) -> tuple[str, str, int]:
    api_key = ensure_anthropic_key()
    headers = {
        "x-api-key": api_key,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
    }
    payload = {
        "model": model,
        "max_tokens": 800,
        "temperature": 0.2,
        "system": (
            "You are a precise commit assistant. Return only a compact JSON object "
            'like {"rating": 7, "subject": "...", "body": "..."}.\n'
            "Rules:\n"
            "- rating: integer 1..10 only\n"
            "- subject: <=72 chars, imperative mood\n"
            "- body: short, grouped by file, WHAT and WHY\n"
            "No markdown, no extra text."
        ),
        "messages": [{"role": "user", "content": prompt}],
    }
    resp = requests.post(ANTHROPIC_API_URL, headers=headers, json=payload, timeout=120)
    if resp.status_code != 200:
        raise RuntimeError(f"Anthropic error {resp.status_code}: {resp.text}")

    data = resp.json()
    text = "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text").strip()

    # Strict JSON parse with fallback
    import json, re
    try:
        obj = json.loads(text)
    except json.JSONDecodeError:
        s = text[text.find("{"): text.rfind("}")+1]
        obj = json.loads(s)

    rating = int(obj.get("rating", 5))
    rating = 1 if rating < 1 else 10 if rating > 10 else rating
    subject = (obj.get("subject") or "chore: update").strip()[:72]
    body = (obj.get("body") or "").strip()
    return subject, body, rating

def code_qual(ai_impact):

    tencom = subprocess.run(
        "git log -10 --shortstat | awk '/files changed/ {inserted+=$4; deleted+=$6} END {print \"+\" inserted \" -\" deleted}'",
        shell=True,
        capture_output=True,
    )

    curcom = subprocess.run(
        ["git diff --cached --shortstat | awk '/files changed/ {print $4+$6}'"],
        shell=True,
        capture_output=True
    )

    t_out=tencom.stdout.decode().strip()
    c_out=curcom.stdout.decode().strip()

    t_nums = list(map(int, re.findall(r"-?\d+", t_out)))
    c_nums = list(map(int, re.findall(r"-?\d+", c_out)))

    t_sum = sum(t_nums)
    c_sum = sum(c_nums)

    plines=t_sum
    clines=c_sum

    mean = plines/10

    r = clines / mean if mean else 0

    im = r/(r+1)
    ai_num = ai_impact/10

    AIWeight = 0.5
    HeuristicWeight = 0.5

    final_impact = 100 * (AIWeight*ai_num + HeuristicWeight*im) 
    return final_impact

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
def integrate(
    model: str = typer.Option(MODEL, help="Anthropic model id"),
    add_all: bool = typer.Option(True, help="Run `git add -A` before summarizing."),
    showcase: bool = typer.Option(False, help="Show the AI message but do not commit."),
    allow_empty: bool = typer.Option(False, help="Allow empty commit if nothing staged."),
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip confirmation and commit immediately."),
):
    if add_all:
        subprocess.run(["git", "add", "-A"], check=False)

    diff = get_staged_diff()
    if not diff and not allow_empty:
        typer.echo("No staged changes. Use `--add-all` or `git add` first.")
        raise typer.Exit(code=1)

    prompt = (
        "Generate a high-quality git commit message for the following staged diff. "
        "Use an imperative, concise subject (<=72 chars), then a blank line, then "
        "a very short, readable body grouped by file explaining WHAT and WHY. "
        "No code fences, no markdown headers.\n\n"
        f"{diff if diff else '(empty diff)'}"
    )
    summary_subject, summary_body, ai_impact = summarize_with_anthropic(prompt, model)
    subject, body = split_subject_body(summary_subject + ("\n\n" + summary_body if summary_body else ""))

    typer.echo("\n----- AI Commit Message -----\n")
    typer.echo(subject)
    if body:
        typer.echo("\n" + body)
    typer.echo("\n-----------------------------\n")

    if showcase:
        typer.echo("Not committing.")
        raise typer.Exit()

    if not yes:
        if not typer.confirm("Use this commit message to commit now?", default=True):
            typer.echo("Aborted. No commit made.")
            raise typer.Exit(code=1)

    # Build and run git commit
    commit_cmd = ["git", "commit"]
    if allow_empty and not diff:
        commit_cmd.append("--allow-empty")
    commit_cmd += ["-m", subject]
    if body:
        commit_cmd += ["-m", body]

    result = subprocess.run(commit_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        typer.echo("git commit failed:")
        typer.echo(result.stderr)
        raise typer.Exit(code=result.returncode)

    typer.echo(result.stdout.strip())

    # Ask user whether to push changes
    push_confirm = typer.confirm("Push this commit to the remote repository?", default=True)
    pushed = False
    if push_confirm:
        typer.echo("Pushing changes...")
        push_result = subprocess.run(["git", "push"], capture_output=True, text=True)
        if push_result.returncode == 0:
            typer.echo(push_result.stdout.strip())
            pushed = True
        else:
            typer.echo("Push failed:")
            typer.echo(push_result.stderr)
    else:
        typer.echo("Skipped push.")


@app.command()
def doc(
    model: str = typer.Option("claude-sonnet-4-5", help="OpenRouter model id"),
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
    doc_subject, doc_body, doc_rating = summarize_with_anthropic(docs_prompt, model)
    md = doc_subject + ("\n\n" + doc_body if doc_body else "")

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
