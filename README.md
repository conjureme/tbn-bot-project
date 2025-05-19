# project to be named !

this project is still being fleshed-out, it is a passion project so the direction is all over the place. as of right now it is a customizable discord AI chatbot that is capable of adapting to any persona/character you set. the goal is to make it work with multiple API providers and local models for maximum flexibility. please check the roadmap below to see where i'm at with it.

## current status

🧀 **early development** - the core functionality of the bot works, but it is not polished or feature-complete yet.

## features

- core discord bot foundation
- command & event handlers
- configurable settings (system prompt, tokens, parameters)
- per-channel memory system
- memory management
- basic API backend integration

### in development

- summarization capabilities
- web dashboard for more intuitive configuration
- multiple LLM provider support
- more local backend support

## tech stack

- discord.js
- node.js
- typescript

## running the bot

0. you need to choose a model to use. currently only OpenAI API completions is supported. text-generation-webui is being used during development, that would be my recommendation for local models. you'll also need an app made in discord's developer portal.

1. clone repository:

   ```bash
   git clone https://github.com/conjureme/tbn-bot-project.git
   cd tbn-bot-project
   ```

2. install dependencies:

```bash
npm install
```

3. setup environment variables:

- create .env.local file and fill in details:
  - bot_token=
  - guild_id=
  - client_id=
  - api_server=
  - bot_name=

4. setup bot configuration

- in bot/config create ai-config.json, formatting.json, memory-config.json, and system-prompt.json files
  - default configs are created when bot is run, but are setup for chatml and lacks a decent system prompt. the configuration setup will be overhauled later with better default parameters

5. run the bot

```bash
npx tsx bot/deploy-commands.ts
npm run dev
```

## bot commands

- `/memory stats` - view memory statistics
- `/memory clear` - clears memory for current channel
- `/memory info` - shows memory info for current channel

## roadmap

### immediate priorities

- [ ] add conversation summarization
- [ ] web dashboard for real-time configuration
  - [ ] LLM settings (temperature, tokens, top_p, etc.)
  - [ ] character/persona management
  - [ ] system prompt editing
- [ ] multi-provider API support
- [ ] local model backends

## features to come

- [ ] voice channel integration
- [ ] vision support
- [ ] lorebooks- provide model with additional context, server emotes, etc.

## project structure

```
tbn-bot-project/
├── bot/
│   ├── commands/        # command handlers
│   ├── events/          # event handlers
│   ├── utils/           # api & backend services
│   ├── config/          # configuration management
│   └── memory/          # memory system
│   └── index.ts         # entry
│   └── deploy-commands.ts # registers commands to discord api
└── ...
```

## contributing

this project is in very early development! feel free to:

- report bugs
- suggest features
- submit pull requests
- help with documentation

## license

[MIT](LICENSE)

\*note: project name is temporary- expect repo name to be changed !!
