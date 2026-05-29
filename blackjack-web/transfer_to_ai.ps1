<#
.SYNOPSIS
  Archive le projet Blackjack et envoie le paquet vers un serveur IA distant.

.DESCRIPTION
  Ce script crée un fichier ZIP de tout le dossier de projet courant, puis
  peut l'envoyer via HTTP POST vers une URL de destination. Utile pour transférer
  l'application vers une autre IA ou un endpoint de déploiement.

.PARAMETER ProjectDir
  Le dossier du projet à archiver. Par défaut, le répertoire courant.

.PARAMETER DestinationZip
  Le chemin de sortie du fichier ZIP.

.PARAMETER UploadUrl
  L'URL de l'IA distante ou du serveur qui recevra l'archive.

.EXAMPLE
  .\transfer_to_ai.ps1 -UploadUrl "https://example.com/upload"

.EXAMPLE
  .\transfer_to_ai.ps1 -ProjectDir "C:\Users\antoi\Documents\TESTS - Projets BlackJack\blackjack-web" -DestinationZip "C:\temp\blackjack-web.zip"
#>

param(
    [string]$ProjectDir = (Get-Location).Path,
    [string]$DestinationZip = "$(Get-Location)\blackjack-web-transfer.zip",
    [string]$UploadUrl
)

Write-Host "Project directory:" $ProjectDir
Write-Host "Destination ZIP:" $DestinationZip

if (-Not (Test-Path $ProjectDir)) {
    Write-Error "Le dossier de projet spécifié n'existe pas : $ProjectDir"
    exit 1
}

if (Test-Path $DestinationZip) {
    Write-Host "Le fichier ZIP existe déjà. Suppression..."
    Remove-Item $DestinationZip -Force
}

Write-Host "Création de l'archive..."
Compress-Archive -Path "$ProjectDir\*" -DestinationPath $DestinationZip -Force

if ($UploadUrl) {
    Write-Host "Envoi vers l'URL de destination : $UploadUrl"
    try {
        $response = Invoke-WebRequest -Uri $UploadUrl -Method Post -InFile $DestinationZip -ContentType "application/zip" -UseBasicParsing
        Write-Host "Envoi terminé. Status:" $response.StatusCode
        Write-Host $response.StatusDescription
    } catch {
        Write-Error "Échec de l'envoi : $_"
        exit 1
    }
} else {
    Write-Host "Aucune URL d'envoi fournie. Archive créée localement."
}

Write-Host "Terminé."