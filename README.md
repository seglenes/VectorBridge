# Vector Bridge

Vector Bridge is a script toolset for seamlessly transferring vector graphics from Adobe Illustrator to Adobe After Effects. It precisely preserves layer structures (including nested groups converted to Shape Layer groups), Z-ordering, and positioning, mapping correctly to standard 1080p compositions.

## Features (v2.1)
- **Nested Groups**: Accurately imports Illustrator group structures as nested groups within an After Effects Shape Layer.
- **Accurate Positioning**: Maps Illustrator document coordinates to After Effects composition coordinates, keeping the visual layout intact.
- **Text & Font Handling**: Correctly handles text scaling and font settings during import.
- **Complex Paths**: Robust support for compound paths and masked objects.

## Usage
1. Open your artwork in Adobe Illustrator.
2. Run `VectorBridge_AI.jsx` in Illustrator to export the structural data.
3. Open Adobe After Effects.
4. Run `VectorBridge_AE.jsx` to build the shapes from the exported data.

*(For detailed instructions and notes on current limitations like Gradients, see `LEIA-ME.txt` or future updates).*

## License
Provided "as is" or per the standard terms associated with your usage.
