"""
CLI script to ingest all Markdown and PDF documents from the knowledge_base directory
into the EduPilot RAG vector database.
"""
import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import AsyncSessionLocal
from app.modules.rag.service import rag_service


async def main():
    print("=" * 60)
    print("EduPilot RAG Knowledge Base Ingestion Pipeline")
    print("=" * 60)

    # Determine knowledge_base path relative to script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    kb_path = os.path.abspath(os.path.join(repo_root, "..", "knowledge_base"))

    if not os.path.exists(kb_path):
        print(f"ERROR: Knowledge base directory not found at: {kb_path}")
        return

    print(f"Scanning directory: {kb_path}\n")

    async with AsyncSessionLocal() as session:
        result = await rag_service.ingest_knowledge_base_directory(session, kb_path)

        print("\nIngestion Summary:")
        print(f"Total documents ingested: {result['total_ingested']}")
        for doc in result["documents"]:
            print(f"  • {doc['filename']} ({doc['category']}): {doc['pages']} pages, {doc['chunks']} chunks")

        if result["errors"]:
            print("\nErrors encountered:")
            for err in result["errors"]:
                print(f"  ❌ {err['file']}: {err['error']}")
    print("\n[SUCCESS] Knowledge base is ready for semantic retrieval and Q&A!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
