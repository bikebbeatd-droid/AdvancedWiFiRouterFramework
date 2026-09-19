from dataclasses import dataclass

@dataclass
class ExponentialBackoff:
    initial: float = 2.0
    maximum: float = 60.0
    attempts: int = 0

    def next_delay(self) -> float:
        delay=min(self.maximum,self.initial*(2**self.attempts))
        self.attempts+=1
        return delay

    def reset(self) -> None:
        self.attempts=0
