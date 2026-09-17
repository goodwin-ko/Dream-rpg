@echo off
chcp 65001 > nul
title DREAM RPG 아이템 조합기 & 파밍 도우미
cd /d "%~dp0"
echo ========================================================
echo  DREAM RPG 아이템 조합기 웹 서버를 실행합니다...
echo  접속 주소: http://localhost:8088
echo  웹 브라우저가 자동으로 열립니다.
echo  (종료하려면 이 창을 닫으세요)
echo ========================================================
python app.py
pause
