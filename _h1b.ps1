$proj = "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"
try {
    $r = Invoke-WebRequest -Uri http://localhost:3001/learn/arrays -UseBasicParsing -TimeoutSec 10
    # Find all occurrences of "Arrays" as topic name in content
    $arraysCount = [regex]::Matches($r.Content, 'Arrays').Count
    Write-Output "Status: $($r.StatusCode)  Length: $($r.Content.Length)"
    Write-Output "Occurrences of 'Arrays': $arraysCount"
    # Check if topic.name from STATIC_TOPICS appears
    if ($r.Content -match 'Concept Overview') {
        Write-Output "EDUCATION CONTENT: FOUND"
    } else {
        Write-Output "EDUCATION CONTENT: NOT FOUND"
    }
    # Check for topic name in a different way
    if ($r.Content -match 'Contiguous indexed storage') {
        Write-Output "ARRAYS DESCRIPTION: FOUND"
    }
    if ($r.Content -match 'class=\"font-display\"') {
        Write-Output "Has font-display class: yes"
    }
} catch {
    Write-Output "ERROR: $_"
}
