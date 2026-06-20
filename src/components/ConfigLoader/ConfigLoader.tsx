import { useRef, useState, type ChangeEvent } from "react";
import type { GameConfig } from "../../types/game";
import { validateGameConfig } from "../../utils/validateConfig";
import "./ConfigLoader.scss";

const EXAMPLE_CONFIGS = [
  { path: "/examples/nabor-1.json", label: "Набор 1 — AI Generated" },
  { path: "/examples/nabor-2.json", label: "Набор 2 — Из шоу Парадеевича" },
] as const;

interface ConfigLoaderProps {
  onLoad: (config: GameConfig, name: string) => void;
  onCancel?: () => void;
}

export function ConfigLoader({ onLoad, onCancel }: ConfigLoaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleParsedConfig = (data: unknown, name: string) => {
    const result = validateGameConfig(data);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    onLoad(result.config, name);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown;
      handleParsedConfig(data, file.name);
    } catch {
      setError(
        "Не удалось прочитать файл. Проверьте, что это корректный JSON.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExampleLoad = async (path: string, label: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(path);
      if (!response.ok) {
        setError(`Не удалось загрузить пример: ${label}`);
        return;
      }

      const data = (await response.json()) as unknown;
      handleParsedConfig(data, label);
    } catch {
      setError(`Не удалось загрузить пример: ${label}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="config-loader">
      <header className="config-loader__header">
        <h1 className="config-loader__title">100 к 1</h1>
        <p className="config-loader__subtitle">
          Загрузите JSON с вопросами, чтобы начать игру
        </p>
      </header>

      <section className="config-loader__panel">
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="config-loader__file-input"
          onChange={handleFileChange}
          disabled={loading}
        />

        <button
          type="button"
          className="config-loader__btn config-loader__btn--primary"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
        >
          {loading ? "Загрузка…" : "Выбрать файл JSON"}
        </button>

        {error && <p className="config-loader__error">{error}</p>}

        <div className="config-loader__examples">
          <p className="config-loader__examples-title">Или выберите пример:</p>
          <div className="config-loader__examples-list">
            {EXAMPLE_CONFIGS.map((example) => (
              <button
                key={example.path}
                type="button"
                className="config-loader__btn config-loader__btn--example"
                onClick={() => handleExampleLoad(example.path, example.label)}
                disabled={loading}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            className="config-loader__btn config-loader__btn--cancel"
            onClick={onCancel}
          >
            Вернуться к игре
          </button>
        )}
      </section>
    </div>
  );
}
