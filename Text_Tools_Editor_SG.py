class TextToolsEditorSG:
    CATEGORY = "text/utils"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "optional": {
                "text_input": ("STRING", {
                    "forceInput": True,
                    "default": "",
                    "tooltip": "Text will be overwritten if this is connected"
                }),
                "text": ("STRING", {
                    "default": "",
                    "multiline": True,
                    "dynamicPrompts": False
                })
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
                "extra_pnginfo": "EXTRA_PNGINFO"
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "execute"
    OUTPUT_NODE = True

    def execute(self, text="", text_input=None, **kwargs):
        # If text_input is connected (not None),  overwrite the editor text
        if text_input is not None:
            display_text = text_input
        else:
            # Otherwise, keep showing the text from the editor
            display_text = text

        # Return both tuple for output AND dict for UI message
        return {
            "ui": {
                "text": [display_text]
            },
            "result": (display_text,)
        }

NODE_CLASS_MAPPINGS = {
    "Text Tools Editor-SG": TextToolsEditorSG,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "Text Tools Editor-SG": "Text Tools 🪶 Editor-SG",
}
