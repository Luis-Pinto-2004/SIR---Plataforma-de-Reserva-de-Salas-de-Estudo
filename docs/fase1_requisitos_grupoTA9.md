# StudySpace – Fase 1: Definição do Tema e Recolha de Requisitos

## 1. Identificação do Projeto
**Nome provisório da aplicação:** StudySpace  
**Tema:** Reserva de Salas de Estudo e Equipamentos  
**Membros do grupo:** * Luís Pinto (29367) - Ivo Ramoa (29447)*  
**Curso / Turma:** Engenharia Informática – ESTG  
**Data:** Novembro 2025

---

## 2. Contexto e Motivação
A nossa comunidade académica enfrenta atualmente dificuldades na reserva organizada de salas de estudo e equipamentos institucionais. O processo é fragmentado, depende de comunicação informal ou deslocações físicas ao serviço responsável, sem existir um controlo de reservas o que resulta em tempos de espera e deslocações até ao local desnecessária.

A ausência de um sistema digital compromete a eficiência e a autonomia dos utilizadores, especialmente em períodos de maior afluência (épocas de avaliações, trabalhos de grupo e projetos práticos). O resultado é a utilização ineficiente dos recursos da instituição.

A aplicação **StudySpace** procura resolver este problema e fornecer uma plataforma centralizada, colaborativa e acessível onde estudantes, docentes e funcionários podem reservar salas e equipamentos com transparência, rapidez e fiabilidade.

---

## 3. Objetivos da Aplicação
- Disponibilizar uma plataforma digital para reservar salas de estudo e equipamentos.  
- Garantir visibilidade em tempo real sobre a disponibilidade dos recursos.  
- Minimizar conflitos e reservas duplicadas.  
- Facilitar a colaboração académica através de uma gestão eficiente dos espaços.  
- Proporcionar uma interface simples, responsiva e acessível a partir de qualquer dispositivo.  

---

## 4. Principais Utilizadores

### **1. Estudante**
- Consulta e reserva salas e equipamentos.  
- Cancela reservas e verifica o seu histórico.

### **2. Docente**
- Reserva equipamentos e salas específicas para aulas ou atividades.  
- Consulta o estado dos recursos.

### **3. Funcionário / Administrador**
- Gere equipamentos e salas.  
- Valida reservas especiais.  
- Resolve conflitos e atualiza estados (manutenção, indisponibilidade).  

---

## 5. Requisitos Funcionais

1. **RF1:** Autenticação de utilizadores (registo, login, recuperação de password).  
2. **RF2:** Consulta de disponibilidade de salas e equipamentos em tempo real.  
3. **RF3:** Criação, edição e cancelamento de reservas.  
4. **RF4:** Sistema de notificações automáticas (confirmações, alertas, conflitos).  
5. **RF5:** Histórico de reservas por utilizador.  
6. **RF6:** Área administrativa para gestão de recursos e reservas especiais.  

---

## 6. Requisitos Não Funcionais

- **RNF1:** Interface simples, intuitiva e responsiva.  
- **RNF2:** Operações básicas devem responder em menos de 5 segundos.  
- **RNF3:** Dados armazenados numa base de dados não relacional (MongoDB).  
- **RNF4:** Comunicação em tempo real via WebSockets / Socket.IO.  
- **RNF5:** Autenticação obrigatória para qualquer operação de reserva.  
- **RNF6:** Backend implementado em Node.js com API RESTful.  
- **RNF7:** Deploy em Render.com, Vercel.com ou equivalente.  

---

## 7. Modelo de Informação (Versão Inicial)

### **Entidades Principais**

**User**  
- id  
- nome  
- email  
- passwordHash  
- tipo (estudante / docente / administrador)  

**Room**  
- id  
- nome  
- capacidade  
- localização  
- estado (ativo / inativo)  

**Equipment**  
- id  
- nome  
- categoria  
- estado (disponível / reservado / manutenção)  

**Booking**  
- id  
- userId  
- resourceType (“room” | “equipment”)  
- resourceId  
- dataInicio  
- dataFim  
- estado (“confirmada”, “cancelada”, “pendente”)  

### **Relações**
- Um **User** pode criar várias **Bookings**.  
- Uma **Booking** refere-se sempre a uma sala ou equipamento.  
- Salas e equipamentos são independentes mas partilham o sistema de reservas.  

---

## 8. Mockups / Wireframes

*(As imagens estão colocadas no diretório `/docs/mockups/` ou anexadas ao PDF final.)*

### **Mockup 1 — Login**
- Logótipo da instituição  
- Campos: Email, Password  
- Botão “Entrar”  
- Link “Criar conta”  

### **Mockup 2 — Dashboard**
- Listagem de salas e equipamentos com estado (verde/vermelho)  
- Filtros por tipo de recurso  
- Botão “Criar Reserva”  
- Histórico de reservas recente  

### **Mockup 3 — Criar Reserva**
- Seleção de sala/equipamento  
- Calendário com horários livres/ocupados  
- Botão “Confirmar Reserva”  

---

## 9. Validação Inicial com Utilizadores

### **Entrevista 1 — Estudante Rodrigo Machado**
**Problemas reportados:** dificuldade em encontrar salas de estudo livres e falta de informação sobre as mesmas.  
**Feedback:**  
- “Falta de informação sobre as salas é o maior problema”  
- “A consulta em tempo real é essencial.”  

### **Entrevista 2 — Docente Simulação**
**Problemas reportados:** falta de organização nos equipamentos multimédia.  
**Feedback:**  
- “Gosto da ideia de ver o histórico de utilização de equipamentos.”  

### **Entrevista 3 — Funcionário Simulação**
**Problemas reportados:** reservas sobrepostas e devoluções fora de prazo.  
**Feedback:**  
- “Um painel para gerir estados e conflitos era a solução ideal.”  
- “Receber e gerir reservas facilitaria o trabalho diario e resolvia muitos problemas para os estudantes.”

### **Conclusões**
Os três perfis de utilizadores demonstram interesse real na aplicação. Reforçaram a importância de:  
- Visibilidade em tempo real    
- Gestão de conflitos
- Simplicidade e rapidez da interface  

---

## 10. Ferramentas Utilizadas
- **Figma / Excalidraw:** criação dos mockups e modelo de informação.  
- **GitHub:** controlo de versões e organização do projeto.  
- **Discord / conversas informais:** recolha de requisitos reais.

---

