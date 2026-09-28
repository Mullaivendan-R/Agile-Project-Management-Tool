import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "agile_pm.db")

def inspect_database():
    if not os.path.exists(DB_PATH):
        print(f"Database file not found at: {os.path.abspath(DB_PATH)}")
        print("Run 'python backend/seed.py' or start the server to create it.")
        return

    print("=" * 75)
    print(f" SQLITE DATABASE FILE: {os.path.abspath(DB_PATH)}")
    print("=" * 75)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1. Projects
    print("\n[TABLE: projects]")
    cur.execute("SELECT id, name, status, created_at FROM projects")
    projects = cur.fetchall()
    if not projects:
        print("  (No records)")
    for p in projects:
        print(f"  ID {p[0]}: {p[1]} | Status: {p[2]} | Created: {p[3]}")

    # 2. Stories
    print("\n[TABLE: stories]")
    cur.execute("SELECT id, project_id, title, status, priority FROM stories")
    stories = cur.fetchall()
    if not stories:
        print("  (No records)")
    for s in stories:
        print(f"  ID {s[0]} -> (Project #{s[1]}) '{s[2]}' | Status: {s[3]} | Priority: {s[4]}")

    # 3. Tasks
    print("\n[TABLE: tasks]")
    cur.execute("SELECT id, user_story_id, title, status, priority, assigned_to, due_date FROM tasks")
    tasks = cur.fetchall()
    if not tasks:
        print("  (No records)")
    for t in tasks:
        due = t[6][:16] if t[6] else "None"
        assignee = t[5] or "Unassigned"
        print(f"  ID {t[0]} -> (Story #{t[1]}) '{t[2]}' | Status: {t[3]} | Priority: {t[4]} | Assignee: {assignee} | Due: {due}")

    # 4. Notifications
    print("\n[TABLE: notifications]")
    cur.execute("SELECT id, task_id, type, message, read_at FROM notifications")
    notifications = cur.fetchall()
    if not notifications:
        print("  (No records)")
    for n in notifications:
        status = "READ" if n[4] else "UNREAD"
        print(f"  ID {n[0]} -> (Task #{n[1]}) [{n[2]}] [{status}] {n[3]}")

    # 5. Hierarchy Tree
    print("\n" + "=" * 75)
    print(" HIERARCHY TREE: Project -> User Story -> Task")
    print("=" * 75)

    for p in projects:
        print(f"\n[Project #{p[0]}] {p[1]} (Status: {p[2]})")
        cur.execute("SELECT id, title, status, priority FROM stories WHERE project_id = ?", (p[0],))
        p_stories = cur.fetchall()
        if not p_stories:
            print("   \\-- (No stories)")
        for s in p_stories:
            print(f"   +-- [Story #{s[0]}] {s[1]} [Status: {s[2]}, Priority: {s[3]}]")
            cur.execute("SELECT id, title, status, priority, due_date FROM tasks WHERE user_story_id = ?", (s[0],))
            s_tasks = cur.fetchall()
            if not s_tasks:
                print("   |    \\-- (No tasks)")
            for t in s_tasks:
                due = f", Due: {t[4][:10]}" if t[4] else ""
                print(f"   |    +-- [Task #{t[0]}] {t[1]} [Status: {t[2]}, Priority: {t[3]}{due}]")

    print("\n" + "=" * 75)
    conn.close()

if __name__ == "__main__":
    inspect_database()
