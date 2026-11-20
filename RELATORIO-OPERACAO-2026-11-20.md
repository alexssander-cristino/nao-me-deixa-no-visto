# Relatório técnico — Operação Não Me Deixa no Visto

**Data:** 20/11/2026  
**Branch:** `main`  
**Commit de referência:** `2e5ed29280eef82249d6cee1c33215a837a18507`

## Resumo executivo

A base existente foi preservada. A auditoria confirmou uma aplicação Three.js r128 + Electron, com gameplay principal ainda concentrado em `index.html` e módulos auxiliares para entrada, física, controle FPS, modelos, renderização e salvamento.

Nesta etapa foram corrigidos os testes de regressão que estavam bloqueando o CI e integrado um corpo procedural articulado de primeira pessoa, sincronizado com posição, rotação, velocidade, corrida e agachamento do jogador. A cabeça foi omitida para não obstruir a câmera FPS; o avatar desaparece enquanto o jogador está escondido.

**Não é uma conclusão integral da operação solicitada.** Vários sistemas ainda estão parciais e exigem implementação adicional e validação visual interativa.

## Arquivos modificados

- `index.html`
  - Carrega o novo módulo `player-animation.js`.
  - Cria o avatar ao construir cada fase.
  - Atualiza a animação do corpo junto ao controlador FPS.
- `tests/game-systems.test.cjs`
  - Corrige a expectativa antiga de um único script inline; agora valida os dois blocos inline existentes.
  - Adiciona teste de integração do corpo articulado.

## Arquivos criados

- `player-animation.js`
  - Corpo procedural com tronco, braços, antebraços, mãos, pernas, joelhos e pés.
  - Pivôs articulados e animação de marcha/corrida/agachamento.
  - Sincronização com transformações do jogador e ocultação durante esconderijos.

## Sistemas e estado técnico observado

| Sistema | Estado nesta etapa |
|---|---|
| Corpo 3D do jogador | Implementado em versão procedural de primeira pessoa; não é um rig humano completo com cabeça visível |
| Valdirene | Modelo procedural articulado existente; ainda sem rig/asset externo e clips autorados |
| Jumpscare | Sequência 3D procedural existente; ataque cinematográfico letal e variações ainda precisam de evolução |
| IA | Patrulha, relocação, perseguição, busca e investigação existentes; percepção e transições ainda precisam de refinamento |
| Física do jogador | Cápsula 3D em implementação, com colisão contra geometria estática; escadas/degraus e rampas exigem validação e melhorias |
| Física de objetos | Solver AABB simplificado; não equivale a solver 6DOF com juntas |
| Interações | Coleta, portas e esconderijos funcionais; gavetas, armários com estados próprios e mecanismos adicionais não estão completos |
| Salvamento | Cinco slots, validação de envelope e persistência Electron/localStorage; restauração do estado do mundo ainda é parcial |
| Loading | Ainda não há progresso granular real de todos os recursos; o carregamento de fase usa espera artificial e precisa ser substituído |
| Áudio | Web Audio e posicionamento estéreo existentes; mixagem por estado e cancelamento central de eventos ainda são parciais |
| Cenário | Geometria e materiais procedurais existentes; não há pipeline completo de assets PBR/LOD |
| Lanterna | SpotLight, bateria, oscilação e modelo de mão existentes; reflexos e volumetria física não implementados |
| HUD/UI | Menus, inventário, pausa, configurações e slots existentes; feedback e acabamento ainda precisam de revisão |
| Desempenho | Perfis Low/Medium/High e limites de renderização existentes; RTX 3050 Laptop não foi medida nesta etapa |
| Electron | Main/preload com context isolation e IPC de salvamento; empacotamento CI passou em runner Linux |
| Windows | Instalador/EXE e execução gráfica real ainda não validados em Windows |

## Testes executados

Workflow GitHub Actions:  
https://github.com/alexssander-cristino/nao-me-deixa-no-visto/actions/runs/44818859545

- `npm ci --ignore-scripts`: aprovado.
- Instalação do binário Electron no CI: aprovada.
- `npm audit`: 0 vulnerabilidades reportadas.
- `npm test`: **30 aprovados, 0 falhas**.
- `npm run package`: aprovado no runner Linux.

O teste de regressão anterior falhava porque esperava um único bloco inline, apesar do bootstrap de fallback do Three.js ser um segundo bloco válido. A expectativa foi corrigida sem remover o fallback.

## Pendências prioritárias

1. Implementar loading assíncrono por tarefas reais de modelos, texturas, áudio, física e IA, removendo a espera artificial.
2. Completar o contrato de salvamento/restauração de estados serializáveis de todos os objetos e eventos.
3. Consolidar a IA em máquina de estados explícita, com investigação de ruídos/portas/objetos e memória de última posição.
4. Criar a sequência de ataque/jumpscare letal com animação e áudio sincronizados.
5. Evoluir as interações de gavetas, armários, mecanismos e objetos manipuláveis.
6. Completar a física de degraus, rampas e colisões de objetos, mantendo explícitas as limitações do solver atual.
7. Validar animação e clipping do avatar e da Valdirene em execução real.
8. Fazer playtest no Windows/Electron e medir frame time/VRAM em RTX 3050 Laptop 6 GB.
9. Gerar e testar o instalador Windows com `npm run make` em ambiente Windows.

## Como executar

Na pasta do repositório, com Node.js instalado:

```bash
npm install
npm start
```

Testes:

```bash
npm test
```

Gerar pacote/instalador no Windows:

```bash
npm run make
```

Os artefatos são gerados em `out/`. A assinatura digital do executável não está configurada.
