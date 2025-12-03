import { app } from "../../scripts/app.js";

const loadMarkdownIt = () => {
	return new Promise((resolve, reject) => {
		if (window.markdownit) {
			resolve(window.markdownit);
			return;
		}
		const script = document.createElement('script');
		script.src = '/extensions/ComfyUI_Text_Tools_SG/markdown-it.min.js';
		script.onload = () => resolve(window.markdownit);
		script.onerror = reject;
		document.head.appendChild(script);
	});
};

const markdownit = await loadMarkdownIt().catch(err => {
	console.warn("Failed to load markdown-it:", err);
	return null;
});

app.registerExtension({
	name: "TextToolsEditorSG",
	async beforeRegisterNodeDef(nodeType, nodeData, appRef) {
		if (nodeData?.name !== "Text Tools Editor-SG") return;

		const markdownit = await loadMarkdownIt().catch(err => {
			console.warn("Failed to load markdown-it:", err);
			return null;
		});

		const origOnNodeCreated = nodeType.prototype.onNodeCreated;
		nodeType.prototype.onNodeCreated = function () {
			origOnNodeCreated?.apply(this, arguments);

			// Hide the default text widget
			const textWidget = this.widgets.find(w => w.name === "text");
			if (textWidget) {
				textWidget.type = "converted-widget";
				textWidget.computeSize = () => [0, -4];
				if (textWidget.element) {
					textWidget.element.style.display = "none";
					textWidget.element.style.visibility = "hidden";
					textWidget.element.style.height = "0px";
					textWidget.element.style.width = "0px";
					textWidget.element.style.position = "absolute";
					textWidget.element.style.pointerEvents = "none";
				}
				textWidget.hidden = true;
				textWidget.visible = false;
			}

			// Container for counter and buttons
			const topContainer = document.createElement("div");
			topContainer.style.position = "absolute";
			topContainer.style.top = "0";
			topContainer.style.left = "0";
			topContainer.style.right = "0";
			topContainer.style.display = "flex";
			topContainer.style.justifyContent = "flex-start";
			topContainer.style.alignItems = "center";
			topContainer.style.gap = "10px";
			topContainer.style.padding = "2px 5px";
			topContainer.style.fontSize = "10px";
			topContainer.style.fontFamily = "monospace";
			topContainer.style.height = "20px";
			topContainer.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
			topContainer.style.zIndex = "10";
			topContainer.style.pointerEvents = "none";
			topContainer.style.overflow = "hidden";
			topContainer.style.minWidth = "0";

			// Counter display
			const counter = document.createElement("div");
			counter.style.color = "#999";
			counter.style.whiteSpace = "nowrap";
			counter.style.flex = "0 0 auto";
			counter.textContent = "0 chars | 0 words | 0 lines";
			topContainer.appendChild(counter);

			// Spacer
			const spacer = document.createElement("div");
			spacer.style.flex = "1";
			topContainer.appendChild(spacer);

			// Button container
			const btnContainer = document.createElement("div");
			btnContainer.style.display = "flex";
			btnContainer.style.gap = "3px";
			btnContainer.style.flex = "0 1 auto";
			btnContainer.style.flexWrap = "nowrap";
			btnContainer.style.overflow = "hidden";
			btnContainer.style.minWidth = "0";
			btnContainer.style.pointerEvents = "auto";

			// Main textarea
			const box = document.createElement("textarea");
			box.readOnly = false;
			box.className = "comfy-multiline-input";
			box.placeholder = "❗Text will be overwritten if text_input is connected❗";
			box.style.resize = "none";
			box.style.boxSizing = "border-box";
			box.style.fontFamily = "monospace";
			box.style.fontSize = "14px";
			box.style.lineHeight = "1.5";
			box.style.whiteSpace = "pre-wrap";
			box.style.overflowWrap = "break-word";
			box.style.width = "100%";
			box.style.height = "100%";
			box.style.paddingTop = "42px";  // 20px top button bar + 20px markdown toolbar + 2px gap

			// Markdown preview div
			const markdownDiv = document.createElement("div");
			markdownDiv.className = "markdown-preview";
			markdownDiv.style.position = "absolute";
			markdownDiv.style.top = "1px";
			markdownDiv.style.left = "0";
			markdownDiv.style.width = "100%";
			markdownDiv.style.height = "calc(100% - 22px)";
			markdownDiv.style.padding = "10px";
			markdownDiv.style.paddingTop = "42px";  // 20px top button bar + 20px markdown toolbar + 2px gap
			markdownDiv.style.boxSizing = "border-box";
			markdownDiv.style.overflow = "auto";
			markdownDiv.style.display = "none";
			markdownDiv.style.zIndex = "6";
			markdownDiv.style.fontFamily = "sans-serif";
			markdownDiv.style.fontSize = "14px";
			markdownDiv.style.lineHeight = "1.6";

			// Add markdown table styling CSS
			if (!document.getElementById('markdown-table-style')) {
				const style = document.createElement('style');
				style.id = 'markdown-table-style';
				style.textContent = `
					.markdown-preview table {
						border-collapse: collapse;
						width: 100%;
						margin: 10px 0;
						border: 1px solid #555;
					}
					.markdown-preview th,
					.markdown-preview td {
						border: 1px solid #555;
						padding: 8px 12px;
						text-align: left;
					}
					.markdown-preview th {
						background-color: rgba(100, 100, 100, 0.3);
						font-weight: bold;
					}
					.markdown-preview tr:nth-child(even) {
						background-color: rgba(50, 50, 50, 0.2);
					}
					.markdown-preview h1,
					.markdown-preview h2,
					.markdown-preview h3 {
						margin-top: 16px;
						margin-bottom: 8px;
					}
					.markdown-preview p {
						margin: 8px 0;
					}
					.markdown-preview ul,
					.markdown-preview ol {
						margin: 8px 0;
						padding-left: 24px;
					}
					.markdown-preview code {
						background-color: rgba(100, 100, 100, 0.3);
						padding: 2px 4px;
						border-radius: 3px;
						font-family: monospace;
					}
					.markdown-preview pre {
						background-color: rgba(100, 100, 100, 0.3);
						padding: 10px;
						border-radius: 4px;
						overflow-x: auto;
					}
					.markdown-preview del {
						text-decoration: line-through;
					}
				`;
				document.head.appendChild(style);
			}

			// Highlight overlay div
			const highlightDiv = document.createElement("div");
			highlightDiv.style.position = "absolute";
			highlightDiv.style.top = "0";
			highlightDiv.style.left = "0";
			highlightDiv.style.width = "100%";
			highlightDiv.style.height = "100%";
			highlightDiv.style.pointerEvents = "none";
			highlightDiv.style.fontFamily = "monospace";
			highlightDiv.style.fontSize = "14px";
			highlightDiv.style.lineHeight = "1.5";
			highlightDiv.style.whiteSpace = "pre-wrap";
			highlightDiv.style.padding = "0";
			highlightDiv.style.paddingTop = "42px";  // 20px top button bar + 20px markdown toolbar + 2px gap
			highlightDiv.style.boxSizing = "border-box";
			highlightDiv.style.color = "transparent";
			highlightDiv.style.overflow = "hidden";
			highlightDiv.style.zIndex = "5";
			highlightDiv.style.display = "none";

			// Initialize properties
			this.properties = this.properties || {};
			this.properties.theme = this.properties.theme || "Dark";
			this.properties.word_wrap = this.properties.word_wrap ?? true;
			this.properties.editable = this.properties.editable ?? true;
			this.properties.text_filter = this.properties.text_filter ?? false;
			this.properties.line_filter = this.properties.line_filter ?? false;
			this.properties.markdown_mode = this.properties.markdown_mode ?? false;
			this.properties.pretty_json_mode = this.properties.pretty_json_mode ?? false;
			this.properties.max_width = this.properties.max_width ?? 750;
			this.properties.max_height = this.properties.max_height ?? 750;
			this.properties.font_size = this.properties.font_size ?? 14;


			// Select All button
            const selectAllBtn = document.createElement("button");
            selectAllBtn.textContent = "☑️";
            selectAllBtn.title = "Select All Text";
            selectAllBtn.style.fontSize = "12px";
            selectAllBtn.style.padding = "1px 4px";
            selectAllBtn.style.cursor = "pointer";
            selectAllBtn.style.minWidth = "24px";
            selectAllBtn.style.width = "24px";
            selectAllBtn.style.flexShrink = "0";
            selectAllBtn.onclick = () => {
                box.select();
                box.focus();
                // Visual feedback
                selectAllBtn.textContent = "✓";
                setTimeout(() => {
                    selectAllBtn.textContent = "☑️";
                }, 1500);
            };

			// Copy button
			const copyBtn = document.createElement("button");
			copyBtn.textContent = "📋";
			copyBtn.title = "Copy to clipboard";
			copyBtn.style.fontSize = "12px";
			copyBtn.style.padding = "1px 4px";
			copyBtn.style.cursor = "pointer";
			copyBtn.style.minWidth = "24px";
			copyBtn.style.width = "24px";
			copyBtn.style.flexShrink = "0";
			copyBtn.onclick = () => {
           // Check if there's selected text
             const start = box.selectionStart;
             const end = box.selectionEnd;
    
             // If there's a selection, copy only that, otherwise copy all
             const textToCopy = (start !== end) ? box.value.substring(start, end) : box.value;
    
             navigator.clipboard.writeText(textToCopy);
             copyBtn.textContent = "✓";
             setTimeout(() => {
                 copyBtn.textContent = "📋";
             }, 1500);
         };
            

			// Theme button
			const themeBtn = document.createElement("button");
			themeBtn.textContent = "🌙";
			themeBtn.title = "Toggle Theme (Dark/Light)";
			themeBtn.style.fontSize = "12px";
			themeBtn.style.padding = "1px 4px";
			themeBtn.style.cursor = "pointer";
			themeBtn.style.minWidth = "24px";
			themeBtn.style.width = "24px";
			themeBtn.style.flexShrink = "0";
			themeBtn.onclick = () => {
				this.properties.theme = this.properties.theme === "Dark" ? "Light" : "Dark";
				themeBtn.textContent = this.properties.theme === "Dark" ? "🌙" : "☀️";
				this._applyTheme(this.properties.theme);
			};
			

			// Paste button
            const pasteBtn = document.createElement("button");
            pasteBtn.textContent = "📄";
            pasteBtn.title = "Paste from clipboard";
            pasteBtn.style.fontSize = "12px";
            pasteBtn.style.padding = "1px 4px";
            pasteBtn.style.cursor = "pointer";
            pasteBtn.style.minWidth = "24px";
            pasteBtn.style.width = "24px";
            pasteBtn.style.flexShrink = "0";
            pasteBtn.onclick = async () => {
    try {
		saveToHistory(true);
        const clipboardText = await navigator.clipboard.readText();
        
        // Get cursor position
        const start = box.selectionStart;
        const end = box.selectionEnd;
        const currentValue = box.value;
        
        // Insert clipboard text at cursor position
        const newValue = currentValue.substring(0, start) + clipboardText + currentValue.substring(end);
        
        // Update the textarea
        box.value = newValue;
		saveToHistory(true);
        
        // Set cursor position after pasted text
        const newCursorPos = start + clipboardText.length;
        box.setSelectionRange(newCursorPos, newCursorPos);
        
        // Focus the textarea
        box.focus();
        
        // Update stored text
        this._tv_original_text = newValue;
        
        // Sync with widget
        const textWidget = this.widgets?.find(w => w.name === "text");
        if (textWidget) {
            textWidget.value = newValue;
        }
        
        // Update counter
        this._updateCounter();
        
        // Update markdown if active
        if (this.properties.markdown_mode && this._md) {
            this._renderMarkdownWithHighlight();
        }
        
        // Visual feedback
        pasteBtn.textContent = "✓";
        setTimeout(() => {
            pasteBtn.textContent = "📄";
        }, 1500);
    } catch (err) {
        console.error('Failed to read clipboard:', err);
        pasteBtn.textContent = "✗";
        setTimeout(() => {
            pasteBtn.textContent = "📄";
        }, 1500);
    }
};
            

			// Wrap button
			const wrapBtn = document.createElement("button");
			wrapBtn.textContent = "↔️";
			wrapBtn.title = "Toggle Text Wrap";
			wrapBtn.style.fontSize = "12px";
			wrapBtn.style.padding = "1px 4px";
			wrapBtn.style.cursor = "pointer";
			wrapBtn.style.minWidth = "24px";
			wrapBtn.style.width = "24px";
			wrapBtn.style.flexShrink = "0";
			wrapBtn.style.opacity = this.properties.word_wrap ? "1" : "0.5";
			wrapBtn.onclick = () => {
				this.properties.word_wrap = !this.properties.word_wrap;
				wrapBtn.style.opacity = this.properties.word_wrap ? "1" : "0.5";
				box.style.whiteSpace = this.properties.word_wrap ? "pre-wrap" : "pre";
				box.style.overflowWrap = this.properties.word_wrap ? "break-word" : "normal";
				highlightDiv.style.whiteSpace = this.properties.word_wrap ? "pre-wrap" : "pre";
				highlightDiv.style.overflowWrap = this.properties.word_wrap ? "break-word" : "normal";
			};
			

			// Toggle Text Editing button
			const editBtn = document.createElement("button");
			editBtn.textContent = "🪶";
			editBtn.title = "Toggle Text Editing";
			editBtn.style.fontSize = "12px";
			editBtn.style.padding = "1px 4px";
			editBtn.style.cursor = "pointer";
			editBtn.style.minWidth = "24px";
			editBtn.style.width = "24px";
			editBtn.style.flexShrink = "0";
			editBtn.style.opacity = this.properties.editable ? "1" : "0.5";
			editBtn.onclick = () => {
				this.properties.editable = !this.properties.editable;
				editBtn.style.opacity = this.properties.editable ? "1" : "0.5";
				box.readOnly = !this.properties.editable;
			};
			

			// Markdown button
			if (markdownit) {
				const markdownBtn = document.createElement("button");
				markdownBtn.textContent = "Ⓜ️ (Disable to allow editing)";
				markdownBtn.title = "Toggle Markdown Preview Only";
				markdownBtn.style.fontSize = "15px";
				markdownBtn.style.padding = "1px 4px";
				markdownBtn.style.cursor = "pointer";
				markdownBtn.style.minWidth = "210px";
				markdownBtn.style.width = "210px";
				markdownBtn.style.flexShrink = "0";
				markdownBtn.style.opacity = this.properties.markdown_mode ? "1" : "0.5";

				// Initialize markdown-it with all plugins enabled
				this._md = markdownit({
					html: true,
					linkify: true,
					typographer: true,
					breaks: false
				}).enable(['table', 'strikethrough']);

				markdownBtn.onclick = () => {
					this.properties.markdown_mode = !this.properties.markdown_mode;
					markdownBtn.style.opacity = this.properties.markdown_mode ? "1" : "0.5";

					if (this.properties.markdown_mode) {
						box.style.display = "none";
						highlightDiv.style.display = "none";
						markdownDiv.style.display = "block";
						this._renderMarkdownWithHighlight();
					} else {
						box.style.display = "block";
						markdownDiv.style.display = "none";
						if (this.properties.text_filter) {
							highlightDiv.style.display = "block";
							this._applyFilter();
						}
					}
				};
				btnContainer.appendChild(markdownBtn);
			}

			// Text Highlight toggle button
			const highlightBtn = document.createElement("button");
			highlightBtn.textContent = "🔍";
			highlightBtn.title = "Search / Highlight Text";
			highlightBtn.style.fontSize = "12px";
			highlightBtn.style.padding = "1px 4px";
			highlightBtn.style.cursor = "pointer";
			highlightBtn.style.minWidth = "24px";
			highlightBtn.style.width = "24px";
			highlightBtn.style.flexShrink = "0";
			
			highlightBtn.style.opacity = this.properties.text_filter ? "1" : "0.5";

			// Filter button
			const filterBtn = document.createElement("button");
			filterBtn.textContent = "🎯";
			filterBtn.title = "Filter Lines";
			filterBtn.style.fontSize = "12px";
			filterBtn.style.padding = "1px 4px";
			filterBtn.style.cursor = "pointer";
			filterBtn.style.minWidth = "24px";
			filterBtn.style.width = "24px";
			filterBtn.style.flexShrink = "0";
			filterBtn.style.opacity = this.properties.line_filter ? "1" : "0.5";

			// Export button
			const exportBtn = document.createElement("button");
			exportBtn.textContent = "💾";
			exportBtn.title = "Export to file";
			exportBtn.style.fontSize = "12px";
			exportBtn.style.padding = "1px 4px";
			exportBtn.style.cursor = "pointer";
			exportBtn.style.minWidth = "24px";
			exportBtn.style.width = "24px";
			exportBtn.style.flexShrink = "0";
			exportBtn.onclick = () => {
				const now = new Date();
				const day = String(now.getDate()).padStart(2, '0');
				const month = String(now.getMonth() + 1).padStart(2, '0');
				const year = now.getFullYear();
				const hours = String(now.getHours()).padStart(2, '0');
				const minutes = String(now.getMinutes()).padStart(2, '0');
				const seconds = String(now.getSeconds()).padStart(2, '0');
				const dateTime = `${day}-${month}-${year}_${hours}_${minutes}_${seconds}`;

				const blob = new Blob([box.value], { type: 'text/plain' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `comfy_${dateTime}.txt`;
				a.click();
				URL.revokeObjectURL(url);
			};

			// ============ PRETTY JSON TOGGLE BUTTON ============
			let prettyJsonBtn = document.createElement("button");
			prettyJsonBtn.textContent = "{}";
			prettyJsonBtn.title = "Toggle Pretty JSON Format";
			prettyJsonBtn.style.cssText = "font-size: 12px; padding: 1px 4px; cursor: pointer; min-width: 24px; width: 24px; flex-shrink: 0;";
			prettyJsonBtn.dataset.action = "pretty-json";
			this.properties.pretty_json_mode = this.properties.pretty_json_mode ?? false;
			prettyJsonBtn.style.opacity = this.properties.pretty_json_mode ? "1" : "0.5";

			prettyJsonBtn.onclick = () => {
				this.properties.pretty_json_mode = !this.properties.pretty_json_mode;
				prettyJsonBtn.style.opacity = this.properties.pretty_json_mode ? "1" : "0.5";

				if (this.properties.pretty_json_mode) {
					try {
						const textToParse = this._tv_original_text.trim();
						if (!textToParse) {
							this.properties.pretty_json_mode = false;
							prettyJsonBtn.style.opacity = "0.5";
							return;
						}

						let jsonObj;
						try {
							jsonObj = JSON.parse(textToParse);
						} catch (parseError) {
							try {
								jsonObj = eval('(' + textToParse + ')');
							} catch (evalError) {
								this.properties.pretty_json_mode = false;
								prettyJsonBtn.style.opacity = "0.5";
								return;
							}
						}

						const prettyJson = JSON.stringify(jsonObj, null, 2);
						this._tv_pretty_json_text = prettyJson;
						box.value = prettyJson;
						this._updateCounter();

						// Reapply filters after JSON formatting
						if (this.properties.text_filter) {
							this._applyFilter();
						}
						if (this.properties.line_filter) {
							this._applyLineFilter();
						}
						if (this.properties.markdown_mode && this._md) {
							this._renderMarkdownWithHighlight();
						}
					} catch (err) {
						this.properties.pretty_json_mode = false;
						prettyJsonBtn.style.opacity = "0.5";
						return;
					}
				} else {
					box.value = this._tv_original_text;
					this._updateCounter();

					// Reapply filters when switching back
					if (this.properties.text_filter) {
						this._applyFilter();
					}
					if (this.properties.line_filter) {
						this._applyLineFilter();
					}
					if (this.properties.markdown_mode && this._md) {
						this._renderMarkdownWithHighlight();
					}
				}
			};



		// Wrapper
			const textareaWrapper = document.createElement("div");
			textareaWrapper.style.position = "relative";
			textareaWrapper.style.width = "100%";
			textareaWrapper.style.height = "100%";
			textareaWrapper.style.paddingBottom = "10px";
			textareaWrapper.style.boxSizing = "border-box";

			textareaWrapper.appendChild(box);
			textareaWrapper.appendChild(markdownDiv);
			textareaWrapper.appendChild(topContainer);

			// Text Size button
			const textSizeBtn = document.createElement("button");
			textSizeBtn.textContent = "Aa";
			textSizeBtn.title = "Text Size (6-72)";
			textSizeBtn.style.fontSize = "12px";
			textSizeBtn.style.padding = "1px 4px";
			textSizeBtn.style.cursor = "pointer";
			textSizeBtn.style.minWidth = "24px";
			textSizeBtn.style.width = "24px";
			textSizeBtn.style.flexShrink = "0";
			textSizeBtn.style.fontWeight = "bold";
			textSizeBtn.style.opacity = "1";

			// Text size controls (inline popup)
			const textSizeControls = document.createElement("div");
			textSizeControls.style.position = "absolute";
			textSizeControls.style.top = "22px";
			textSizeControls.style.left = "0";
			textSizeControls.style.right = "0";
			textSizeControls.style.display = "none";
			textSizeControls.style.flexDirection = "row";
			textSizeControls.style.gap = "5px";
			textSizeControls.style.alignItems = "center";
			textSizeControls.style.padding = "8px";
			textSizeControls.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
			textSizeControls.style.border = "3px solid #4CAF50";
			textSizeControls.style.borderRadius = "4px";
			textSizeControls.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
			textSizeControls.style.zIndex = "15";
			textSizeControls.style.backdropFilter = "blur(4px)";

			// Label
			const textSizeLabel = document.createElement("span");
			textSizeLabel.textContent = "Text Size:";
			textSizeLabel.style.fontSize = "13px";
			textSizeLabel.style.color = "#4CAF50";
			textSizeLabel.style.fontWeight = "bold";
			textSizeLabel.style.fontFamily = "monospace";

			// Input field
			const textSizeInput = document.createElement("input");
			textSizeInput.type = "number";
			textSizeInput.min = "6";
			textSizeInput.max = "72";
			textSizeInput.value = this.properties.font_size ?? 14;
			textSizeInput.style.width = "60px";
			textSizeInput.style.height = "28px";
			textSizeInput.style.boxSizing = "border-box";
			textSizeInput.style.fontFamily = "monospace";
			textSizeInput.style.fontSize = "12px";
			textSizeInput.style.padding = "4px";
			textSizeInput.style.border = "2px solid #555";
			textSizeInput.style.borderRadius = "3px";
			textSizeInput.style.backgroundColor = "#1e1e1e";
			textSizeInput.style.color = "#d4d4d4";

			// Apply button
			const applyBtn = document.createElement("button");
			applyBtn.textContent = "Apply";
			applyBtn.style.fontSize = "12px";
			applyBtn.style.padding = "4px 12px";
			applyBtn.style.cursor = "pointer";
			applyBtn.style.border = "2px solid #4CAF50";
			applyBtn.style.borderRadius = "3px";
			applyBtn.style.backgroundColor = "#4CAF50";
			applyBtn.style.color = "#fff";
			applyBtn.style.fontWeight = "bold";

			// Close button
			const closeBtn = document.createElement("button");
			closeBtn.textContent = "✕";
			closeBtn.style.fontSize = "14px";
			closeBtn.style.padding = "4px 8px";
			closeBtn.style.cursor = "pointer";
			closeBtn.style.border = "2px solid #555";
			closeBtn.style.borderRadius = "3px";
			closeBtn.style.backgroundColor = "#333";
			closeBtn.style.color = "#fff";
			closeBtn.style.fontWeight = "bold";

			// Apply size function
			const applySize = () => {
				const sizeNum = parseInt(textSizeInput.value)
				if (!isNaN(sizeNum) && sizeNum >= 6 && sizeNum <= 72) {
					this.properties.font_size = sizeNum
					box.style.fontSize = `${sizeNum}px`
					highlightDiv.style.fontSize = `${sizeNum}px`
					markdownDiv.style.fontSize = `${sizeNum}px`
					textSizeControls.style.display = 'none'
					textSizeBtn.style.opacity = '1'

				} else {
					textSizeInput.style.borderColor = '#f44336'
					setTimeout(() => textSizeInput.style.borderColor = '#555', 1000)
				}
			}

			// Close function
			const closeTextSize = () => {
				textSizeControls.style.display = "none";
				textSizeBtn.style.opacity = "1";
				this.updateTextPadding();
			};

			// Button click handlers
			applyBtn.onclick = applySize;
			closeBtn.onclick = closeTextSize;

			// Enter to apply, Escape to close
			textSizeInput.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					applySize();
				} else if (e.key === "Escape") {
					e.preventDefault();
					closeTextSize();
				}
			});

			// Toggle text size controls
			textSizeBtn.onclick = () => {
				const isVisible = textSizeControls.style.display === "flex";
				textSizeControls.style.display = isVisible ? "none" : "flex";
				textSizeBtn.style.opacity = isVisible ? "1" : "0.5";
				
				if (!isVisible) {
					textSizeInput.value = this.properties.font_size;
					setTimeout(() => textSizeInput.focus(), 100);
				}
				
				this.updateTextPadding();
			};

			// Assemble controls
			textSizeControls.appendChild(textSizeLabel);
			textSizeControls.appendChild(textSizeInput);
			textSizeControls.appendChild(applyBtn);
			textSizeControls.appendChild(closeBtn);

			// Add to DOM
			
			textareaWrapper.appendChild(textSizeControls);

			// Store reference for padding updates
			this.tvtextsizecontrols = textSizeControls;

			// Delete All button
			const deleteAllBtn = document.createElement("button");
			deleteAllBtn.textContent = "🗑️";
			deleteAllBtn.title = "Delete All Text";
			deleteAllBtn.style.fontSize = "12px";
			deleteAllBtn.style.padding = "1px 4px";
			deleteAllBtn.style.cursor = "pointer";
			deleteAllBtn.style.minWidth = "24px";
			deleteAllBtn.style.width = "24px";
			deleteAllBtn.style.flexShrink = "0";
			deleteAllBtn.style.flexBasis = "24px";
			deleteAllBtn.style.opacity = "1";

			// Delete confirmation controls (inline popup)
			const deleteConfirmControls = document.createElement("div");
			deleteConfirmControls.style.position = "absolute";
			deleteConfirmControls.style.top = "22px";
			deleteConfirmControls.style.left = "0";
			deleteConfirmControls.style.right = "0";
			deleteConfirmControls.style.display = "none";
			deleteConfirmControls.style.flexDirection = "column";
			deleteConfirmControls.style.gap = "10px";
			deleteConfirmControls.style.padding = "12px";
			deleteConfirmControls.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
			deleteConfirmControls.style.border = "3px solid #ff6b6b";
			deleteConfirmControls.style.borderRadius = "4px";
			deleteConfirmControls.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
			deleteConfirmControls.style.zIndex = "15";
			deleteConfirmControls.style.backdropFilter = "blur(4px)";

			// Warning message
			const deleteMessage = document.createElement("div");
			deleteMessage.textContent = "⚠️ Delete all text? This cannot be undone.";
			deleteMessage.style.fontSize = "13px";
			deleteMessage.style.color = "#ff6b6b";
			deleteMessage.style.fontWeight = "bold";
			deleteMessage.style.textAlign = "center";
			deleteMessage.style.fontFamily = "monospace";

			// Button container
			const deleteButtonContainer = document.createElement("div");
			deleteButtonContainer.style.display = "flex";
			deleteButtonContainer.style.gap = "10px";
			deleteButtonContainer.style.justifyContent = "center";

			// Confirm Delete button
			const confirmDeleteBtn = document.createElement("button");
			confirmDeleteBtn.textContent = "Delete All";
			confirmDeleteBtn.style.fontSize = "12px";
			confirmDeleteBtn.style.padding = "6px 16px";
			confirmDeleteBtn.style.cursor = "pointer";
			confirmDeleteBtn.style.border = "2px solid #ff6b6b";
			confirmDeleteBtn.style.borderRadius = "3px";
			confirmDeleteBtn.style.backgroundColor = "#ff6b6b";
			confirmDeleteBtn.style.color = "#fff";
			confirmDeleteBtn.style.fontWeight = "bold";
			confirmDeleteBtn.style.fontFamily = "monospace";

			// Cancel button
			const cancelDeleteBtn = document.createElement("button");
			cancelDeleteBtn.textContent = "Cancel";
			cancelDeleteBtn.style.fontSize = "12px";
			cancelDeleteBtn.style.padding = "6px 16px";
			cancelDeleteBtn.style.cursor = "pointer";
			cancelDeleteBtn.style.border = "2px solid #555";
			cancelDeleteBtn.style.borderRadius = "3px";
			cancelDeleteBtn.style.backgroundColor = "#333";
			cancelDeleteBtn.style.color = "#fff";
			cancelDeleteBtn.style.fontWeight = "bold";
			cancelDeleteBtn.style.fontFamily = "monospace";

			// Hover effects
			confirmDeleteBtn.onmouseenter = () => {
				confirmDeleteBtn.style.backgroundColor = "#ff5252";
			};
			confirmDeleteBtn.onmouseleave = () => {
				confirmDeleteBtn.style.backgroundColor = "#ff6b6b";
			};

			cancelDeleteBtn.onmouseenter = () => {
				cancelDeleteBtn.style.backgroundColor = "#666";
			};
			cancelDeleteBtn.onmouseleave = () => {
				cancelDeleteBtn.style.backgroundColor = "#333";
			};

			// Delete function
			const executeDelete = () => {
				box.value = "";

				if (!this.properties) {
					this.properties = {};
				}

				this._tv_original_text = "";
				this._tv_pretty_json_text = "";
				this.properties.text = "";
				this.properties.pretty_json_text = "";

				const textWidget = this.widgets?.find(w => w.name === "text");
				if (textWidget) {
					textWidget.value = "";
				}

				this._updateCounter();

				if (this._tv_filter_input) {
					this._tv_filter_input.value = "";
				}

				if (this._tv_line_filter_input) {
					this._tv_line_filter_input.value = "";
				}

				this.properties.pretty_json_mode = false;
				if (prettyJsonBtn) {
					prettyJsonBtn.style.opacity = "0.5";
				}

				if (this.properties.markdown_mode && this._md) {
					this._renderMarkdownWithHighlight();
				}

				if (this._tv_highlight_div) {
					this._tv_highlight_div.innerHTML = '';
				}

				this._tv_match_positions = [];
				if (this._tv_match_counter) {
					this._tv_match_counter.textContent = "0 / 0";
				}

				if (this._tv_line_match_counter) {
					this._tv_line_match_counter.textContent = "0 lines";
				}

				// Close the confirmation dialog
				deleteConfirmControls.style.display = "none";
				deleteAllBtn.style.opacity = "1";
				this.updateTextPadding();

				// Show success feedback
				deleteAllBtn.textContent = "✓";
				setTimeout(() => {
					deleteAllBtn.textContent = "🗑️";
				}, 1500);
			};

			// Cancel function
			const cancelDelete = () => {
				deleteConfirmControls.style.display = "none";
				deleteAllBtn.style.opacity = "1";
				this.updateTextPadding();
			};

			// Button click handlers
			confirmDeleteBtn.onclick = executeDelete;
			cancelDeleteBtn.onclick = cancelDelete;

			// Escape key to cancel
			const deleteEscapeHandler = (e) => {
				if (e.key === "Escape" && deleteConfirmControls.style.display === "flex") {
					e.preventDefault();
					e.stopPropagation();
					cancelDelete();
				}
			};

			// Toggle delete confirmation
			deleteAllBtn.onclick = () => {
				const isVisible = deleteConfirmControls.style.display === "flex";
				deleteConfirmControls.style.display = isVisible ? "none" : "flex";
				deleteAllBtn.style.opacity = isVisible ? "1" : "0.5";
				
				if (!isVisible) {
					document.addEventListener("keydown", deleteEscapeHandler);
				} else {
					document.removeEventListener("keydown", deleteEscapeHandler);
				}
				
				this.updateTextPadding();
			};

			// Assemble controls
			deleteButtonContainer.appendChild(confirmDeleteBtn);
			deleteButtonContainer.appendChild(cancelDeleteBtn);
			deleteConfirmControls.appendChild(deleteMessage);
			deleteConfirmControls.appendChild(deleteButtonContainer);

			// Add to DOM

			textareaWrapper.appendChild(deleteConfirmControls);

			// Store reference for padding updates
			this.tvdeletecontrols = deleteConfirmControls;

			topContainer.appendChild(btnContainer);

			// ============ MARKDOWN FORMATTING TOOLBAR ============
			// Second toolbar for markdown formatting
			const markdownToolbar = document.createElement("div");
			markdownToolbar.style.position = "absolute";
			markdownToolbar.style.top = "20px";  // Right below topContainer
			markdownToolbar.style.left = "0";
			markdownToolbar.style.right = "0";
			markdownToolbar.style.display = "flex";
			markdownToolbar.style.justifyContent = "flex-start";
			markdownToolbar.style.alignItems = "center";
			markdownToolbar.style.gap = "3px";
			markdownToolbar.style.padding = "2px 5px";
			markdownToolbar.style.fontSize = "10px";
			markdownToolbar.style.fontFamily = "monospace";
			markdownToolbar.style.height = "20px";
			markdownToolbar.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
			markdownToolbar.style.zIndex = "10";
			markdownToolbar.style.overflow = "hidden";
			markdownToolbar.style.minWidth = "0";

						this._tv_undo_stack = []; 
			this._tv_redo_stack = [];  
			this._tv_max_history = 50;

			// Debounced save to history
			let saveTimeout = null;
			let lastSavedText = "";

			const saveToHistory = (immediate = false) => {
				const currentText = box.value;
				
				// Skip if text hasn't changed
				if (currentText === lastSavedText) return;
				
				if (immediate) {
					// Save immediately (for button actions)
					if (this._tv_undo_stack.length === 0 || this._tv_undo_stack[this._tv_undo_stack.length - 1] !== currentText) {
						this._tv_undo_stack.push(currentText);
						if (this._tv_undo_stack.length > this._tv_max_history) {
							this._tv_undo_stack.shift();
						}
						this._tv_redo_stack = [];
						lastSavedText = currentText;
					}
				} else {
					// Debounced save (for typing)
					if (saveTimeout) {
						clearTimeout(saveTimeout);
					}
					
					saveTimeout = setTimeout(() => {
						if (this._tv_undo_stack.length === 0 || this._tv_undo_stack[this._tv_undo_stack.length - 1] !== currentText) {
							this._tv_undo_stack.push(currentText);
							if (this._tv_undo_stack.length > this._tv_max_history) {
								this._tv_undo_stack.shift();
							}
							this._tv_redo_stack = [];
							lastSavedText = currentText;
						}
					}, 1000);
				}
			};

			// Initialize with current state
			this._tv_undo_stack.push(box.value);
			lastSavedText = box.value;

			// Helper function to wrap selected text with markdown syntax
			const wrapSelection = (before, after = before) => {
				saveToHistory(true);
				const start = box.selectionStart;
				const end = box.selectionEnd;
				const selectedText = box.value.substring(start, end);
				const beforeText = box.value.substring(0, start);
				const afterText = box.value.substring(end);
				
				// Check if the text is already wrapped (toggle behavior)
				const beforeLen = before.length;
				const afterLen = after.length;
				const textBefore = beforeText.slice(-beforeLen);
				const textAfter = afterText.slice(0, afterLen);
				
				let newText;
				let newStart, newEnd;
				
				if (textBefore === before && textAfter === after) {
					// Text is already wrapped, remove the wrapping
					newText = beforeText.slice(0, -beforeLen) + selectedText + afterText.slice(afterLen);
					newStart = start - beforeLen;
					newEnd = end - beforeLen;
				} else {
					// Text is not wrapped, add the wrapping
					newText = beforeText + before + selectedText + after + afterText;
					newStart = start + beforeLen;
					newEnd = end + beforeLen;
				}
				
				box.value = newText;
				
				// Update cursor position
				box.setSelectionRange(newStart, newEnd);
				box.focus();
				
				// Sync with widget
				this._tv_original_text = newText;
				const textWidget = this.widgets?.find(w => w.name === "text");
				if (textWidget) {
					textWidget.value = newText;
				}
				this._updateCounter();

				saveToHistory(true);
				
				// Update markdown preview if active
				if (this.properties.markdown_mode && this._md) {
					this._renderMarkdownWithHighlight();
				}
			};


			// Helper function to insert text at cursor
			const insertAtCursor = (text) => {
				saveToHistory(true);
				const start = box.selectionStart;
				const end = box.selectionEnd;
				const beforeText = box.value.substring(0, start);
				const afterText = box.value.substring(end);
				
				const newText = beforeText + text + afterText;
				box.value = newText;
				
				// Update cursor position
				box.setSelectionRange(start + text.length, start + text.length);
				box.focus();
				
				// Sync with widget
				this._tv_original_text = newText;
				const textWidget = this.widgets?.find(w => w.name === "text");
				if (textWidget) {
					textWidget.value = newText;
				}
				this._updateCounter();

				saveToHistory(true);
			};

			// Bold button
			const boldBtn = document.createElement("button");
			boldBtn.textContent = "B";
			boldBtn.title = "Bold (Ctrl+B)";
			boldBtn.style.fontSize = "12px";
			boldBtn.style.padding = "1px 6px";
			boldBtn.style.cursor = "pointer";
			boldBtn.style.fontWeight = "bold";
			boldBtn.style.minWidth = "24px";
			boldBtn.style.flexShrink = "0";
			boldBtn.onclick = () => wrapSelection("**");

			// Italic button
			const italicBtn = document.createElement("button");
			italicBtn.textContent = "I";
			italicBtn.title = "Italic (Ctrl+I)";
			italicBtn.style.fontSize = "12px";
			italicBtn.style.padding = "1px 6px";
			italicBtn.style.cursor = "pointer";
			italicBtn.style.fontStyle = "italic";
			italicBtn.style.minWidth = "24px";
			italicBtn.style.flexShrink = "0";
			italicBtn.onclick = () => wrapSelection("*");

			// Strikethrough button
			const strikeBtn = document.createElement("button");
			strikeBtn.textContent = "S";
			strikeBtn.title = "Strikethrough";
			strikeBtn.style.fontSize = "12px";
			strikeBtn.style.padding = "1px 6px";
			strikeBtn.style.cursor = "pointer";
			strikeBtn.style.textDecoration = "line-through";
			strikeBtn.style.minWidth = "24px";
			strikeBtn.style.flexShrink = "0";
			strikeBtn.onclick = () => wrapSelection("~~");

			// Code inline button
			const codeBtn = document.createElement("button");
			codeBtn.textContent = "<>";
			codeBtn.title = "Inline Code";
			codeBtn.style.fontSize = "11px";
			codeBtn.style.padding = "1px 6px";
			codeBtn.style.cursor = "pointer";
			codeBtn.style.fontFamily = "monospace";
			codeBtn.style.minWidth = "24px";
			codeBtn.style.flexShrink = "0";
			codeBtn.onclick = () => wrapSelection("`");

			// Code block button
			const codeBlockBtn = document.createElement("button");
			codeBlockBtn.textContent = "{}";
			codeBlockBtn.title = "Code Block";
			codeBlockBtn.style.fontSize = "11px";
			codeBlockBtn.style.padding = "1px 6px";
			codeBlockBtn.style.cursor = "pointer";
			codeBlockBtn.style.fontFamily = "monospace";
			codeBlockBtn.style.minWidth = "24px";
			codeBlockBtn.style.flexShrink = "0";
			codeBlockBtn.onclick = () => wrapSelection("\n``````\n");

			// Heading button
			const headingBtn = document.createElement("button");
			headingBtn.textContent = "H";
			headingBtn.title = "Heading (cycles H1-H3)";
			headingBtn.style.fontSize = "12px";
			headingBtn.style.padding = "1px 6px";
			headingBtn.style.cursor = "pointer";
			headingBtn.style.fontWeight = "bold";
			headingBtn.style.minWidth = "24px";
			headingBtn.style.flexShrink = "0";
			headingBtn.onclick = () => {
				saveToHistory(true);
				const start = box.selectionStart;
				const lineStart = box.value.lastIndexOf('\n', start - 1) + 1;
				const lineEnd = box.value.indexOf('\n', start);
				const lineEndPos = lineEnd === -1 ? box.value.length : lineEnd;
				const line = box.value.substring(lineStart, lineEndPos);
				
				let newLine;
				if (line.startsWith('### ')) {
					newLine = line.substring(4);
				} else if (line.startsWith('## ')) {
					newLine = '### ' + line.substring(3);
				} else if (line.startsWith('# ')) {
					newLine = '## ' + line.substring(2);
				} else {
					newLine = '# ' + line;
				}
				
				const newText = box.value.substring(0, lineStart) + newLine + box.value.substring(lineEndPos);
				box.value = newText;
				this._tv_original_text = newText;
				const textWidget = this.widgets?.find(w => w.name === "text");
				if (textWidget) {
					textWidget.value = newText;
				}
				this._updateCounter();
				box.focus();

   				saveToHistory(true);
			};

			// Bullet list button
			const bulletBtn = document.createElement("button");
			bulletBtn.textContent = "•";
			bulletBtn.title = "Bullet List (toggle current line)";
			bulletBtn.style.fontSize = "14px";
			bulletBtn.style.padding = "1px 6px";
			bulletBtn.style.cursor = "pointer";
			bulletBtn.style.minWidth = "24px";
			bulletBtn.style.flexShrink = "0";
			bulletBtn.onclick = () => {
				saveToHistory(true);
				const start = box.selectionStart;
				const lineStart = box.value.lastIndexOf('\n', start - 1) + 1;
				const lineEnd = box.value.indexOf('\n', start);
				const lineEndPos = lineEnd === -1 ? box.value.length : lineEnd;
				const line = box.value.substring(lineStart, lineEndPos);
				
				let newLine;
				if (line.startsWith('- ')) {
					// Remove bullet
					newLine = line.substring(2);
				} else {
					// Add bullet
					newLine = '- ' + line;
				}
				
				const newText = box.value.substring(0, lineStart) + newLine + box.value.substring(lineEndPos);
				box.value = newText;
				this._tv_original_text = newText;
				
				const textWidget = this.widgets?.find(w => w.name === "text");
				if (textWidget) {
					textWidget.value = newText;
				}
				this._updateCounter();
				box.focus();
				
				if (this.properties.markdown_mode && this._md) {
					this._renderMarkdownWithHighlight();
				};
   				 saveToHistory(true);
			};


			// Numbered list button
			const numberedBtn = document.createElement("button");
			numberedBtn.textContent = "1.";
			numberedBtn.title = "Numbered List (toggle current line)";
			numberedBtn.style.fontSize = "12px";
			numberedBtn.style.padding = "1px 6px";
			numberedBtn.style.cursor = "pointer";
			numberedBtn.style.minWidth = "24px";
			numberedBtn.style.flexShrink = "0";
			numberedBtn.onclick = () => {
				saveToHistory(true);
				const start = box.selectionStart;
				const lineStart = box.value.lastIndexOf('\n', start - 1) + 1;
				const lineEnd = box.value.indexOf('\n', start);
				const lineEndPos = lineEnd === -1 ? box.value.length : lineEnd;
				const line = box.value.substring(lineStart, lineEndPos);
				
				let newLine;
				// Check if line starts with number pattern like "1. ", "2. ", etc.
				const numberPattern = /^\d+\.\s/;
				if (numberPattern.test(line)) {
					// Remove numbering
					newLine = line.replace(numberPattern, '');
				} else {
					// Add numbering
					newLine = '1. ' + line;
				}
				
				const newText = box.value.substring(0, lineStart) + newLine + box.value.substring(lineEndPos);
				box.value = newText;
				this._tv_original_text = newText;
				
				const textWidget = this.widgets?.find(w => w.name === "text");
				if (textWidget) {
					textWidget.value = newText;
				}
				this._updateCounter();
				box.focus();
				
				if (this.properties.markdown_mode && this._md) {
					this._renderMarkdownWithHighlight();
				};
    			saveToHistory(true);
			};


			// Link button
			const linkBtn = document.createElement("button");
			linkBtn.textContent = "🔗";
			linkBtn.title = "Insert Link";
			linkBtn.style.fontSize = "12px";
			linkBtn.style.padding = "1px 4px";
			linkBtn.style.cursor = "pointer";
			linkBtn.style.minWidth = "24px";
			linkBtn.style.flexShrink = "0";
			linkBtn.onclick = () => {
				const start = box.selectionStart;
				const end = box.selectionEnd;
				const selectedText = box.value.substring(start, end);
				if (selectedText) {
					wrapSelection("[", "](url)");
				} else {
					insertAtCursor("[text](url)");
				}
			};

			// Quote button
			const quoteBtn = document.createElement("button");
			quoteBtn.textContent = "\"";
			quoteBtn.title = "Quote";
			quoteBtn.style.fontSize = "14px";
			quoteBtn.style.padding = "1px 6px";
			quoteBtn.style.cursor = "pointer";
			quoteBtn.style.minWidth = "24px";
			quoteBtn.style.flexShrink = "0";
			quoteBtn.onclick = () => insertAtCursor("> ");

			// Horizontal rule button
			const hrBtn = document.createElement("button");
			hrBtn.textContent = "─";
			hrBtn.title = "Horizontal Rule";
			hrBtn.style.fontSize = "14px";
			hrBtn.style.padding = "1px 6px";
			hrBtn.style.cursor = "pointer";
			hrBtn.style.minWidth = "24px";
			hrBtn.style.flexShrink = "0";
			hrBtn.onclick = () => insertAtCursor("\n---\n");

			// Table button
			const tableBtn = document.createElement("button");
			tableBtn.textContent = "⊞";
			tableBtn.title = "Insert Table";
			tableBtn.style.fontSize = "14px";
			tableBtn.style.padding = "1px 6px";
			tableBtn.style.cursor = "pointer";
			tableBtn.style.minWidth = "24px";
			tableBtn.style.flexShrink = "0";

			// Table size controls inline popup
			const tableControls = document.createElement("div");
			tableControls.style.position = "absolute";
			tableControls.style.top = "42px"; // Below markdown toolbar
			tableControls.style.left = "0";
			tableControls.style.right = "0";
			tableControls.style.display = "none";
			tableControls.style.flexDirection = "row";
			tableControls.style.gap = "8px";
			tableControls.style.alignItems = "center";
			tableControls.style.padding = "8px";
			tableControls.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
			tableControls.style.border = "3px solid #4CAF50";
			tableControls.style.borderRadius = "4px";
			tableControls.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
			tableControls.style.zIndex = "15";
			tableControls.style.backdropFilter = "blur(4px)";

			// Label
			const tableLabel = document.createElement("span");
			tableLabel.textContent = "Table Size:";
			tableLabel.style.fontSize = "13px";
			tableLabel.style.color = "#4CAF50";
			tableLabel.style.fontWeight = "bold";
			tableLabel.style.fontFamily = "monospace";

			// Rows input
			const rowsLabel = document.createElement("span");
			rowsLabel.textContent = "Rows:";
			rowsLabel.style.fontSize = "12px";
			rowsLabel.style.color = "#ddd";
			rowsLabel.style.fontFamily = "monospace";

			const rowsInput = document.createElement("input");
			rowsInput.type = "number";
			rowsInput.min = "1";
			rowsInput.max = "50";
			rowsInput.value = "4";
			rowsInput.style.width = "50px";
			rowsInput.style.height = "28px";
			rowsInput.style.boxSizing = "border-box";
			rowsInput.style.fontFamily = "monospace";
			rowsInput.style.fontSize = "12px";
			rowsInput.style.padding = "4px";
			rowsInput.style.border = "2px solid #555";
			rowsInput.style.borderRadius = "3px";
			rowsInput.style.backgroundColor = "#1e1e1e";
			rowsInput.style.color = "#d4d4d4";

			// Columns input
			const colsLabel = document.createElement("span");
			colsLabel.textContent = "Cols:";
			colsLabel.style.fontSize = "12px";
			colsLabel.style.color = "#ddd";
			colsLabel.style.fontFamily = "monospace";

			const colsInput = document.createElement("input");
			colsInput.type = "number";
			colsInput.min = "1";
			colsInput.max = "20";
			colsInput.value = "4";
			colsInput.style.width = "50px";
			colsInput.style.height = "28px";
			colsInput.style.boxSizing = "border-box";
			colsInput.style.fontFamily = "monospace";
			colsInput.style.fontSize = "12px";
			colsInput.style.padding = "4px";
			colsInput.style.border = "2px solid #555";
			colsInput.style.borderRadius = "3px";
			colsInput.style.backgroundColor = "#1e1e1e";
			colsInput.style.color = "#d4d4d4";

			// Insert button
			const insertTableBtn = document.createElement("button");
			insertTableBtn.textContent = "Insert";
			insertTableBtn.style.fontSize = "12px";
			insertTableBtn.style.padding = "4px 12px";
			insertTableBtn.style.cursor = "pointer";
			insertTableBtn.style.border = "2px solid #4CAF50";
			insertTableBtn.style.borderRadius = "3px";
			insertTableBtn.style.backgroundColor = "#4CAF50";
			insertTableBtn.style.color = "#fff";
			insertTableBtn.style.fontWeight = "bold";

			// Close button
			const closeTableBtn = document.createElement("button");
			closeTableBtn.textContent = "✕";
			closeTableBtn.style.fontSize = "14px";
			closeTableBtn.style.padding = "4px 8px";
			closeTableBtn.style.cursor = "pointer";
			closeTableBtn.style.border = "2px solid #555";
			closeTableBtn.style.borderRadius = "3px";
			closeTableBtn.style.backgroundColor = "#333";
			closeTableBtn.style.color = "#fff";
			closeTableBtn.style.fontWeight = "bold";

			// Insert table function
			const insertTable = () => {
				const rows = parseInt(rowsInput.value);
				const cols = parseInt(colsInput.value);
				
				if (isNaN(rows) || rows < 1 || rows > 50 || isNaN(cols) || cols < 1 || cols > 20) {
					rowsInput.style.borderColor = "#f44336";
					colsInput.style.borderColor = "#f44336";
					setTimeout(() => {
						rowsInput.style.borderColor = "#555";
						colsInput.style.borderColor = "#555";
					}, 1000);
					return;
				}
				
				// Create header row
				let headerRow = "|";
				let separatorRow = "|";
				for (let i = 1; i <= cols; i++) {
					headerRow += ` Header ${i} |`;
					separatorRow += "----------|";
				}
				
				// Create data rows
				let dataRows = "";
				for (let i = 1; i <= rows; i++) {
					let row = "|";
					for (let j = 1; j <= cols; j++) {
						row += ` Cell ${i},${j} |`;
					}
					dataRows += row + "\n";
				}
				
				const table = `\n${headerRow}\n${separatorRow}\n${dataRows}`;
				insertAtCursor(table);
				
				tableControls.style.display = "none";
				tableBtn.style.opacity = "1";
				this.updateTextPadding();
			};

			// Close function
			const closeTable = () => {
				tableControls.style.display = "none";
				tableBtn.style.opacity = "1";
				this.updateTextPadding();
			};

			// Button click handlers
			insertTableBtn.onclick = insertTable;
			closeTableBtn.onclick = closeTable;

			// Enter to insert, Escape to close
			rowsInput.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					insertTable();
				} else if (e.key === "Escape") {
					e.preventDefault();
					closeTable();
				}
			});

			colsInput.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					insertTable();
				} else if (e.key === "Escape") {
					e.preventDefault();
					closeTable();
				}
			});

			// Toggle table controls
			tableBtn.onclick = () => {
				const isVisible = tableControls.style.display === "flex";
				tableControls.style.display = isVisible ? "none" : "flex";
				tableBtn.style.opacity = isVisible ? "1" : "0.5";
				if (!isVisible) {
					rowsInput.value = "4";
					colsInput.value = "4";
					setTimeout(() => rowsInput.focus(), 100);
				}
				this.updateTextPadding();
			};

			// Assemble controls
			tableControls.appendChild(tableLabel);
			tableControls.appendChild(rowsLabel);
			tableControls.appendChild(rowsInput);
			tableControls.appendChild(colsLabel);
			tableControls.appendChild(colsInput);
			tableControls.appendChild(insertTableBtn);
			tableControls.appendChild(closeTableBtn);

			// Add to DOM
			textareaWrapper.appendChild(tableControls);

			// Store reference
			this._tv_table_controls = tableControls;


			// Non-breaking space button
			const nbspBtn = document.createElement("button");
			nbspBtn.textContent = "␣";
			nbspBtn.title = "Non-breaking Space (&nbsp;)";
			nbspBtn.style.fontSize = "14px";
			nbspBtn.style.padding = "1px 6px";
			nbspBtn.style.cursor = "pointer";
			nbspBtn.style.minWidth = "24px";
			nbspBtn.style.flexShrink = "0";
			nbspBtn.onclick = () => insertAtCursor("&nbsp;");

			// En space button
			const enspBtn = document.createElement("button");
			enspBtn.textContent = "␣␣";
			enspBtn.title = "En Space (&ensp;) - 2 spaces wide";
			enspBtn.style.fontSize = "12px";
			enspBtn.style.padding = "1px 6px";
			enspBtn.style.cursor = "pointer";
			enspBtn.style.minWidth = "24px";
			enspBtn.style.flexShrink = "0";
			enspBtn.onclick = () => insertAtCursor("&ensp;");

			// Em space button
			const emspBtn = document.createElement("button");
			emspBtn.textContent = "␣␣␣␣";
			emspBtn.title = "Em Space (&emsp;) - 4 spaces wide";
			emspBtn.style.fontSize = "10px";
			emspBtn.style.padding = "1px 6px";
			emspBtn.style.cursor = "pointer";
			emspBtn.style.minWidth = "24px";
			emspBtn.style.flexShrink = "0";
			emspBtn.onclick = () => insertAtCursor("&emsp;");

			// Undo button
			const undoBtn = document.createElement("button");
			undoBtn.textContent = "↶";
			undoBtn.title = "Undo (Ctrl+Z)";
			undoBtn.style.fontSize = "16px";
			undoBtn.style.padding = "1px 6px";
			undoBtn.style.cursor = "pointer";
			undoBtn.style.minWidth = "24px";
			undoBtn.style.flexShrink = "0";
			undoBtn.onclick = () => {
				if (this._tv_undo_stack.length > 1) {
					// Save current state to redo
					this._tv_redo_stack.push(this._tv_undo_stack.pop());
					// Get previous state
					const previousText = this._tv_undo_stack[this._tv_undo_stack.length - 1];
					box.value = previousText;
					this._tv_original_text = previousText;
					const textWidget = this.widgets?.find(w => w.name === "text");
					if (textWidget) textWidget.value = previousText;
					this.updateCounter();
					if (this.properties.markdownmode && this.md) this.renderMarkdownWithHighlight();
				}
			};

			// Redo button
			const redoBtn = document.createElement("button");
			redoBtn.textContent = "↷";
			redoBtn.title = "Redo (Ctrl+Y)";
			redoBtn.style.fontSize = "16px";
			redoBtn.style.padding = "1px 6px";
			redoBtn.style.cursor = "pointer";
			redoBtn.style.minWidth = "24px";
			redoBtn.style.flexShrink = "0";
			redoBtn.onclick = () => {
				if (this._tv_redo_stack.length > 0) {
					const nextText = this._tv_redo_stack.pop();
					this._tv_undo_stack.push(nextText);
					box.value = nextText;
					this._tv_original_text = nextText;
					const textWidget = this.widgets?.find(w => w.name === "text");
					if (textWidget) textWidget.value = nextText;
					this.updateCounter();

					saveToHistory(true);
					
					if (this.properties.markdownmode && this.md) this.renderMarkdownWithHighlight();
				}
			};

			// Add all buttons to toolbar
			markdownToolbar.appendChild(boldBtn);
			markdownToolbar.appendChild(italicBtn);
			markdownToolbar.appendChild(strikeBtn);
			markdownToolbar.appendChild(codeBtn);
			markdownToolbar.appendChild(codeBlockBtn);
			markdownToolbar.appendChild(headingBtn);
			markdownToolbar.appendChild(bulletBtn);
			markdownToolbar.appendChild(numberedBtn);
			markdownToolbar.appendChild(linkBtn);
			markdownToolbar.appendChild(quoteBtn);
			markdownToolbar.appendChild(hrBtn);
			markdownToolbar.appendChild(tableBtn);
			markdownToolbar.appendChild(nbspBtn); 
			markdownToolbar.appendChild(enspBtn);
			markdownToolbar.appendChild(emspBtn);	
			markdownToolbar.appendChild(undoBtn);
			markdownToolbar.appendChild(redoBtn);	


			// Add keyboard shortcuts
			box.addEventListener("keydown", (e) => {
				// Bold and Italic shortcuts
				if (e.ctrlKey || e.metaKey) {
					if (e.key === 'b') {
						e.preventDefault();
						boldBtn.click();
					} else if (e.key === 'i') {
						e.preventDefault();
						italicBtn.click();
					} else if (e.key === 'z' && !e.shiftKey) {  // Add this
						e.preventDefault();
						undoBtn.click();
					} else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {  // Add this
						e.preventDefault();
						redoBtn.click();
					}
				}
				
				// Auto-continue lists on Enter
				if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
					const start = box.selectionStart;
					const lineStart = box.value.lastIndexOf('\n', start - 1) + 1;
					const line = box.value.substring(lineStart, start);
					
					// Check for bullet list
					if (line.trim() === '-') {
						// Empty bullet, remove it
						e.preventDefault();
						const newText = box.value.substring(0, lineStart) + box.value.substring(start);
						box.value = newText;
						box.setSelectionRange(lineStart, lineStart);
						this._tv_original_text = newText;
						const textWidget = this.widgets?.find(w => w.name === "text");
						if (textWidget) textWidget.value = newText;
						this._updateCounter();
					} else if (line.startsWith('- ')) {
						// Continue bullet list
						e.preventDefault();
						const newText = box.value.substring(0, start) + '\n- ' + box.value.substring(start);
						box.value = newText;
						box.setSelectionRange(start + 3, start + 3);
						this._tv_original_text = newText;
						const textWidget = this.widgets?.find(w => w.name === "text");
						if (textWidget) textWidget.value = newText;
						this._updateCounter();
					}
					
					// Check for numbered list
					const numberMatch = line.match(/^(\d+)\.\s/);
					if (numberMatch) {
						const currentNum = parseInt(numberMatch[1]);
						if (line.trim() === `${currentNum}.`) {
							// Empty numbered item, remove it
							e.preventDefault();
							const newText = box.value.substring(0, lineStart) + box.value.substring(start);
							box.value = newText;
							box.setSelectionRange(lineStart, lineStart);
							this._tv_original_text = newText;
							const textWidget = this.widgets?.find(w => w.name === "text");
							if (textWidget) textWidget.value = newText;
							this._updateCounter();
						} else {
							// Continue numbered list
							e.preventDefault();
							const nextNum = currentNum + 1;
							const newText = box.value.substring(0, start) + `\n${nextNum}. ` + box.value.substring(start);
							box.value = newText;
							box.setSelectionRange(start + `\n${nextNum}. `.length, start + `\n${nextNum}. `.length);
							this._tv_original_text = newText;
							const textWidget = this.widgets?.find(w => w.name === "text");
							if (textWidget) textWidget.value = newText;
							this._updateCounter();
						}
					}
				}
			});


			// Store reference
			this._tv_markdown_toolbar = markdownToolbar;
			// Add markdown toolbar to wrapper
			textareaWrapper.appendChild(markdownToolbar);

			// Highlight controls
			const highlightControls = document.createElement("div");
			highlightControls.style.position = "absolute";
			highlightControls.style.left = "0";
			highlightControls.style.right = "0";
			highlightControls.style.display = "none";
			highlightControls.style.flexDirection = "row";
			highlightControls.style.gap = "5px";
			highlightControls.style.alignItems = "center";
			highlightControls.style.padding = "8px";
			highlightControls.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
			highlightControls.style.border = "3px solid #FFD700";
			highlightControls.style.borderRadius = "4px";
			highlightControls.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
			highlightControls.style.zIndex = "15";
			highlightControls.style.backdropFilter = "blur(4px)";

			const filterInput = document.createElement("input");
			filterInput.type = "text";
			filterInput.placeholder = "Highlight text (regex supported)...";
			filterInput.style.width = "200px";
			filterInput.style.minWidth = "200px";
			filterInput.style.maxWidth = "600px";
			filterInput.style.height = "28px";
			filterInput.style.boxSizing = "border-box";
			filterInput.style.fontFamily = "monospace";
			filterInput.style.fontSize = "12px";
			filterInput.style.padding = "4px";
			filterInput.style.border = "2px solid #555";
			filterInput.style.borderRadius = "3px";

			filterInput.addEventListener('input', function() {
				const charWidth = 8;
				const padding = 50;
				const minWidth = 200;
				const maxWidth = 600;
				const calculatedWidth = Math.min(maxWidth, Math.max(minWidth, this.value.length * charWidth + padding));
				this.style.width = calculatedWidth + 'px';
			});

			const matchCounter = document.createElement("span");
			matchCounter.style.fontSize = "13px";
			matchCounter.style.fontWeight = "bold";
			matchCounter.style.color = "#FFD700";
			matchCounter.style.minWidth = "60px";
			matchCounter.style.fontFamily = "monospace";
			matchCounter.style.textShadow = "0 0 2px rgba(0, 0, 0, 0.8)";
			matchCounter.textContent = "0 / 0";

			const prevBtn = document.createElement("button");
			prevBtn.textContent = "↑ Prev";
			prevBtn.title = "Previous match (Shift+Enter)";
			prevBtn.style.fontSize = "12px";
			prevBtn.style.padding = "4px 8px";
			prevBtn.style.cursor = "pointer";
			prevBtn.style.border = "2px solid #555";
			prevBtn.style.borderRadius = "3px";
			prevBtn.style.backgroundColor = "#333";
			prevBtn.style.color = "#fff";
			prevBtn.style.fontWeight = "bold";

			const nextBtn = document.createElement("button");
			nextBtn.textContent = "Next ↓";
			nextBtn.title = "Next match (Enter)";
			nextBtn.style.fontSize = "12px";
			nextBtn.style.padding = "4px 8px";
			nextBtn.style.cursor = "pointer";
			nextBtn.style.border = "2px solid #555";
			nextBtn.style.borderRadius = "3px";
			nextBtn.style.backgroundColor = "#333";
			nextBtn.style.color = "#fff";
			nextBtn.style.fontWeight = "bold";

			highlightControls.appendChild(filterInput);
			highlightControls.appendChild(matchCounter);
			highlightControls.appendChild(prevBtn);
			highlightControls.appendChild(nextBtn);

			textareaWrapper.appendChild(highlightControls);

			// Filter controls
			const filterControls = document.createElement("div");
			filterControls.style.position = "absolute";
			filterControls.style.left = "0";
			filterControls.style.right = "0";
			filterControls.style.display = "none";
			filterControls.style.flexDirection = "row";
			filterControls.style.gap = "5px";
			filterControls.style.alignItems = "center";
			filterControls.style.padding = "8px";
			filterControls.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
			filterControls.style.border = "3px solid #4CAF50";
			filterControls.style.borderRadius = "4px";
			filterControls.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
			filterControls.style.zIndex = "15";
			filterControls.style.backdropFilter = "blur(4px)";

			const lineFilterInput = document.createElement("input");
			lineFilterInput.type = "text";
			lineFilterInput.placeholder = "Filter lines (regex supported)...";
			lineFilterInput.style.width = "200px";
			lineFilterInput.style.minWidth = "200px";
			lineFilterInput.style.maxWidth = "600px";
			lineFilterInput.style.height = "28px";
			lineFilterInput.style.boxSizing = "border-box";
			lineFilterInput.style.fontFamily = "monospace";
			lineFilterInput.style.fontSize = "12px";
			lineFilterInput.style.padding = "4px";
			lineFilterInput.style.border = "2px solid #555";
			lineFilterInput.style.borderRadius = "3px";

			lineFilterInput.addEventListener('input', function() {
				const charWidth = 8;
				const padding = 50;
				const minWidth = 200;
				const maxWidth = 600;
				const calculatedWidth = Math.min(maxWidth, Math.max(minWidth, this.value.length * charWidth + padding));
				this.style.width = calculatedWidth + 'px';
			});

			const lineMatchCounter = document.createElement("span");
			lineMatchCounter.style.fontSize = "13px";
			lineMatchCounter.style.fontWeight = "bold";
			lineMatchCounter.style.color = "#4CAF50";
			lineMatchCounter.style.minWidth = "80px";
			lineMatchCounter.style.fontFamily = "monospace";
			lineMatchCounter.style.textShadow = "0 0 2px rgba(0, 0, 0, 0.8)";
			lineMatchCounter.textContent = "0 lines";

			filterControls.appendChild(lineFilterInput);
			filterControls.appendChild(lineMatchCounter);

			textareaWrapper.appendChild(filterControls);

			// Sync scroll
			box.addEventListener('scroll', () => {
				highlightDiv.scrollTop = box.scrollTop;
				highlightDiv.scrollLeft = box.scrollLeft;
			});

			textareaWrapper.appendChild(highlightDiv);

			// Buttons order of appearance
			btnContainer.appendChild(editBtn);
			btnContainer.appendChild(deleteAllBtn);
			btnContainer.appendChild(copyBtn);            
			btnContainer.appendChild(selectAllBtn);
			btnContainer.appendChild(pasteBtn);
			btnContainer.appendChild(highlightBtn);
			btnContainer.appendChild(filterBtn);
			btnContainer.appendChild(exportBtn);
			btnContainer.appendChild(prettyJsonBtn);			
			btnContainer.appendChild(textSizeBtn);			
			btnContainer.appendChild(themeBtn);
			btnContainer.appendChild(wrapBtn);		

			// Store references
			this._tv_box = box;
			this._tv_counter = counter;
			this._tv_filter_input = filterInput;
			this._tv_highlight_div = highlightDiv;
			this._tv_highlight_controls = highlightControls;
			this._tv_match_counter = matchCounter;
			this._tv_match_positions = [];
			this._tv_current_match_index = -1;
			this._tv_original_text = "";
			this._tv_markdown_div = markdownDiv;

			this._tv_original_text = "";
			this._tv_pretty_json_text = "";
			this._tv_line_filter_input = lineFilterInput;
			this._tv_filter_controls = filterControls;
			this._tv_line_match_counter = lineMatchCounter;

			this.updateTextPadding = () => {
				const hasControls = this.properties.text_filter || this.properties.line_filter ||
					(textSizeControls.style.display === "flex") ||
					(deleteConfirmControls.style.display === "flex");
				
				const basePadding = 42; // 20px top button bar + 20px markdown toolbar + 2px gap
				const controlsHeight = 48; // Height of control boxes
				const totalPadding = hasControls ? (basePadding + controlsHeight) : basePadding;

				// Update padding for text areas
				box.style.paddingTop = `${totalPadding}px`;
				highlightDiv.style.paddingTop = `${totalPadding}px`;
				markdownDiv.style.paddingTop = `${totalPadding}px`;
				markdownDiv.style.height = `calc(100% - ${totalPadding}px)`;

				// Position controls below markdown toolbar
				highlightControls.style.top = `${basePadding}px`;
				filterControls.style.top = `${basePadding}px`;
				textSizeControls.style.top = `${basePadding}px`;
				deleteConfirmControls.style.top = `${basePadding}px`;
			};

			// Navigation for textarea mode
			const navigateToMatch = (index) => {
				if (this._tv_match_positions.length === 0) return;

				this._tv_current_match_index = index;
				const pos = this._tv_match_positions[index];

				const textBeforeMatch = box.value.substring(0, pos);
				const lineNumber = textBeforeMatch.split('\n').length - 1;
				const lineHeight = parseFloat(getComputedStyle(box).lineHeight);
				const scrollPosition = lineNumber * lineHeight;

				box.scrollTop = scrollPosition - (box.clientHeight / 2);
				highlightDiv.scrollTop = box.scrollTop;

				matchCounter.textContent = `${index + 1} / ${this._tv_match_positions.length}`;
				this._applyFilter(index);
			};

			// Navigation for markdown mode
			this._navigateToMarkdownMatch = (index) => {
				if (!this._tv_match_positions || this._tv_match_positions.length === 0) return;

				this._tv_current_match_index = index;

				// Remove previous current highlight
				this._tv_match_positions.forEach(mark => {
					mark.style.backgroundColor = '#ffeb3b';
				});

				// Highlight current match
				const currentMark = this._tv_match_positions[index];
				currentMark.style.backgroundColor = '#ff6b6b';

				// Scroll to current match
				currentMark.scrollIntoView({ behavior: 'smooth', block: 'center' });

				// Update counter
				matchCounter.textContent = `${index + 1} / ${this._tv_match_positions.length}`;
			};

			prevBtn.onclick = () => {
				if (this._tv_match_positions.length === 0) return;
				const newIndex = (this._tv_current_match_index - 1 + this._tv_match_positions.length) % this._tv_match_positions.length;
				
				if (this.properties.markdown_mode) {
					this._navigateToMarkdownMatch(newIndex);
				} else {
					navigateToMatch(newIndex);
				}
			};

			nextBtn.onclick = () => {
				if (this._tv_match_positions.length === 0) return;
				const newIndex = (this._tv_current_match_index + 1) % this._tv_match_positions.length;
				
				if (this.properties.markdown_mode) {
					this._navigateToMarkdownMatch(newIndex);
				} else {
					navigateToMatch(newIndex);
				}
			};

			filterInput.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					if (e.shiftKey) {
						prevBtn.click();
					} else {
						nextBtn.click();
					}
				}
			});

			this._tv_navigate_to_match = navigateToMatch;

			// Highlight button handler
			highlightBtn.onclick = () => {
				this.properties.text_filter = !this.properties.text_filter;
				highlightBtn.style.opacity = this.properties.text_filter ? "1" : "0.5";
				highlightControls.style.display = this.properties.text_filter ? "flex" : "none";
				
				if (!this.properties.markdown_mode) {
					highlightDiv.style.display = this.properties.text_filter ? "block" : "none";
				}

				this.updateTextPadding();

				if (!this.properties.text_filter) {
					filterInput.value = "";
					if (this.properties.markdown_mode) {
						this._renderMarkdownWithHighlight();
					} else {
						this._applyFilter();
					}
				} else {
					this._tv_original_text = box.value;
					setTimeout(() => filterInput.focus(), 100);
				}
			};
			

			// Filter button handler
			filterBtn.onclick = () => {
				this.properties.line_filter = !this.properties.line_filter;
				filterBtn.style.opacity = this.properties.line_filter ? "1" : "0.5";
				filterControls.style.display = this.properties.line_filter ? "flex" : "none";

				this.updateTextPadding();

				if (!this.properties.line_filter) {
					lineFilterInput.value = "";
					if (this.properties.markdown_mode) {
						this._renderMarkdownWithHighlight();
					} else {
						this._applyLineFilter();
					}
				} else {
					setTimeout(() => lineFilterInput.focus(), 100);
				}
			};
			

			// Filter input handlers
			filterInput.oninput = () => {
				this._tv_current_match_index = -1;
				
				if (this.properties.markdown_mode) {
					this._renderMarkdownWithHighlight();
				} else {
					this._applyFilter();
					if (this._tv_match_positions.length > 0) {
						this._tv_navigate_to_match(0);
					}
				}
			};

			lineFilterInput.oninput = () => {
				if (this.properties.markdown_mode) {
					this._renderMarkdownWithHighlight();
				} else {
					this._applyLineFilter();
				}
			};

			// Set text helper
			this._tv_set = (v) => {
				const text = typeof v === "string" ? v : (Array.isArray(v) ? v.join("\n") : "");
				this._tv_original_text = text;
				box.value = text;
			this._tv_original_text = text;
			this._tv_pretty_json_text = "";

				if (this.properties.markdown_mode) {
					this._renderMarkdownWithHighlight();
				} else {
					this._applyFilter();
					this._applyLineFilter();
				}

				this._updateCounter();

				const textWidget = this.widgets?.find(w => w.name === "text");
				if (textWidget) {
					textWidget.value = text;
				}
			};

			// Highlight text in rendered markdown HTML
			this._highlightMarkdownText = (searchText) => {
				if (!searchText || !this._tv_markdown_div) return;

				try {
					const regex = new RegExp(searchText, 'gi');

					// Get all text nodes in the markdown div
					const walker = document.createTreeWalker(
						this._tv_markdown_div,
						NodeFilter.SHOW_TEXT,
						null,
						false
					);

					const textNodes = [];
					let node;
					while (node = walker.nextNode()) {
						textNodes.push(node);
					}

					// Store match positions for navigation
					this._tv_match_positions = [];
					let globalIndex = 0;

					// Process each text node
					textNodes.forEach(textNode => {
						const text = textNode.textContent;
						const matches = [];
						let match;

						// Find all matches in this text node
						while ((match = regex.exec(text)) !== null) {
							matches.push({
								start: match.index,
								end: match.index + match[0].length,
								text: match[0],
								globalIndex: globalIndex++
							});
						}

						if (matches.length === 0) return;

						// Create a document fragment to hold the highlighted content
						const fragment = document.createDocumentFragment();
						let lastIndex = 0;

						matches.forEach((match, idx) => {
							// Add text before the match
							if (match.start > lastIndex) {
								fragment.appendChild(
									document.createTextNode(text.substring(lastIndex, match.start))
								);
							}

							// Add highlighted match
							const mark = document.createElement('mark');
							mark.textContent = match.text;
							mark.style.backgroundColor = '#ffeb3b';
							mark.style.color = '#000';
							mark.dataset.matchIndex = match.globalIndex;
							fragment.appendChild(mark);
							this._tv_match_positions.push(mark);

							lastIndex = match.end;
						});

						// Add remaining text
						if (lastIndex < text.length) {
							fragment.appendChild(
								document.createTextNode(text.substring(lastIndex))
							);
						}

						// Replace the text node with the fragment
						textNode.parentNode.replaceChild(fragment, textNode);
					});

					// Update match counter
					matchCounter.textContent = `0 / ${this._tv_match_positions.length}`;

					// Navigate to first match if available
					if (this._tv_match_positions.length > 0) {
						this._navigateToMarkdownMatch(0);
					}

				} catch (e) {
					console.warn("Invalid regex pattern for text highlighting");
					this._tv_match_positions = [];
					matchCounter.textContent = "0 / 0";
				}
			};

			// Render markdown with highlighting and line filtering
			this._renderMarkdownWithHighlight = () => {
				if (!this._md || !this._tv_markdown_div) return;

				const filterValue = this._tv_filter_input.value;
				const lineFilterValue = this._tv_line_filter_input.value;
				let textToRender = box.value;

				// Apply line filter first if active
				if (lineFilterValue && this.properties.line_filter) {
					try {
						const regex = new RegExp(lineFilterValue, 'i');
						const lines = textToRender.split('\n');
						const matchedLines = lines.filter(line => regex.test(line));
						textToRender = matchedLines.join('\n');

						// Update line counter
						this._tv_line_match_counter.textContent = `${matchedLines.length} lines`;
					} catch (e) {
						console.warn("Invalid regex pattern for line filter");
					}
				}

				try {
					const html = this._md.render(textToRender);
					this._tv_markdown_div.innerHTML = html;

					// Apply text highlighting if active
					if (filterValue && this.properties.text_filter) {
						this._highlightMarkdownText(filterValue);
					} else {
						this._tv_match_positions = [];
						matchCounter.textContent = "0 / 0";
					}

				} catch (e) {
					console.error("Markdown render error:", e);
					this._tv_markdown_div.innerHTML = "Error rendering markdown";
				}
			};

			// Render markdown (entry point)
			this._renderMarkdown = () => {
				this._renderMarkdownWithHighlight();
			};

			// Apply theme
			this._applyTheme = (theme) => {
				const themes = {
					"Dark": {
						bg: "#1e1e1e",
						color: "#d4d4d4",
						border: "#3e3e3e",
						mdBg: "#2d2d2d",
						mdColor: "#e0e0e0",
						tableBorder: "#555",
						tableHeaderBg: "rgba(100, 100, 100, 0.3)",
						tableRowEven: "rgba(50, 50, 50, 0.2)"
					},
					"Light": {
						bg: "#ffffff",
						color: "#000000",
						border: "#cccccc",
						mdBg: "#f9f9f9",
						mdColor: "#333333",
						tableBorder: "#ddd",
						tableHeaderBg: "#f0f0f0",
						tableRowEven: "#f8f8f8"
					},
				};

				const t = themes[theme] || themes["Dark"];

				box.style.backgroundColor = t.bg;
				box.style.color = t.color;
				box.style.border = `1px solid ${t.border}`;

				filterInput.style.backgroundColor = t.bg;
				filterInput.style.color = t.color;

				lineFilterInput.style.backgroundColor = t.bg;
				lineFilterInput.style.color = t.color;

				markdownDiv.style.backgroundColor = t.mdBg;
				markdownDiv.style.color = t.mdColor;

				// Update table styling dynamically
				const existingStyle = document.getElementById('md-table-theme-style');
				if (existingStyle) existingStyle.remove();

				const themeStyle = document.createElement('style');
				themeStyle.id = 'md-table-theme-style';
				themeStyle.textContent = `
					.markdown-preview table,
					.markdown-preview th,
					.markdown-preview td {
						border-color: ${t.tableBorder} !important;
					}
					.markdown-preview th {
						background-color: ${t.tableHeaderBg} !important;
					}
					.markdown-preview tr:nth-child(even) {
						background-color: ${t.tableRowEven} !important;
					}
				`;
				document.head.appendChild(themeStyle);
			};

			// Update counter
			this._updateCounter = () => {
				const text = box.value;
				const chars = text.length;
				const words = text.trim() ? text.trim().split(/\s+/).length : 0;
				const lines = text ? text.split('\n').length : 0;
				counter.textContent = `${chars} chars | ${words} words | ${lines} lines`;
			};

			// Apply filter
			this._applyFilter = (currentMatchIndex = -1) => {
				const filterValue = filterInput.value;

				if (!this.properties.line_filter) {
					box.value = this._tv_original_text;
				}

				this._updateCounter();

				if (!filterValue || !this.properties.text_filter) {
					highlightDiv.innerHTML = '';
					this._tv_match_positions = [];
					matchCounter.textContent = "0 / 0";
					return;
				}

				try {
					const regex = new RegExp(filterValue, 'gi');
					const text = box.value;

					this._tv_match_positions = [];
					let match;
					while ((match = regex.exec(text)) !== null) {
						this._tv_match_positions.push(match.index);
					}

					if (currentMatchIndex === -1) {
						matchCounter.textContent = `0 / ${this._tv_match_positions.length}`;
					}

					let matchIndex = 0;
					const highlightedText = text.replace(new RegExp(filterValue, 'gi'), (match) => {
						const isCurrentMatch = matchIndex === currentMatchIndex;
						matchIndex++;

						if (isCurrentMatch) {
							return `<mark style="background-color: #ff6b6b; color: #000;">${match}</mark>`;
						} else {
							return `<mark style="background-color: #ffeb3b; color: #000;">${match}</mark>`;
						}
					});

					highlightDiv.innerHTML = highlightedText;
					highlightDiv.style.fontSize = box.style.fontSize;
					highlightDiv.scrollTop = box.scrollTop;

				} catch (e) {
					console.warn("Invalid regex");
					this._tv_match_positions = [];
					matchCounter.textContent = "0 / 0";
				}
			};

			// Apply line filter
			this._applyLineFilter = () => {
				const filterValue = this._tv_line_filter_input.value;

				if (!filterValue || !this.properties.line_filter) {
					box.value = this._tv_original_text;
					this._tv_line_match_counter.textContent = "0 lines";
					this._updateCounter();
					return;
				}

				try {
					const regex = new RegExp(filterValue, 'i');
					
			const sourceText = this.properties.pretty_json_mode ? this._tv_pretty_json_text : this._tv_original_text;
			const lines = sourceText.splitsplit('\n');
					const matchedLines = lines.filter(line => regex.test(line));

					box.value = matchedLines.join('\n');
					this._tv_line_match_counter.textContent = `${matchedLines.length} lines`;
					this._updateCounter();

					if (this.properties.text_filter) {
						this._applyFilter();
					}

				} catch (e) {
					console.warn("Invalid regex");
				}
			};

			// Sync on input
				box.addEventListener("input", () => {
					saveToHistory();
					this._tv_original_text = box.value;
					const textWidget = this.widgets?.find(w => w.name === "text");
					if (textWidget) textWidget.value = box.value;
					this.updateCounter();

					saveToHistory(false);

				if (this.properties.markdown_mode && this._md) {
					this._renderMarkdownWithHighlight();
				}
			});

			// Add DOM widget
			this.addDOMWidget("textDisplay", "customtext", textareaWrapper, {
				getValue: () => box.value,
				setValue: (v) => {
					box.value = v;
					this._tv_set(v);
				}
			});

			// Initial setup
			this._tv_set(this.properties?.text ?? "");
			this._applyTheme(this.properties.theme);

			// Apply initial font size
			if (this.properties.font_size) {
				box.style.fontSize = `${this.properties.font_size}px`;
				highlightDiv.style.fontSize = `${this.properties.font_size}px`;
				markdownDiv.style.fontSize = `${this.properties.font_size}px`;
			}

			this.size = [740,200];
			this.serialize_widgets = true;
		};

		// Handle incoming text_input connections
		const onExecuted = nodeType.prototype.onExecuted;
		nodeType.prototype.onExecuted = function(message) {
			onExecuted?.apply(this, arguments);
			
			if (message?.text && Array.isArray(message.text) && this._tv_set) {
				const incomingText = message.text[0];
				
				// Check if text_input is connected
				const textInputWidget = this.widgets?.find(w => w.name === "text_input");
				const isInputConnected = this.inputs?.some(input => input.link != null && input.name === "text_input");
				
				// Only update if input is connected
				if (isInputConnected) {
					this._tv_set(incomingText);
				}
			}
		};

		// Override onConfigure
		const origOnConfigure = nodeType.prototype.onConfigure;
		nodeType.prototype.onConfigure = function(info) {
			origOnConfigure?.call(this, info);

			const textWidget = this.widgets?.find(w => w.name === "text");
			if (textWidget && this._tv_box) {
				this._tv_box.value = textWidget.value || "";
				this._updateCounter?.();
			}

			// Restore font size from saved properties
			if (this.properties.font_size && this._tv_box) {
				this._tv_box.style.fontSize = `${this.properties.font_size}px`;
				if (this._tv_highlight_div) {
					this._tv_highlight_div.style.fontSize = `${this.properties.font_size}px`;
				}
				if (this._tv_markdown_div) {
					this._tv_markdown_div.style.fontSize = `${this.properties.font_size}px`;
				}
			}

			// Restore markdown mode state
			if (this.properties.markdown_mode && this._tv_box && this._tv_markdown_div) {
				const markdownBtn = document.querySelector('button[title="Toggle Markdown Preview Only"]');
				if (markdownBtn) {
					markdownBtn.style.opacity = "1";
				}
				this._tv_box.style.display = "none";
				if (this._tv_highlight_div) {
					this._tv_highlight_div.style.display = "none";
				}
				this._tv_markdown_div.style.display = "block";
				if (this._md) {
					this._renderMarkdownWithHighlight();
				}
			}
		};

			// Override serialize to ensure properties are saved
			const origSerialize = nodeType.prototype.serialize;
			nodeType.prototype.serialize = function() {
				const data = origSerialize ? origSerialize.apply(this, arguments) : {};
				
				// Ensure properties are saved
				if (this.properties) {
					data.properties = data.properties || {};
					data.properties.font_size = this.properties.font_size;
					data.properties.markdown_mode = this.properties.markdown_mode;
					data.properties.theme = this.properties.theme;
					data.properties.word_wrap = this.properties.word_wrap;
					data.properties.editable = this.properties.editable;
					data.properties.text_filter = this.properties.text_filter;
					data.properties.line_filter = this.properties.line_filter;
					data.properties.pretty_json_mode = this.properties.pretty_json_mode;
				}
				
				return data;
			};
	},
});
