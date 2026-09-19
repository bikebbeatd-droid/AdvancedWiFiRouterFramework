from dataclasses import dataclass
import subprocess

class WPAError(RuntimeError):
    pass

@dataclass(frozen=True)
class WPAControl:
    interface: str
    binary: str = 'wpa_cli'
    timeout: int = 8
    def _run(self,args):
        if not self.interface or any(not isinstance(x,str) for x in args):
            raise WPAError('Invalid wpa_cli arguments')
        cmd=[self.binary,'-i',self.interface,*args]
        try:
            p=subprocess.run(cmd,capture_output=True,text=True,timeout=self.timeout,check=False)
        except (OSError,subprocess.TimeoutExpired) as e:
            raise WPAError(str(e)) from e
        if p.returncode != 0:
            raise WPAError(p.stderr.strip() or p.stdout.strip() or 'wpa_cli command failed')
        return p.stdout.strip()
    def status(self): return self._run(['status'])
    def reconnect(self): return self._run(['reconnect'])
