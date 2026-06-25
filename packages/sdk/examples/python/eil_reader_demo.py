"""
EILReader + LlamaIndex VectorStoreIndex demo.

pip install llama-index-core requests

Set OPENAI_API_KEY only if you uncomment the index block below.
"""

from eil_reader import EILReader

reader = EILReader()
documents = reader.load_data(domain="sinyalle.com", split_catalog=True)

print(f"Documents: {len(documents)}")
for doc in documents:
    kind = doc.metadata.get("document_kind", "unknown")
    print(f"  - [{kind}] {doc.text[:80].replace(chr(10), ' ')}...")

# Optional: build a small RAG index (requires llama-index-llms-openai or similar)
# from llama_index.core import VectorStoreIndex
# index = VectorStoreIndex.from_documents(documents)
# query_engine = index.as_query_engine()
# print(query_engine.query("What products does this organization offer?"))
