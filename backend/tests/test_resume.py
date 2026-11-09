import io
import zipfile

import pytest

from app.db.memory import MemoryRepository
from app.schemas import Blueprint, BlueprintTopic, ResumeProfileData
from app.services.interview.engine import InterviewEngine
from app.schemas import InterviewConfig
from app.services.resume import ResumeExtraction, extract_resume_profile


def make_docx(text: str) -> bytes:
    document = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f"<w:body><w:p><w:r><w:t>{text}</w:t></w:r></w:p></w:body></w:document>"
    )
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("word/document.xml", document)
    return buffer.getvalue()


class FakeResumeLLM:
    def __init__(self):
        self.user_prompt = ""

    async def generate_json(self, *, system, user, schema, model, **kwargs):
        self.user_prompt = user
        return ResumeExtraction(
            summary="Backend engineer",
            skills=["Python", "FastAPI"],
            experience=["Built APIs"],
            projects=["Interview service"],
            education=["Computer Science"],
        )


@pytest.mark.asyncio
async def test_docx_resume_extracts_profile_without_saving_raw_text():
    llm = FakeResumeLLM()
    profile = await extract_resume_profile(
        make_docx("Backend engineer with Python and FastAPI experience building interview APIs."),
        ".docx",
        llm,
    )

    assert profile.skills == ["Python", "FastAPI"]
    assert "Backend engineer" in profile.summary
    assert "Backend engineer with Python" in llm.user_prompt
    assert "[contact removed]" not in profile.summary


def test_memory_repository_persists_profile_without_original_file():
    import asyncio

    async def run():
        repo = MemoryRepository()
        profile = ResumeProfileData(
            summary="Backend engineer",
            skills=["Python"],
            experience=[],
            projects=["Interview service"],
            education=[],
        )
        stored = await repo.save_resume_profile("user-1", profile)

        assert await repo.get_resume_profile("user-1") == stored
        assert not hasattr(stored, "original_file")
        await repo.delete_resume_profile("user-1")
        assert await repo.get_resume_profile("user-1") is None

    asyncio.run(run())


@pytest.mark.asyncio
async def test_resume_profile_is_added_to_interview_blueprint_prompt():
    class CapturingLLM:
        user_prompt = ""

        async def generate_json(self, *, system, user, schema, model, **kwargs):
            self.user_prompt = user
            return Blueprint(
                topics=[
                    BlueprintTopic(
                        topic="Python project",
                        opening_question="How did you scale your Python project?",
                        expected_concepts=["scaling"],
                        follow_up_hints=[],
                    )
                ]
            )

    llm = CapturingLLM()
    engine = InterviewEngine(llm=llm)
    blueprint = await engine.build_blueprint(
        InterviewConfig(
            type="technical",
            domain="Python",
            difficulty="intermediate",
            duration_min=5,
            language="en",
        ),
        ResumeProfileData(
            summary="Backend engineer",
            skills=["Python"],
            experience=["Built APIs"],
            projects=["Interview service"],
            education=[],
        ),
    )

    assert '"Python"' in llm.user_prompt
    assert "Interview service" in llm.user_prompt
    assert blueprint.topics[0].topic == "Resume Deep Dive"
    assert "Interview service" in blueprint.topics[0].opening_question


@pytest.mark.asyncio
async def test_resume_opening_question_uses_configured_language():
    class GenericLLM:
        async def generate_json(self, *, system, user, schema, model, **kwargs):
            return Blueprint(
                topics=[
                    BlueprintTopic(
                        topic="Python",
                        opening_question="Tell me about Python.",
                        expected_concepts=["Python"],
                        follow_up_hints=[],
                    )
                ]
            )

    engine = InterviewEngine(llm=GenericLLM())
    blueprint = await engine.build_blueprint(
        InterviewConfig(
            type="technical",
            domain="Python",
            difficulty="intermediate",
            duration_min=5,
            language="hi",
        ),
        ResumeProfileData(
            summary="Backend engineer",
            skills=["Python"],
            experience=["Built APIs"],
            projects=["Interview service"],
            education=[],
        ),
    )

    assert "Interview service" in blueprint.topics[0].opening_question
    assert "आपके resume" in blueprint.topics[0].opening_question
