from dotenv import load_dotenv
import os
import subprocess
#documentation here https://llm.datasette.io/en/stable/
from langchain_google_genai import ChatGoogleGenerativeAI
import typer
#model = llm.get_model("gpt-4o-mini")
#rint(llm.get_model().prompt("Five surprising names for a pet pelican"))

load_dotenv()

app = typer.Typer()

#remove once claude ai works and other commands can produce results
@app.command()
def test():
    # key= is optional, you can configure the key in other ways
    # edit to work with claude
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        api_key= os.getenv("API_KEY")
        )
    print(subprocess.run("git diff --cached > change_material.txt", shell=True))
    with open("change_material.txt", "r") as f:
        data = f.read()
    #print(data) #for debug
    print(subprocess.run("rm change_material.txt", shell=True))
    print(llm.invoke(data+"\n\nWrite a summary of these git changes").content)

@app.command()
def commit():
    print("commiting")
#print(subprocess.run(f'git commit -m{test()}'))

@app.command()
def doc():
    print("placeholder")
    #produce docs for the new file and changes using ai
if __name__ == "__main__":
    app()



 
