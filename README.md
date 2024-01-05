# Usage Report From LINE BOT With GAS

## Init

cp .env.sample .env

## Deploy

- Do not load env for the first time
  - pnpm run deploy:init
  - pnpm run deploy:init:prod
- Get the deploy_id output during the first deployment
- Set deploy_id to .env and load it except for the first time
  - pnpm run deploy
  - pnpm run deploy:prod
