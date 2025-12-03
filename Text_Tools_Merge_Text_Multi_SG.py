class TextToolsMergeTextMultiSG:
    """
    A ComfyUI node with dynamic text inputs controlled by enable toggles.
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text_order": (["Sequential", "Custom"],),
                "custom_order": ("STRING", {"default": "1,2,3", "multiline": False}),
                "separator": ("STRING", {"default": ", ", "multiline": False}),
                "insert_separator": (["None", "Before", "After", "Between", "Before and After", "Before and Between", "After and Between", "Before, Between, After"], {"default": "Before, Between, After"}),
                "text_1": ("STRING", {"multiline": True, "default": ""}),
                "⬆️_enable_1": ("BOOLEAN", {"default": True}),
                "text_2": ("STRING", {"multiline": True, "default": ""}),
                "⬆️_enable_2": ("BOOLEAN", {"default": True}),
            },
            "optional": {
                "text_3": ("STRING", {"multiline": True, "default": ""}),
                "⬆️_enable_3": ("BOOLEAN", {"default": True}),
                "text_4": ("STRING", {"multiline": True, "default": ""}),
                "⬆️_enable_4": ("BOOLEAN", {"default": True}),
                "text_5": ("STRING", {"multiline": True, "default": ""}),
                "⬆️_enable_5": ("BOOLEAN", {"default": True}),
            },
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("merged_text",)
    FUNCTION = "merge_texts"
    CATEGORY = "text"
    
    def merge_texts(self, text_order, separator, insert_separator, text_1="", text_2="", text_3="", text_4="", text_5="",
                    **kwargs):
        """
        Merges multiple text inputs based on order and custom separator position.
        """
        # Extract enable values from kwargs
        enable_1 = kwargs.get("⬆️_enable_1", True)
        enable_2 = kwargs.get("⬆️_enable_2", True)
        enable_3 = kwargs.get("⬆️_enable_3", True)
        enable_4 = kwargs.get("⬆️_enable_4", True)
        enable_5 = kwargs.get("⬆️_enable_5", True)
        
        custom_order = kwargs.get("custom_order", "1,2,3")
        
        # Collect all texts and their enable states
        all_texts = [text_1, text_2, text_3, text_4, text_5]
        all_enables = [enable_1, enable_2, enable_3, enable_4, enable_5]
        
        # Get only active texts based on enable state
        texts = []
        for i in range(10):
            if all_enables[i] and all_texts[i]:
                texts.append((i, all_texts[i]))
        
        # Determine the order
        if text_order == "Sequential":
            ordered_texts = [text for idx, text in texts]
        else:  # Custom order
            try:
                order_indices = [int(x.strip()) - 1 for x in custom_order.split(",")]
                ordered_texts = []
                for idx in order_indices:
                    for text_idx, text in texts:
                        if text_idx == idx:
                            ordered_texts.append(text)
                            break
            except:
                ordered_texts = [text for idx, text in texts]
        
        # Apply separator positioning
        if not ordered_texts:
            merged = ""
        elif insert_separator == "None":
            merged = "".join(ordered_texts)
        elif insert_separator == "Before":
            merged = separator + "".join(ordered_texts)
        elif insert_separator == "After":
            merged = "".join(ordered_texts) + separator
        elif insert_separator == "Between":
            merged = separator.join(ordered_texts)
        elif insert_separator == "Before and After":
            merged = separator + "".join(ordered_texts) + separator
        elif insert_separator == "Before and Between":
            merged = separator + separator.join(ordered_texts)
        elif insert_separator == "After and Between":
            merged = separator.join(ordered_texts) + separator
        elif insert_separator == "Before, Between, After":
            merged = separator + separator.join(ordered_texts) + separator
        else:
            merged = "".join(ordered_texts)
        
        return (merged,)

# Node registration
NODE_CLASS_MAPPINGS = {
    "Text Tools Merge Text Multi-SG": TextToolsMergeTextMultiSG
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "Text Tools Merge Text Multi-SG": "Text Tools Merge Text Multi-SG"
}
