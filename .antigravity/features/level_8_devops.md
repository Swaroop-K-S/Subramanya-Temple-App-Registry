# Level 8: DevOps God-Mode (IaC)

**Status**: CONFIGURED
**Providers**: AWS, Google Cloud, Docker, Vercel
**Strategy**: GitOps

## Capabilities
- **Containerization**: Auto-generated `Dockerfile` and `docker-compose.yml`.
- **Provisioning**: Terraform/Pulumi script generation.
- **CI/CD**: GitHub Actions workflow generation for test/deploy pipelines.

## Triggers
- Command: "Deploy to Production" -> Triggers Build -> Test -> Push to Cloud.
