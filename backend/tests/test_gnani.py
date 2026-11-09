"""Unit tests for Gnani STT and TTS utilities, text normalization, and audio segmentation."""

import pytest
from app.services.gnani_tts import prepare_spoken_text, GnaniTTS
from app.services.audio import segment_audio


def test_prepare_spoken_text():
    # Markdown stripping
    raw = "Here is `#include <stdio.h>` and `SELECT * FROM users;` in SQL -> database & backend / frontend @ 2026."
    cleaned = prepare_spoken_text(raw)
    assert "`" not in cleaned
    assert " to " in cleaned
    assert " and " in cleaned
    assert " or " in cleaned
    assert " at " in cleaned


def test_prepare_spoken_text_length_limit():
    long_text = "This is a sentence. " * 50
    cleaned = prepare_spoken_text(long_text)
    assert len(cleaned) <= 600
    assert cleaned.endswith(".")


def test_voice_selection():
    tts = GnaniTTS()
    v_en, l_en = tts._select_voice_and_lang("en")
    assert l_en == "en-IN"

    v_ta, l_ta = tts._select_voice_and_lang("ta")
    assert l_ta == "ta-IN"

    v_hi, l_hi = tts._select_voice_and_lang("hi")
    assert l_hi == "hi-IN"


def test_segment_audio():
    # 60s audio with 28s max duration should create 3 chunks
    chunks = segment_audio(total_duration_sec=60.0, max_chunk_sec=28.0)
    assert len(chunks) == 3
    assert chunks[0] == (0.0, 28.0)
    assert chunks[1] == (28.0, 28.0)
    assert chunks[2] == (56.0, 4.0)
