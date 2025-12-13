# Extract content from DOCX file
Add-Type -AssemblyName System.IO.Compression.FileSystem

$docxPath = "C:\Users\DavidKamau\Downloads\David Kaniaru Kamau_BURN_HOD_IT.docx"
$outputPath = "D:\Projects\resume-optimizer-app\original_resume_content.xml"

# Open the DOCX file as a ZIP archive
$zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)

# Find and read the document.xml entry
$entry = $zip.Entries | Where-Object { $_.Name -eq 'document.xml' }

if ($entry) {
    $stream = $entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $content = $reader.ReadToEnd()
    $reader.Close()
    $stream.Close()

    # Save to output file
    $content | Out-File -FilePath $outputPath -Encoding UTF8
    Write-Host "Content extracted successfully to: $outputPath"
} else {
    Write-Host "Error: document.xml not found in DOCX file"
}

$zip.Dispose()
