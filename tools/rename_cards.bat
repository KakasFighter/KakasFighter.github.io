@ECHO off
@SETLOCAL ENABLEDELAYEDEXPANSION
REM 原始目錄結構
REM C:.
REM |   rename_cards.bat
REM |
REM +---cards_angel
REM |   \---images
REM |           10_zhitianshi01.jpg
REM |           11_yongyitainshi.jpg
REM |           12_tianshi03.jpg
REM |           13_tianshi02.jpg
REM 結果:搬移並去掉開頭數字與底線
REM C:.
REM |   acniang.jpg
REM |   afuluodite.jpg
REM |   AIDS.jpg
REM |   ailisi.jpg
REM |   airen.jpg
REM |   aishen.jpg
REM |   aisicuide.jpg
REM |   ajiuBB.jpg
REM |   akeliusi.jpg
REM |   Alfred.jpg
REM ...
REM |   rename_cards.bat
FOR /F "tokens=1 delims=" %%f IN ('dir /S /B *.jpg') DO @(
  ECHO "Get card name:path\file:[%%f] -> file:[%%~nxf]"
  SET "card=%%~nxf"
  REM ECHO !card!
  FOR /L %%i IN (0,1,3) DO @(
    IF "_" == "!card:~%%i,1!" (
      SET /A index=%%i+1
      REM ECHO "index:!index!"
      FOR %%N IN (!index!) DO SET "card=!card:~%%N!"
      REM [104_hero_bingyaohu.jpg:[3+1=4]=hero_bingyaohu.jpg
      REM ECHO [%%~nxf:[%%i+1=!index!]=!card!
      REM 在原本目錄下改名
      REM REN "%%f" !card!
      REM 移動到執行此.bat的目錄下
      MOVE "%%f" !card!
    )
  )
)
PAUSE
REM cmd /k