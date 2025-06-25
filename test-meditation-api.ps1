$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    duration = 2
    prompt = "méditation calme"
    goal = "calm"
    gender = "male"
} | ConvertTo-Json

Write-Host "🧘 Testing meditation API with 2-minute duration..."
Write-Host "Request body: $body"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/meditation" -Method POST -Headers $headers -Body $body -OutFile "test_meditation_2min.mp3"
    Write-Host "✅ Meditation generated successfully!"
    Write-Host "📁 File saved as: test_meditation_2min.mp3"
    
    # Check file size
    if (Test-Path "test_meditation_2min.mp3") {
        $fileSize = (Get-Item "test_meditation_2min.mp3").Length
        Write-Host "📊 File size: $($fileSize / 1024) KB"
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
} 