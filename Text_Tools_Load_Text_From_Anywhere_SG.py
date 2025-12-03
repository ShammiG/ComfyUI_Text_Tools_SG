import os
import json

class TextToolsLoadTextFromAnywhereSG:
    """
    A ComfyUI node for loading text, JSON, and Markdown files using direct file path input
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "file_path": ("STRING", {
                    "default": "", 
                    "multiline": False, 
                    "placeholder": "Enter full file path (e.g., C:/folder/file.txt)"
                }),
                "info_text": ("STRING", {
                    "default": "Load text, Json, markdown file from anywhere. \nRight-click the file in File Explorer and select 'Copy as path' and paste in the box above. ",
                    "multiline": True,
                }),
            },
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text_content",)
    FUNCTION = "load_file"
    CATEGORY = "utils"
    OUTPUT_NODE = True
    
    @classmethod
    def VALIDATE_INPUTS(cls, file_path, info_text=""):
        """
        Validate the file path input
        """
        if not file_path or file_path.strip() == "":
            return "No file path specified"
        
        # Remove quotes and strip whitespace
        file_path = file_path.strip().strip('"').strip("'")
        
        if not os.path.exists(file_path):
            return f"File not found: {file_path}"
        
        if not os.path.isfile(file_path):
            return f"Path is not a file: {file_path}"
        
        if not file_path.endswith(('.txt', '.json', '.md')):
            return f"Invalid file type. Only .txt, .json, and .md files are supported"
        
        return True
    
    def load_file(self, file_path, info_text=""):
        """
        Load and return the content of the specified text, JSON, or Markdown file
        """
        if not file_path or file_path.strip() == "":
            return ("No file path specified",)
        
        # Remove quotes and strip whitespace
        file_path = file_path.strip().strip('"').strip("'")
        
        # Check if file exists
        if not os.path.exists(file_path):
            error_msg = f"File not found: {file_path}"
            return (error_msg,)
        
        # Check if it's a file
        if not os.path.isfile(file_path):
            error_msg = f"Path is not a file: {file_path}"
            return (error_msg,)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # If it's a JSON file, pretty-format it
            if file_path.endswith('.json'):
                try:
                    json_data = json.loads(content)
                    content = json.dumps(json_data, indent=2, ensure_ascii=False)
                except json.JSONDecodeError:
                    pass
            
            return (content,)
        
        except Exception as e:
            error_msg = f"Error loading file: {str(e)}"
            return (error_msg,)
    
    @classmethod
    def IS_CHANGED(cls, file_path, info_text=""):
        if not file_path or file_path.strip() == "":
            return float("NaN")
        
        # Remove quotes and strip whitespace
        file_path = file_path.strip().strip('"').strip("'")
        
        if os.path.exists(file_path):
            return os.path.getmtime(file_path)
        
        return float("NaN")

# Node registration
NODE_CLASS_MAPPINGS = {
    "Text Tools Load Text FilePath-SG": TextToolsLoadTextFromAnywhereSG,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "Text Tools Load Text FilePath-SG": "Text Tools Load Text json md From Anywhere (FilePath)-SG",
}
