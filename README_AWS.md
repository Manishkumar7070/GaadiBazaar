# AWS Deployment Guide: AsOneDealer

This guide explains how to deploy the **AsOneDealer** application to AWS in a production-ready environment using **AWS App Runner**.

## Prerequisites
1. An AWS Account (you have provided credentials).
2. [AWS CLI](https://aws.amazon.com/cli/) installed and configured.
3. [Docker](https://www.docker.com/) installed on your machine.

## Deployment Steps

### 1. Create an ECR Repository
First, you need a place to store your container image.
```bash
aws ecr create-repository --repository-name gaadibazaar
```

### 2. Build and Push the Image
Login to ECR (replace `<AWS_ACCOUNT_ID>` and `<REGION>`):
```bash
aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com
```

Build the image:
```bash
docker build -t gaadibazaar .
```

Tag and push:
```bash
docker tag gaadibazaar:latest <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/gaadibazaar:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/gaadibazaar:latest
```

### 3. Deploy to AWS App Runner
1. Go to the **AWS App Runner** console.
2. Click **Create service**.
3. Source: **Container registry**.
4. Provider: **Amazon ECR**.
5. Container image URI: Select the `gaadibazaar:latest` image you just pushed.
6. Deployment settings: **Automatic** (this will redeploy whenever you push a new image).
7. Service settings:
   - Port: `3000`
   - Environment Variables: Add all variables from `.env.example` (Firebase keys, Supabase keys, etc.).
8. Review and Create.

## GitHub Actions: Automated Deployment
I have set up a GitHub Actions workflow in `.github/workflows/aws-deploy.yml`. This will automatically build and deploy your app to AWS every time you push to the `main` branch.

### Setup GitHub Secrets
To make this work, go to your GitHub Repository **Settings > Secrets and variables > Actions** and add the following **New repository secrets**:

1.  `AWS_ACCESS_KEY_ID`: `AKIAUQ...` (The ID you provided)
2.  `AWS_SECRET_ACCESS_KEY`: `XjTr7g...` (The Secret Key you provided)
3.  `AWS_REGION`: e.g., `ap-south-1`
4.  `AWS_APP_RUNNER_SERVICE_ARN`: The ARN of your App Runner service (you get this after creating the service in the AWS Console).
5.  `DOCKERHUB_USERNAME`: `manii7070`
6.  `DOCKERHUB_TOKEN`: `Manish7070@#` (Your Docker Hub password)

## Environment Variables Required
Make sure to set these in the App Runner console (or via the `aws-deploy.yml` if you prefer to manage them there):
- `NODE_ENV`: `production`
- `PORT`: `3000`
- `SUPABASE_URL`: (Your Supabase URL)
- `SUPABASE_SERVICE_ROLE_KEY`: (Your Supabase Key)
- `TWILIO_ACCOUNT_SID`: (Your Twilio SID)
- `TWILIO_AUTH_TOKEN`: (Your Twilio Token)
- `TWILIO_VERIFY_SERVICE_SID`: (Your Twilio Verify SID)

## Security Warning
**IMPORTANT:** Never share your AWS root or IAM credentials in chat or screenshots. For production, always create an IAM user with "Least Privilege" (only the permissions needed for App Runner and ECR).
