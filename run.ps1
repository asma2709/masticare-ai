# run.ps1

$PythonExe = "python"
if (Test-Path "$PSScriptRoot\.venv\Scripts\python.exe") {
    $PythonExe = "$PSScriptRoot\.venv\Scripts\python.exe"
} elseif (Test-Path ".\.venv\Scripts\python.exe") {
    $PythonExe = ".\.venv\Scripts\python.exe"
} elseif (Test-Path "$env:USERPROFILE\anaconda3\python.exe") {
    $PythonExe = "$env:USERPROFILE\anaconda3\python.exe"
} elseif (Test-Path "C:\ProgramData\anaconda3\python.exe") {
    $PythonExe = "C:\ProgramData\anaconda3\python.exe"
}

Write-Host "Using Python: $PythonExe"
Write-Host "Starting Backend..."
Start-Process powershell -ArgumentList "-NoExit -Command `"cd backend; & '$PythonExe' -m pip install -r requirements.txt; & '$PythonExe' ml_pipeline.py; & '$PythonExe' -m uvicorn main:app --reload`""

Write-Host "Starting Frontend..."
Start-Process powershell -ArgumentList "-NoExit -Command `"cd frontend; npm run dev`""

Write-Host "Wait 5 seconds for backend to start, then seed the database..."
Start-Sleep -Seconds 5
cd backend
& $PythonExe seed.py
cd ..

Write-Host "MastiCare AI is running!"
