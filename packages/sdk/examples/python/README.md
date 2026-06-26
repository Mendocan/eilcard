# EIL Card — Python agent examples

> **Prefer the installable SDK:** `pip install eil-card` — see [`packages/python/README.md`](../../python/README.md).

These files are legacy copy-paste templates; the packaged equivalents live in `eil_card.integrations`.

| File | Packaged equivalent | Install |
|------|---------------------|---------|
| `resolve_eil_card.py` | `from eil_card import DigitalCard` | `pip install eil-card` |
| `langchain_tool.py` | `eil_card.integrations.langchain.create_eil_resolve_tool` | `pip install eil-card[langchain]` |
| `langchain_agent_loop.py` | Sample AgentExecutor loop | `langchain`, `langchain-openai`, … |
| `eil_reader.py` | `eil_card.integrations.llamaindex.EILReader` | `pip install eil-card[llamaindex]` |
| `eil_reader_demo.py` | Load documents + optional index | same as above |

## Quick start (SDK)

```python
from eil_card import DigitalCard, discover_capabilities

result = DigitalCard.resolve(domain="sinyalle.com")
caps = discover_capabilities(result["card"])
```

## LangChain

```python
from eil_card.integrations.langchain import create_eil_resolve_tool

tool = create_eil_resolve_tool()
```

## CrewAI

```python
from eil_card.integrations.crewai import create_eil_resolve_crewai_tool

tool = create_eil_resolve_crewai_tool()
```

## LlamaIndex

```python
from eil_card.integrations.llamaindex import EILReader
from llama_index.core import VectorStoreIndex

docs = EILReader().load_data(domain="sinyalle.com", split_catalog=True)
index = VectorStoreIndex.from_documents(docs)
```

See https://eilcard.com/docs/agents
