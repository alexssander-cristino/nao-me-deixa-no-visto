# Auditoria técnica — Não Me Deixa no Visto

## Estado da base auditada

- Renderização: Three.js r128 carregado localmente pelo Electron; o jogo cria uma única cena e uma câmera FPS.
- Arquitetura: Electron + HTML/CSS + JavaScript clássico. A lógica de gameplay, níveis, áudio, UI e ciclo principal ainda está concentrada em `index.html` (arquivo monolítico).
- Módulos já separados: `input.js`, `physics.js`, `controller.js`, `models.js`.
- Física do jogador: colisão circular 2.5D contra OBBs rotacionados. Não equivale a um character controller 3D com cápsula, degraus e gravidade.
- Props físicos: solver próprio 3D simplificado com corpos AABB, gravidade, impulso, contato, atrito e sono. Não oferece juntas/dobradiças ou solver geral 6DOF.
- Modelos: Valdirene é procedural e hierárquica, mas ainda construída com geometrias paramétricas; não há pipeline de assets com rig/UV/normal maps autorados.
- Materiais: predominam materiais MeshStandardMaterial e texturas procedurais pontuais; não há conjunto PBR completo por superfície.
- Iluminação: luz ambiente e fontes locais, SpotLight da lanterna e sombras dinâmicas. Não há GI real, SSR ou volumetria.
- IA: estados de patrulha/investigação/perseguição e percepção por distância/linha de visão/audição, implementados na lógica do jogo.
- Áudio: Web Audio API, síntese procedural e panner HRTF; oclusão é aproximada por raycast 2D.
- Persistência: localStorage com sanitização de configurações e progresso.
- Testes: testes Node para física, controle, entrada e integração estática; não substituem playtest gráfico dentro de Chromium/Windows.

## Defeitos e riscos identificados

1. O ciclo de renderização e o gameplay ainda compartilham um único loop; física, câmera e UI não têm cadências independentes.
2. O mouse usa coleta por evento e consumo por frame, mas a integração Pointer Lock/fallback ainda precisa de validação interativa no navegador e no Electron.
3. O fallback de arraste é limitado: não reproduz a liberdade de movimento do Pointer Lock e precisa ser tratado apenas como contingência.
4. A câmera FPS e o jogador são essencialmente 2.5D; não há gravidade vertical do jogador nem detecção de degraus real.
5. A física de props usa AABBs alinhadas aos eixos, sem rotação completa no contato entre corpos.
6. A lanterna usa SpotLight e um cone visual; o cone decorativo não é volumetria e não substitui iluminação indireta.
7. O pipeline atual não tem pós-processamento dedicado nem AO em tela; não se deve mascarar a falta desses recursos com vinheta pesada.
8. Modelos e cenários são gerados por código; não há inventário de assets externos/licenças nem pipeline de LOD/UV.
9. O CI consultava sempre o PR #4 no endpoint do SonarCloud, o que foi corrigido para usar o número do PR atual.

## Sequência de reconstrução

1. **Fundação e estabilidade:** entrada, ciclo de jogo, renderer, telemetria de frame time e testes de regressão.
2. **Renderização e materiais:** perfis gráficos centralizados, color management, materiais por superfície e iluminação calibrada.
3. **Física e controle:** separar simulação fixa da renderização; avaliar integração de character controller e juntas para props.
4. **Arte e ambientes:** pipeline de assets com licença, escala, UV, materiais, LOD e revisão de todos os níveis.
5. **Personagens e animação:** rigs, clips, blending e estados de animação para jogador e entidade.
6. **IA e áudio:** máquina de estados explícita, memória de percepção, áudio por evento e oclusão espacial melhor definida.
7. **Gameplay e UX:** validar progressão, interações, salvamento, menus e acessibilidade.
8. **Validação final:** testes automatizados, execução em Chromium/Electron e playtest de cada nível em hardware real.

## Entrega desta etapa

- Criado `rendering.js` para centralizar perfis Low/Medium/High e configuração do renderer Three.js.
- `index.html` passou a usar o módulo em vez de duplicar a configuração de qualidade.
- Adicionado teste automatizado para limites de pixel ratio, sombras e perfis.
- Corrigido o workflow para consultar o PR correto no SonarCloud.

## Limites de validação

Nenhum teste automatizado de Node comprova qualidade visual, sensação de mouse, áudio espacial ou estabilidade em GPU. Esses itens só podem ser marcados como concluídos após execução interativa nos ambientes de destino.
