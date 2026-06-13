$base = "http://localhost:3001"
$tests = @("/learn/arrays", "/learn/strings", "/learn/nonexistent", "/learn")
foreach ($url in $tests) {
    try {
        $r = Invoke-WebRequest -Uri "$base$url" -UseBasicParsing -TimeoutSec 10
        $len = $r.Content.Length
        $h1Count = [regex]::Matches($r.Content, '<h1').Count
        
        # Check for key indicators
        $hasIndexContent = $r.Content -match 'Learn CS topics'
        $hasSlugContent = $r.Content -match 'Concept Overview'
        $hasNotFound = $r.Content -match 'Topic not found'
        $hasArrays = $r.Content -match 'Arrays'
        
        Write-Output "$url => $($r.StatusCode) len=$len h1s=$h1Count index=$hasIndexContent slug=$hasSlugContent notFound=$hasNotFound arrays=$hasArrays"
    } catch {
        Write-Output "$url => ERROR"
    }
}
