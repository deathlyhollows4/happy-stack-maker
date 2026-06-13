# Get learn/arrays HTML and find all h1 elements
$proj = "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"

try {
    $r = Invoke-WebRequest -Uri http://localhost:3001/learn/arrays -UseBasicParsing -TimeoutSec 10
    Write-Output "Status: $($r.StatusCode)"
    # Find all h1 tags
    $h1s = [regex]::Matches($r.Content, '<h1[^>]*>(.*?)</h1>')
    Write-Output "H1 elements: $($h1s.Count)"
    foreach ($m in $h1s) {
        $text = $m.Groups[1].Value -replace '<[^>]+>', ''
        Write-Output "  H1: $text"
    }
    # Check if the arrays title is in the page
    $hasArrays = $r.Content -match 'Arrays DSA Guide'
    Write-Output "Has 'Arrays DSA Guide' in title: $hasArrays"
} catch {
    Write-Output "ERROR: $_"
}
