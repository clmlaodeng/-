@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js，请先安装 Node.js 18 或更高版本。
  pause
  exit /b 1
)

echo 正在启动解方程练习生成器...
echo 启动后请打开窗口中显示的本地地址。
echo.
npm.cmd start

pause
