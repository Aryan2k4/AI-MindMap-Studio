# AI MindMap Studio - Google Cloud Run Deployment Script
# This script automates building and deploying the container to Cloud Run on Windows.

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " AI MindMap Studio - Cloud Run Deployer  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check if Google Cloud SDK (gcloud) is installed
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Google Cloud SDK ('gcloud' CLI) is not installed." -ForegroundColor Red
    Write-Host "Please download and install it from:" -ForegroundColor Yellow
    Write-Host "https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Exit
}

Write-Host "[+] gcloud CLI detected." -ForegroundColor Green

# 2. Authenticate user
Write-Host ""
Write-Host "Step 1: Authenticating with Google Cloud..." -ForegroundColor Cyan
Write-Host "A browser window will open. Please log in with your Google Account." -ForegroundColor Gray
gcloud auth login

# 3. Choose Google Cloud Project
Write-Host ""
Write-Host "Step 2: Configuring active project..." -ForegroundColor Cyan
$projectId = Read-Host "Enter your Google Cloud Project ID"
if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Host "[ERROR] Project ID cannot be empty." -ForegroundColor Red
    Exit
}
gcloud config set project $projectId

# 4. Enable Google APIs
Write-Host ""
Write-Host "Step 3: Enabling required APIs (Artifact Registry, Cloud Build, Cloud Run)..." -ForegroundColor Cyan
gcloud services enable artifactregistry.googleapis.com run.googleapis.com cloudbuild.googleapis.com

# 5. Create Artifact Registry Repository
Write-Host ""
Write-Host "Step 4: Creating Artifact Registry Docker repository..." -ForegroundColor Cyan
$repoName = "ai-mindmap-repo"
$region = "us-central1"
Write-Host "Creating repository '$repoName' in region '$region'..." -ForegroundColor Gray
gcloud artifacts repositories create $repoName `
    --repository-format=docker `
    --location=$region `
    --description="Repository for AI MindMap Studio" `
    --quiet 2>$null

# 6. Build and push container using Google Cloud Build
Write-Host ""
Write-Host "Step 5: Building and pushing container using Google Cloud Build..." -ForegroundColor Cyan
$imageTag = "$region-docker.pkg.dev/$projectId/$repoName/ai-mindmap-studio:latest"
Write-Host "Submitting build to Cloud Build for image tag: $imageTag" -ForegroundColor Gray
gcloud builds submit --tag $imageTag

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Cloud Build failed." -ForegroundColor Red
    Exit
}
Write-Host "[+] Container image built and pushed successfully." -ForegroundColor Green

# 7. Collect Gemini API Key
Write-Host ""
Write-Host "Step 6: Injecting Gemini API Key..." -ForegroundColor Cyan
Write-Host "Get your free API key from https://aistudio.google.com/" -ForegroundColor Gray
$geminiKey = Read-Host "Paste your GEMINI_API_KEY (input hidden)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($geminiKey)
$plainKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)

if ([string]::IsNullOrWhiteSpace($plainKey)) {
    Write-Host "[ERROR] GEMINI_API_KEY cannot be empty." -ForegroundColor Red
    Exit
}

# 8. Deploy to Cloud Run
Write-Host ""
Write-Host "Step 7: Deploying to Google Cloud Run..." -ForegroundColor Cyan
gcloud run deploy ai-mindmap-studio `
    --image $imageTag `
    --region $region `
    --platform managed `
    --allow-unauthenticated `
    --set-env-vars GEMINI_API_KEY=$plainKey `
    --port 8080

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host " SUCCESS! AI MindMap Studio is deployed! " -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[ERROR] Cloud Run deployment failed." -ForegroundColor Red
}
