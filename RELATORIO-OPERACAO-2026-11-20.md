# Relatório técnico — Operação Não Me Deixa no Visto

**Data:** 20/11/2026  
**Branch:** `main`  
**Repositório:** https://github.com/alexssander-cristino/nao-me-deixa-no-visto

## Resumo executivo

A base Three.js r128 + Electron foi preservada. Foram integrados quatro módulos novos, corrigidos pontos de persistência e colisão, melhoradas as reações da IA e substituído o loading temporizado por etapas de trabalho assíncronas.

**A operação ainda não está integralmente concluída.** Os sistemas implementados abaixo passaram por testes automatizados, mas o jogo ainda precisa de playtest visual prolongado, medição de desempenho na RTX 3050 Laptop e validação da distribuição Windows final.

## Arquivos criados

- `player-animation.js`
  - Corpo procedural articulado de primeira pessoa, com tronco, braços, antebraços, mãos, pernas, joelhos e pés.
  - Sincronização com posição, yaw, velocidade, corrida e agachamento.
  - Animação de alcance durante interação e reações corporais de medo.
  - Ocultação durante esconderijos; cabeça omitida para não bloquear a câmera.
- `enemy-animation.js`
  - Animação procedural com blending por estado, marcha, corrida, respiração e movimento de cabeça.
- `enemy-ai.js`
  - Percepção explícita por visão e audição. A entidade só atualiza a última posição conhecida quando vê o jogador ou recebe um ruído válido.
- `loading-manager.js`
  - Gerenciador assíncrono de tarefas ponderadas, com progresso emitido após cada tarefa real e tratamento de falhas.

## Arquivos modificados

- `index.html`
  - Integração do corpo do jogador, animação da Valdirene e módulo de percepção.
  - Passos, corrida, portas e objetos empurrados emitem eventos sonoros investigáveis.
  - Ataque final animado da Valdirene dentro do ambiente 3D, com aproximação, pose de ataque, câmera e áudio sincronizados.
  - Loading com etapas reais: construção do cenário/colisões, compilação de materiais/iluminação e primeiro render.
  - Salvamento ampliado com dificuldade, qualidade, FOV, sensibilidade, acessibilidade, posição vertical, agachamento, itens, portas e estado da entidade.
  - Restauração de portas também atualiza os colliders físicos.
  - Callbacks de áudio atrasados são invalidados ao pausar, morrer ou sair da partida, impedindo reprodução atrasada após retomar.
- `main.cjs`
  - Validação de payloads, rejeição de arrays, limite de 1 MB e escrita temporária exclusiva com limpeza em caso de erro.
- `tests/game-systems.test.cjs`
  - Testes para corpo do jogador, animação da Valdirene, loading, percepção, ataque, salvamentos, colisões e áudio.
- `.github/workflows/game-tests.yml`
  - Matriz Linux/Windows, testes em ambas as plataformas, empacotamento Linux e build portátil Windows com artefatos.
- `package.json`
  - Removido o maker Squirrel, que falhou no runner Windows por ferramenta externa ausente. Mantido o pacote ZIP portátil com o executável e os recursos necessários.

## Resultado dos testes automatizados

Workflow mais recente:  
https://github.com/alexssander-cristino/nao-me-deixa-no-visto/actions/runs/44821077423

- Ubuntu: **38 testes aprovados, 0 falhas**; empacotamento Electron Linux aprovado.
- Windows: **38 testes aprovados, 0 falhas**.
- Build portátil Windows: estava em execução no momento da atualização deste relatório; o resultado final e o artefato precisam ser confirmados no workflow.
- `npm audit`: 0 vulnerabilidades reportadas no último pipeline concluído.
- O pipeline anterior identificou que o maker Squirrel falhava no runner Windows. Ele foi removido; a distribuição configurada agora é ZIP portátil contendo o executável.

## Estado real dos sistemas

| Sistema | Situação |
|---|---|
| Corpo 3D do jogador | Procedural e integrado; sem rig externo, cabeça visível ou animações mocap |
| Animação da Valdirene | Rig procedural existente com blending de patrulha, busca e perseguição |
| Jumpscare | Ataque em ambiente 3D, com aproximação, animação, áudio e transição para morte; ainda sem captura de movimento |
| IA | Visão/audição explícitas, última posição conhecida, investigação de ruídos, busca e perseguição; pathfinding e estados legados ainda precisam de refinamento |
| Física do jogador | Cápsula 3D e colisões com geometria estática; degraus, escadas e rampas precisam de playtest |
| Física de objetos | Solver AABB 3D com gravidade, impulsos, colisões e sono; não é solver 6DOF com juntas |
| Interações | Coleta, portas e esconderijos integrados; gavetas, armários com inventário próprio e mecanismos adicionais não estão completos |
| Salvamento | Cinco slots, validação, gravação atômica no Electron, estado do jogador, itens, portas, entidade e configurações; não há estado de gavetas/mecanismos ainda inexistentes |
| Loading | Etapas reais de construção, compilação e primeiro render; não mede individualmente cada textura/modelo/arquivo de áudio |
| Áudio | Áudio posicional existente, ruídos investigáveis e invalidação de callbacks ao pausar; mixagem avançada por estado ainda parcial |
| Cenário | Geometria e materiais procedurais existentes; pipeline completo de assets PBR/LOD não foi criado |
| Lanterna | SpotLight, bateria, oscilação e falhas existentes; reflexos e volumetria física não implementados |
| HUD/UI | Menus, inventário, pausa, configurações e slots existentes; revisão visual geral pendente |
| Desempenho | Perfis gráficos e limite de FPS existentes; RTX 3050 Laptop ainda não medida |
| Electron | Isolamento de contexto, preload e salvamentos IPC existentes; Linux empacotado |
| Windows | Testes automatizados passaram; build portátil está em validação no workflow. A abertura interativa em desktop Windows ainda não foi observada |

## Como executar no Windows

Na pasta do repositório:

```powershell
npm install
npm start
```

Executar testes:

```powershell
npm test
```

Gerar o pacote portátil Windows:

```powershell
npm run make
```

O ZIP e os arquivos empacotados são gerados em `out/`. Extraia o ZIP e execute o arquivo `.exe` dentro da pasta do aplicativo. Não é necessário instalar Node.js ou ferramentas de desenvolvimento na máquina de destino.

## Validação manual ainda necessária

1. Abrir o jogo no Windows e percorrer os cinco capítulos.
2. Verificar clipping, visibilidade e proporções do corpo em primeira pessoa.
3. Testar a Valdirene em corredores, portas, esconderijos e perseguições.
4. Confirmar o ataque e a tela de morte em execução real.
5. Salvar e carregar cada tipo de estado do ambiente.
6. Testar escadas, degraus, rampas, portas e objetos empurráveis.
7. Medir FPS, frame time, VRAM e estabilidade na RTX 3050 Laptop de 6 GB.
8. Confirmar que o ZIP portátil abre em uma instalação limpa do Windows.

## Critério de conclusão

Esta entrega melhora e integra sistemas reais, mas não declara o jogo completo. A conclusão exige a validação manual acima e a implementação dos sistemas ainda parciais, especialmente gavetas/mecanismos, física avançada, assets visuais finais e testes de desempenho em hardware-alvo.
