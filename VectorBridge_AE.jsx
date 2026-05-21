// VectorBridge_AE.jsx
// Version: 2.2
// Floating ScriptUI Panel for After Effects

(function (thisObj) {
    // UI Setup (Works as both dockable panel or floating palette)
    var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Vector Bridge (AE)", undefined, { resizeable: false });

    if (win !== null) {
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 10;
        win.margins = 16;

        var title = win.add("statictext", undefined, "Pull shapes/text from AI:");
        title.alignment = "center";

        var btnImport = win.add("button", [0, 0, 150, 40], "📥 Pull from AI");
        var statusText = win.add("statictext", undefined, "Ready.");
        statusText.alignment = "center";

        // Estilizando a UI (Anarquizando o sistema!)
        try {
            var bgColor = win.graphics.newBrush(win.graphics.BrushType.SOLID_COLOR, [0.4, 0.15, 0.6, 1]); // Roxo vibrante
            win.graphics.backgroundColor = bgColor;
            
            var whitePen = win.graphics.newPen(win.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
            title.graphics.foregroundColor = whitePen;
            statusText.graphics.foregroundColor = whitePen;
        } catch(e) {}

        // Import Logic
        btnImport.onClick = function () {
            var comp = app.project.activeItem;
            if (!(comp instanceof CompItem)) {
                statusText.text = "Error: Select a Comp.";
                return;
            }

            var userDataFolder = Folder.userData;
            var tempFile = new File(userDataFolder.fsName + "/ai_to_ae_bridge_data.json");

            if (!tempFile.exists) {
                statusText.text = "Error: No AI data found.";
                return;
            }

            tempFile.open("r");
            tempFile.encoding = "UTF-8";
            var jsonString = tempFile.read();
            tempFile.close();

            var importedData = null;
            try {
                if (typeof JSON !== "undefined") {
                    importedData = JSON.parse(jsonString);
                } else {
                    importedData = eval("(" + jsonString + ")");
                }
            } catch (e) {
                statusText.text = "Error parsing data.";
                return;
            }

            if (!importedData || !importedData.shapes || importedData.shapes.length === 0) {
                statusText.text = "No valid shapes found.";
                return;
            }

            var currentTime = new Date().getTime();
            if (importedData.timestamp) {
                var ageInMinutes = (currentTime - importedData.timestamp) / 1000 / 60;
                if (ageInMinutes > 5) {
                    var confirmOld = confirm("The data from Illustrator is over " + Math.round(ageInMinutes) + " minutes old. The AI export might have failed.\n\nContinue trying to import anyway?");
                    if (!confirmOld) {
                        statusText.text = "Import cancelled.";
                        return;
                    }
                }
            }

            app.beginUndoGroup("Import from Vector Bridge");

            var targetLayer = (comp.selectedLayers.length > 0) ? comp.selectedLayers[0] : null;

            var docW = importedData.docBounds.width;
            var docH = importedData.docBounds.height;
            var docLeft = importedData.docBounds.left || 0;
            var docTop = importedData.docBounds.top || 0;

            var cW = comp.width;
            var cH = comp.height;

            var aiCenterX = docLeft + docW / 2;
            var aiCenterY = docTop - docH / 2;

            function buildPath(shapeData, parentGroup, skipAppearance, refX, refY) {
                var pathGroup = parentGroup.addProperty("ADBE Vector Group");
                pathGroup.name = shapeData.name || "Path";
                var pathGroupContents = pathGroup.property("ADBE Vectors Group");

                if (shapeData.type === "rect") {
                    var pathProperty = pathGroupContents.addProperty("ADBE Vector Shape - Rect");
                    pathProperty.property("ADBE Vector Rect Size").setValue(shapeData.size);
                    var px = shapeData.position[0] - refX;
                    var py = refY - shapeData.position[1];
                    pathProperty.property("ADBE Vector Rect Position").setValue([px, py]);
                } else if (shapeData.type === "ellipse") {
                    var pathProperty = pathGroupContents.addProperty("ADBE Vector Shape - Ellipse");
                    pathProperty.property("ADBE Vector Ellipse Size").setValue(shapeData.size);
                    var px = shapeData.position[0] - refX;
                    var py = refY - shapeData.position[1];
                    pathProperty.property("ADBE Vector Ellipse Position").setValue([px, py]);
                } else {
                    var pathProperty = pathGroupContents.addProperty("ADBE Vector Shape - Group");
                    var shape = new Shape();

                    var vertices = [], inTangents = [], outTangents = [];
                    for (var v = 0; v < shapeData.vertices.length; v++) {
                        var pt = shapeData.vertices[v];
                        var vx = pt[0] - refX;
                        var vy = refY - pt[1]; // Invert Y, relative to reference center
                        vertices.push([vx, vy]);
                        inTangents.push(shapeData.inTangents && shapeData.inTangents.length > v ? [shapeData.inTangents[v][0], -shapeData.inTangents[v][1]] : [0, 0]);
                        outTangents.push(shapeData.outTangents && shapeData.outTangents.length > v ? [shapeData.outTangents[v][0], -shapeData.outTangents[v][1]] : [0, 0]);
                    }

                    if (vertices.length === 0) {
                        vertices = [[0, 0], [0.1, 0.1]];
                        inTangents = [[0, 0], [0, 0]];
                        outTangents = [[0, 0], [0, 0]];
                    } else if (vertices.length === 1) {
                        vertices.push([vertices[0][0] + 0.1, vertices[0][1] + 0.1]);
                        inTangents.push([0, 0]);
                        outTangents.push([0, 0]);
                    }

                    shape.vertices = vertices;
                    shape.inTangents = inTangents;
                    shape.outTangents = outTangents;
                    shape.closed = shapeData.closed;
                    pathProperty.property("ADBE Vector Shape").setValue(shape);
                }

                if (!skipAppearance && shapeData.stroke) {
                    applyStroke(shapeData.stroke, pathGroupContents);
                }

                if (!skipAppearance && shapeData.fill) {
                    var fillProp = pathGroupContents.addProperty("ADBE Vector Graphic - Fill");
                    fillProp.property("ADBE Vector Fill Color").setValue(shapeData.fill);
                }
            }

            function buildMask(maskData, parentGroup, refX, refY) {
                if (maskData.type === "path" || maskData.type === "rect" || maskData.type === "ellipse") {
                    buildPath(maskData, parentGroup, true, refX, refY);
                } else if (maskData.type === "compound") {
                    var compoundGroup = parentGroup.addProperty("ADBE Vector Group");
                    compoundGroup.name = maskData.name + " (Mask)";
                    var compoundContents = compoundGroup.property("ADBE Vectors Group");
                    for (var cp = maskData.children.length - 1; cp >= 0; cp--) {
                        if (maskData.children[cp].type === "path" || maskData.children[cp].type === "rect" || maskData.children[cp].type === "ellipse") {
                            buildPath(maskData.children[cp], compoundContents, true, refX, refY);
                        }
                    }
                    compoundContents.addProperty("ADBE Vector Filter - Merge");
                }
            }

            function applyStroke(strokeData, targetContents) {
                if (!strokeData) return;
                var strokeProp = targetContents.addProperty("ADBE Vector Graphic - Stroke");
                strokeProp.property("ADBE Vector Stroke Color").setValue(strokeData.color);
                strokeProp.property("ADBE Vector Stroke Width").setValue(strokeData.width);
                if (strokeData.cap !== undefined) {
                    try { strokeProp.property("ADBE Vector Stroke Line Cap").setValue(strokeData.cap); } catch(e) {}
                }
                if (strokeData.join !== undefined) {
                    try { strokeProp.property("ADBE Vector Stroke Line Join").setValue(strokeData.join); } catch(e) {}
                }
            }

            function traverseNode(nodeData, parentLayerOrGroup, refX, refY, activeClipMask) {
                var currentRefX = (nodeData.cx !== undefined) ? nodeData.cx : (refX !== undefined ? refX : aiCenterX);
                var currentRefY = (nodeData.cy !== undefined) ? nodeData.cy : (refY !== undefined ? refY : aiCenterY);

                if (nodeData.type === "group") {
                    var contents;
                    var nextClipMask = activeClipMask;
                    var contentChildren = nodeData.children;

                    if (nodeData.isClipped) {
                        var maskNode = null;
                        var newChildren = [];
                        for (var c = 0; c < nodeData.children.length; c++) {
                            if (nodeData.children[c].isMask) {
                                maskNode = nodeData.children[c];
                            } else {
                                newChildren.push(nodeData.children[c]);
                            }
                        }
                        if (maskNode) {
                            nextClipMask = maskNode;
                            contentChildren = newChildren;
                        }
                    }

                    if (!parentLayerOrGroup) {
                        var shapeLayer = comp.layers.addShape();
                        if (targetLayer) shapeLayer.moveBefore(targetLayer);
                        shapeLayer.name = nodeData.name;
                        var absPosX = (cW / 2) + (currentRefX - aiCenterX);
                        var absPosY = (cH / 2) + (aiCenterY - currentRefY);
                        shapeLayer.property("Position").setValue([absPosX, absPosY]);
                        contents = shapeLayer.property("ADBE Root Vectors Group");
                    } else {
                        var localGroup = parentLayerOrGroup.addProperty("ADBE Vector Group");
                        localGroup.name = nodeData.name;
                        contents = localGroup.property("ADBE Vectors Group");
                    }

                    for (var c = contentChildren.length - 1; c >= 0; c--) {
                        var child = contentChildren[c];
                        if (child.type === "path" || child.type === "rect" || child.type === "ellipse") {
                            if (nextClipMask) {
                                var intGroup = contents.addProperty("ADBE Vector Group");
                                intGroup.name = child.name + " (Masked)";
                                var intContents = intGroup.property("ADBE Vectors Group");
                                buildMask(nextClipMask, intContents, currentRefX, currentRefY);
                                buildPath(child, intContents, true, currentRefX, currentRefY);
                                var mergePaths = intContents.addProperty("ADBE Vector Filter - Merge");
                                mergePaths.property("ADBE Vector Merge Type").setValue(4);
                                if (child.stroke) {
                                    applyStroke(child.stroke, intContents);
                                }
                                if (child.fill) {
                                    var fillProp = intContents.addProperty("ADBE Vector Graphic - Fill");
                                    fillProp.property("ADBE Vector Fill Color").setValue(child.fill);
                                }
                            } else {
                                buildPath(child, contents, false, currentRefX, currentRefY);
                            }
                        } else if (child.type === "compound") {
                            var parentContentsForCompound = contents;
                            if (nextClipMask) {
                                var intGroup = contents.addProperty("ADBE Vector Group");
                                intGroup.name = child.name + " (Masked)";
                                parentContentsForCompound = intGroup.property("ADBE Vectors Group");
                                buildMask(nextClipMask, parentContentsForCompound, currentRefX, currentRefY);
                            }

                            var compoundGroup = parentContentsForCompound.addProperty("ADBE Vector Group");
                            compoundGroup.name = child.name;
                            var compoundContents = compoundGroup.property("ADBE Vectors Group");

                            var firstFill = null;
                            var firstStroke = null;

                            for (var cp = child.children.length - 1; cp >= 0; cp--) {
                                if (child.children[cp].type === "path" || child.children[cp].type === "rect" || child.children[cp].type === "ellipse") {
                                    if (!firstFill && child.children[cp].fill) firstFill = child.children[cp].fill;
                                    if (!firstStroke && child.children[cp].stroke) firstStroke = child.children[cp].stroke;

                                    buildPath(child.children[cp], compoundContents, true, currentRefX, currentRefY);
                                }
                            }
                            compoundContents.addProperty("ADBE Vector Filter - Merge");

                            if (nextClipMask) {
                                var mergePaths = parentContentsForCompound.addProperty("ADBE Vector Filter - Merge");
                                mergePaths.property("ADBE Vector Merge Type").setValue(4);
                                if (firstStroke) {
                                    applyStroke(firstStroke, parentContentsForCompound);
                                }
                                if (firstFill) {
                                    var fillProp = parentContentsForCompound.addProperty("ADBE Vector Graphic - Fill");
                                    fillProp.property("ADBE Vector Fill Color").setValue(firstFill);
                                }
                            } else {
                                if (firstStroke) {
                                    applyStroke(firstStroke, compoundContents);
                                }
                                if (firstFill) {
                                    var fillProp = compoundContents.addProperty("ADBE Vector Graphic - Fill");
                                    fillProp.property("ADBE Vector Fill Color").setValue(firstFill);
                                }
                            }
                        } else {
                            traverseNode(child, contents, currentRefX, currentRefY, nextClipMask);
                        }
                    }
                }
                else if (nodeData.type === "compound") {
                    var contents;
                    if (!parentLayerOrGroup) {
                        var shapeLayer = comp.layers.addShape();
                        if (targetLayer) shapeLayer.moveBefore(targetLayer);
                        shapeLayer.name = nodeData.name;
                        var absPosX = (cW / 2) + (currentRefX - aiCenterX);
                        var absPosY = (cH / 2) + (aiCenterY - currentRefY);
                        shapeLayer.property("Position").setValue([absPosX, absPosY]);
                        contents = shapeLayer.property("ADBE Root Vectors Group");
                    } else {
                        var cGroup = parentLayerOrGroup.addProperty("ADBE Vector Group");
                        cGroup.name = nodeData.name;
                        contents = cGroup.property("ADBE Vectors Group");
                    }

                    var parentContentsForCompound = contents;
                    if (activeClipMask) {
                        var intGroup = contents.addProperty("ADBE Vector Group");
                        intGroup.name = nodeData.name + " (Masked)";
                        parentContentsForCompound = intGroup.property("ADBE Vectors Group");
                        buildMask(activeClipMask, parentContentsForCompound, currentRefX, currentRefY);
                        
                        var compoundGroup = parentContentsForCompound.addProperty("ADBE Vector Group");
                        compoundGroup.name = nodeData.name;
                        contents = compoundGroup.property("ADBE Vectors Group");
                    }

                    var firstFill = null;
                    var firstStroke = null;
                    for (var cp = nodeData.children.length - 1; cp >= 0; cp--) {
                        if (nodeData.children[cp].type === "path" || nodeData.children[cp].type === "rect" || nodeData.children[cp].type === "ellipse") {
                            if (!firstFill && nodeData.children[cp].fill) firstFill = nodeData.children[cp].fill;
                            if (!firstStroke && nodeData.children[cp].stroke) firstStroke = nodeData.children[cp].stroke;
                            buildPath(nodeData.children[cp], contents, true, currentRefX, currentRefY);
                        }
                    }
                    contents.addProperty("ADBE Vector Filter - Merge");

                    if (activeClipMask) {
                        var mergePaths = parentContentsForCompound.addProperty("ADBE Vector Filter - Merge");
                        mergePaths.property("ADBE Vector Merge Type").setValue(4);
                        if (firstStroke) {
                            applyStroke(firstStroke, parentContentsForCompound);
                        }
                        if (firstFill) {
                            var fProp = parentContentsForCompound.addProperty("ADBE Vector Graphic - Fill");
                            fProp.property("ADBE Vector Fill Color").setValue(firstFill);
                        }
                    } else {
                        if (firstStroke) {
                            applyStroke(firstStroke, contents);
                        }
                        if (firstFill) {
                            var fProp = contents.addProperty("ADBE Vector Graphic - Fill");
                            fProp.property("ADBE Vector Fill Color").setValue(firstFill);
                        }
                    }
                }
                else if (nodeData.type === "path" || nodeData.type === "rect" || nodeData.type === "ellipse") {
                    if (!parentLayerOrGroup) {
                        var shapeLayer = comp.layers.addShape();
                        if (targetLayer) shapeLayer.moveBefore(targetLayer);
                        shapeLayer.name = nodeData.name;
                        var absPosX = (cW / 2) + (currentRefX - aiCenterX);
                        var absPosY = (cH / 2) + (aiCenterY - currentRefY);
                        shapeLayer.property("Position").setValue([absPosX, absPosY]);
                        
                        if (activeClipMask) {
                            var intGroup = shapeLayer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
                            intGroup.name = nodeData.name + " (Masked)";
                            var intContents = intGroup.property("ADBE Vectors Group");
                            buildMask(activeClipMask, intContents, currentRefX, currentRefY);
                            buildPath(nodeData, intContents, true, currentRefX, currentRefY);
                            var mergePaths = intContents.addProperty("ADBE Vector Filter - Merge");
                            mergePaths.property("ADBE Vector Merge Type").setValue(4);
                            if (nodeData.stroke) {
                                applyStroke(nodeData.stroke, intContents);
                            }
                            if (nodeData.fill) {
                                var fillProp = intContents.addProperty("ADBE Vector Graphic - Fill");
                                fillProp.property("ADBE Vector Fill Color").setValue(nodeData.fill);
                            }
                        } else {
                            buildPath(nodeData, shapeLayer.property("ADBE Root Vectors Group"), false, currentRefX, currentRefY);
                        }
                    } else {
                        if (activeClipMask) {
                            var intGroup = parentLayerOrGroup.addProperty("ADBE Vector Group");
                            intGroup.name = nodeData.name + " (Masked)";
                            var intContents = intGroup.property("ADBE Vectors Group");
                            buildMask(activeClipMask, intContents, currentRefX, currentRefY);
                            buildPath(nodeData, intContents, true, currentRefX, currentRefY);
                            var mergePaths = intContents.addProperty("ADBE Vector Filter - Merge");
                            mergePaths.property("ADBE Vector Merge Type").setValue(4);
                            if (nodeData.stroke) {
                                applyStroke(nodeData.stroke, intContents);
                            }
                            if (nodeData.fill) {
                                var fillProp = intContents.addProperty("ADBE Vector Graphic - Fill");
                                fillProp.property("ADBE Vector Fill Color").setValue(nodeData.fill);
                            }
                        } else {
                            buildPath(nodeData, parentLayerOrGroup, false, currentRefX, currentRefY);
                        }
                    }
                }
            }

            for (var i = 0; i < importedData.shapes.length; i++) {
                try {
                    traverseNode(importedData.shapes[i], null);
                } catch(e) {
                    alert("Vector Bridge Error on shape '" + importedData.shapes[i].name + "': " + e.toString() + " (Line " + e.line + ")");
                }
            }

            app.endUndoGroup();
            statusText.text = "✅ Pulled " + importedData.shapes.length + " item(s).";
        };

        if (win instanceof Window) {
            win.center();
            win.show();
        } else {
            win.layout.layout(true);
            win.layout.resize();
        }
    }
})(this);
