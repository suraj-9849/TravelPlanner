import json
import sys

from rich.console import Console
from rich.json import JSON

if __name__ == "__main__":
    Console().print(JSON.from_data(json.load(sys.stdin), indent=2))
