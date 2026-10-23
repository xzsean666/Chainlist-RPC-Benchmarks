# TASK-005: Cloudflare Pages Deployment Automation Script

## Objective
Create an automated deployment script and Wrangler configuration that uses existing local Cloudflare credentials to deploy the application to Cloudflare Pages.

## Scope
- Create `deploy.sh` script with executable permissions.
- Validate local `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- Configure `wrangler.toml` for Cloudflare Pages (dist directory, project name).
- Perform a build check and deployment dry-run/deployment.

## Allowed Files
- `deploy.sh`
- `wrangler.toml`
- `package.json`

## Dependencies
- TASK-004

## Inputs and Outputs
- **Inputs**: Built project assets in `dist/`, Cloudflare credentials in environment.
- **Outputs**: Publicly deployed Cloudflare Pages URL and verifiable live status.

## Acceptance Criteria
1. `deploy.sh` checks for prerequisites, builds the project, and deploys via Wrangler.
2. Deployment succeeds and outputs the live Cloudflare Pages URL.
3. Live site loads correctly and fetches Chain 1868 RPCs.

## Verification Commands
- `bash deploy.sh --dry-run` or full deployment execution.
- HTTP check on deployed Cloudflare Pages domain.

## Risks and Assumptions
- Cloudflare Pages project will be created automatically if it doesn't already exist under the account.

## Status
DONE
