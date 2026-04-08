# Vector Bridge

*Read this in other languages: [English](#english), [Português](#português-pt-br).*

---

## English

**Vector Bridge** is a script toolset with a graphical user interface (ScriptUI Panels) for seamlessly transferring vector graphics from Adobe Illustrator to Adobe After Effects. It precisely preserves layer structures, Z-ordering, absolute positioning, text layers, and parametric shapes without relying on external files or messy SVGs.

### ✨ Features (v2.3)
1. **Real-time Interface**: Native floating panels in both software tools—no need to constantly go to `File > Scripts`.
2. **Live Text Support**: Illustrator text elements are built as real Text Layers in After Effects (injecting font, color, paragraph, and content), allowing you to edit the text and use native AE Animators.
3. **Smart Split Layers (Structural Groups)**: 
   - If you have 5 loose shapes in AI, AE creates 5 independent Shape Layers.
   - If you wrap them in an Illustrator Group, AE creates only 1 Shape Layer containing the 5 properties internally.
4. **Inverted Z-Index Ordering**: AE builds properties from bottom to top, unlike Illustrator. Our engine automatically inverts recursive reads, ensuring background objects covering others in AI maintain the exact same overlay depth in AE.
5. **Absolute and Relative Positioning**: It maps to the anchor of the active Illustrator Artboard, transferring it perfectly to your AE Composition origin. Elements aligned to corners in AI will spawn in the exact same corners in AE.
6. **Compound Paths (Pathfinder/Holes)**: Elements merged or "punched" by AI's Pathfinder maintain their properties. AE replicates the Clipping/Hole behavior by automatically triggering a Merge Paths operation on the group's root.
7. **Multi-Path Sequence Animation**: Export independent art groups as animated sequences ("Selection as Sequence" or "Canvas as Sequence"). You can export complex arrangements and the script will calculate frames by synchronizing all properties in AE.
8. **Parametric Shapes & Live Shapes**: Invisibly audits Adobe's native Live Shapes. If it detects pure Rectangles or Ellipses, it recreates them natively in AE, giving you absolute control over Parametric Dimensions and Roundness.
9. **Spot Color Support**: Say goodbye to global swatch issues. Captures Spot Colors and derived tints, converting the values to pure RGB equivalents ready for your composition.

### ⚠️ Known Limitations
- **Text Layers**: Font styles might occasionally default to basic fonts if exact matches aren't found in AE. Full rich text fidelity is a work in progress.
- **Gradients**: Gradients are not fully supported yet and will fall back to solid colors.

### 🚀 Usage

**In Adobe Illustrator:**
1. Go to `File > Scripts > Other Script...` and run `VectorBridge_AI.jsx` (the panel will float).
2. Draw your vectors, groups, and text.
3. Select everything you want to export.
4. Click the **Push to AE 📤** button.

**In Adobe After Effects:**
1. Go to `File > Scripts > Run Script File...` and run `VectorBridge_AE.jsx` (you can dock this panel in your native AE UI).
2. With your Composition active, click **📥 Pull from AI**.
3. Watch your graphics convert into native Shape Layers and Text Layers, ready for animation!

### 📝 License
Provided "as is" or per the standard terms associated with your usage.

---

## Português (PT-BR)

**Vector Bridge** é um conjunto de scripts com interface gráfica nativa (ScriptUI Panels) para transferir gráficos vetoriais do Adobe Illustrator para o Adobe After Effects de forma perfeita. A ferramenta preserva com precisão estruturas de camadas, ordenação Z (Z-Index), posicionamento absoluto, textos editáveis e formas paramétricas.

### ✨ Novidades da V2.3
1. **Interface em Tempo Real**: Em vez de ir em `File > Scripts` o tempo todo, agora você tem Painéis nativos e flutuantes nos dois softwares.
2. **Live Text Support (Texto Editável)**: Se a sua seleção no Illustrator tiver um objeto de Texto, o AE construirá uma Text Layer real (injetando fonte, cor, parágrafo e conteúdo), permitindo editar o texto e usar Animators nativos do AE.
3. **Split Layers Inteligentes (Grupos Estruturais)**: 
   - Se você tiver 5 formas soltas no AI, o AE criará 5 Shape Layers independentes.
   - Se você agrupou elas num Group, o AE criará apenas 1 Shape Layer contendo as 5 propriedades internamente na raiz.
4. **Z-Index de Camadas Invertidas**: O AE constrói propriedades de baixo para cima (diferente do Illustrator). O motor inverte a leitura recursiva automaticamente, garantindo que objetos de fundo continuem exatemente com a mesma profundidade de visualização (Overlay) nas propriedades finais.
5. **Posição Relativa e Absoluta**: Mapeia a âncora do Active Artboard do Illustrator, transferindo-a para a origem da sua Composição. Elementos alinhados aos cantos no AI nascerão nos mesmos cantos no AE.
6. **Compound Paths (Pathfinder/Vazados)**: Elementos mesclados ou "furados" pelo Pathfinder têm sua propriedade resgatada. O AE replica o comportamento de Clipping/Hole acionando um Merge Paths automático na propriedade raiz do grupo.
7. **Animação de Sequências Multi-Path**: Suporta exportar grupos de arte independentes como sequências animadas ("Selection as Sequence"). Você pode exportar arranjos complexos com múltiplos objetos, e o script calculará os frames sincronizando todas as propriedades no After Effects.
8. **Formas Paramétricas e Live Shapes**: O motor audita os Live Shapes do Adobe invisivelmente. Se reconhecer Rectangles (Retângulos) e Ellipses (Círculos) puros, ele recria a forma nativamente no AE, dando controle absoluto de Roundness e Dimensões paramétricas.
9. **Suporte a Spot Colors (Cores Especiais)**: Adeus aos problemas com cores globais. Captura cores especiais (Spot) e tintas derivadas, convertendo os valores exatamente para equivalentes RGB puros, prontos para a composição no AE.

### ⚠️ Limitações Conhecidas
- **Camadas de Texto**: Fontes podem eventualmente cair para a fonte padrão (ex: Times New Roman) caso o arquivo falhe em parear exatamente o nome da fonte no After Effects.
- **Gradientes**: Ainda não há suporte pleno para a conversão de gradientes.

### 🚀 Como Usar no Dia-a-Dia

**No Illustrator:**
1. Vá em `File > Scripts > Other Script...` e escolha `VectorBridge_AI.jsx` (a janela vai ficar flutuando).
2. Desenhe vetores normais, grupos e textos. 
3. Selecione tudo o que quer exportar.
4. Clique no botão **Push to AE 📤**.

**No After Effects:**
1. Vá em `File > Scripts > Run Script File...` e rode `VectorBridge_AE.jsx` (você pode "dockar" o painel junto às abas nativas do seu AE).
2. Com a sua Composição aberta, clique em **📥 Pull from AI**.
3. Assista as Shapes Layers isoladas e Text Layers nascerem perfeitamente prontas para animação!

### 📝 Licença
Fornecido "no estado em que se encontra" ("as is") ou de acordo com os termos padrão de uso.
