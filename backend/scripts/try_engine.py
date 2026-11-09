"""Interactive 3-turn CLI interview simulator testing question quality and adaptive pacing."""

import asyncio
import os
import sys
import datetime
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.schemas import InterviewConfig, StoredSession, Question, StoredTurn
from app.services.interview.engine import InterviewEngine
from app.services.interview.scoring import delivery_metrics


async def main():
    print("==================================================")
    print("   InterviewIQ AI — Terminal Engine Simulator     ")
    print("==================================================")

    config = InterviewConfig(
        type="technical",
        domain="System Design & Concurrency",
        difficulty="intermediate",
        duration_min=5,
        language="en",
    )

    engine = InterviewEngine()
    print(f"\n[1/3] Generating interview blueprint for {config.domain} ({config.difficulty})...")
    blueprint = await engine.build_blueprint(config)

    print(f"Blueprint created with {len(blueprint.topics)} topics:")
    for idx, t in enumerate(blueprint.topics):
        print(f"  {idx + 1}. {t.topic} -> '{t.opening_question}'")

    first_topic = blueprint.topics[0]
    session = StoredSession(
        id=uuid.uuid4().hex[:16],
        user_id="cli-user",
        config=config,
        status="in_progress",
        started_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        blueprint=blueprint,
        current_question=Question(
            id=uuid.uuid4().hex[:12],
            text=first_topic.opening_question,
            topic=first_topic.topic,
            is_follow_up=False,
            index=0,
        ),
        current_expected_concepts=first_topic.expected_concepts,
        topic_index=0,
        questions_asked=1,
        follow_ups_on_topic=0,
        turns=[],
    )

    print("\n--- Interview Begins ---")
    for turn_num in range(1, 4):
        print(f"\n[Turn {turn_num}] Topic: {session.current_question.topic}")
        print(f"Interviewer: \"{session.current_question.text}\"")
        print(f"(Expected concepts: {', '.join(session.current_expected_concepts)})")

        answer_text = input("\nYour answer (or press Enter for sample answer): ").strip()
        if not answer_text:
            if turn_num == 1:
                answer_text = (
                    "A process is an execution environment with its own isolated virtual memory space and address table, "
                    "whereas a thread is an execution unit inside a process that shares memory and heap with other threads. "
                    "Context switching between processes requires TLB invalidation and is more expensive."
                )
            elif turn_num == 2:
                answer_text = (
                    "To prevent race conditions, we can use mutex locks, atomic primitives, or read-write locks. "
                    "However, improper lock ordering can lead to deadlocks, which we mitigate with lock hierarchy."
                )
            else:
                answer_text = (
                    "In distributed systems, optimistic concurrency control uses version stamps, while pessimistic uses distributed locks."
                )
            print(f"Using default sample answer: \"{answer_text}\"")

        # Simulate 25s speaking time
        audio_dur_sec = 25.0
        wpm, filler_count = delivery_metrics(answer_text, audio_dur_sec)
        print(f"\nEvaluating answer... (Simulated delivery: {wpm} WPM, {filler_count} fillers)")

        evaluation, next_question, is_complete = await engine.evaluate_and_plan(
            session=session,
            transcript=answer_text,
            audio_duration_sec=audio_dur_sec,
        )

        print(f"\n--- Turn {turn_num} Evaluation ---")
        print(f"Overall Score: {evaluation.overall}/100")
        print(f"Sub-scores: Tech={evaluation.scores.technical_correctness}, Concept={evaluation.scores.conceptual_understanding}, Complete={evaluation.scores.completeness}")
        print(f"Strengths: {', '.join(evaluation.strengths)}")
        print(f"Improvements: {', '.join(evaluation.improvements)}")
        if evaluation.missing_concepts:
            print(f"Missing Concepts: {', '.join(evaluation.missing_concepts)}")

        # Store turn
        turn = StoredTurn(
            question=session.current_question,
            transcript=answer_text,
            evaluation=evaluation,
            audio_duration_sec=audio_dur_sec,
            wpm=wpm,
            filler_count=filler_count,
            created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        )
        session.turns.append(turn)

        if is_complete or not next_question:
            print("\n[Interview Concluded by Engine Decision]")
            break

        session.current_question = next_question
        session.questions_asked += 1
        if next_question.is_follow_up:
            session.follow_ups_on_topic += 1
        else:
            session.follow_ups_on_topic = 0

    print("\nSimulation complete!")


if __name__ == "__main__":
    asyncio.run(main())
