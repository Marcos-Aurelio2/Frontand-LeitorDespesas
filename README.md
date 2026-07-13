# Finance Core

Dashboard financeiro (React 19 + Vite + Tailwind v4) que consome uma API Java/Spring Boot para despesas e proventos.

## Requisitos

- Node 20+
- API Java rodando (padrão `http://localhost:8080`)

## Setup

```bash
npm install
cp .env.example .env   # opcional: ajuste VITE_API_BASE_URL
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

## Variáveis de ambiente

- `VITE_API_BASE_URL` — URL do backend Java. Sobrescrevível em tempo de execução pela tela de Configurações (persistido em `localStorage` como `fc_api_url`).
