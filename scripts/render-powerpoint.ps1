param([Parameter(Mandatory=$true)][string]$OutputDirectory)
$qaPath = (Resolve-Path -LiteralPath $OutputDirectory).Path
$pptApp = New-Object -ComObject PowerPoint.Application
try {
  foreach ($lang in @('en','hi')) {
    $deck = $pptApp.Presentations.Open((Join-Path $qaPath "$lang-pptx.pptx"), -1, 0, 0)
    try {
      $deck.Export((Join-Path $qaPath "$lang-powerpoint"), 'PNG', 1280, 720)
      $deck.SaveAs((Join-Path $qaPath "$lang-powerpoint.pdf"), 32)
      foreach ($slide in $deck.Slides) {
        foreach ($shape in $slide.Shapes) {
          if ($shape.HasTextFrame -and $shape.TextFrame.HasText) {
            if ($shape.TextFrame.TextRange.BoundHeight -gt ($shape.Height + 4)) {
              throw "Text overflow on $lang slide $($slide.SlideIndex)"
            }
          }
        }
      }
      Write-Output "$lang PowerPoint: $($deck.Slides.Count) slides rendered and checked."
    } finally { $deck.Close() }
  }
} finally { $pptApp.Quit() }
