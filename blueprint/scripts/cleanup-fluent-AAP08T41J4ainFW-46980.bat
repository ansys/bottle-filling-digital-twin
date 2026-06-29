echo off
set LOCALHOST=%COMPUTERNAME%
set KILL_CMD="C:\PROGRA~1\ANSYSI~1\v261\fluent/ntbin/win64/winkill.exe"

start "tell.exe" /B "C:\PROGRA~1\ANSYSI~1\v261\fluent\ntbin\win64\tell.exe" AAP08T41J4ainFW 64672 CLEANUP_EXITING
timeout /t 1
"C:\PROGRA~1\ANSYSI~1\v261\fluent\ntbin\win64\kill.exe" tell.exe
if /i "%LOCALHOST%"=="AAP08T41J4ainFW" (%KILL_CMD% 1336) 
if /i "%LOCALHOST%"=="AAP08T41J4ainFW" (%KILL_CMD% 46980) 
if /i "%LOCALHOST%"=="AAP08T41J4ainFW" (%KILL_CMD% 48540)
del "C:\AnsysDev\omniverse-sandbox\bottle-filling-digital-twin\blueprint\scripts\cleanup-fluent-AAP08T41J4ainFW-46980.bat"
