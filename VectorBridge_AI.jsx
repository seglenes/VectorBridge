// VectorBridge_AI.jsx
// Version: 2.2
// Floating ScriptUI Panel for Illustrator

#target illustrator
#targetengine "vectorbridge"

    (function () {
        // Create floating window
        var win = new Window("palette", "Vector Bridge (AI)", undefined, { resizeable: false });
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 10;
        win.margins = 16;

        // UI Elements
        var title = win.add("statictext", undefined, "Push selected paths/text to AE:");
        title.alignment = "center";

        var grpOptions = win.add("group");
        grpOptions.add("statictext", undefined, "Mode:");
        var ddlMode = grpOptions.add("dropdownlist", undefined, [
            "Selection -> Separate Layers", 
            "Selection -> Group by AI Layer", 
            "Selection -> As Sequence", 
            "All Layers -> As Sequences"
        ]);
        ddlMode.selection = 1;

        var btnExport = win.add("button", [0, 0, 150, 40], "Push to AE 📤");
        var statusText = win.add("statictext", undefined, "Ready.");
        statusText.alignment = "center";

        // Main Logic when clicking the button
        btnExport.onClick = function () {
            statusText.text = "Exporting...";

            // BridgeTalk Workaround for Persistent Engines in Illustrator
            // Executing the logic in the main Illustrator thread so 'app' and 'activeDocument' are properly scoped.
            var bt = new BridgeTalk();
            bt.target = "illustrator";
            // Pass the selected mode index to the function
            bt.body = "var exportFunction = " + mainLogic.toString() + "; exportFunction(" + ddlMode.selection.index + ");";

            bt.onResult = function (resultMsg) {
                statusText.text = resultMsg.body;
            };

            bt.onError = function (err) {
                statusText.text = "Err: " + err.body;
                alert("BridgeTalk Error: " + err.body);
            };

            bt.send();
        };

        // --- CORE LOGIC (Executed via BridgeTalk) ---
        function mainLogic(modeIndex) {
            try {
                if (app.documents.length === 0) {
                    return "Error: No Document Open.";
                }

                var doc = app.activeDocument;

                // If mode is 0, 1, or 2, selection is required.
                if (modeIndex >= 0 && modeIndex <= 2) {
                    if (!doc.selection || doc.selection.length === 0) {
                        return "Error: Select something first.";
                    }
                }

                var abIdx = doc.artboards.getActiveArtboardIndex();
                var abRect = doc.artboards[abIdx].artboardRect; // [left, top, right, bottom]

                var exportData = {
                    shapes: [],
                    docBounds: {
                        left: abRect[0], top: abRect[1], right: abRect[2], bottom: abRect[3],
                        width: Math.abs(abRect[2] - abRect[0]),
                        height: Math.abs(abRect[3] - abRect[1])
                    }
                };

                function extractPathData(pathItem) {
                    var shapeData = {
                        type: "path",
                        name: pathItem.name || "Shape",
                        closed: pathItem.closed,
                        vertices: [],
                        inTangents: [],
                        outTangents: [],
                        fill: null,
                        stroke: null
                    };



                    if (pathItem.filled && pathItem.fillColor) shapeData.fill = parseColor(pathItem.fillColor);
                    if (pathItem.stroked && pathItem.strokeColor) {
                        shapeData.stroke = { color: parseColor(pathItem.strokeColor), width: pathItem.strokeWidth };
                    }

                    if (pathItem.pathPoints) {
                        for (var i = 0; i < pathItem.pathPoints.length; i++) {
                            var pt = pathItem.pathPoints[i];
                            var anchor = [pt.anchor[0], pt.anchor[1]];
                            shapeData.vertices.push(anchor);
                            shapeData.inTangents.push([pt.leftDirection[0] - anchor[0], pt.leftDirection[1] - anchor[1]]);
                            shapeData.outTangents.push([pt.rightDirection[0] - anchor[0], pt.rightDirection[1] - anchor[1]]);
                        }
                    }
                    return shapeData;
                }

                function parseColor(aiColor) {
                    if (!aiColor) return [0, 0, 0];
                    if (aiColor.typename === "RGBColor") return [aiColor.red / 255, aiColor.green / 255, aiColor.blue / 255];
                    if (aiColor.typename === "CMYKColor") {
                        var c = aiColor.cyan / 100, m = aiColor.magenta / 100, y = aiColor.yellow / 100, k = aiColor.black / 100;
                        return [1 - Math.min(1, c * (1 - k) + k), 1 - Math.min(1, m * (1 - k) + k), 1 - Math.min(1, y * (1 - k) + k)];
                    }
                    if (aiColor.typename === "GrayColor") return [1 - (aiColor.gray / 100), 1 - (aiColor.gray / 100), 1 - (aiColor.gray / 100)];
                    if (aiColor.typename === "SpotColor") {
                        var baseColor = parseColor(aiColor.spot.color);
                        var tint = (aiColor.tint !== undefined) ? aiColor.tint / 100 : 1;
                        return [
                            1 - (1 - baseColor[0]) * tint,
                            1 - (1 - baseColor[1]) * tint,
                            1 - (1 - baseColor[2]) * tint
                        ];
                    }
                    if (aiColor.typename === "GradientColor") {
                        // Temp fallback for gradients -> grab the first gradient color stop
                        try {
                            return parseColor(aiColor.gradient.gradientStops[0].color);
                        } catch (e) { return [0.5, 0.5, 0.5]; }
                    }
                    return [0, 0, 0];
                }

                function processItem(item, fallbackName) {
                    var safeName = "";
                    if (item.name) {
                        safeName = item.name;
                    } else if (item.layer && item.layer.name) {
                        safeName = item.layer.name;
                    } else if (fallbackName) {
                        safeName = fallbackName;
                    }

                    if (item.typename === "PathItem") {
                        var pathData = extractPathData(item);
                        pathData.name = safeName || "Path";
                        return pathData;
                    } else if (item.typename === "TextFrame") {
                        var textData = {
                            type: "text", name: safeName || "Text Layer", contents: item.contents,
                            position: [item.position[0], -item.position[1]], fontFamily: "Arial", fontSize: 12, fillColor: [1, 1, 1], justification: 0
                        };
                        if (item.textRange && item.textRange.characterAttributes) {
                            var chars = item.textRange.characterAttributes;
                            try { textData.fontFamily = chars.textFont.name; } catch (e) { }
                            try { textData.fontSize = chars.size; } catch (e) { }
                            if (chars.fillColor) textData.fillColor = parseColor(chars.fillColor);
                        }
                        if (item.textRange && item.textRange.paragraphAttributes) {
                            try {
                                if (item.textRange.paragraphAttributes.justification == Justification.CENTER) textData.justification = 2;
                                if (item.textRange.paragraphAttributes.justification == Justification.RIGHT) textData.justification = 1;
                            } catch (e) { }
                        }
                        return textData;
                    } else if (item.typename === "CompoundPathItem") {
                        var compoundObj = { type: "compound", name: safeName || "Compound Path", children: [] };
                        for (var j = item.pathItems.length - 1; j >= 0; j--) {
                            var child = processItem(item.pathItems[j], safeName);
                            if (child) compoundObj.children.push(child);
                        }
                        return compoundObj;
                    } else if (item.typename === "GroupItem") {
                        var groupObj = { type: "group", name: safeName || "Group", children: [] };
                        for (var g = item.pageItems.length - 1; g >= 0; g--) {
                            var child = processItem(item.pageItems[g], safeName);
                            if (child) groupObj.children.push(child);
                        }
                        return groupObj;
                    }
                    return null;
                }

                function gatherPaths(container) {
                    var paths = [];
                    for (var i = 0; i < container.pageItems.length; i++) {
                        var item = container.pageItems[i];
                        if (item.hidden || item.locked) continue;
                        if (item.typename === "PathItem") {
                            paths.push(item);
                        } else if (item.typename === "GroupItem") {
                            paths = paths.concat(gatherPaths(item));
                        }
                    }
                    return paths;
                }

                if (modeIndex === 0) {
                    // 0: Selection -> Separate Layers
                    var selection = doc.selection;
                    for (var i = selection.length - 1; i >= 0; i--) {
                        var selItem = selection[i];
                        var node = processItem(selItem);
                        if (node) {
                            try {
                                if (selItem.geometricBounds) {
                                    var b = selItem.geometricBounds;
                                    node.cx = (b[0] + b[2]) / 2;
                                    node.cy = (b[1] + b[3]) / 2;
                                }
                            } catch (e) { }
                            exportData.shapes.push(node);
                        }
                    }
                } else if (modeIndex === 1) {
                    // 1: Selection -> Group by AI Layer
                    var selection = doc.selection;
                    var groupsByLayer = {};
                    var orderedLayerNames = [];

                    for (var i = selection.length - 1; i >= 0; i--) {
                        var selItem = selection[i];
                        var node = processItem(selItem);
                        if (node) {
                            var layName = (selItem.layer && selItem.layer.name) ? selItem.layer.name : "Layer";
                            
                            if (!groupsByLayer[layName]) {
                                groupsByLayer[layName] = { type: "group", name: layName, children: [] };
                                orderedLayerNames.push(layName);
                            }
                            
                            try {
                                if (selItem.geometricBounds) {
                                    var b = selItem.geometricBounds;
                                    node.cx = (b[0] + b[2]) / 2;
                                    node.cy = (b[1] + b[3]) / 2;
                                }
                            } catch (e) { }
                            
                            groupsByLayer[layName].children.push(node);
                        }
                    }

                    for (var k = 0; k < orderedLayerNames.length; k++) {
                        exportData.shapes.push(groupsByLayer[orderedLayerNames[k]]);
                    }
                } else if (modeIndex === 2) {
                    // 2: Selection as Sequence
                    var selection = doc.selection;
                    var frames = [];
                    var firstFill = null, firstStroke = null;
                    var cx = 0, cy = 0;

                    for (var i = selection.length - 1; i >= 0; i--) {
                        var selItem = selection[i];
                        if (selItem.typename === "PathItem") {
                            var pData = extractPathData(selItem);
                            if (!firstFill && pData.fill) firstFill = pData.fill;
                            if (!firstStroke && pData.stroke) firstStroke = pData.stroke;
                            frames.push({ vertices: pData.vertices, inTangents: pData.inTangents, outTangents: pData.outTangents, closed: pData.closed });

                            if (frames.length === 1 && selItem.geometricBounds) {
                                var b = selItem.geometricBounds;
                                cx = (b[0] + b[2]) / 2;
                                cy = (b[1] + b[3]) / 2;
                            }
                        }
                    }

                    if (frames.length > 0) {
                        exportData.shapes.push({
                            type: "path_sequence",
                            name: "AnimSequence",
                            frames: frames,
                            fill: firstFill,
                            stroke: firstStroke,
                            cx: cx,
                            cy: cy
                        });
                    }
                } else if (modeIndex === 3) {
                    // 3: Canvas (Layer Sequences)
                    // Iterate from bottom layer to top layer
                    for (var i = doc.layers.length - 1; i >= 0; i--) {
                        var layer = doc.layers[i];
                        if (!layer.visible || layer.locked) continue;

                        var frames = [];
                        var firstFill = null, firstStroke = null;
                        var cx = 0, cy = 0;

                        var paths = gatherPaths(layer);
                        // internal pageItems are also top-to-bottom, so go backwards to get bottom-to-top frames
                        for (var r = paths.length - 1; r >= 0; r--) {
                            var pData = extractPathData(paths[r]);
                            if (!firstFill && pData.fill) firstFill = pData.fill;
                            if (!firstStroke && pData.stroke) firstStroke = pData.stroke;
                            frames.push({ vertices: pData.vertices, inTangents: pData.inTangents, outTangents: pData.outTangents, closed: pData.closed });

                            if (frames.length === 1 && paths[r].geometricBounds) {
                                var b = paths[r].geometricBounds;
                                cx = (b[0] + b[2]) / 2;
                                cy = (b[1] + b[3]) / 2;
                            }
                        }

                        if (frames.length > 0) {
                            exportData.shapes.push({
                                type: "path_sequence",
                                name: layer.name,
                                frames: frames,
                                fill: firstFill,
                                stroke: firstStroke,
                                cx: cx,
                                cy: cy
                            });
                        }
                    }
                }

                if (exportData.shapes.length === 0) return "Error: Found no valid paths/text for export.";

                function stringify(obj) {
                    var t = typeof (obj);
                    if (t != "object" || obj === null) return (t == "string") ? '"' + obj + '"' : String(obj);
                    var n, v, json = [], arr = (obj && obj.constructor == Array);
                    for (n in obj) {
                        v = obj[n]; t = typeof (v);
                        if (t == "string") v = '"' + v + '"'; else if (t == "object" && v !== null) v = stringify(v);
                        json.push((arr ? "" : '"' + n + '":') + String(v));
                    }
                    return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
                }

                var userDataFolder = Folder.userData;
                var tempFile = new File(userDataFolder.fsName + "/ai_to_ae_bridge_data.json");
                tempFile.encoding = "UTF-8";
                tempFile.open("w"); tempFile.write(stringify(exportData)); tempFile.close();

                return "✅ Pushed " + exportData.shapes.length + " item(s).";
            } catch (e) {
                return "Err: " + e.message + " (L:" + e.line + ")";
            }
        }

        win.center();
        win.show();

    })();
