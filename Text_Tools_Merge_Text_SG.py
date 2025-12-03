import os

class TextToolsMergeTextSG:
    """
    A ComfyUI node that merges two text inputs with configurable order and custom separator placement.
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "optional": {
                "text1": ("STRING", {"multiline": True, "default": ""}),
                "text2": ("STRING", {"multiline": True, "default": ""}),
            },
            "required": {
                "order": (["Text1 + Text2", "Text2 + Text1"],),
                "separator": ("STRING", {"default": ", ", "multiline": False}),
                "insert_separator": (["None", "Before", "After", "Between",
                                      "Before and After", "Before and Between",
                                      "After and Between", "Before, Between, After"],),
            },
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("merged_text",)
    FUNCTION = "merge_texts"
    CATEGORY = "text"
    
    def merge_texts(self, order, separator, insert_separator, text1=None, text2=None):
        """
        Merges two texts based on order and custom separator position preferences.
        
        Args:
            text1: First text input (optional)
            text2: Second text input (optional)
            order: Order of merging ("Text1 + Text2" or "Text2 + Text1")
            separator: Custom text to use as separator (can be comma, space, dot, etc.)
            insert_separator: Where to place the separator
        
        Returns:
            Merged text string
        """
        # Handle None values (from disabled nodes)
        text1 = text1 if text1 is not None else ""
        text2 = text2 if text2 is not None else ""
        
        # Determine the order
        if order == "Text1 + Text2":
            first_text = text1
            second_text = text2
        else:  # "Text2 + Text1"
            first_text = text2
            second_text = text1
        
        # Apply separator positioning
        if insert_separator == "None":
            merged = first_text + second_text
        elif insert_separator == "Before":
            merged = separator + first_text + second_text
        elif insert_separator == "After":
            merged = first_text + second_text + separator
        elif insert_separator == "Between":
            merged = first_text + separator + second_text
        elif insert_separator == "Before and After":
            merged = separator + first_text + second_text + separator
        elif insert_separator == "Before and Between":
            merged = separator + first_text + separator + second_text
        elif insert_separator == "After and Between":
            merged = first_text + separator + second_text + separator
        elif insert_separator == "Before, Between, After":
            merged = separator + first_text + separator + second_text + separator
        else:
            merged = first_text + second_text
        
        return (merged,)

# Node registration
NODE_CLASS_MAPPINGS = {
    "Text Tools Merge Text-SG": TextToolsMergeTextSG,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "Text Tools Merge Text-SG": "Text Tools Merge Text-SG"
}
