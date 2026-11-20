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
- Build portátil Windows: **aprovado**; executável e ZIP gerados e artefato publicado.
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


---

## Aditivo — etapa de mecanismos interativos (20/11/2026)

### Auditoria confrontada com o código
A leitura deste relatório e dos módulos atuais confirmou que o jogo ainda usa:
- portas de passagem com rotação e collider atualizados;
- esconderijos de armário sem portas individuais;
- props dinâmicos por solver AABB 3D;
- salvamento de portas, itens e jogador, mas sem estado individual de mecanismos;
- personagens procedurais, sem esqueleto/mocap externo;
- cenário procedural, sem pipeline de assets PBR/LOD completo.

### Implementações desta etapa

| Item | Classificação | Resultado |
|---|---|---|
| Motor genérico de mecanismos | **PARCIAL** | Registro por ID, tipos hinge/drawer/switch/lever/button/lock, limites, animação temporal, chave opcional e serialização |
| Portas de armário | **PARCIAL** | Duas portas articuladas por armário, animação suave, geometria própria, colisores OBB atualizados e áudio posicional |
| Gavetas | **PARCIAL** | Duas gavetas por armário, deslocamento linear, limites, colisores atualizados e áudio posicional |
| Seleção individual | **PARCIAL** | Alvo de interação calculado por posição para cada porta/gaveta |
| Persistência | **PARCIAL** | Progresso, destino, bloqueio e habilitação de cada mecanismo entram no payload de salvamento; IDs são reconstruídos de coordenadas estáveis do cenário |
| Itens dentro de gavetas | **PENDENTE** | Gavetas ainda não possuem loot individual coletável nem integração de chave/cadeado no cenário |
| Disjuntores, interruptores e alavancas no cenário | **PENDENTE** | Tipos suportados pelo motor, mas não existem objetivos/malhas/efeitos de gameplay integrados |
| Física de objetos | **PARCIAL** | Solver AABB 3D existente preservado; não foi convertido em solver 6DOF nem recebeu rampas/escadas físicas |
| Rig humano esquelético | **PENDENTE** | Rig atual continua procedural por pivôs; não há esqueleto externo, skinning completo ou mocap |
| Valdirene e animações | **PARCIAL** | Blending procedural existente preservado; não há nova animação de busca específica de armário nem mocap |
| Modelos e ambientes PBR/LOD | **PENDENTE** | Esta etapa acrescentou detalhes funcionais às portas/gavetas; não substitui o pipeline de arte final |
| Salvamentos antigos | **PARCIAL** | Campos novos são opcionais; saves anteriores sem `mechanisms` continuam carregando sem restaurar estados inexistentes |
| Testes automatizados | **NÃO VALIDADO** | Foram adicionados quatro testes unitários de mecanismos; execução do workflow correspondente ainda precisa terminar |
| Teste visual prolongado no Windows | **NÃO VALIDADO** | Não foi executado nesta sessão |
| Benchmark RTX 3050 Laptop 6 GB | **NÃO VALIDADO** | Nenhum FPS, frame time, RAM ou VRAM foi medido; não há números estimados apresentados como medição |

### Arquivos desta etapa
- Criado `mechanisms.js`: motor de estados, animação, travas opcionais e snapshot/restore.
- Criado `tests/mechanisms.test.cjs`: testes de gaveta, dobradiça, chave, ID único, restauração e limites.
- Modificado `index.html`: criação de portas e gavetas nos armários existentes, interação por proximidade, áudio, colisores e persistência.
- Este relatório atualizado com o estado real, sem elevar itens parciais a concluídos.

### Limitações e riscos ainda abertos
1. As portas e gavetas foram integradas aos armários existentes, mas não há itens coletáveis gerados dentro delas.
2. O inventário atual do jogo não possui uma coleção de chaves; por isso, a capacidade de cadeado do motor é testada isoladamente, não usada numa missão.
3. O sistema não cria automaticamente mecanismos de história, disjuntores ou alavancas: esses elementos exigem objetivos e efeitos narrativos específicos por capítulo.
4. A colisão das portas/gavetas usa OBB 2D no plano do cenário, coerente com a arquitetura atual; não é colisão rígida 6DOF.
5. A qualidade visual geral, rig esquelético, física de rampas/escadas e otimização GPU continuam sem implementação/validação suficientes.
6. Os novos estados de mecanismo só podem ser considerados validados após CI e playtest no executável Windows.

### Estado da operação
**A operação permanece aberta.** A integração de portas e gavetas é um avanço funcional, não a conclusão absoluta solicitada. CI, validação visual real no Windows e benchmark físico da RTX 3050 ainda são critérios bloqueadores.


### Resultado de validação automatizada após a integração

Workflow: https://github.com/alexssander-cristino/nao-me-deixa-no-visto/actions/runs/44824652262  
Commit de código testado: `14f1e96d94d65d20fbd3f5e2d1df030c43d0b97d`

- Linux: **42 testes aprovados, 0 falhas**; pacote Electron Linux gerado.
- Windows: **42 testes aprovados, 0 falhas**; build portátil Windows aprovado.
- Artefatos `game-build-Windows` e `game-build-Linux` publicados pelo workflow.
- Execução concluída com **success**.
- O primeiro CI da integração encontrou apenas uma asserção antiga que esperava `schema:3`; a expectativa foi atualizada para o payload `schema:4` com snapshot de mecanismos. Nenhum teste foi removido.
- Essa aprovação comprova testes automatizados e empacotamento, não comprova playtest visual no desktop nem benchmark de hardware.

Classificação atualizada: **testes automatizados — CONCLUÍDO** para o commit acima; **build portátil Windows — CONCLUÍDO** em CI; **teste manual Windows e RTX 3050 — NÃO VALIDADO**.


### Extensão de loot e validação incremental (20/11/2026)

- A primeira gaveta inferior do primeiro armário de cada capítulo agora pode revelar uma pilha coletável. O item reutiliza o fluxo existente de bateria/inventário e não é duplicado quando já consta no progresso coletado.
- Ao carregar um save com a gaveta aberta, o loot é reconstruído se ainda não foi coletado; se já foi coletado, permanece ausente.
- Foi adicionado teste de regressão para spawn, coleta e restauração sem duplicação.
- Workflow atual: https://github.com/alexssander-cristino/nao-me-deixa-no-visto/actions/runs/44824993583
- Os testes automatizados Linux e Windows passaram nesta execução; o build/artefato Windows ainda estava em execução no momento deste registro.
- O loot continua **PARCIAL**: só há um ponto de loot por capítulo; não há tabela de itens aleatórios, chaves de missão ou conteúdo individual em todas as gavetas.


### Resultado final do workflow após o loot de gaveta

Workflow: https://github.com/alexssander-cristino/nao-me-deixa-no-visto/actions/runs/44824993583  
Commit de código: `4a27e978777ecae0ab845a135f6c16bccb7b1d20`

- Linux: **43 testes aprovados, 0 falhas**.
- Windows: **43 testes aprovados, 0 falhas**.
- Empacotamento portátil Windows: **success**.
- Artefatos `game-build-Windows` (aprox. 333 MB) e `game-build-Linux` (aprox. 132 MB) publicados.
- Workflow completo: **completed / success**.

Aprovação do workflow cobre testes automatizados e build, mas não altera as classificações de playtest manual e benchmark: ambos continuam **NÃO VALIDADO**.
