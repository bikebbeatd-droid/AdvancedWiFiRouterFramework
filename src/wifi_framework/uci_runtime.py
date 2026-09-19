from dataclasses import dataclass
import subprocess

class UCIError(RuntimeError): pass

@dataclass(frozen=True)
class UCI:
    binary:str="uci"; timeout:int=8
    def run(self,*args):
        if not args or any(not isinstance(x,str) or not x for x in args): raise UCIError("Invalid UCI arguments")
        try: p=subprocess.run([self.binary,*args],capture_output=True,text=True,timeout=self.timeout,check=False)
        except (OSError,subprocess.TimeoutExpired) as e: raise UCIError("UCI command failed") from e
        if p.returncode: raise UCIError(p.stderr.strip() or p.stdout.strip() or "uci command failed")
        return p.stdout.strip()
    def set(self,key,value): return self.run("set",key+"="+value)
    def commit(self,package): return self.run("commit",package)
    def revert(self,package): return self.run("revert",package)
