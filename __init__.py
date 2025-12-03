import os

from .Text_Tools_Viewer_SG import TextToolsViewerSG
from .Text_Tools_Editor_SG import TextToolsEditorSG
from .Text_Tools_Load_Text_SG import TextToolsLoadTextSG
from .Text_Tools_Load_Text_From_Anywhere_SG import TextToolsLoadTextFromAnywhereSG
from .Text_Tools_Save_Text_File_SG import TextToolsSaveTextFileSG
from .Text_Tools_Merge_Text_SG import TextToolsMergeTextSG
from .Text_Tools_Merge_Text_Multi_SG import TextToolsMergeTextMultiSG

NODE_CLASS_MAPPINGS = {
    "Text Tools Viewer-SG": TextToolsViewerSG,
    "Text Tools Editor-SG": TextToolsEditorSG,
    "Text Tools Load Text-SG": TextToolsLoadTextSG,
    "Text Tools Load Text FilePath-SG": TextToolsLoadTextFromAnywhereSG,
    "Text Tools Save Text File-SG": TextToolsSaveTextFileSG,
    "Text Tools Merge Text-SG": TextToolsMergeTextSG,
    "Text Tools Merge Text Multi-SG": TextToolsMergeTextMultiSG
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "Text Tools Viewer-SG": "Text Tools 🧾 Viewer-SG",
    "Text Tools Editor-SG": "Text Tools 🪶 Editor-SG",
    "Text Tools Load Text-SG": "Text Tools Load Text Json md-SG",
    "Text Tools Load Text FilePath-SG": "Text Tools Load Text json md From Anywhere (FilePath)-SG",
    "Text Tools Save Text File-SG": "Text Tools Save Text json md File-SG",
    "Text Tools Merge Text-SG": "Text Tools Merge Text-SG",
    "Text Tools Merge Text Multi-SG": "Text Tools Merge Text Multi-SG"
}

WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
