# EIL Card — Python agent examples

Runnable templates for LangChain, LlamaIndex, and zero-dependency resolve.

| File | Purpose | Install |
|------|---------|---------|
| `resolve_eil_card.py` | Native resolve by domain or handle | `requests` |
| `langchain_tool.py` | `@tool` for LangChain agents | `langchain-core`, `requests` |
| `langchain_agent_loop.py` | Sample AgentExecutor loop | `langchain`, `langchain-openai`, … |
| `eil_reader.py` | **LlamaIndex `EILReader`** data connector | `llama-index-core`, `requests` |
| `eil_reader_demo.py` | Load documents + optional index | same as above |

## LlamaIndex EILReader

```python
from eil_reader import EILReader
from llama_index.core import VectorStoreIndex

reader = EILReader()
docs = reader.load_data(domain="sinyalle.com", split_catalog=True)
index = VectorStoreIndex.from_documents(docs)
```

By handle:

```python
docs = reader.load_data(handle="sinyal24")
```

See https://eilcard.com/docs/agents
