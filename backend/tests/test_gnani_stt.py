import pytest

from app.services.gnani_stt import GnaniSTT


@pytest.mark.asyncio
async def test_transcribe_chunks_joins_transcripts_in_order(monkeypatch):
    client = GnaniSTT()
    calls = []

    async def transcribe_chunk(chunk, language, keyterms, request_id):
        calls.append((chunk, language, keyterms, request_id))
        return {b"first": "Hello", b"second": "world"}[chunk]

    monkeypatch.setattr(client, "_transcribe_chunk", transcribe_chunk)
    transcript = await client.transcribe_chunks(
        [b"first", b"second"],
        "en",
        ["Python"],
        "answer",
    )
    await client.client.aclose()

    assert transcript == "Hello world"
    assert [call[3] for call in calls] == ["answer_0", "answer_1"]
