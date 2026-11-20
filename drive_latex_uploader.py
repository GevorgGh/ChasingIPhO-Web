import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass
from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload
import io
from deep_translator import GoogleTranslator

# Load environment
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(PROJECT_DIR, ".env"))

ROOT_FOLDER_ID = os.getenv("ROOT_FOLDER_ID", "1-7YBELZjfBHPU93miQMs9-XulnKTJdUK")
SERVICE_ACCOUNT_FILE = os.path.join(PROJECT_DIR, "service_account.json")
FONT_FILE = os.path.join(PROJECT_DIR, "Sylfaen.ttf")

TOPICS_FILE = os.path.join(PROJECT_DIR, "topics.json")

DEFAULT_TOPICS = {
    "kinematics": {"en": "Kinematics", "hy": "Կինեմատիկա", "ru": "Кинематика"},
    "dynamics": {"en": "Dynamics", "hy": "Դինամիկա", "ru": "Динамика"},
    "statics": {"en": "Statics", "hy": "Ստատիկա", "ru": "Статика"},
    "hydrostatics": {"en": "Hydrostatics", "hy": "Հիդրոստատիկա", "ru": "Гидростатика"},
    "pressure and hydrostatics": {"en": "Pressure and Hydrostatics", "hy": "Ճնշում և հիդրոստատիկա", "ru": "Давление и гидростатика"},
    "thermodynamics": {"en": "Thermodynamics", "hy": "Թերմոդինամիկա", "ru": "Термодинамика"},
    "electricity and magnetism": {"en": "Electricity and Magnetism", "hy": "Էլեկտրականություն և մագնիսականություն", "ru": "Электричество и магнетизм"},
    "electrodynamics": {"en": "Electrodynamics", "hy": "Էլեկտրամագնիսականություն", "ru": "Электродинамика"},
    "optics": {"en": "Optics", "hy": "Օպտիկա", "ru": "Оптика"},
    "circuits": {"en": "Electric Circuits", "hy": "Էլեկտրական շղթաներ", "ru": "Электрические цепи"},
    "waves": {"en": "Waves and Oscillations", "hy": "Ալիքներ և տատանումներ", "ru": "Волны и колебания"},
    "oscillations": {"en": "Oscillations", "hy": "Տատանումներ", "ru": "Колебания"},
    "quantum": {"en": "Quantum Physics", "hy": "Քվանտային ֆիզիկա", "ru": "Квантовая физика"},
    "gravity": {"en": "Gravity", "hy": "Ձգողականություն", "ru": "Гравитация"},
    "general": {"en": "General", "hy": "Ընդհանուր", "ru": "Общая физика"},
}

def load_topics() -> dict:
    """Loads all topics from topics.json, falling back to DEFAULT_TOPICS."""
    topics = dict(DEFAULT_TOPICS)
    if os.path.exists(TOPICS_FILE):
        try:
            with open(TOPICS_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                if isinstance(saved, dict):
                    topics.update(saved)
        except Exception as e:
            print(f"⚠️ Error loading {TOPICS_FILE}: {e}")
    else:
        try:
            with open(TOPICS_FILE, "w", encoding="utf-8") as f:
                json.dump(topics, f, ensure_ascii=False, indent=2)
        except Exception:
            pass
    return topics

def save_topics(topics_dict: dict):
    """Saves topics dictionary to topics.json."""
    try:
        with open(TOPICS_FILE, "w", encoding="utf-8") as f:
            json.dump(topics_dict, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ Error saving {TOPICS_FILE}: {e}")

def get_topic_choices() -> list[tuple[str, str]]:
    """Returns sorted list of (code, English Name) tuples for UI buttons."""
    topics = load_topics()
    choices = []
    for code, data in topics.items():
        if isinstance(data, dict):
            en_name = data.get("en", code.title())
        elif isinstance(data, str):
            en_name = data
        else:
            en_name = code.title()
        choices.append((code, en_name))
    choices.sort(key=lambda x: x[1].lower())
    return choices

TOPIC_CHOICES = get_topic_choices()

def add_topic(en_name: str, hy_name: str = None, ru_name: str = None) -> tuple[str, dict]:
    """Adds a new topic in English, auto-translates to Armenian and Russian if not provided, and persists to topics.json."""
    en_clean = en_name.strip()
    code = en_clean.lower()
    
    if not hy_name or not ru_name:
        auto_hy, auto_ru = auto_translate_title(en_clean)
        if not hy_name:
            hy_name = auto_hy or en_clean
        if not ru_name:
            ru_name = auto_ru or en_clean
            
    topics = load_topics()
    topics[code] = {
        "en": en_clean,
        "hy": hy_name.strip(),
        "ru": ru_name.strip()
    }
    save_topics(topics)
    
    # Refresh in-place TOPIC_CHOICES
    new_choices = get_topic_choices()
    TOPIC_CHOICES.clear()
    TOPIC_CHOICES.extend(new_choices)
    
    return code, topics[code]

def delete_topic(topic_code: str) -> bool:
    """Deletes a topic from topics.json and refreshes TOPIC_CHOICES."""
    code = topic_code.strip().lower()
    topics = load_topics()
    if code in topics:
        del topics[code]
        save_topics(topics)
        new_choices = get_topic_choices()
        TOPIC_CHOICES.clear()
        TOPIC_CHOICES.extend(new_choices)
        return True
    return False

def _translate_single_text(text: str, target_lang: str) -> str:
    """Helper to translate a string using deep_translator with gtx fallback."""
    if not text:
        return ""
    try:
        translated = GoogleTranslator(source='auto', target=target_lang).translate(text)
        if translated:
            return translated
    except Exception:
        pass
    try:
        import urllib.request
        import urllib.parse
        q = urllib.parse.quote(text)
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={target_lang}&dt=t&q={q}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode('utf-8'))
            if data and data[0] and data[0][0] and data[0][0][0]:
                return data[0][0][0]
    except Exception:
        pass
    return text

def auto_translate_title(title_text: str) -> tuple[str, str]:
    """Auto translates title text to Armenian and Russian with fallback support."""
    if not title_text:
        return "", ""
    title_hy = _translate_single_text(title_text, "hy")
    title_ru = _translate_single_text(title_text, "ru")
    return title_hy, title_ru


TOKEN_FILE = os.path.join(PROJECT_DIR, "token.json")
from google.oauth2.credentials import Credentials as UserCredentials
from google.auth.transport.requests import Request as GoogleAuthRequest

def get_drive_service():
    """Initializes Google Drive v3 service using User OAuth2 (token.json or GOOGLE_TOKEN_JSON) or service_account."""
    # 1. Check GOOGLE_TOKEN_JSON environment variable (ideal for Render/cloud deployments)
    env_token = os.getenv("GOOGLE_TOKEN_JSON")
    if env_token:
        try:
            token_data = json.loads(env_token)
            creds = UserCredentials.from_authorized_user_info(token_data, scopes=["https://www.googleapis.com/auth/drive"])
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(GoogleAuthRequest())
            return build("drive", "v3", credentials=creds)
        except Exception as e:
            print(f"⚠️ Error loading credentials from GOOGLE_TOKEN_JSON: {e}")

    # 2. Check token.json paths (local or Render secret files /etc/secrets/token.json)
    token_candidates = [
        TOKEN_FILE,
        "/etc/secrets/token.json",
        os.path.join(os.getcwd(), "token.json")
    ]
    for token_path in token_candidates:
        if os.path.exists(token_path):
            try:
                creds = UserCredentials.from_authorized_user_file(token_path, scopes=["https://www.googleapis.com/auth/drive"])
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(GoogleAuthRequest())
                    try:
                        with open(token_path, "w", encoding="utf-8") as f:
                            f.write(creds.to_json())
                    except Exception:
                        pass
                return build("drive", "v3", credentials=creds)
            except Exception as e:
                print(f"⚠️ User OAuth token refresh failed for {token_path}: {e}")

    # 3. Check GOOGLE_SERVICE_ACCOUNT_JSON environment variable
    env_sa = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if env_sa:
        try:
            sa_data = json.loads(env_sa)
            creds = service_account.Credentials.from_service_account_info(
                sa_data,
                scopes=["https://www.googleapis.com/auth/drive"]
            )
            return build("drive", "v3", credentials=creds)
        except Exception as e:
            print(f"⚠️ Error loading credentials from GOOGLE_SERVICE_ACCOUNT_JSON: {e}")

    # 4. Check service_account.json paths
    sa_candidates = [
        SERVICE_ACCOUNT_FILE,
        "/etc/secrets/service_account.json",
        os.path.join(os.getcwd(), "service_account.json")
    ]
    for sa_path in sa_candidates:
        if os.path.exists(sa_path):
            try:
                creds = service_account.Credentials.from_service_account_file(
                    sa_path,
                    scopes=["https://www.googleapis.com/auth/drive"]
                )
                return build("drive", "v3", credentials=creds)
            except Exception as e:
                print(f"⚠️ Service account auth error for {sa_path}: {e}")

    raise RuntimeError(
        "No valid Google Drive credentials found. "
        "For Render deployment: Add GOOGLE_TOKEN_JSON to Environment Variables, "
        "or add token.json as a Secret File in Render Dashboard -> Environment."
    )


import base64
import json
import urllib.request
import urllib.error

LATEX_API_URL = "https://latex.ytotech.com/builds/sync"

def normalize_tex_fonts(tex_content: str) -> str:
    """
    Ensures fontspec directives for Sylfaen include Path=./ so XeLaTeX
    directly loads the embedded Sylfaen.ttf resource instead of searching system directories.
    """
    if not tex_content:
        return ""
    tex = tex_content
    # 1. \setmainfont[options]{Sylfaen}
    tex = re.sub(
        r'\\setmainfont\[([^\]]*)\]\{Sylfaen\}',
        lambda m: r'\setmainfont[Path=./, ' + m.group(1) + r']{Sylfaen}' if 'Path=' not in m.group(1) else m.group(0),
        tex,
        flags=re.IGNORECASE
    )
    # 2. \setmainfont{Sylfaen}[options]
    tex = re.sub(
        r'\\setmainfont\{Sylfaen\}\[([^\]]*)\]',
        lambda m: r'\setmainfont{Sylfaen}[Path=./, ' + m.group(1) + r']' if 'Path=' not in m.group(1) else m.group(0),
        tex,
        flags=re.IGNORECASE
    )
    # 3. \setmainfont{Sylfaen} with no brackets
    tex = re.sub(
        r'\\setmainfont\{Sylfaen\}(?!\s*\[)',
        r'\\setmainfont{Sylfaen}[Path=./]',
        tex,
        flags=re.IGNORECASE
    )
    return tex


def compile_via_api(tex_content: str) -> bytes:
    """Compiles LaTeX via latex.ytotech.com REST API with Sylfaen.ttf font included."""
    tex_clean = normalize_tex_fonts(tex_content)
    font_b64 = None
    if os.path.exists(FONT_FILE):
        with open(FONT_FILE, "rb") as f:
            font_b64 = base64.b64encode(f.read()).decode("utf-8")

    resources = [{"main": True, "content": tex_clean}]
    if font_b64:
        resources.append({"path": "Sylfaen.ttf", "file": font_b64})

    payload = {
        "compiler": "xelatex",
        "resources": resources
    }

    req = urllib.request.Request(
        LATEX_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "ChasingIPhoBot/1.0"}
    )

    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"LaTeX Cloud Compilation Error (HTTP {e.code}):\n{err_body[:1200]}")
    except Exception as e:
        raise RuntimeError(f"LaTeX Cloud API Error: {e}")


def compile_tex_to_pdf_local(tex_content: str, working_title: str = "document") -> tuple[bytes, str]:
    r"""
    Compiles LaTeX content to PDF bytes.
    First tries local xelatex if available, with automatic cloud API fallback if xelatex is not installed.
    Returns (pdf_bytes, log_output).
    """
    tex_clean = normalize_tex_fonts(tex_content)
    # 1. Try local xelatex if binary exists in PATH
    local_failed_due_to_missing_bin = False
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tex_filename = "main.tex"
            tex_filepath = os.path.join(tmpdir, tex_filename)
            
            if os.path.exists(FONT_FILE):
                shutil.copyfile(FONT_FILE, os.path.join(tmpdir, "Sylfaen.ttf"))
                
            with open(tex_filepath, "w", encoding="utf-8") as f:
                f.write(tex_clean)
                
            res = subprocess.run(
                ["xelatex", "-interaction=nonstopmode", "-halt-on-error", tex_filename],
                cwd=tmpdir,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            pdf_path = os.path.join(tmpdir, "main.pdf")
            if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
                with open(pdf_path, "rb") as pf:
                    pdf_bytes = pf.read()
                return pdf_bytes, res.stdout
            else:
                log_path = os.path.join(tmpdir, "main.log")
                err_log = ""
                if os.path.exists(log_path):
                    with open(log_path, "r", encoding="utf-8", errors="ignore") as lf:
                        err_log = lf.read()
                else:
                    err_log = res.stdout + "\n" + res.stderr
                # If local compiler had syntax error, raise it
                raise RuntimeError(f"LaTeX Compilation Error:\n{err_log[-1200:]}")
    except (FileNotFoundError, OSError) as e:
        # xelatex not installed on server, fallback to Cloud API
        local_failed_due_to_missing_bin = True

    # 2. Cloud API fallback
    if local_failed_due_to_missing_bin:
        pdf_bytes = compile_via_api(tex_content)
        return pdf_bytes, "Compiled via Cloud XeLaTeX API"


def build_default_problem_template(
    p_num: int | str,
    title_hy: str = "",
    title_en: str = "",
    title_ru: str = "",
    body_hy: str = "",
    body_en: str = "",
    body_ru: str = "",
    is_solution: bool = False
) -> str:
    """Generates standard XeLaTeX document from Armenian, English, and Russian sections."""
    num_str = f"{int(p_num):04d}" if str(p_num).isdigit() else str(p_num)
    label_hy = "Լուծում" if is_solution else "Խնդիր"
    label_en = "Solution" if is_solution else "Problem"
    label_ru = "Решение" if is_solution else "Задача"

    num_display = int(num_str) if num_str.isdigit() else num_str
    head_hy = f"{label_hy} {num_display}․ {title_hy.strip()}" if title_hy.strip() else f"{label_hy} {num_display}"
    head_en = f"{label_en} {num_display}. {title_en.strip()}" if title_en.strip() else f"{label_en} {num_display}"
    head_ru = f"{label_ru} {num_display}. {title_ru.strip()}" if title_ru.strip() else f"{label_ru} {num_display}"

    return rf"""% !TEX program = xelatex
\documentclass[12pt,a4paper]{{article}}

\usepackage{{geometry}}
\usepackage{{fontspec}}
\usepackage{{amsmath}}
\usepackage{{amssymb}}
\usepackage{{tikz}}
\usepackage{{pgfplots}}
\usepackage{{booktabs}}
\usepackage{{newunicodechar}}
\usetikzlibrary{{decorations.pathmorphing, shapes.geometric, arrows.meta}}

\pgfplotsset{{compat=1.18}}
\geometry{{margin=2.2cm}}
\linespread{{1.2}}

\setmainfont{{Sylfaen}}[
 Path=./,
 AutoFakeBold=2.5,
 AutoFakeSlant=0.2
]
\newunicodechar{{․}}{{.}}

\begin{{document}}

% ==================== ARMENIAN SECTION ====================
\begin{{center}}
 {{\Large \textbf{{{head_hy}}}}}\\[0.4em]
\end{{center}}

{body_hy.strip()}

% ==================== ENGLISH SECTION ====================
\newpage
\begin{{center}}
 {{\Large \textbf{{{head_en}}}}}\\[0.4em]
\end{{center}}

{body_en.strip()}

% ==================== RUSSIAN SECTION ====================
\newpage
\begin{{center}}
 {{\Large \textbf{{{head_ru}}}}}\\[0.4em]
\end{{center}}

{body_ru.strip()}

\end{{document}}
"""


def find_or_create_folder(service, parent_id: str, folder_name: str) -> str:
    """Finds an existing non-trashed folder by name inside parent_id, or creates it."""
    query = f"'{parent_id}' in parents and name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    res = service.files().list(
        q=query,
        spaces="drive",
        fields="files(id, name)",
        supportsAllDrives=True,
        includeItemsFromAllDrives=True
    ).execute()
    files = res.get("files", [])
    if files:
        return files[0]["id"]

    # Create folder
    folder_metadata = {
        "name": folder_name,
        "mimeType": "application/vnd.google-apps.folder",
        "parents": [parent_id]
    }
    folder = service.files().create(
        body=folder_metadata,
        fields="id",
        supportsAllDrives=True
    ).execute()
    return folder.get("id")


def upload_or_replace_file(service, parent_id: str, filename: str, content_bytes: bytes, mime_type: str) -> str:
    """Uploads a file or updates existing file in a parent folder."""
    query = f"'{parent_id}' in parents and name = '{filename}' and trashed = false"
    res = service.files().list(
        q=query,
        spaces="drive",
        fields="files(id, name)",
        supportsAllDrives=True,
        includeItemsFromAllDrives=True
    ).execute()
    files = res.get("files", [])
    
    media = MediaIoBaseUpload(io.BytesIO(content_bytes), mimetype=mime_type, resumable=True)
    
    if files:
        file_id = files[0]["id"]
        updated = service.files().update(
            fileId=file_id,
            media_body=media,
            fields="id",
            supportsAllDrives=True
        ).execute()
        return updated.get("id")
    else:
        file_metadata = {
            "name": filename,
            "parents": [parent_id]
        }
        created = service.files().create(
            body=file_metadata,
            media_body=media,
            fields="id",
            supportsAllDrives=True
        ).execute()
        return created.get("id")


def rename_drive_folder_service(service, folder_id: str, new_status: str) -> str | None:
    """Renames a Google Drive folder status tag ([draft], [active], [solved])."""
    try:
        folder = service.files().get(
            fileId=folder_id,
            fields="id, name",
            supportsAllDrives=True
        ).execute()
        current_name = folder.get("name", "")
        if not current_name:
            return None

        new_name = current_name
        if "[draft]" in current_name.lower():
            new_name = re.sub(r"\[draft\]", f"[{new_status}]", current_name, flags=re.IGNORECASE)
        elif "[active]" in current_name.lower() and new_status != "active":
            new_name = re.sub(r"\[active\]", f"[{new_status}]", current_name, flags=re.IGNORECASE)
        elif not any(tag in current_name.lower() for tag in ["[draft]", "[active]", "[solved]"]):
            new_name = f"{current_name} [{new_status}]"

        if new_name != current_name:
            service.files().update(
                fileId=folder_id,
                body={"name": new_name},
                supportsAllDrives=True
            ).execute()
            print(f"✅ Renamed Google Drive folder: '{current_name}' -> '{new_name}'")
            return new_name
        return current_name
    except Exception as e:
        print(f"⚠️ Error renaming Drive folder {folder_id}: {e}")
        return None


def upload_problem_to_drive(
    p_num: str | int,
    topic: str,
    title: str,
    pdf_bytes: bytes,
    tex_content: str,
    status: str = "draft"
) -> dict:
    """
    Uploads a problem to Google Drive:
    - Root > Problems and Solutions > {0043 Topic [draft]}
    - Problem_0043_Title.pdf (or Problem_0043.pdf if title is skipped)
    - latex/Problem_0043_Title.tex (or Problem_0043.tex if title is skipped)
    Returns dict with folder_id, problem_file_id, tex_file_id.
    """
    service = get_drive_service()
    num_str = f"{int(p_num):04d}" if str(p_num).isdigit() else str(p_num)
    
    # 1. Find "Problems and Solutions" folder
    root_items = service.files().list(
        q=f"'{ROOT_FOLDER_ID}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'",
        fields="files(id, name)",
        supportsAllDrives=True,
        includeItemsFromAllDrives=True
    ).execute().get("files", [])
    
    prob_root_id = None
    for item in root_items:
        if "problems and solutions" in item["name"].lower():
            prob_root_id = item["id"]
            break
            
    if not prob_root_id:
        prob_root_id = find_or_create_folder(service, ROOT_FOLDER_ID, "Problems and Solutions")
        
    # 2. Topic formatting & Folder Name: e.g. "0043 Pressure and Hydrostatics [draft]"
    topic_display = dict(TOPIC_CHOICES).get(topic.lower(), topic.title() if topic else "General")
    folder_name = f"{num_str} {topic_display} [{status}]"
    
    # Check if folder for this problem number already exists
    existing_folders = service.files().list(
        q=f"'{prob_root_id}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'",
        fields="files(id, name)",
        supportsAllDrives=True,
        includeItemsFromAllDrives=True
    ).execute().get("files", [])
    
    folder_id = None
    for f in existing_folders:
        fname = f["name"]
        if fname.startswith(num_str) or (num_str.isdigit() and re.match(rf'^{int(num_str)}\b', fname)):
            folder_id = f["id"]
            break
            
    if not folder_id:
        folder_id = find_or_create_folder(service, prob_root_id, folder_name)
        
    # 3. Create/Find latex subfolder
    latex_folder_id = find_or_create_folder(service, folder_id, "latex")
    
    # 4. File naming: Problem_XXXX_Name.pdf (spaces replaced with _)
    clean_title = ""
    if title and title.strip():
        cleaned = re.sub(r'[^\w\s-]', '', title).strip()
        clean_title = re.sub(r'[\s_]+', '_', cleaned)

    if clean_title:
        pdf_name = f"Problem_{num_str}_{clean_title}.pdf"
        tex_name = f"Problem_{num_str}_{clean_title}.tex"
    else:
        pdf_name = f"Problem_{num_str}.pdf"
        tex_name = f"Problem_{num_str}.tex"

    pdf_id = upload_or_replace_file(service, folder_id, pdf_name, pdf_bytes, "application/pdf")
    tex_id = upload_or_replace_file(service, latex_folder_id, tex_name, tex_content.encode("utf-8"), "text/x-tex")
    
    return {
        "folder_id": folder_id,
        "folder_name": folder_name,
        "problem_file_id": pdf_id,
        "problem_file_name": pdf_name,
        "tex_file_id": tex_id,
    }


def upload_solution_to_drive(
    p_num: str | int,
    pdf_bytes: bytes,
    tex_content: str,
    folder_id: str = None,
    title: str = None
) -> dict:
    """
    Uploads solution to Google Drive for an existing problem:
    - Solution_0043_Title.pdf (in problem folder)
    - latex/Solution_0043_Title.tex (in latex subfolder)
    """
    service = get_drive_service()
    num_str = f"{int(p_num):04d}" if str(p_num).isdigit() else str(p_num)
    
    if not folder_id:
        # Locate problem folder
        root_items = service.files().list(
            q=f"'{ROOT_FOLDER_ID}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'",
            fields="files(id, name)",
            supportsAllDrives=True,
            includeItemsFromAllDrives=True
        ).execute().get("files", [])
        
        prob_root_id = None
        for item in root_items:
            if "problems and solutions" in item["name"].lower():
                prob_root_id = item["id"]
                break
                
        if not prob_root_id:
            raise RuntimeError("Problems and Solutions folder not found.")
            
        folders = service.files().list(
            q=f"'{prob_root_id}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'",
            fields="files(id, name)",
            supportsAllDrives=True,
            includeItemsFromAllDrives=True
        ).execute().get("files", [])
        
        for f in folders:
            fname = f["name"]
            if fname.startswith(num_str) or (num_str.isdigit() and re.match(rf'^{int(num_str)}\b', fname)):
                folder_id = f["id"]
                break
                
    if not folder_id:
        raise RuntimeError(f"Could not find folder for Problem #{num_str} on Google Drive.")

    # Extract or format clean title for Solution file naming
    clean_title = ""
    if title and title.strip():
        cleaned = re.sub(r'[^\w\s-]', '', title).strip()
        clean_title = re.sub(r'[\s_]+', '_', cleaned)
    else:
        # Inspect files inside folder to mirror Problem_XXXX_Name.pdf
        try:
            folder_files = service.files().list(
                q=f"'{folder_id}' in parents and trashed = false",
                fields="files(id, name)",
                supportsAllDrives=True,
                includeItemsFromAllDrives=True
            ).execute().get("files", [])
            for ff in folder_files:
                fname = ff["name"]
                if fname.lower().startswith("problem_") and fname.lower().endswith(".pdf"):
                    base = os.path.splitext(fname)[0]
                    parts = base.split("_")
                    if len(parts) > 2:
                        clean_title = "_".join(parts[2:])
                    break
        except Exception:
            pass

    if clean_title:
        sol_pdf_name = f"Solution_{num_str}_{clean_title}.pdf"
        sol_tex_name = f"Solution_{num_str}_{clean_title}.tex"
    else:
        sol_pdf_name = f"Solution_{num_str}.pdf"
        sol_tex_name = f"Solution_{num_str}.tex"

    latex_folder_id = find_or_create_folder(service, folder_id, "latex")
    sol_pdf_id = upload_or_replace_file(service, folder_id, sol_pdf_name, pdf_bytes, "application/pdf")
    sol_tex_id = upload_or_replace_file(service, latex_folder_id, sol_tex_name, tex_content.encode("utf-8"), "text/x-tex")

    return {
        "folder_id": folder_id,
        "solution_file_id": sol_pdf_id,
        "solution_file_name": sol_pdf_name,
        "solution_tex_file_id": sol_tex_id,
    }


def upload_material_to_drive(
    topic: str = None,
    title: str = "",
    pdf_bytes: bytes = b"",
    tex_content: str = None,
    parent_folder_name: str = "Materials"
) -> dict:
    """
    Uploads material to Google Drive:
    - If topic: Root > {parent_folder_name} > {Topic} > {Title}.pdf
    - If no topic: Root > {parent_folder_name} > {Title}.pdf
    """
    service = get_drive_service()
    
    # 1. Find or create root materials folder (e.g. "Materials" or "Self-Made Materials")
    root_items = service.files().list(
        q=f"'{ROOT_FOLDER_ID}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'",
        fields="files(id, name)",
        supportsAllDrives=True,
        includeItemsFromAllDrives=True
    ).execute().get("files", [])
    
    mat_root_id = None
    target_lower = parent_folder_name.lower().strip()
    for item in root_items:
        if item["name"].lower().strip() == target_lower:
            mat_root_id = item["id"]
            break
            
    if not mat_root_id:
        mat_root_id = find_or_create_folder(service, ROOT_FOLDER_ID, parent_folder_name)
        
    # 2. Topic subfolder if specified
    if topic and topic.strip().lower() not in ("none", "general", ""):
        topic_clean = topic.title().strip()
        target_folder_id = find_or_create_folder(service, mat_root_id, topic_clean)
    else:
        target_folder_id = mat_root_id
    
    clean_title = re.sub(r'[\/\\:*?"<>|]', '', title).strip()
    clean_filename = re.sub(r'\s+', '_', clean_title)
    pdf_name = f"{clean_filename}.pdf"
    pdf_id = upload_or_replace_file(service, target_folder_id, pdf_name, pdf_bytes, "application/pdf")
    
    tex_id = None
    if tex_content:
        tex_name = f"{clean_filename}.tex"
        tex_id = upload_or_replace_file(service, target_folder_id, tex_name, tex_content.encode("utf-8"), "text/x-tex")
        
    return {
        "folder_id": target_folder_id,
        "file_id": pdf_id,
        "pdf_name": pdf_name,
        "tex_file_id": tex_id
    }




# ──────────────────────────────────────────────────────────────────────────────
# Persistent Scheduled Solutions (Google Drive JSON file)
# ──────────────────────────────────────────────────────────────────────────────

SCHEDULED_JSON_FILENAME = "problems and solutions.json"


def _find_problems_and_solutions_folder(service) -> str:
    """Finds or creates the 'Problems and Solutions' folder under ROOT_FOLDER_ID."""
    root_items = service.files().list(
        q=f"'{ROOT_FOLDER_ID}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'",
        fields="files(id, name)",
        supportsAllDrives=True,
        includeItemsFromAllDrives=True
    ).execute().get("files", [])

    for item in root_items:
        if "problems and solutions" in item["name"].lower():
            return item["id"]

    return find_or_create_folder(service, ROOT_FOLDER_ID, "Problems and Solutions")


def _load_scheduled_json(service, folder_id: str) -> tuple[dict, str | None]:
    """
    Loads the 'problems and solutions.json' file from the given Drive folder.
    Returns (data_dict, file_id) or ({}, None) if not found.
    """
    query = f"'{folder_id}' in parents and name = '{SCHEDULED_JSON_FILENAME}' and trashed = false"
    res = service.files().list(
        q=query,
        spaces="drive",
        fields="files(id, name)",
        supportsAllDrives=True,
        includeItemsFromAllDrives=True
    ).execute()
    files = res.get("files", [])

    if not files:
        return {}, None

    file_id = files[0]["id"]
    try:
        import googleapiclient.http
        request = service.files().get_media(fileId=file_id, supportsAllDrives=True)
        buf = io.BytesIO()
        downloader = googleapiclient.http.MediaIoBaseDownload(buf, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        buf.seek(0)
        data = json.loads(buf.read().decode("utf-8"))
        return data if isinstance(data, dict) else {}, file_id
    except Exception as e:
        print(f"⚠️ Failed to read {SCHEDULED_JSON_FILENAME} from Drive: {e}")
        return {}, file_id


def _save_scheduled_json(service, folder_id: str, data: dict, existing_file_id: str | None = None) -> str:
    """
    Saves the data dict as 'problems and solutions.json' in the given Drive folder.
    Creates or updates the file. Returns the file ID.
    """
    content_bytes = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
    media = MediaIoBaseUpload(io.BytesIO(content_bytes), mimetype="application/json", resumable=True)

    if existing_file_id:
        updated = service.files().update(
            fileId=existing_file_id,
            media_body=media,
            fields="id",
            supportsAllDrives=True
        ).execute()
        return updated.get("id")
    else:
        file_metadata = {
            "name": SCHEDULED_JSON_FILENAME,
            "parents": [folder_id]
        }
        created = service.files().create(
            body=file_metadata,
            media_body=media,
            fields="id",
            supportsAllDrives=True
        ).execute()
        return created.get("id")


def save_drive_scheduled_solution(p_num: str, scheduled_at: str, scheduled_by: int):
    """
    Persists a scheduled solution entry to 'problems and solutions.json' on Google Drive.
    Called when an admin schedules a solution for later posting.
    """
    try:
        service = get_drive_service()
        folder_id = _find_problems_and_solutions_folder(service)
        data, file_id = _load_scheduled_json(service, folder_id)

        num_str = f"{int(p_num):04d}" if str(p_num).isdigit() else str(p_num)
        data[num_str] = {
            "solution_scheduled_at": scheduled_at,
            "solution_scheduled_by": scheduled_by,
        }

        _save_scheduled_json(service, folder_id, data, file_id)
        print(f"✅ Saved scheduled solution #{num_str} to Drive '{SCHEDULED_JSON_FILENAME}'.")
    except Exception as e:
        print(f"❌ Failed to save scheduled solution #{p_num} to Drive: {e}")


def remove_drive_scheduled_solution(p_num: str):
    """
    Removes a scheduled solution entry from 'problems and solutions.json' on Google Drive.
    Called after a solution has been sent or the schedule was canceled.
    """
    try:
        service = get_drive_service()
        folder_id = _find_problems_and_solutions_folder(service)
        data, file_id = _load_scheduled_json(service, folder_id)

        num_str = f"{int(p_num):04d}" if str(p_num).isdigit() else str(p_num)

        removed = False
        if num_str in data:
            del data[num_str]
            removed = True
        # Also try without leading zeros
        if str(p_num) in data and str(p_num) != num_str:
            del data[str(p_num)]
            removed = True

        if removed and file_id:
            _save_scheduled_json(service, folder_id, data, file_id)
            print(f"✅ Removed scheduled solution #{num_str} from Drive '{SCHEDULED_JSON_FILENAME}'.")
        elif not removed:
            print(f"ℹ️ No scheduled entry for #{num_str} found in Drive '{SCHEDULED_JSON_FILENAME}'.")
    except Exception as e:
        print(f"❌ Failed to remove scheduled solution #{p_num} from Drive: {e}")


def load_drive_scheduled_solutions(service=None) -> dict:
    """
    Loads all scheduled solution entries from 'problems and solutions.json' on Google Drive.
    Called on startup to restore scheduled sends that were lost during redeployment.
    Returns a dict like: { "0043": { "solution_scheduled_at": "...", "solution_scheduled_by": 123 }, ... }
    """
    try:
        if service is None:
            service = get_drive_service()
        folder_id = _find_problems_and_solutions_folder(service)
        data, _ = _load_scheduled_json(service, folder_id)
        if data:
            print(f"📂 Loaded {len(data)} scheduled solution(s) from Drive '{SCHEDULED_JSON_FILENAME}'.")
        return data
    except Exception as e:
        print(f"⚠️ Failed to load scheduled solutions from Drive: {e}")
        return {}
