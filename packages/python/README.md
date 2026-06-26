# EIL Card Python SDK (`eil-card`)

Resolve verified organization and person identity from the EIL Card registry — with LangChain, CrewAI, and LlamaIndex integrations.

## Install

```bash
pip install eil-card
```

Optional framework extras:

```bash
pip install eil-card[langchain]
pip install eil-card[llamaindex]
pip install eil-card[crewai]
pip install eil-card[all]
```

## Quick start

```python
from eil_card import DigitalCard, discover_capabilities, discover_act_capabilities

result = DigitalCard.resolve(domain="sinyalle.com")
card = result["card"]
print(card["name"]["official"], card.get("verified"))

caps = discover_capabilities(card)
if caps["available"]:
    print("Gateway:", caps["agent_gateway"])

act = discover_act_capabilities(card)
print("Write/act scopes:", act["scopes_parsed"]["write"], act["scopes_parsed"]["act"])
```

## LangChain

```python
from eil_card.integrations.langchain import create_eil_resolve_tool

tool = create_eil_resolve_tool()
# tools = [tool]
```

Tool name matches the TypeScript SDK: `resolve_entity_identity`.

## CrewAI

```python
from crewai import Agent
from eil_card.integrations.crewai import create_eil_resolve_crewai_tool

resolve_tool = create_eil_resolve_crewai_tool()
agent = Agent(role="Researcher", goal="Verify entities", tools=[resolve_tool])
```

## LlamaIndex

```python
from eil_card.integrations.llamaindex import EILReader

docs = EILReader().load_data(domain="sinyalle.com")
```

## Agent act headers (pilot gateway)

```python
from eil_card import build_idempotency_key, build_agent_act_headers, agent_act_headers_to_fetch

key = build_idempotency_key(
    agent_client_id="my-agent",
    action_id="create_post",
    entity_id="sinyalle.com",
    nonce="run-1",
)
headers = agent_act_headers_to_fetch(
    build_agent_act_headers(
        access_token="...",
        idempotency_key=key,
        action_id="create_post",
        card_id="sinyalle.com",
    )
)
```

## Development

```bash
cd packages/python
pip install -e ".[dev]"
pytest
```

## Publish (maintainers)

```bash
pip install build twine
python -m build
twine upload dist/*
```

Set `PYPI_API_TOKEN` in the environment or `~/.pypirc`.

## Docs

- https://eilcard.com/docs/agents
- TypeScript SDK parity: `packages/sdk/SDK.md`
