# Voz original da Valdirene

## Estado atual

O jogo possui um sistema de diálogos narrativos integrado aos 15 capítulos, com legendas sincronizadas, fila/prioridade, controle de repetição, interrupção, persistência por partida e áudio espacial HRTF quando a personagem está fisicamente presente.

**As gravações de voz ainda não foram fornecidas.** Não há arquivos de diálogo humano neste diretório e o jogo não finge reproduzi-los: quando um arquivo está ausente, a legenda é exibida pelo tempo estimado e o sistema segue sem voz. Os efeitos não verbais existentes (grito feminino, vento, respiração e rosnado) continuam sendo efeitos separados, não falas da personagem.

## Entrega das gravações

Consulte `voice-manifest.json` para a lista completa de 330 assets esperados (22 variações/eventos por capítulo, distribuídos pelos 15 capítulos).

Padrão de caminho:

```
audio/valdirene/pt-BR/capitulo-01/vd-c01-intro-01.ogg
audio/valdirene/pt-BR/capitulo-01/vd-c01-explore-a.ogg
...
vd-c01-laugh.ogg
...
audio/valdirene/pt-BR/capitulo-15/vd-c15-death.ogg
```

- Formato recomendado: OGG Vorbis, mono, 48 kHz, 96–160 kbps.
- Voz: feminina adulta, português brasileiro, interpretação natural e consistente.
- Pico máximo recomendado: -1 dBTP; loudness alvo aproximado: -18 LUFS integrado para falas.
- Remover ruído e silêncio excessivo sem eliminar respiração intencional.
- Manter o mesmo timbre entre capítulos; variar intensidade, distância vocal, sarcasmo, irritação e vulnerabilidade conforme a progressão.
- Para sussurros, gravar uma interpretação sussurrada real; não apenas reduzir o volume de uma fala normal.
- Nomear cada arquivo exatamente como no manifesto. Não alterar o identificador usado pelo código.
- As falas de proximidade/perseguição usam espacialização 3D quando Valdirene está no mundo; as falas narrativas sem presença física são reproduzidas sem posição falsa.

## Acessibilidade

As legendas podem ser desativadas independentemente da voz nas Configurações. O controle de volume da voz é independente dos efeitos e do ambiente.

## Direitos de uso

As gravações devem ser originais ou licenciadas expressamente para uso comercial no jogo, incluindo distribuição em versões executáveis e atualizações. Guarde autorizações/licenças junto aos arquivos de produção.
