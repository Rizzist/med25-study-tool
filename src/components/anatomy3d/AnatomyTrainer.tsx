"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { listAnatomyModules } from "../../lib/anatomy3d/registry";
import { buildAnatomyQuiz } from "../../lib/anatomy3d/quiz.mjs";
import type { AnatomyQuestion } from "../../lib/anatomy3d/quiz.mjs";
import type { AnatomyStructure } from "../../lib/anatomy3d/types";
import AnatomyViewer, { type AnatomyViewerHandle } from "./AnatomyViewer";

type TrainerMode = "quiz" | "training";

type ModuleProgress = {
  score: number;
  answered: number;
  wrongStructureIds: string[];
};

type AnatomyProgress = {
  version: 1;
  modules: Record<string, ModuleProgress>;
};

const progressStorageKey = "anatomy3d.progress.v1";
const respiratoryModules = listAnatomyModules("respiratory");

function emptyProgress(): AnatomyProgress {
  return { version: 1, modules: {} };
}

function readProgress(): AnatomyProgress {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(progressStorageKey) ?? "null");
    if (!parsed || typeof parsed !== "object" || !("version" in parsed) || parsed.version !== 1 || !("modules" in parsed)) {
      return emptyProgress();
    }
    const rawModules = parsed.modules;
    if (!rawModules || typeof rawModules !== "object" || Array.isArray(rawModules)) return emptyProgress();
    const modules: Record<string, ModuleProgress> = {};
    for (const [key, value] of Object.entries(rawModules)) {
      if (!value || typeof value !== "object") continue;
      const record = value as Partial<ModuleProgress>;
      const score = Math.max(0, Math.floor(Number(record.score) || 0));
      const answered = Math.max(score, Math.floor(Number(record.answered) || 0));
      const wrongStructureIds = Array.isArray(record.wrongStructureIds)
        ? [...new Set(record.wrongStructureIds.filter((id): id is string => typeof id === "string"))]
        : [];
      modules[key] = { score, answered, wrongStructureIds };
    }
    return { version: 1, modules };
  } catch {
    return emptyProgress();
  }
}

function progressFor(progress: AnatomyProgress, modelKey: string): ModuleProgress {
  return progress.modules[modelKey] ?? { score: 0, answered: 0, wrongStructureIds: [] };
}

export function AnatomyTrainer() {
  const viewerRef = useRef<AnatomyViewerHandle>(null);
  const randomStateRef = useRef(0x6d2b79f5);
  const [mode, setMode] = useState<TrainerMode>("quiz");
  const [moduleKey, setModuleKey] = useState(respiratoryModules[0]?.manifest.modelKey ?? "");
  const [quizRound, setQuizRound] = useState(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [trainingStructureId, setTrainingStructureId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const [progress, setProgress] = useState<AnatomyProgress>(readProgress);

  const registration = respiratoryModules.find((candidate) => candidate.manifest.modelKey === moduleKey)
    ?? respiratoryModules[0];
  const manifest = registration?.manifest;
  const questions = useMemo<AnatomyQuestion[]>(() => (
    manifest ? buildAnatomyQuiz(manifest, { seed: `${manifest.modelKey}:${quizRound}` }) : []
  ), [manifest, quizRound]);
  const currentQuestion = questions[questionIndex] ?? null;
  const moduleProgress = progressFor(progress, moduleKey);
  const selectedTrainingStructure = manifest?.structures.find((structure) => structure.id === trainingStructureId) ?? null;
  const wrongStructures = moduleProgress.wrongStructureIds.flatMap((id) => {
    const structure = manifest?.structures.find((candidate) => candidate.id === id);
    return structure ? [structure] : [];
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(progressStorageKey, JSON.stringify(progress));
    } catch {
      // Progress remains usable for this session when browser storage is unavailable.
    }
  }, [progress]);

  useEffect(() => {
    if (mode === "quiz" && currentQuestion) viewerRef.current?.focusStructure(currentQuestion.structureId);
  }, [currentQuestion, mode]);

  function chooseModule(nextModelKey: string) {
    setModuleKey(nextModelKey);
    setQuestionIndex(0);
    setSelectedOptionId(null);
    setTrainingStructureId(null);
    setQuizRound((round) => round + 1);
  }

  function chooseMode(nextMode: TrainerMode) {
    setMode(nextMode);
    setSelectedOptionId(null);
    if (nextMode === "training" && trainingStructureId) {
      viewerRef.current?.focusStructure(trainingStructureId);
    }
  }

  function answerQuestion(optionId: string) {
    if (!currentQuestion || selectedOptionId) return;
    setSelectedOptionId(optionId);
    const correct = optionId === currentQuestion.correctOptionId;
    setProgress((current) => {
      const previousModule = progressFor(current, moduleKey);
      const wrongIds = new Set(previousModule.wrongStructureIds);
      if (correct) wrongIds.delete(currentQuestion.structureId);
      else wrongIds.add(currentQuestion.structureId);
      return {
        version: 1,
        modules: {
          ...current.modules,
          [moduleKey]: {
            score: previousModule.score + (correct ? 1 : 0),
            answered: previousModule.answered + 1,
            wrongStructureIds: [...wrongIds],
          },
        },
      };
    });
  }

  function restartQuiz() {
    setQuizRound((round) => round + 1);
    setQuestionIndex(0);
    setSelectedOptionId(null);
    setProgress((current) => {
      const previousModule = progressFor(current, moduleKey);
      return {
        version: 1,
        modules: {
          ...current.modules,
          [moduleKey]: { ...previousModule, score: 0, answered: 0 },
        },
      };
    });
  }

  function nextQuestion() {
    if (questionIndex + 1 >= questions.length) {
      restartQuiz();
      return;
    }
    setQuestionIndex((index) => index + 1);
    setSelectedOptionId(null);
  }

  function selectTrainingStructure(structure: AnatomyStructure) {
    setTrainingStructureId(structure.id);
    viewerRef.current?.focusStructure(structure.id);
  }

  function showRandomLocation() {
    if (!manifest?.structures.length) return;
    randomStateRef.current = (Math.imul(1664525, randomStateRef.current) + 1013904223) >>> 0;
    const index = Math.floor((randomStateRef.current / 4294967296) * manifest.structures.length);
    selectTrainingStructure(manifest.structures[index]);
  }

  if (!registration || !manifest) {
    return <section className="anatomy3d-empty">No respiratory 3D modules are registered yet.</section>;
  }

  const answered = selectedOptionId !== null;
  const selectedWasCorrect = answered && selectedOptionId === currentQuestion?.correctOptionId;

  return (
    <section className="anatomy3d-trainer" aria-labelledby="anatomy3d-title">
      <header className="anatomy3d-header">
        <div>
          <p className="eyebrow">Interactive atlas</p>
          <h2 id="anatomy3d-title">3D Anatomy</h2>
          <p>{manifest.blurb}</p>
        </div>
        <div className="anatomy3d-mode-switch" aria-label="Study mode">
          <button type="button" className={mode === "quiz" ? "active" : ""} onClick={() => chooseMode("quiz")}>Quiz</button>
          <button type="button" className={mode === "training" ? "active" : ""} onClick={() => chooseMode("training")}>Training</button>
        </div>
      </header>

      <nav className="anatomy3d-module-switcher" aria-label="Anatomy module">
        {respiratoryModules.map(({ manifest: option }) => (
          <button
            type="button"
            key={option.modelKey}
            className={option.modelKey === moduleKey ? "active" : ""}
            aria-pressed={option.modelKey === moduleKey}
            onClick={() => chooseModule(option.modelKey)}
          >
            {option.title}
          </button>
        ))}
      </nav>

      <div className="anatomy3d-layout">
        <div className="anatomy3d-viewer-card">
          <AnatomyViewer
            ref={viewerRef}
            modelKey={moduleKey}
            focusStructureId={mode === "quiz" ? currentQuestion?.structureId : trainingStructureId}
            pickEnabled={mode === "training"}
            showLabels={mode === "training" && showLabels}
            onPick={(structureId) => {
              if (mode === "training") setTrainingStructureId(structureId);
            }}
          />
        </div>

        <aside className="anatomy3d-panel">
          {mode === "quiz" && currentQuestion ? (
            <>
              <div className="anatomy3d-score">
                <span>Question {questionIndex + 1}/{questions.length}</span>
                <span>Score {moduleProgress.score}/{moduleProgress.answered}</span>
                <span>To review {moduleProgress.wrongStructureIds.length}</span>
              </div>
              <div className="anatomy3d-question">
                <p className="eyebrow">Difficulty {currentQuestion.difficulty}</p>
                <h3>{currentQuestion.prompt}</h3>
                <p>Inspect the highlighted structure, then choose its anatomical name.</p>
              </div>
              <div className={`anatomy3d-options ${answered ? "locked" : ""}`}>
                {currentQuestion.options.map((option) => {
                  const isCorrect = option.id === currentQuestion.correctOptionId;
                  const isSelectedWrong = answered && option.id === selectedOptionId && !isCorrect;
                  return (
                    <button
                      type="button"
                      key={option.id}
                      disabled={answered}
                      className={`anatomy3d-option ${answered && isCorrect ? "correct" : ""} ${isSelectedWrong ? "wrong" : ""}`.trim()}
                      onClick={() => answerQuestion(option.id)}
                    >
                      <span><b>{option.id}</b>{option.text}</span>
                      {answered && (
                        <small>
                          <strong>{isCorrect ? "Why this is right" : "Why this is wrong"}</strong>
                          {isCorrect ? currentQuestion.explanation : currentQuestion.distractorExplanations[option.id]}
                        </small>
                      )}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <div className={`anatomy3d-feedback ${selectedWasCorrect ? "correct" : "wrong"}`} role="status">
                  <strong>{selectedWasCorrect ? "Correct." : `Correct answer: ${currentQuestion.label}`}</strong>
                  <p>{currentQuestion.explanation}</p>
                </div>
              )}
              <div className="anatomy3d-actions">
                <button type="button" className="secondary" onClick={restartQuiz}>Restart</button>
                <button type="button" onClick={nextQuestion} disabled={!answered}>
                  {questionIndex + 1 === questions.length ? "Reseed quiz" : "Next"}
                </button>
              </div>
              {wrongStructures.length > 0 && (
                <details className="anatomy3d-wrong-list">
                  <summary>Wrong-list ({wrongStructures.length})</summary>
                  <ul>{wrongStructures.map((structure) => <li key={structure.id}>{structure.label}</li>)}</ul>
                </details>
              )}
            </>
          ) : (
            <>
              <div className="anatomy3d-training-controls">
                <button type="button" className="anatomy3d-random" onClick={showRandomLocation}>Show me a random location</button>
                <label>
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(event) => setShowLabels(event.target.checked)}
                  />
                  Labels
                </label>
              </div>
              <p className="anatomy3d-free-explore">Click any structure to select and frame it, or rotate the model freely.</p>
              {selectedTrainingStructure ? (
                <article className="anatomy3d-details">
                  <p className="eyebrow">{selectedTrainingStructure.tissue}</p>
                  <h3>{selectedTrainingStructure.label}</h3>
                  <p>{selectedTrainingStructure.description}</p>
                  {selectedTrainingStructure.keyPoints?.length ? (
                    <ul>{selectedTrainingStructure.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul>
                  ) : null}
                </article>
              ) : (
                <div className="anatomy3d-empty">
                  <strong>Free explore</strong>
                  <p>Choose the random-location prompt or click a part of the model to reveal its notes.</p>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

export default AnatomyTrainer;
