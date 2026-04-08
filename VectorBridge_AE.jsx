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
                    var strokeProp = pathGroupContents.addProperty("ADBE Vector Graphic - Stroke");
                    strokeProp.property("ADBE Vector Stroke Color").setValue(shapeData.stroke.color);
                    strokeProp.property("ADBE Vector Stroke Width").setValue(shapeData.stroke.width);
                }

                if (!skipAppearance && shapeData.fill) {
                    var fillProp = pathGroupContents.addProperty("ADBE Vector Graphic - Fill");
                    fillProp.property("ADBE Vector Fill Color").setValue(shapeData.fill);
                }
            }

            function traverseNode(nodeData, parentLayerOrGroup, refX, refY) {
                var currentRefX = (nodeData.cx !== undefined) ? nodeData.cx : (refX !== undefined ? refX : aiCenterX);
                var currentRefY = (nodeData.cy !== undefined) ? nodeData.cy : (refY !== undefined ? refY : aiCenterY);

                if (nodeData.type === "text") {
                    var textLayer = comp.layers.addText(nodeData.contents);
                    if (targetLayer) textLayer.moveBefore(targetLayer);
                    textLayer.name = nodeData.name;
                    var textProp = textLayer.property("Source Text");
                    var textDocument = textProp.value;
                    textDocument.font = nodeData.fontFamily;
                    textDocument.fontSize = nodeData.fontSize;
                    textDocument.fillColor = nodeData.fillColor;
                    textDocument.applyFill = true;
                    textDocument.justification = nodeData.justification;
                    textProp.setValue(textDocument);

                    var tx = nodeData.position[0];
                    var ty = nodeData.position[1];
                    var absX = (cW / 2) + (tx - aiCenterX);
                    var absY = (cH / 2) + (aiCenterY - ty);
                    textLayer.property("Position").setValue([absX, absY]);
                }
                else if (nodeData.type === "group") {
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
                        var localGroup = parentLayerOrGroup.addProperty("ADBE Vector Group");
                        localGroup.name = nodeData.name;
                        contents = localGroup.property("ADBE Vectors Group");
                    }

                    for (var c = nodeData.children.length - 1; c >= 0; c--) {
                        var child = nodeData.children[c];
                        if (child.type === "path" || child.type === "rect" || child.type === "ellipse") {
                            buildPath(child, contents, false, currentRefX, currentRefY);
                        } else if (child.type === "compound") {
                            var compoundGroup = contents.addProperty("ADBE Vector Group");
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

                            if (firstStroke) {
                                var strokeProp = compoundContents.addProperty("ADBE Vector Graphic - Stroke");
                                strokeProp.property("ADBE Vector Stroke Color").setValue(firstStroke.color);
                                strokeProp.property("ADBE Vector Stroke Width").setValue(firstStroke.width);
                            }

                            if (firstFill) {
                                var fillProp = compoundContents.addProperty("ADBE Vector Graphic - Fill");
                                fillProp.property("ADBE Vector Fill Color").setValue(firstFill);
                            }
                        } else {
                            traverseNode(child, contents, currentRefX, currentRefY);
                        }
                    }
                }
                else if (nodeData.type === "compound") {
                    // Stray compound path at root level 
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
                    if (firstStroke) {
                        var sProp = contents.addProperty("ADBE Vector Graphic - Stroke");
                        sProp.property("ADBE Vector Stroke Color").setValue(firstStroke.color);
                        sProp.property("ADBE Vector Stroke Width").setValue(firstStroke.width);
                    }
                    if (firstFill) {
                        var fProp = contents.addProperty("ADBE Vector Graphic - Fill");
                        fProp.property("ADBE Vector Fill Color").setValue(firstFill);
                    }
                }
                else if (nodeData.type === "path_sequence") {
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

                    var pathGroup = contents.addProperty("ADBE Vector Group");
                    pathGroup.name = nodeData.name;
                    var pathGroupContents = pathGroup.property("ADBE Vectors Group");

                    try {
                        var maxPaths = 0;
                        for (var f = 0; f < nodeData.frames.length; f++) {
                            if (nodeData.frames[f] && nodeData.frames[f].length > maxPaths) maxPaths = nodeData.frames[f].length;
                        }

                        for (var p = 0; p < maxPaths; p++) {
                            var pathProperty = pathGroupContents.addProperty("ADBE Vector Shape - Group");
                            pathProperty.name = "Path " + (p + 1);
                        }

                        var keyTime = comp.time;
                        var frameSpacing = comp.frameDuration * 2; // Animate on twos

                        for (var f = 0; f < nodeData.frames.length; f++) {
                            var framePaths = nodeData.frames[f];

                            for (var p = 0; p < maxPaths; p++) {
                                var shape = new Shape();
                                if (p < framePaths.length) {
                                    var frameData = framePaths[p];
                                    var vertices = [], inTangents = [], outTangents = [];

                                    for (var v = 0; v < frameData.vertices.length; v++) {
                                        var pt = frameData.vertices[v];
                                        var vx = pt[0] - currentRefX;
                                        var vy = currentRefY - pt[1];
                                        vertices.push([vx, vy]);
                                        inTangents.push(frameData.inTangents && frameData.inTangents.length > v ? [frameData.inTangents[v][0], -frameData.inTangents[v][1]] : [0, 0]);
                                        outTangents.push(frameData.outTangents && frameData.outTangents.length > v ? [frameData.outTangents[v][0], -frameData.outTangents[v][1]] : [0, 0]);
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
                                    shape.closed = frameData.closed;
                                } else {
                                    shape.vertices = [[0, 0], [0.1, 0.1]];
                                    shape.inTangents = [[0, 0], [0, 0]];
                                    shape.outTangents = [[0, 0], [0, 0]];
                                    shape.closed = false;
                                }

                                pathGroupContents.property(p + 1).property("ADBE Vector Shape").setValueAtTime(keyTime, shape);
                            }

                            keyTime += frameSpacing;
                        }

                        if (nodeData.stroke) {
                            var sProp = pathGroupContents.addProperty("ADBE Vector Graphic - Stroke");
                            sProp.property("ADBE Vector Stroke Color").setValue(nodeData.stroke.color);
                            sProp.property("ADBE Vector Stroke Width").setValue(nodeData.stroke.width);
                        }
                        if (nodeData.fill) {
                            var fProp = pathGroupContents.addProperty("ADBE Vector Graphic - Fill");
                            fProp.property("ADBE Vector Fill Color").setValue(nodeData.fill);
                        }
                        if (!nodeData.stroke && !nodeData.fill) {
                            var sProp = pathGroupContents.addProperty("ADBE Vector Graphic - Stroke");
                            sProp.property("ADBE Vector Stroke Color").setValue([0.9, 0.1, 0.1]);
                            sProp.property("ADBE Vector Stroke Width").setValue(3);
                        }
                    } catch (err) {
                        alert("CRITICAL ERROR in Sequence Builder!\nFrames: " + nodeData.frames.length + "\nMaxPaths: " + maxPaths + "\nError: " + err.toString() + "\nLine: " + err.line);
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
                        buildPath(nodeData, shapeLayer.property("ADBE Root Vectors Group"), false, currentRefX, currentRefY);
                    } else {
                        buildPath(nodeData, parentLayerOrGroup, false, currentRefX, currentRefY);
                    }
                }
            }

            for (var i = 0; i < importedData.shapes.length; i++) {
                traverseNode(importedData.shapes[i], null);
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
