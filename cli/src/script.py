import subprocess
#documentation here https://llm.datasette.io/en/stable/
import llm

#model = llm.get_model("gpt-4o-mini")
#rint(llm.get_model().prompt("Five surprising names for a pet pelican"))

print(subprocess.run("git diff --cached > eaklfsjladf.txt", shell=True))
with open("eaklfsjladf.txt", "r") as f:
    data = f.read()
print(data)
print(subprocess.run("rm eaklfsjladf.txt", shell=True))



 
