#!/usr/bin/env bash
set -euo pipefail

# Resolve paths
root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
scripts_dir="$root_dir/scripts"

# Arrays (portable construction without mapfile)
sh_ext=()
while IFS= read -r f; do
  sh_ext+=("$f")
done < <(find "$scripts_dir" -type f -name "*.sh" -print 2>/dev/null)

shebang_execs=()
# grep -rI returns file names; filter to files and readable
while IFS= read -r f; do
  [ -f "$f" ] && shebang_execs+=("$f")
done < <(grep -rIlE '^#!.*/(ba)?sh' "$scripts_dir" 2>/dev/null || true)

executables=()
while IFS= read -r f; do
  executables+=("$f")
done < <(find "$scripts_dir" -type f -perm -u+x -print 2>/dev/null)

# Merge unique list
files=()
# shellcheck disable=SC2034  # used as assoc-like set via grep check
seen=""
add_unique() {
  local path="$1"
  [ -n "$path" ] || return 0
  [ -f "$path" ] || return 0
  # Use grep as a simple set check
  if ! printf '%s\n' "${files[@]}" | grep -Fxq -- "$path"; then
    files+=("$path")
  fi
}

for f in "${sh_ext[@]}"; do add_unique "$f"; done
for f in "${shebang_execs[@]}"; do add_unique "$f"; done
for f in "${executables[@]}"; do add_unique "$f"; done

if ((${#files[@]} == 0)); then
  echo "No shell scripts found under $scripts_dir"
  exit 0
fi

echo "Running ShellCheck on ${#files[@]} script(s)..."
shellcheck -S warning "${files[@]}"