class TextToolsViewerSG:
    CATEGORY = "text/utils"
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text": ("STRING", {"default": "", "forceInput": True})
            }
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "texteditor"
    OUTPUT_NODE = True
    
    def texteditor(self, text: str, **kwargs):
        return {
            "ui": {
                "text": [text]
            },
            "result": (text,)
        }

NODE_CLASS_MAPPINGS = {
    "Text Tools Viewer-SG": TextToolsViewerSG
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "Text Tools Viewer-SG": "Text Tools 🧾 Viewer-SG"
}
