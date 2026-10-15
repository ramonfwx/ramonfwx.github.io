# Uso: npm run narrar -- -Nome portfolio
# Gera a narração (voz offline do Windows, pt-BR) de cada cena de src/<Nome>/roteiro.json
# em public/audio/<Nome>/ e salva as durações em src/<Nome>/duracoes.json.
param([string]$Nome = 'portfolio')
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Add-Type -AssemblyName System.Speech

$roteiro = Get-Content "$raiz\src\$Nome\roteiro.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$pastaAudio = "$raiz\public\audio\$Nome"
New-Item -ItemType Directory -Force $pastaAudio | Out-Null

$voz = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voz.SelectVoice('Microsoft Maria Desktop')
$voz.Rate = 1

$duracoes = [ordered]@{}
foreach ($cena in $roteiro.cenas) {
  $wav = "$pastaAudio\$($cena.id).wav"
  $voz.SetOutputToWaveFile($wav)
  $voz.Speak($cena.fala)
  $voz.SetOutputToNull()
  $seg = & ffprobe -v error -show_entries format=duration -of csv=p=0 $wav
  $duracoes[$cena.id] = [math]::Round([double]::Parse($seg, [Globalization.CultureInfo]::InvariantCulture), 2)
  Write-Host "$($cena.id): $($duracoes[$cena.id])s"
}
$voz.Dispose()
$duracoes | ConvertTo-Json | Set-Content "$raiz\src\$Nome\duracoes.json" -Encoding UTF8
