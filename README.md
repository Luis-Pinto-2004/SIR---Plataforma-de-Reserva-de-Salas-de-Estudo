# StudySpace — TA9

O **StudySpace** é uma aplicação web para **gestão de disponibilidade e reservas** de **salas** e **equipamentos**, com **atualização automática** e **painel de administração**.

A aplicação suporta interface em **Português**, **English (UK)** e **Español**.

---

## Requisitos

- **Docker** (Docker Desktop ou Docker Engine)
- **Docker Compose v2**
- Navegador web

> A execução recomendada é em **Docker**, por garantir o arranque consistente de todos os serviços.

---

## Executar (Docker)

```bash
docker compose up --build
```

Abrir no navegador:
- Aplicação: **http://localhost:8080**
- Verificação rápida: **http://localhost:8080/api/health** → deve devolver `{ "status": "ok" }`

Para parar:
```bash
CTRL + C
docker compose down
```

---

## Credenciais de teste

- **Admin**
  - Email: `admin@ipvc.pt`
  - Password: `admin_2004`

- **Teacher**
  - Email: `professor@ipvc.pt`
  - Password: `admin_2004`

- **Student**
  - Email: `aluno@ipvc.pt`
  - Password: `admin_2004`

---

## Funcionalidades principais (implementadas)

### Utilizador (Student/Teacher)
- Autenticação (login, registo e recuperação de palavra-passe)
- Consulta de disponibilidade de salas e equipamentos
- Pesquisa e filtros
- Criação de reservas por tipo (sala/equipamento) e por período
- Validação de conflitos (não permite reservas sobrepostas no mesmo recurso)
- Histórico de reservas (filtros por datas e estado)
- Edição e cancelamento de reservas

### Administração (Admin)
- Gestão de salas (criar, editar, eliminar)
- Gestão de equipamentos (criar, editar, eliminar)
- Gestão de reservas (listar, ajustar, cancelar)
- Filtros por tipo e por estado

### Atualização automática
- A disponibilidade e as listas refletem alterações automaticamente (sem necessidade de recarregar a página).

---

## Estrutura do repositório

```
/backend
/frontend
/gateway
docker-compose.yml
README.md
```
