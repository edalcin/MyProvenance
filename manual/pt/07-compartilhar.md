# Compartilhar

Um Registro pode ser compartilhado de duas formas independentes: um link público de leitura, ou coedição com outra Conta registrada.

## O que é e para que serve

O botão `Compartilhar` (visível para o dono e para Administradores, exige Conta) abre o diálogo `Compartilhar Registro` com duas abas:

- **`Link público`** — gera um link de leitura sem necessidade de sessão, sem direito a edição ou exclusão.
- **`Compartilhar com usuário`** — convida outra Conta registrada a coeditar o Registro com você, escolhendo o nível de permissão.

## Quando usar

`Link público` para divulgar um Registro finalizado a qualquer pessoa, sem que ela precise ter conta. `Compartilhar com usuário` para trabalhar em conjunto num mesmo Registro com outra pessoa que também usa o MyProvenance.

## Passo a passo

### Link público

1. Abra `Compartilhar` → aba `Link público`.
2. Clique em `Ativar link público`.
3. Clique em `Copiar` para copiar a URL gerada.
4. Para revogar o acesso, clique em `Desativar link público` — o link antigo para de funcionar.

### Compartilhar com usuário

1. Abra `Compartilhar` → aba `Compartilhar com usuário`.
2. Preencha `Nome de usuário` da Conta que vai receber acesso.
3. Escolha a `Permissão`: `Editor` ou `Administrador`.
4. Clique em `Compartilhar`.
5. A lista `Quem tem acesso` mostra todos com acesso ao Registro; use `Remover` para revogar o acesso de alguém, ou `Sair` para você mesmo deixar de ter acesso a um Registro compartilhado com você.

## Hierarquia de permissões

`Dono` > `Administrador` > `Editor`:

- **Editor** edita título, descrição e Atividades/Entidades, respeitando as mesmas regras de `Rascunho`/`Finalizado` do dono.
- **Administrador** tem paridade total com o dono: também pode `Finalizar`, `Excluir Registro`, e gerenciar o link público e quem tem acesso.
- Compartilhar de novo com alguém que já tem acesso apenas atualiza o papel dessa pessoa — a operação é idempotente.

## Screenshot

![Diálogo Compartilhar Registro, aba Link público](/manual/pt/07-dialog-link-publico.png)

![Aba Compartilhar com usuário, com campo de nome de usuário e seletor de permissão](/manual/pt/07-aba-compartilhar-usuario.png)

![Lista Quem tem acesso com os papéis de cada pessoa](/manual/pt/07-lista-acessos.png)

> 🔗 **Padrão:** compartilhar não altera o grafo de proveniência (`prov:Bundle` permanece o mesmo) — é uma camada de controle de acesso sobre quem pode consultar ou editar o Registro, não um dado de proveniência em si.

> 💡 **Dica:** o link público é sempre somente leitura, mesmo para quem tem permissão de Administrador — a única forma de editar é através de uma Conta com acesso via `Compartilhar com usuário`.

## Próximos passos

[Excluir registro](/como-usar/08-excluir-registro)
