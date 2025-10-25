import subprocess
#documentation here https://llm.datasette.io/en/stable/
import llm
import typer
#model = llm.get_model("gpt-4o-mini")
#rint(llm.get_model().prompt("Five surprising names for a pet pelican"))

app = typer.Typer()

@app.command()
def main():
    print(subprocess.run("git diff --cached > change_material.txt", shell=True))
    with open("change_material.txt", "r") as f:
        data = f.read()
    print(data)
    print(subprocess.run("rm change_material.txt", shell=True))

if __name__ == "__main__":
    app()



 
