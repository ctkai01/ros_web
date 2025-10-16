@echo off
setlocal

:: Create timestamp for package name
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set timestamp=%datetime:~0,8%_%datetime:~8,6%
set package_name=ros_web_ws_%timestamp%.zip

echo Creating package: %package_name%

:: Create a list of files to exclude
echo .git> exclude.txt
echo .vscode>> exclude.txt
echo build>> exclude.txt
echo devel>> exclude.txt
echo *.log>> exclude.txt
echo .DS_Store>> exclude.txt

:: Create zip file excluding files from the list
powershell -Command "$exclude = Get-Content exclude.txt; Get-ChildItem -Recurse | Where-Object { $item = $_; -not ($exclude | Where-Object { $item.FullName -like \"*$_*\" }) } | Compress-Archive -DestinationPath %package_name%"

:: Clean up
del exclude.txt

echo Package created successfully!
echo Package location: %package_name%
for %%I in (%package_name%) do echo Package size: %%~zI bytes

endlocal 