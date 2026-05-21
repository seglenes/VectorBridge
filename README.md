# Vector Bridge

*Read this in other languages: [English](#english), [Português](#português-pt-br).*

---

## English

**Vector Bridge** is a script toolset with a graphical user interface (ScriptUI Panels) for seamlessly transferring vector graphics from Adobe Illustrator to Adobe After Effects. It precisely preserves layer structures, Z-ordering, absolute positioning, text layers, and parametric shapes without relying on external files or messy SVGs.

### ✨ Features (v2.3)
1. **Real-time Interface**: Native floating panels in both software tools—no need to constantly go to `File > Scripts`.
2. **Auto-Outlines for Text**: Text elements are automatically converted to vector outlines during export. They arrive in AE as perfectly organized Shape Layers, guaranteeing 100% visual fidelity without any missing font issues or layout breaks.
3. **Smart Split Layers (Structural Groups)**: 
   - If you have 5 loose shapes in AI, AE creates 5 independent Shape Layers.
   - If you wrap them in an Illustrator Group, AE creates only 1 Shape Layer containing the 5 properties internally.
4. **Inverted Z-Index Ordering**: AE builds properties from bottom to top, unlike Illustrator. Our engine automatically inverts recursive reads, ensuring background objects covering others in AI maintain the exact same overlay depth in AE.
5. **Absolute and Relative Positioning**: It maps to the anchor of the active Illustrator Artboard, transferring it perfectly to your AE Composition origin. Elements aligned to corners in AI will spawn in the exact same corners in AE.
6. **Compound Paths (Pathfinder/Holes)**: Elements merged or "punched" by AI's Pathfinder maintain their properties. AE replicates the Clipping/Hole behavior by automatically triggering a Merge Paths operation on the group's root.
7. **Parametric Shapes & Live Shapes**: Invisibly audits Adobe's native Live Shapes. If it detects pure Rectangles or Ellipses, it recreates them natively in AE, giving you absolute control over Parametric Dimensions and Roundness.
8. **Spot Color Support**: Say goodbye to global swatch issues. Captures Spot Colors and derived tints, converting the values to pure RGB equivalents ready for your composition.

### ⚠️ Known Limitations
- **Gradients**: Gradients are not fully supported yet and will fall back to solid colors (usually the first stop of the gradient).

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
2. **Auto-Outlines para Texto**: Elementos de texto são automaticamente convertidos em vetores (outlines) de forma invisível durante a exportação. Eles chegam ao AE como Shape Layers perfeitamente agrupadas, garantindo 100% de fidelidade visual sem quebra de layout ou erros de fonte não encontrada.
3. **Split Layers Inteligentes (Grupos Estruturais)**: 
   - Se você tiver 5 formas soltas no AI, o AE criará 5 Shape Layers independentes.
   - Se você agrupou elas num Group, o AE criará apenas 1 Shape Layer contendo as 5 propriedades internamente na raiz.
4. **Z-Index de Camadas Invertidas**: O AE constrói propriedades de baixo para cima (diferente do Illustrator). O motor inverte a leitura recursiva automaticamente, garantindo que objetos de fundo continuem exatemente com a mesma profundidade de visualização (Overlay) nas propriedades finais.
5. **Posição Relativa e Absoluta**: Mapeia a âncora do Active Artboard do Illustrator, transferindo-a para a origem da sua Composição. Elementos alinhados aos cantos no AI nascerão nos mesmos cantos no AE.
6. **Compound Paths (Pathfinder/Vazados)**: Elementos mesclados ou "furados" pelo Pathfinder têm sua propriedade resgatada. O AE replica o comportamento de Clipping/Hole acionando um Merge Paths automático na propriedade raiz do grupo.
7. **Formas Paramétricas e Live Shapes**: O motor audita os Live Shapes do Adobe invisivelmente. Se reconhecer Rectangles (Retângulos) e Ellipses (Círculos) puros, ele recria a forma nativamente no AE, dando controle absoluto de Roundness e Dimensões paramétricas.
8. **Suporte a Spot Colors (Cores Especiais)**: Adeus aos problemas com cores globais. Captura cores especiais (Spot) e tintas derivadas, convertendo os valores exatamente para equivalentes RGB puros, prontos para a composição no AE.

### ⚠️ Limitações Conhecidas
- **Gradientes**: Ainda não há suporte pleno para a conversão de gradientes (os objetos assumem a cor sólida da primeira cor do gradiente).

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
