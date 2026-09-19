#!/bin/sh
set -eu

echo '=== R4CM hardware check ==='
echo "Kernel: $(uname -a)"
echo '--- CPU ---'
grep -E 'system type|machine|cpu model' /proc/cpuinfo 2>/dev/null || true
echo '--- Memory ---'
grep -E 'MemTotal|MemFree' /proc/meminfo 2>/dev/null || true
echo '--- MTD ---'
cat /proc/mtd 2>/dev/null || echo '/proc/mtd unavailable'
echo '--- Wireless ---'
iw dev 2>/dev/null || echo 'iw unavailable'
echo '--- Network ---'
ip -br link 2>/dev/null || true
ip -br addr 2>/dev/null || true
echo '--- Board ---'
cat /tmp/sysinfo/model 2>/dev/null || true
cat /tmp/sysinfo/board_name 2>/dev/null || true
