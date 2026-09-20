@echo off
chcp 65001 > nul
cd /d "%~dp0\.."
echo ========================================================
echo  정보Table.xlsx 데이터를 게임 데이터로 병합합니다...
echo ========================================================
python tools/merge_all_data.py
echo.
echo 완료되었습니다.
pause
