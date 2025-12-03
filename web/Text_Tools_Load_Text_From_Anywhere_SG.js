import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "TextToolsLoadTextFromAnywhereSG.InfoBox",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "Text Tools Load Text FilePath-SG") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function() {
                const result = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                
                // Find the info_text widget
                const infoWidget = this.widgets?.find(w => w.name === "info_text");
                
                if (infoWidget) {
                    // Set the widget to only show 3 lines
                    infoWidget.options = infoWidget.options || {};
                    infoWidget.options.max_length = 1000;
                    
                    // Make it read-only and styled
                    if (infoWidget.inputEl) {
                        infoWidget.inputEl.readOnly = true;
                        infoWidget.inputEl.disabled = true;
                        infoWidget.inputEl.style.opacity = "0.6";
                        infoWidget.inputEl.style.fontSize = "12px";
                        infoWidget.inputEl.style.fontWeight = "bold";
                        infoWidget.inputEl.style.backgroundColor = "transparent";
                        infoWidget.inputEl.style.border = "none";
                        infoWidget.inputEl.style.cursor = "default";
                        infoWidget.inputEl.style.resize = "none";
                        infoWidget.inputEl.style.padding = "8px";
                        infoWidget.inputEl.style.color = "#999";
                        infoWidget.inputEl.style.height = "60px";
                    }
                    
                    // Don't serialize this widget
                    infoWidget.serialize = false;
                    
                    // Adjust the widget's computed height
                    infoWidget.computeSize = function(width) {
                        return [width, 70];  // Fixed width for the widget
                    };
                }
                
                // Set the node's initial size
                const nodeWidth = 360; 
                const nodeHeight = 100; 
                this.setSize([nodeWidth, nodeHeight]);
                
                // Store the original onResize
                const originalOnResize = this.onResize;
                
                // Override onResize to maintain minimum size
                this.onResize = function(size) {
                    // Set minimum size constraints
                    size[0] = Math.max(size[0], 300);  // Minimum width
                    size[1] = Math.max(size[1], 100);  // Minimum height
                    
                    if (originalOnResize) {
                        originalOnResize.apply(this, [size]);
                    }
                };
                
                return result;
            };
        }
    }
});
