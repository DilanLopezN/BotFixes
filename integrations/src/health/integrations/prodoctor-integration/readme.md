# Integração ProDoctor

Este módulo implementa a **integração com a API ProDoctor**, incluindo uma **API Fake** para desenvolvimento local e execução de testes automatizados.

## Executando a API Fake (Desenvolvimento Local)

A API Fake simula o comportamento da API ProDoctor e deve ser utilizada para desenvolvimento e testes.

### Passos

1. Acesse o diretório da API Fake:

```bash
cd kissbot-general-development/kissbot-integrations/src/health/integrations/prodoctor-integration/prodoctor-fake-api/src
```

2. Execute a aplicação:

```bash
npx ts-node main.ts
```

Após a execução, a API Fake estará disponível para consumo local.

---

## Executando os Testes

Os testes validam o funcionamento da integração com a ProDoctor.

### Testes da API ProDoctor

```bash
npm run test -- prodoctor-api.service.spec.ts
```

### Testes do Serviço de Integração

```bash
npm run test -- prodoctor.service.spec.ts
```

---

## Observações

- Garanta que todas as dependências estejam instaladas antes da execução.
- A API Fake deve estar em execução para que os testes de integração funcionem corretamente.
