Write-Host "Testing meditation API..."

$json = '{"duration": 2, "prompt": "meditation calme", "goal": "calm", "gender": "male"}'

try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/meditation" -Method POST -ContentType "application/json" -Body $json -OutFile "test.mp3"
    Write-Host "Success! File saved as test.mp3"
    
    if (Test-Path "test.mp3") {
        $size = (Get-Item "test.mp3").Length
        Write-Host "File size: $size bytes"
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)"
} 