import json
import os
import re
import sys

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

load_dotenv()
load_dotenv(".env.local")


API_KEY = os.getenv("GOOGLE_API_KEY")
ROOT_FOLDER_ID = os.getenv("ROOT_FOLDER_ID")
SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "service_account.json")

TOKEN_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "token.json")
from google.oauth2.credentials import Credentials as UserCredentials
from google.auth.transport.requests import Request as GoogleAuthRequest

def get_drive_service():
    """Returns a Google Drive service instance using token.json (User OAuth), Service Account, or API_KEY."""
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
            print(f"⚠️ Error loading credentials from GOOGLE_TOKEN_JSON in sync.py: {e}")

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
                print(f"⚠️ User OAuth token error in sync.py: {e}")

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
            print(f"⚠️ Error loading credentials from GOOGLE_SERVICE_ACCOUNT_JSON in sync.py: {e}")

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
                print(f"⚠️ Service account auth error in sync.py: {e}")

    if API_KEY:
        return build("drive", "v3", developerKey=API_KEY)
    raise RuntimeError("No valid Google Drive credentials found in .env, token.json, or service_account.json.")



def extract_title_from_filename(filename):
    """Extracts 'Speed Records' from 'Problem_001_Speed_Records.pdf'"""
    base_name = os.path.splitext(filename)[0]
    parts = base_name.split("_")
    if len(parts) > 2:
        return " ".join(parts[2:])
    return None


def get_files_in_folder(service, folder_id):
    """Helper to list all non-trashed files/folders inside a parent folder."""
    query = f"'{folder_id}' in parents and trashed = false"
    results = (
        service.files()
        .list(
            q=query,
            spaces="drive",
            fields="files(id, name, mimeType)",
            pageSize=1000,
            supportsAllDrives=True,
            includeItemsFromAllDrives=True,
        )
        .execute()
    )
    return results.get("files", [])


def sync_problems(service, problems_folder_id):
    """Scans Problems and Solutions folder and generates problems.json."""
    from drive_latex_uploader import load_drive_scheduled_solutions

    # Load persistent Drive scheduled solutions from 'problems and solutions.json'
    drive_scheduled = load_drive_scheduled_solutions(service)

    # Load existing problems.json if present to preserve manually added links
    existing_data = {}
    if os.path.exists("problems.json"):
        try:
            with open("problems.json", "r", encoding="utf-8") as f:
                existing_data = json.load(f)
        except Exception:
            existing_data = {}

    problems = {}
    subfolders = get_files_in_folder(service, problems_folder_id)

    for folder in subfolders:
        if folder["mimeType"] != "application/vnd.google-apps.folder":
            continue

        folder_name = folder["name"]
        folder_id = folder["id"]

        clean_folder = re.sub(r'\s*\[(active|draft|solved)\]', '', folder_name, flags=re.I).strip()
        match = re.match(r'^(\d+)[_\s]*(.*)$', clean_folder)
        if match:
            p_num = match.group(1)
            raw_topic = match.group(2).replace("_", " ").strip()
            topic = raw_topic.lower() if raw_topic else "general"
        else:
            parts = folder_name.replace("_", " ").split()
            p_num = parts[0]
            topic = " ".join(parts[1:]).lower() if len(parts) > 1 else "general"
            topic = re.sub(r'\s*\[(active|draft|solved)\]', '', topic, flags=re.I).strip()

        old_entry = existing_data.get(p_num, {})

        status = None
        if "[active]" in folder_name.lower():
            status = "active"
        elif "[solved]" in folder_name.lower():
            status = "solved"
        elif "[draft]" in folder_name.lower():
            status = "draft"
        else:
            status = old_entry.get("status") or "draft"

        files = get_files_in_folder(service, folder_id)

        prob_file_id, prob_file_name = None, None
        sol_file_id, sol_file_name = None, None
        tex_file_id, sol_tex_file_id = None, None
        extracted_title = None

        for file in files:
            fname = file["name"].lower()
            if file["mimeType"] == "application/vnd.google-apps.folder" and fname.strip() == "latex":
                latex_files = get_files_in_folder(service, file["id"])
                for lfile in latex_files:
                    lfname = lfile["name"].strip().lower()
                    is_tex_file = lfname.endswith(".tex") or lfile.get("mimeType") == "text/x-tex"
                    if is_tex_file and lfname.startswith("problem"):
                        tex_file_id = lfile["id"]
                    elif is_tex_file and lfname.startswith("solution"):
                        sol_tex_file_id = lfile["id"]
            elif fname.startswith("problem") and fname.endswith(".pdf"):
                prob_file_id = file["id"]
                prob_file_name = file["name"]
                extracted_title = extract_title_from_filename(file["name"])
            elif fname.startswith("solution") and fname.endswith(".pdf"):
                sol_file_id = file["id"]
                sol_file_name = file["name"]
                if not extracted_title:
                    extracted_title = extract_title_from_filename(file["name"])
            elif fname.startswith("problem") and fname.endswith(".tex"):
                tex_file_id = file["id"]
            elif fname.startswith("solution") and fname.endswith(".tex"):
                sol_tex_file_id = file["id"]

        # Fallback for problem PDF if not named starting with 'problem'
        if not prob_file_id:
            for file in files:
                fname = file["name"].lower()
                if fname.endswith(".pdf") and not fname.startswith("solution"):
                    prob_file_id = file["id"]
                    prob_file_name = file["name"]
                    if not extracted_title:
                        extracted_title = extract_title_from_filename(file["name"])
                    break

        drive_sched = drive_scheduled.get(p_num) or (drive_scheduled.get(f"{int(p_num):04d}") if p_num.isdigit() else None)
        sched_at = (drive_sched.get("solution_scheduled_at") if isinstance(drive_sched, dict) else None) or old_entry.get("solution_scheduled_at")
        sched_by = (drive_sched.get("solution_scheduled_by") if isinstance(drive_sched, dict) else None) or old_entry.get("solution_scheduled_by")

        # If problem is marked solved, don't schedule
        if status == "solved":
            sched_at = None

        problems[p_num] = {
            "title": extracted_title or old_entry.get("title"),
            "title_hy": old_entry.get("title_hy"),
            "title_ru": old_entry.get("title_ru"),
            "topic": topic,
            "status": status,
            "folder_id": folder_id,
            "folder_name": folder_name,
            "file_id": prob_file_id or old_entry.get("file_id"),
            "problem_file_id": prob_file_id or old_entry.get("problem_file_id"),
            "problem_file_name": prob_file_name or old_entry.get("problem_file_name"),
            "sol_file_id": sol_file_id or old_entry.get("sol_file_id"),
            "solution_file_id": sol_file_id or old_entry.get("solution_file_id"),
            "solution_file_name": sol_file_name or old_entry.get("solution_file_name"),
            "tex_file_id": tex_file_id or old_entry.get("tex_file_id"),
            "sol_tex_file_id": sol_tex_file_id or old_entry.get("sol_tex_file_id"),
            "link": old_entry.get("link"),
            "solution_link": old_entry.get("solution_link"),
            "draft_notified_file_id": old_entry.get("draft_notified_file_id"),
            "draft_sent_file_id": old_entry.get("draft_sent_file_id"),
            "solution_notified_file_id": old_entry.get("solution_notified_file_id"),
            "solution_scheduled_at": sched_at,
            "solution_scheduled_by": sched_by,
        }

    with open("problems.json", "w", encoding="utf-8") as f:
        json.dump(problems, f, ensure_ascii=False, indent=4)

    print(
        f"✅ Successfully updated 'problems.json'! Found {len(problems)} problems."
    )


def detect_material_topic(text: str) -> str:
    """Smart detector for physics material topic based on filename/title keywords."""
    s = text.lower()
    if any(k in s for k in ["термодин", "thermodynamic", "молекуляр", "molekulyar"]):
        return "thermodynamics"
    if any(k in s for k in ["электрические_цепи", "электрические цепи", "electric_circuit", "circuit", "շղթա"]):
        return "circuits"
    if any(k in s for k in ["электродинамик", "elektrodinamika", "electricity", "электричеств", "magnet", "մագնիս"]):
        return "electricity and magnetism"
    if any(k in s for k in ["волновой", "волновая", "оптик", "optik", "optics", "օպտիկ"]):
        return "optics"
    if any(k in s for k in ["колеб", "koleb", "волн", "voln", "wave", "oscillation", "ալիք", "տատանում"]):
        return "waves"
    if any(k in s for k in ["статич", "статическ", "статик", "static", "виртуальных", "виртуальн", "սվիրտուալ", "ստատիկ"]):
        return "statics"
    if any(k in s for k in ["гидростатик", "hydrostatic"]):
        return "hydrostatics"
    if any(k in s for k in ["кинематик", "kinematic"]):
        return "kinematics"
    if any(k in s for k in ["механик", "mechanic", "morin", "морин", "sivuhin", "сивухин", "landau", "ландау", "динамик", "dynamic", "դինամիկ"]):
        return "dynamics"
    if any(k in s for k in ["квант", "quantum"]):
        return "quantum"
    return "general"


def sync_materials(service, materials_folder_id):
    """Scans Materials folder (direct PDF files and subfolders) and generates materials.json."""
    existing_materials_list = []
    if os.path.exists("materials.json"):
        try:
            with open("materials.json", "r", encoding="utf-8") as f:
                existing_materials_list = json.load(f)
        except Exception:
            existing_materials_list = []
    existing_map = {m["id"]: m for m in existing_materials_list if isinstance(m, dict) and "id" in m}

    materials = []
    items = get_files_in_folder(service, materials_folder_id)

    for item in items:
        if item["mimeType"] == "application/vnd.google-apps.folder":
            folder_topic = item["name"].lower().strip()
            sub_files = get_files_in_folder(service, item["id"])
            for f in sub_files:
                if f["name"].endswith(".pdf"):
                    base_name = os.path.splitext(f["name"])[0]
                    if "[draft]" in base_name.lower():
                        continue
                    clean_raw = re.sub(r"\s*\[(active|draft)\]", "", base_name, flags=re.I).strip()
                    clean_title = clean_raw.replace("_", " ").strip()
                    existing_item = existing_map.get(f["id"], {})
                    topic = existing_item.get("topic") or folder_topic or detect_material_topic(f["name"])
                    materials.append({
                        "id": f["id"],
                        "title": clean_title,
                        "topic": topic,
                        "title_hy": existing_item.get("title_hy"),
                        "title_ru": existing_item.get("title_ru"),
                        "status": "active",
                        "file_id": f["id"],
                        "link": existing_item.get("link"),
                    })
        elif item["name"].endswith(".pdf"):
            base_name = os.path.splitext(item["name"])[0]
            if "[draft]" in base_name.lower():
                continue
            clean_raw = re.sub(r"\s*\[(active|draft)\]", "", base_name, flags=re.I).strip()
            clean_title = clean_raw.replace("_", " ").strip()
            existing_item = existing_map.get(item["id"], {})
            topic = existing_item.get("topic") or detect_material_topic(item["name"])
            materials.append({
                "id": item["id"],
                "title": clean_title,
                "topic": topic,
                "title_hy": existing_item.get("title_hy"),
                "title_ru": existing_item.get("title_ru"),
                "status": "active",
                "file_id": item["id"],
                "link": existing_item.get("link"),
            })

    with open("materials.json", "w", encoding="utf-8") as f:
        json.dump(materials, f, ensure_ascii=False, indent=4)

    print(
        f"✅ Successfully updated 'materials.json'! Found {len(materials)} materials."
    )



def sync_self_materials(service, self_materials_folder_id):
    """Scans Self-Made Materials > [Topic Folder] > PDF files and generates self_materials.json."""
    existing_materials_list = []
    if os.path.exists("self_materials.json"):
        try:
            with open("self_materials.json", "r", encoding="utf-8") as f:
                existing_materials_list = json.load(f)
        except Exception:
            existing_materials_list = []
    existing_map = {m["id"]: m for m in existing_materials_list if isinstance(m, dict) and "id" in m}

    self_materials = []
    topic_folders = get_files_in_folder(service, self_materials_folder_id)

    for folder in topic_folders:
        if folder["mimeType"] != "application/vnd.google-apps.folder":
            continue

        topic_name = folder["name"].lower().strip()
        files = get_files_in_folder(service, folder["id"])

        for f in files:
            fname = f["name"]
            if fname.endswith(".pdf"):
                base_name = os.path.splitext(fname)[0]

                status = "draft" if "[draft]" in base_name.lower() else "active"
                if status == "draft":
                    continue

                clean_title = re.sub(
                    r"\s*\[(active|draft)\]", "", base_name, flags=re.I
                ).strip()

                existing_item = existing_map.get(f["id"], {})

                self_materials.append({
                    "id": f["id"],
                    "title": clean_title,
                    "title_hy": existing_item.get("title_hy"),
                    "title_ru": existing_item.get("title_ru"),
                    "topic": topic_name,
                    "status": status,
                    "file_id": f["id"],
                    "link": existing_item.get("link"),
                })

    with open("self_materials.json", "w", encoding="utf-8") as f:
        json.dump(self_materials, f, ensure_ascii=False, indent=4)

    print(
        f"✅ Successfully updated 'self_materials.json'! Found {len(self_materials)} self-made materials."
    )


def sync_olympiads(service, olympiads_folder_id):
    """Scans Olympiads > PDF files and generates olympiads.json."""
    existing_olympiads = []
    if os.path.exists("olympiads.json"):
        try:
            with open("olympiads.json", "r", encoding="utf-8") as f:
                existing_olympiads = json.load(f)
        except Exception:
            existing_olympiads = []
    existing_map = {m["id"]: m for m in existing_olympiads if isinstance(m, dict) and "id" in m}

    olympiads = []
    files = get_files_in_folder(service, olympiads_folder_id)

    for f in files:
        fname = f["name"]
        if fname.endswith(".pdf"):
            base_name = os.path.splitext(fname)[0]
            clean_title = re.sub(
                r"\s*\[(active|draft)\]", "", base_name, flags=re.I
            ).strip()

            existing_item = existing_map.get(f["id"], {})

            olympiads.append({
                "id": f["id"],
                "title": clean_title,
                "title_hy": existing_item.get("title_hy"),
                "title_ru": existing_item.get("title_ru"),
                "file_id": f["id"],
            })

    with open("olympiads.json", "w", encoding="utf-8") as f:
        json.dump(olympiads, f, ensure_ascii=False, indent=4)

    print(
        f"✅ Successfully updated 'olympiads.json'! Found {len(olympiads)} olympiad files."
    )


def scan_public_drive():
    if not ROOT_FOLDER_ID:
        print("Error: ROOT_FOLDER_ID is missing from .env")
        return

    try:
        service = get_drive_service()
    except Exception as e:
        print(f"Error initializing Drive service: {e}")
        return

    print("🔄 Scanning Google Drive Root Folder...")
    root_items = get_files_in_folder(service, ROOT_FOLDER_ID)

    problems_folder_id = None
    materials_folder_id = None
    self_materials_folder_id = None
    olympiads_folder_id = None

    for item in root_items:
        if item["mimeType"] == "application/vnd.google-apps.folder":
            item_name_lower = item["name"].lower()
            if "problems and solutions" in item_name_lower:
                problems_folder_id = item["id"]
            elif "self" in item_name_lower and "material" in item_name_lower:
                self_materials_folder_id = item["id"]
            elif "material" in item_name_lower:
                materials_folder_id = item["id"]
            elif "olympiad" in item_name_lower:
                olympiads_folder_id = item["id"]

    if problems_folder_id:
        sync_problems(service, problems_folder_id)
    else:
        print(
            "⚠️ Warning: Could not find 'Problems and Solutions' folder in"
            " ROOT_FOLDER_ID."
        )

    if materials_folder_id:
        sync_materials(service, materials_folder_id)
    else:
        print("⚠️ Warning: Could not find 'Materials' folder in ROOT_FOLDER_ID.")

    if self_materials_folder_id:
        sync_self_materials(service, self_materials_folder_id)
    else:
        print("ℹ️ Note: 'Self-Made Materials' folder not found or unified in ROOT_FOLDER_ID.")

    if olympiads_folder_id:
        sync_olympiads(service, olympiads_folder_id)
    else:
        print("⚠️ Warning: Could not find 'Olympiad' folder in ROOT_FOLDER_ID.")



def rename_drive_folder_status(folder_id: str, new_status: str):
    """Attempts to rename a folder in Google Drive to reflect its updated status ([active] or [solved])."""
    if not folder_id:
        return
    try:
        service = get_drive_service()
        folder = service.files().get(fileId=folder_id, fields="id, name", supportsAllDrives=True).execute()
        current_name = folder.get("name", "")
        if not current_name:
            return

        new_name = current_name
        if "[draft]" in current_name.lower():
            new_name = re.sub(r"\[draft\]", f"[{new_status}]", current_name, flags=re.IGNORECASE)
        elif "[active]" in current_name.lower() and new_status != "active":
            new_name = re.sub(r"\[active\]", f"[{new_status}]", current_name, flags=re.IGNORECASE)
        elif not any(tag in current_name.lower() for tag in ["[draft]", "[active]", "[solved]"]):
            new_name = f"{current_name} [{new_status}]"

        if new_name != current_name:
            service.files().update(fileId=folder_id, body={"name": new_name}, supportsAllDrives=True).execute()
            print(f"✅ Renamed Google Drive folder: '{current_name}' -> '{new_name}'")
    except Exception as e:
        print(f"ℹ️ Google Drive folder rename info: {e}")


if __name__ == "__main__":
    scan_public_drive()