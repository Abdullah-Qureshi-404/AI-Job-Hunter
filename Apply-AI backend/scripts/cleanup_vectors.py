"""
=========================================================
Pinecone maintenance
=========================================================

Two problems this fixes:

1. ORPHANS. Until delete_resume_vectors() was added, deleting a resume removed
   the file and the database row but left its vectors in Pinecone. Those
   chunks are still retrieved by search_chunks and still shape generated
   resumes and emails - invisibly, and with no way for the user to undo it.

2. STALE CHUNK SIZE. Chunks were 800 words; they are now 200 with overlap.
   Vectors created under the old setting are far too coarse to rank well
   against the new ones.

Usage (from the "Apply-AI backend" directory):

    venv\\Scripts\\python.exe scripts\\cleanup_vectors.py --dry-run
    venv\\Scripts\\python.exe scripts\\cleanup_vectors.py
    venv\\Scripts\\python.exe scripts\\cleanup_vectors.py --reembed
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv(
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
)

from core.pinecone import pinecone_index  # noqa: E402
from core.supabase import supabase  # noqa: E402


def live_resumes():
    """Map of namespace (user_id) -> set of file_name still in the database."""

    response = supabase.table("resumes").select("user_id,file_name,storage_path,resume_type,id").execute()

    by_user = {}

    for row in response.data or []:
        by_user.setdefault(row["user_id"], []).append(row)

    return by_user


def namespaces_in_index():
    stats = pinecone_index.describe_index_stats()

    raw = stats.get("namespaces") or {}

    return {name: info.get("vector_count", 0) for name, info in raw.items()}


def purge_orphans(dry_run):
    db = live_resumes()
    namespaces = namespaces_in_index()

    print(f"Pinecone namespaces: {len(namespaces)}")
    print(f"Users with resumes in database: {len(db)}\n")

    removed_namespaces = 0
    removed_files = 0

    for namespace, count in namespaces.items():
        rows = db.get(namespace)

        # Entire namespace belongs to a user with no resumes left.
        if not rows:
            print(f"  [orphan namespace] {namespace} ({count} vectors)")
            if not dry_run:
                pinecone_index.delete(delete_all=True, namespace=namespace)
            removed_namespaces += 1
            continue

        valid_files = {row["file_name"] for row in rows}

        # Find vectors whose source_file is no longer in the database. Pinecone
        # cannot list distinct metadata values, so probe with a query.
        try:
            sample = pinecone_index.query(
                vector=[0.0] * 1024,
                top_k=1000,
                include_metadata=True,
                namespace=namespace,
            )
        except Exception as error:
            print(f"  [skip] {namespace}: could not sample ({error})")
            continue

        seen_files = {
            match.metadata.get("source_file")
            for match in (sample.matches or [])
            if match.metadata
        }

        stale = {f for f in seen_files if f and f not in valid_files}

        for file_name in stale:
            print(f"  [orphan file] {namespace} -> {file_name}")
            if not dry_run:
                pinecone_index.delete(
                    filter={"source_file": file_name},
                    namespace=namespace,
                )
            removed_files += 1

    print(
        f"\n{'Would remove' if dry_run else 'Removed'}: "
        f"{removed_namespaces} namespaces, {removed_files} stale files."
    )


def reembed_all(dry_run):
    """Re-embed every resume so all vectors use the current chunk size."""

    from rag.embedder import embed_resume

    db = live_resumes()
    total = sum(len(rows) for rows in db.values())

    print(f"\nRe-embedding {total} resumes at the current chunk size...")

    done = 0
    failed = 0

    for user_id, rows in db.items():
        for row in rows:
            label = f"{user_id[:8]}../{row['file_name']}"

            if dry_run:
                print(f"  [would re-embed] {label}")
                done += 1
                continue

            try:
                # Drop the old vectors first so the two chunk sizes never
                # coexist in the same namespace.
                pinecone_index.delete(
                    filter={"source_file": row["file_name"]},
                    namespace=user_id,
                )

                embed_resume(
                    storage_path=row["storage_path"],
                    user_id=user_id,
                    resume_type=row.get("resume_type") or "general",
                    source_file=row["file_name"],
                    resume_id=row["id"],
                )
                print(f"  [ok] {label}")
                done += 1
            except Exception as error:
                print(f"  [FAILED] {label}: {error}")
                failed += 1

    print(f"\nRe-embedded {done}, failed {failed}.")


def main():
    parser = argparse.ArgumentParser(description="Pinecone cleanup and re-embed.")
    parser.add_argument("--dry-run", action="store_true", help="Report only, change nothing.")
    parser.add_argument("--reembed", action="store_true", help="Also re-embed every resume.")
    args = parser.parse_args()

    if args.dry_run:
        print("DRY RUN - nothing will be modified.\n")

    purge_orphans(args.dry_run)

    if args.reembed:
        reembed_all(args.dry_run)


if __name__ == "__main__":
    main()
