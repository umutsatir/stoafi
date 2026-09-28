import { useLocale, useTranslations } from "next-intl";
import { compareStrategies, strategyRegistry, type Profile } from "@stoafi/core";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";

export interface PlanComparisonProps {
  profile: Profile;
  /** The saved plan's strategy id; its card shows as active. */
  activeStrategyId?: string;
  /** When given, each non-active card offers "Use this plan". */
  onSelect?: (strategyId: string) => void;
}

export function PlanComparison({ profile, activeStrategyId, onSelect }: PlanComparisonProps) {
  const results = compareStrategies(profile, strategyRegistry);
  const t = useTranslations("plan");
  const locale = useLocale() as Locale;
  const investingLesson = getLessonCard("index-funds", locale);

  return (
    <div>
      {results.map(({ strategyId, allocation }) => {
        const strategy = strategyRegistry[strategyId];
        const lesson = strategy ? getLessonCard(strategy.lessonId, locale) : undefined;

        return (
          <section key={strategyId} aria-label={strategyId} data-testid={`strategy-${strategyId}`}>
            <h2>{lesson?.title ?? strategyId}</h2>
            <dl>
              <dt>{t("needs")}</dt>
              <dd>{allocation.needs}</dd>
              <dt>{t("wants")}</dt>
              <dd>{allocation.wants}</dd>
              <dt>{t("savings")}</dt>
              <dd>{allocation.savings}</dd>
              <dt>{t("investing")}</dt>
              <dd>{allocation.investing}</dd>
            </dl>
            {onSelect &&
              (strategyId === activeStrategyId ? (
                <button type="button" disabled aria-pressed={true}>
                  {t("activePlan")}
                </button>
              ) : (
                <button type="button" onClick={() => onSelect(strategyId)}>
                  {t("usePlan")}
                </button>
              ))}
            {lesson && (
              <article aria-label={`${strategyId} lesson`}>
                <p>{lesson.principle}</p>
                <footer>
                  {lesson.source.author}, {lesson.source.work}
                </footer>
              </article>
            )}
          </section>
        );
      })}
      {investingLesson && (
        <a
          href={`#lesson-${investingLesson.id}`}
          aria-label={`${investingLesson.id} lesson`}
          data-testid="lesson-link-index-funds"
        >
          {investingLesson.title}
        </a>
      )}
    </div>
  );
}
