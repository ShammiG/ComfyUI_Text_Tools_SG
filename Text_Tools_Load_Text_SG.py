import os
import json
import folder_paths
from server import PromptServer
from aiohttp import web

class TextToolsLoadTextSG:
    """
    A ComfyUI node for loading text, JSON, and Markdown files with folder and file selection capability
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        # Get initial file list for default folder
        initial_files = cls.get_files_for_folder("input")
        return {
            "required": {
                "folder": (["comfyui_root", "input", "output", "output_text", "temp"], {"default": "input"}),
                "file": (initial_files if initial_files else [""], {}),
                "info_text": ("STRING", {
                    "default": "Supports .txt, .json, and .md files. \ncomfyui_root is where you run comfy from.\noutput_text is a folder named text if present in ouput folder.",
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
    def VALIDATE_INPUTS(cls, folder, file, info_text=""):
        """
        Validate folder and file inputs
        """
        if not file or file == "":
            return "No file specified"
        
        base_path = cls.get_folder_path(folder)
        full_path = os.path.join(base_path, file)
        
        if not os.path.exists(full_path):
            return f"File not found: {file} in {folder} folder"
        
        if not file.endswith(('.txt', '.json', '.md')):
            return f"Invalid file type. Only .txt, .json, and .md files are supported"
        
        return True
    
    @classmethod
    def get_folder_path(cls, folder):
        """
        Get the full path for the selected folder option
        """
        if folder == "comfyui_root":
            path = os.path.dirname(os.path.dirname(folder_paths.__file__))
        elif folder == "input":
            path = folder_paths.get_input_directory()
        elif folder == "output":
            path = folder_paths.get_output_directory()
        elif folder == "output_text":
            # Add path to text subfolder inside output
            path = os.path.join(folder_paths.get_output_directory(), "text")
        elif folder == "temp":
            path = folder_paths.get_temp_directory()
        else:
            path = folder_paths.get_input_directory()
        
        return path
    
    @classmethod
    def get_files_for_folder(cls, folder):
        """
        Get list of text/json/md files for the selected folder
        """
        base_path = cls.get_folder_path(folder)
        try:
            if not os.path.exists(base_path):
                return []
            
            all_files = os.listdir(base_path)
            files = []
            for f in all_files:
                full_path = os.path.join(base_path, f)
                if os.path.isfile(full_path) and f.endswith(('.txt', '.json', '.md')):
                    files.append(f)
            
            return sorted(files)
        except Exception as e:
            import traceback
            return []
    
    def load_file(self, folder, file, info_text=""):
        """
        Load and return the content of the selected text, JSON, or Markdown file
        """
        if not file or file == "":
            return ("No file specified",)
        
        base_path = self.get_folder_path(folder)
        target_path = os.path.join(base_path, file)
        
        # Check if file exists
        if not os.path.exists(target_path):
            error_msg = f"File not found: {target_path}"
            return (error_msg,)
        
        try:
            with open(target_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # If it's a JSON file, pretty-format it
            if target_path.endswith('.json'):
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
    def IS_CHANGED(cls, folder, file, info_text=""):
        if not file:
            return float("NaN")
        
        base_path = cls.get_folder_path(folder)
        target_path = os.path.join(base_path, file)
        
        if os.path.exists(target_path):
            return os.path.getmtime(target_path)
        
        return float("NaN")

# API Route
@PromptServer.instance.routes.post("/text_file_loader/files")
async def get_files_for_folder_api(request):
    """
    API endpoint to get files for a selected folder
    """
    try:
        data = await request.json()
        folder = data.get("folder", "input")
        files = TextToolsLoadTextSG.get_files_for_folder(folder)
        return web.json_response({"files": files, "success": True})
    except Exception as e:
        import traceback
        return web.json_response({"error": str(e), "files": [], "success": False}, status=500)

# Node registration
NODE_CLASS_MAPPINGS = {
    "Text Tools Load Text-SG": TextToolsLoadTextSG,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "Text Tools Load Text-SG": "Text Tools Load Text Json md-SG",
}
