import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/context';
import { getLevels, saveProgress, getUserProgress } from '@/lib/store';
import type { PathAccess, Path, Level } from '@/lib/db';

interface Props {
  access: PathAccess & { path: Path };
  onBack: () => void;
}

type LevelState = 'playing' | 'correct' | 'completed';

export default function QuestPlayer({ access, onBack }: Props) {
  const { currentUser } = useApp();
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [levelState, setLevelState] = useState<LevelState>('playing');
  const [showHint, setShowHint] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [showPassage, setShowPassage] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [wrongShake, setWrongShake] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<Set<string>>(new Set());

  useEffect(() => {
    const l = getLevels(access.path_id);
    setLevels(l);
    if (currentUser) {
      const prog = getUserProgress(currentUser.id);
      const completed = new Set(prog.filter(p => p.completed && p.path_id === access.path_id).map(p => p.level_id));
      setCompletedLevels(completed);
      const nextIdx = l.findIndex(lv => !completed.has(lv.id));
      setCurrentIdx(nextIdx >= 0 ? nextIdx : 0);
    }
  }, [access.path_id]);

  const currentLevel = levels[currentIdx];
  const isAllDone = levels.length > 0 && levels.every(l => completedLevels.has(l.id));

  const handleAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLevel || !currentUser) return;

    const correct = answer.trim().toLowerCase() === currentLevel.answer.trim().toLowerCase();
    setAttempts(a => a + 1);

    if (correct) {
      const score = usedHint ? Math.max(0, 100 - currentLevel.hint_penalty) : 100;
      saveProgress(currentUser.id, currentLevel.id, access.path_id, true, usedHint, score);
      setCompletedLevels(prev => new Set([...prev, currentLevel.id]));
      setLevelState('correct');
      setShowPassage(true);
    } else {
      setWrongShake(true);
      setTimeout(() => setWrongShake(false), 600);
    }
  };

  const handleNextLevel = () => {
    setLevelState('playing');
    setAnswer('');
    setShowHint(false);
    setUsedHint(false);
    setShowPassage(false);
    setAttempts(0);
    if (currentIdx + 1 < levels.length) {
      setCurrentIdx(i => i + 1);
    } else {
      setLevelState('completed');
    }
  };

  const handleShowHint = () => {
    setShowHint(true);
    setUsedHint(true);
  };

  if (!currentLevel) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-5xl mb-4">🧩</div>
          <p className="text-muted-foreground">Нет уровней в этом пути</p>
          <button onClick={onBack} className="mt-4 gold-btn px-6 py-3 rounded-xl">← Назад</button>
        </div>
      </div>
    );
  }

  if (levelState === 'completed' || isAllDone) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 star-bg">
        <div className="text-center max-w-md animate-scale-in">
          <div className="text-8xl mb-6 float">🏆</div>
          <h2 className="font-display text-3xl gold-text mb-3">Путь пройден!</h2>
          <p className="text-muted-foreground mb-2">{access.path.title}</p>
          <p className="text-sm text-muted-foreground mb-8">Вы прошли все уровни этого квеста!</p>
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="font-display text-2xl text-yellow-400">{completedLevels.size}</p>
                <p className="text-xs text-muted-foreground">уровней пройдено</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl text-green-400">
                  {getUserProgress(currentUser!.id).filter(p => p.path_id === access.path_id && p.completed).reduce((s, p) => s + p.score, 0)}
                </p>
                <p className="text-xs text-muted-foreground">очков набрано</p>
              </div>
            </div>
          </div>
          <button onClick={onBack} className="gold-btn px-8 py-3 rounded-xl flex items-center gap-2 mx-auto">
            <Icon name="ArrowLeft" size={16} />
            Вернуться к путям
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 star-bg">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <Icon name="ArrowLeft" size={16} /> Назад к путям
      </button>

      {/* Progress */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground font-display">{access.path.title}</p>
          <p className="text-sm text-muted-foreground">{completedLevels.size} / {levels.length}</p>
        </div>
        <div className="flex gap-1 mb-8">
          {levels.map((l, i) => (
            <div
              key={l.id}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                completedLevels.has(l.id) ? 'bg-primary' :
                i === currentIdx ? 'bg-primary/40' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Level Card */}
        <div className="glass-card-violet rounded-2xl p-8 mb-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-display text-primary">
              {currentIdx + 1}
            </div>
            <div>
              <h2 className="font-display text-lg">{currentLevel.title}</h2>
              <p className="text-xs text-muted-foreground">Уровень {currentIdx + 1} из {levels.length}</p>
            </div>
          </div>

          {currentLevel.riddle_content && (
            <div className="bg-muted/40 rounded-xl p-5 mb-6">
              <p className="text-sm leading-relaxed">{currentLevel.riddle_content}</p>
            </div>
          )}

          {!showPassage ? (
            <>
              <form onSubmit={handleAnswer} className="space-y-4">
                <div className={`transition-all ${wrongShake ? 'animate-bounce' : ''}`}>
                  <input
                    className={`w-full bg-muted border rounded-xl px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none transition-all text-center font-display text-lg ${wrongShake ? 'border-destructive' : 'border-border focus:border-primary'}`}
                    placeholder="Введите ответ..."
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    autoFocus
                    disabled={levelState === 'correct'}
                  />
                  {wrongShake && attempts > 0 && (
                    <p className="text-destructive text-xs text-center mt-2">Неверно. Попробуйте ещё раз</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="gold-btn w-full py-4 rounded-xl text-lg flex items-center justify-center gap-3"
                >
                  <Icon name="Send" size={20} />
                  Ответить
                </button>
              </form>

              {currentLevel.hint && !showHint && (
                <button
                  onClick={handleShowHint}
                  className="mt-4 w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 glass-card text-amber-400 hover:bg-amber-400/10 transition-colors border border-amber-400/20"
                >
                  <Icon name="Lightbulb" size={16} />
                  Показать подсказку (-{currentLevel.hint_penalty} очков)
                </button>
              )}

              {showHint && currentLevel.hint && (
                <div className="mt-4 bg-amber-400/10 border border-amber-400/20 rounded-xl p-4 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <Icon name="Lightbulb" size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-400">{currentLevel.hint}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center animate-scale-in">
              <div className="passage-btn inline-flex items-center gap-3 cursor-pointer mb-6" onClick={handleNextLevel}>
                ✨ ПРОХОД ОТКРЫТ ✨
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-green-400 text-sm flex items-center justify-center gap-2">
                  <Icon name="CheckCircle" size={16} /> Правильный ответ: {currentLevel.answer}
                </p>
                {usedHint && <p className="text-amber-400 text-xs">Подсказка использована (-{currentLevel.hint_penalty} очков)</p>}
              </div>
              <button onClick={handleNextLevel} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {currentIdx + 1 < levels.length ? 'Следующий уровень →' : 'Завершить путь →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
