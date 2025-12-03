import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

app.registerExtension({
    name: "TextToolsLoadTextSG.DynamicFileList",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "Text Tools Load Text-SG") {
            
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function() {
                const result = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                
                const folderWidget = this.widgets?.find(w => w.name === "folder");
                const fileWidget = this.widgets?.find(w => w.name === "file");
                const infoWidget = this.widgets?.find(w => w.name === "info_text");
                
                if (!folderWidget || !fileWidget) {
                    console.error("[TextToolsLoadTextSG] Widgets not found!");
                    return result;
                }
                
                // Configure info widget if present
                if (infoWidget) {
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
                        return [width, 90];
                    };
                }
                
                // File list update function
                const updateFileList = async (folder) => {
                    try {
                        const response = await api.fetchApi("/text_file_loader/files", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ folder: folder })
                        });
                        
                        if (!response.ok) {
                            console.error("[TextToolsLoadTextSG] Response not OK:", response.status);
                            return;
                        }
                        
                        const data = await response.json();
                        console.log("[TextToolsLoadTextSG] Received files:", data.files);
                        
                        fileWidget.options = fileWidget.options || {};
                        fileWidget.options.values = data.files || [];
                        
                        if (fileWidget.options.values.length > 0) {
                            fileWidget.value = fileWidget.options.values[0];
                        } else {
                            fileWidget.value = "";
                        }
                        
                    } catch (error) {

                    }
                };
                
                // Initial setup
                setTimeout(() => updateFileList(folderWidget.value), 100);
                
                // Folder change callback
                const origFolderCallback = folderWidget.callback;
                folderWidget.callback = function(value) {
                    updateFileList(value);
                    if (origFolderCallback) {
                        return origFolderCallback.apply(this, arguments);
                    }
                };
                
                // Set the node's initial size
                const nodeWidth = 450;
                const nodeHeight = 120;
                this.setSize([nodeWidth, nodeHeight]);
                
                // Store the original onResize
                const originalOnResize = this.onResize;
                
                // Override onResize to maintain minimum size
                this.onResize = function(size) {
                    size[0] = Math.max(size[0], 300); // Minimum width
                    size[1] = Math.max(size[1], 100); // Minimum height
                    if (originalOnResize) {
                        originalOnResize.apply(this, [size]);
                    }
                };
                
                return result;
            };
        }
    }
});
