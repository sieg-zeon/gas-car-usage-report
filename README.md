<!--
Copyright 2023 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->
# Usage Report From LINE BOT With GAS

## Init

```shell
cp .env.sample .env

pnpm i
```

## Deploy

- Do not load env for the first time

```shell
pnpm run deploy:init
pnpm run deploy:init:prod
```

- Get the deploy_id output during the first deployment
- Set deploy_id to .env and load it except for the first time

```shell
pnpm run deploy
pnpm run deploy:prod
```
