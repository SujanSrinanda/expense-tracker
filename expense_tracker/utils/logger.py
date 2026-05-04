import sys

# ANSI color codes
GREEN = "\033[92m"
RED = "\033[91m"
BLUE = "\033[94m"
RESET = "\033[0m"

def log_success(message: str):
    """Log a success message in green."""
    print(f"{GREEN}[OK] {message}{RESET}", file=sys.stdout)

def log_error(message: str):
    """Log an error message in red."""
    print(f"{RED}[ERR] {message}{RESET}", file=sys.stderr)

def log_info(message: str):
    """Log an informational message in blue."""
    print(f"{BLUE}[i] {message}{RESET}", file=sys.stdout)
